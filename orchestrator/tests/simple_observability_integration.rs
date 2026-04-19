//! Phase 3.2 Simple Observability Integration Tests

#[cfg(test)]
mod tests {
    use orchestrator::prelude::*;
    use orchestrator::VaultManager;
    use std::collections::HashMap;
    use tokio;
    use tempfile::TempDir;

    fn create_test_vault() -> TempDir {
        TempDir::new().unwrap()
    }

    #[tokio::test]
    async fn test_structured_logs_basic() {
        let logger = TraceLogger::new();

        let log1 = StructuredLog::new(LogLevel::Info, "Task started", "wf_001".to_string())
            .with_agent("analyzer");
        let log2 = StructuredLog::new(LogLevel::Info, "Task completed", "wf_001".to_string())
            .with_agent("analyzer");

        logger.log(log1).await;
        logger.log(log2).await;

        let logs = logger.get_workflow_logs("wf_001").await;
        assert_eq!(logs.len(), 2);
        assert_eq!(logs[0].message, "Task started");
        assert_eq!(logs[1].message, "Task completed");
    }

    #[tokio::test]
    async fn test_workflow_correlation() {
        let logger = TraceLogger::new();

        // Same workflow, different executions
        let log1 = StructuredLog::new(LogLevel::Info, "Step 1", "wf_002".to_string())
            .with_execution("exec_a".to_string());
        let log2 = StructuredLog::new(LogLevel::Info, "Step 2", "wf_002".to_string())
            .with_execution("exec_b".to_string());

        logger.log(log1).await;
        logger.log(log2).await;

        let wf_logs = logger.get_workflow_logs("wf_002").await;
        assert_eq!(wf_logs.len(), 2);

        let exec_a_logs = logger.get_execution_logs("exec_a").await;
        assert_eq!(exec_a_logs.len(), 1);

        let exec_b_logs = logger.get_execution_logs("exec_b").await;
        assert_eq!(exec_b_logs.len(), 1);
    }

    #[tokio::test]
    async fn test_execution_trace_timeline() {
        let vault_dir = create_test_vault();
        let vault_manager = VaultManager::new(vault_dir.path().to_path_buf()).unwrap();
        let mut registry = AgentRegistry::new();
        registry.register("echo", std::sync::Arc::new(EchoAgent));
        
        let logger = TraceLogger::new();

        // Simulate logs from execution
        let logs = vec![
            StructuredLog::new(LogLevel::Info, "Agent registered", "wf_003".to_string()),
            StructuredLog::new(LogLevel::Info, "Agent executing", "wf_003".to_string())
                .with_agent("echo"),
            StructuredLog::new(LogLevel::Info, "Agent completed", "wf_003".to_string()),
        ];

        for log in logs.iter() {
            logger.log(log.clone()).await;
        }

        // Create replay
        let retrieved_logs = logger.get_workflow_logs("wf_003").await;
        let replay = ExecutionReplay::from_workflow("wf_003", retrieved_logs, vec![]);

        let timeline = replay.timeline();
        assert_eq!(timeline.len(), 3);

        let human = replay.export_human_readable();
        assert!(human.contains("wf_003"));
        assert!(human.contains("Agent executing"));
    }

    #[tokio::test]
    async fn test_log_levels_filtering() {
        let logger = TraceLogger::new();

        logger
            .log(StructuredLog::new(LogLevel::Debug, "Debug msg", "wf_004".to_string()))
            .await;
        logger
            .log(StructuredLog::new(LogLevel::Info, "Info msg", "wf_004".to_string()))
            .await;
        logger
            .log(StructuredLog::new(LogLevel::Warn, "Warn msg", "wf_004".to_string()))
            .await;
        logger
            .log(StructuredLog::new(LogLevel::Error, "Error msg", "wf_004".to_string()))
            .await;

        let errors = logger.get_logs_by_level("wf_004", LogLevel::Error).await;
        assert_eq!(errors.len(), 1);

        let warns = logger.get_logs_by_level("wf_004", LogLevel::Warn).await;
        assert_eq!(warns.len(), 1);

        let infos = logger.get_logs_by_level("wf_004", LogLevel::Info).await;
        assert_eq!(infos.len(), 1);
    }

