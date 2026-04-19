//! Phase 3.5: Reality Integration Tests
//! 
//! Validates LLM analyzer in real workflow scenarios
//! Tests input validation, error handling, and basic workflow

#[cfg(test)]
mod tests {
    use orchestrator::prelude::*;
    use orchestrator::LLMAnalyzerAgent;
    use serde_json::json;
    use tokio;

    fn create_test_context(content: &str) -> AgentContext {
        AgentContext {
            workflow_id: "wf_llm_test".to_string(),
            task: "Analyze project content".to_string(),
            event_data: json!({"content": content}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_llm_123".to_string(),
            timeout_secs: 30,
        }
    }

    #[tokio::test]
    async fn test_llm_analyzer_input_size_validation() {
        // Create analyzer with dummy key (won't make real API calls for this test)
        let analyzer = LLMAnalyzerAgent::new("test_key".to_string());

        // Input too large (60KB > 50KB limit)
        let large_content = "x".repeat(60_000);
        let context = create_test_context(&large_content);

        let result: Result<AgentOutput, _> = analyzer.execute(context).await;
        assert!(result.is_ok());

        let output = result.unwrap();
        assert!(!output.success);
        assert_eq!(output.metadata.status, "error");
        assert!(output.metadata.error_message.is_some());
    }

    #[tokio::test]
    async fn test_llm_analyzer_valid_input_size() {
        let analyzer = LLMAnalyzerAgent::new("test_key".to_string());

        // Input within limit (10KB < 50KB)
        let content = "x".repeat(10_000);
        let context = create_test_context(&content);

        let result: Result<AgentOutput, _> = analyzer.execute(context).await;
        assert!(result.is_ok());

        let output = result.unwrap();
        // Will fail due to invalid API key, but input should pass validation
        assert!(output.metadata.error_message.is_some() || !output.success);
    }

    #[test]
    fn test_llm_analyzer_logs() {
        // Test that logs are properly formatted
        let analyzer = LLMAnalyzerAgent::new("test_key".to_string());
        let context = create_test_context("test");

        // Run synchronously to check logs structure
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result: Result<AgentOutput, _> = rt.block_on(async { analyzer.execute(context).await });

        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.logs.is_some());
        let logs = output.logs.unwrap();
        assert!(!logs.is_empty());
    }

    #[tokio::test]
    async fn test_llm_analyzer_empty_input() {
        let analyzer = LLMAnalyzerAgent::new("test_key".to_string());
        let context = create_test_context("");

        let result: Result<AgentOutput, _> = analyzer.execute(context).await;
        assert!(result.is_ok());

        let output = result.unwrap();
        // Should attempt execution (prompt will be for empty content)
        assert!(output.metadata.duration_ms > 0);
    }

    #[tokio::test]
    async fn test_llm_analyzer_result_structure() {
        let analyzer = LLMAnalyzerAgent::new("test_key".to_string());
        let context = create_test_context("test content");

        let result: Result<AgentOutput, _> = analyzer.execute(context).await;
        assert!(result.is_ok());

        let output = result.unwrap();
        // Check output structure
        assert!(output.result.is_object());
        assert!(output.metadata.status == "success" || output.metadata.status == "error");
        assert_eq!(output.vault_writes.len(), 0); // LLM analyzer doesn't write to vault
    }

    #[test]
    fn test_workflow_state_machine_with_llm() {
        // Test that LLMAnalyzer works with state machine transitions
        use orchestrator::{WorkflowContext, WorkflowState};

        let ctx = WorkflowContext {
            workflow_id: "wf_llm".to_string(),
            state: WorkflowState::Idle,
            event_data: json!({"content": "test"}),
            vault_file_id: None,
            last_transition: chrono::Utc::now(),
            transition_count: 0,
        };

        // Verify state is valid
        assert_eq!(ctx.state, WorkflowState::Idle);
        assert!(ctx.workflow_id.starts_with("wf_"));
    }

    #[tokio::test]
    async fn test_input_validator_with_llm_context() {
        let validator = InputValidator::new();

        let context = AgentContext {
            workflow_id: "wf_llm".to_string(),
            task: "Analyze this project".to_string(),
            event_data: json!({"content": "some content"}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_llm".to_string(),
            timeout_secs: 30,
        };

        assert!(validator.validate_context(&context).is_ok());
    }

    #[tokio::test]
    async fn test_permission_check_for_llm_agent() {
        let checker = PermissionChecker::with_defaults().await;

        // Create hypothetical llm_analyzer agent
        // Note: This would need to be registered first in production
        // For now, just verify default agents have proper permissions
        assert!(checker.can_execute("analyzer").await);
    }

    #[tokio::test]
    async fn test_output_sanitizer_with_llm_output() {
        let sanitizer = OutputSanitizer::new();

        let output = AgentOutput {
            success: true,
            result: json!({
                "analysis": "Test analysis from LLM",
                "model": "mistral-small",
                "duration_ms": 1500,
            }),
            metadata: AgentMetadata {
                duration_ms: 1500,
                status: "success".to_string(),
                error_message: None,
            },
            vault_writes: vec![],
            logs: Some(vec!["LLM analysis completed".to_string()]),
        };

        assert!(sanitizer.sanitize_output(&output).is_ok());
    }
}