    #[tokio::test]
    async fn test_json_export() {
        let logger = TraceLogger::new();

        let log = StructuredLog::new(LogLevel::Info, "JSON test", "wf_005".to_string())
            .with_execution("exec_001".to_string())
            .with_agent("test_agent");

        logger.log(log).await;

        let json = logger.export_as_json("wf_005").await.unwrap();
        assert!(json.contains("wf_005"));
        assert!(json.contains("exec_001"));
        assert!(json.contains("test_agent"));
        assert!(json.contains("JSON test"));
    }

    #[tokio::test]
    async fn test_replay_issues_extraction() {
        let logger = TraceLogger::new();

        // Add mixed logs
        logger
            .log(StructuredLog::new(LogLevel::Info, "Starting", "wf_006".to_string()))
            .await;
        logger
            .log(StructuredLog::new(
                LogLevel::Error,
                "Database connection failed",
                "wf_006".to_string(),
            ))
            .await;
        logger
            .log(StructuredLog::new(LogLevel::Warn, "Retry attempt", "wf_006".to_string()))
            .await;

        let logs = logger.get_workflow_logs("wf_006").await;
        let replay = ExecutionReplay::from_workflow("wf_006", logs, vec![]);

        let issues = replay.get_issues();
        assert_eq!(issues.len(), 2); // 1 error + 1 warning
        assert!(issues.iter().any(|i| i.contains("Database")));
        assert!(issues.iter().any(|i| i.contains("Retry")));
    }

    #[tokio::test]
    async fn test_concurrent_workflow_logging() {
        let logger = std::sync::Arc::new(TraceLogger::new());
        let mut handles = vec![];

        // Simulate concurrent workflows
        for wf_id in 1..=5 {
            let logger_clone = logger.clone();
            let handle = tokio::spawn(async move {
                let workflow_id = format!("wf_{:03}", wf_id);
                for i in 1..=10 {
                    let log = StructuredLog::new(
                        LogLevel::Info,
                        &format!("Log {}", i),
                        workflow_id.clone(),
                    )
                    .with_execution(format!("exec_{}", i));
                    logger_clone.log(log).await;
                }
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.await.unwrap();
        }

        // Verify all logs recorded
        assert_eq!(logger.count().await, 50); // 5 workflows * 10 logs

        for wf_id in 1..=5 {
            let workflow_id = format!("wf_{:03}", wf_id);
            let count = logger.count_workflow(&workflow_id).await;
            assert_eq!(count, 10);
        }
    }

    #[tokio::test]
    async fn test_log_context_enrichment() {
        let logger = TraceLogger::new();

        let mut context = HashMap::new();
        context.insert(
            "user_id".to_string(),
            serde_json::json!("user_123"),
        );
        context.insert(
            "request_id".to_string(),
            serde_json::json!("req_456"),
        );

        let log = StructuredLog::new(LogLevel::Info, "Request received", "wf_007".to_string())
            .with_contexts(context);

        logger.log(log).await;

        let logs = logger.get_workflow_logs("wf_007").await;
        assert_eq!(logs[0].context.len(), 2);
        assert_eq!(
            logs[0].context.get("user_id").unwrap().as_str().unwrap(),
            "user_123"
        );
    }

    #[tokio::test]
    async fn test_replay_duration() {
        let vault_dir = create_test_vault();
        let _vault_manager = VaultManager::new(vault_dir.path().to_path_buf()).unwrap();

        // Create logs with some time
        let logs = vec![
            StructuredLog::new(LogLevel::Info, "Start", "wf_008".to_string()),
            StructuredLog::new(LogLevel::Info, "Middle", "wf_008".to_string()),
            StructuredLog::new(LogLevel::Info, "End", "wf_008".to_string()),
        ];

        let replay = ExecutionReplay::from_workflow("wf_008", logs, vec![]);
        let duration = replay.duration();

        assert!(duration.is_some());
    }
}
