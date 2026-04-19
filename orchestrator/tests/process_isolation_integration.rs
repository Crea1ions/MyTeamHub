use orchestrator::{
    VaultManager, IsolationConfig, ProcessIsolationLayer,
    AgentRegistry, IsolationEventType, AgentContext, EchoAgent, AgentIsolationPolicy,
};
use serde_json::json;
use std::sync::Arc;
use std::path::PathBuf;
use tempfile::tempdir;
use chrono::Utc;

#[tokio::test]
async fn test_process_isolation_basic_execution() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::default();
    let isolation = ProcessIsolationLayer::new(config, registry);

    let vault_root = vault_dir.path().to_str().unwrap().to_string();
    let context = AgentContext {
        workflow_id: "wf_iso_test".to_string(),
        task: "test_isolation".to_string(),
        event_data: json!({"test": "data"}),
        vault_root,
        execution_id: "exec_iso_001".to_string(),
        timeout_secs: 5,
    };

    let result = isolation.execute_isolated("echo", context).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_audit_trail_records_events() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::default();
    let isolation = ProcessIsolationLayer::new(config, registry);

    let vault_root = vault_dir.path().to_str().unwrap().to_string();
    let context = AgentContext {
        workflow_id: "wf_audit_test".to_string(),
        task: "test_audit".to_string(),
        event_data: json!({"test": "audit"}),
        vault_root,
        execution_id: "exec_audit_001".to_string(),
        timeout_secs: 5,
    };

    let _ = isolation.execute_isolated("echo", context).await;

    let trail = isolation.get_audit_trail("echo").await;
    assert!(!trail.is_empty());

    // Verify we have start event
    let has_start = trail.iter().any(|e| e.event_type == IsolationEventType::ProcessStarted);
    assert!(has_start);

    // Verify we have termination event
    let has_end = trail.iter().any(|e| e.event_type == IsolationEventType::ProcessTerminated);
    assert!(has_end);
}

#[tokio::test]
async fn test_execution_trail_by_id() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::default();
    let isolation = ProcessIsolationLayer::new(config, registry);

    let exec_id = "exec_trail_123".to_string();
    let vault_root = vault_dir.path().to_str().unwrap().to_string();
    let context = AgentContext {
        workflow_id: "wf_trail_test".to_string(),
        task: "test_trail".to_string(),
        event_data: json!({"test": "trail"}),
        vault_root,
        execution_id: exec_id.clone(),
        timeout_secs: 5,
    };

    let _ = isolation.execute_isolated("echo", context).await;

    let trail = isolation.get_execution_trail(&exec_id).await;
    assert!(!trail.is_empty());

    // All events should have the correct execution ID
    for event in &trail {
        assert_eq!(event.execution_id, Some(exec_id.clone()));
    }
}

#[tokio::test]
async fn test_crash_recovery_history() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::default();
    let isolation = ProcessIsolationLayer::new(config, registry);

    // Before execution, no history
    let history = isolation.get_crash_history("echo").await;
    assert!(history.is_none());

    // Execute successfully
    let vault_root = vault_dir.path().to_str().unwrap().to_string();
    let context = AgentContext {
        workflow_id: "wf_crash_test".to_string(),
        task: "test_crash".to_string(),
        event_data: json!({"test": "crash"}),
        vault_root,
        execution_id: "exec_crash_001".to_string(),
        timeout_secs: 5,
    };

    let _ = isolation.execute_isolated("echo", context).await;

    // After successful execution, history should be reset
    let history = isolation.get_crash_history("echo").await;
    if let Some(h) = history {
        assert_eq!(h.crash_count, 0); // Reset on success
    }
}

#[tokio::test]
async fn test_permissive_config() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::permissive();
    assert_eq!(config.max_memory_mb, 2048);
    assert_eq!(config.max_cpu_percent, 100.0);

    let isolation = ProcessIsolationLayer::new(config, registry);

    let vault_root = vault_dir.path().to_str().unwrap().to_string();
    let context = AgentContext {
        workflow_id: "wf_permissive_test".to_string(),
        task: "test_permissive".to_string(),
        event_data: json!({"test": "permissive"}),
        vault_root,
        execution_id: "exec_permissive_001".to_string(),
        timeout_secs: 60, // Permissive timeout
    };

    let result = isolation.execute_isolated("echo", context).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_strict_config() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::strict();
    assert_eq!(config.max_memory_mb, 256);
    assert_eq!(config.max_cpu_percent, 25.0);
    assert_eq!(config.max_retries, 1);

    let isolation = ProcessIsolationLayer::new(config, registry);

    let vault_root = vault_dir.path().to_str().unwrap().to_string();
    let context = AgentContext {
        workflow_id: "wf_strict_test".to_string(),
        task: "test_strict".to_string(),
        event_data: json!({"test": "strict"}),
        vault_root,
        execution_id: "exec_strict_001".to_string(),
        timeout_secs: 15, // Strict timeout
    };

    let result = isolation.execute_isolated("echo", context).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_isolation_config_default() {
    let config = IsolationConfig::default();
    assert_eq!(config.max_memory_mb, 512);
    assert_eq!(config.max_cpu_percent, 50.0);
    assert_eq!(config.timeout_secs, 30);
    assert!(config.crash_recovery_enabled);
    assert_eq!(config.max_retries, 3);
}

#[tokio::test]
async fn test_multiple_agents_concurrent_isolation() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::default();
    let isolation = Arc::new(ProcessIsolationLayer::new(config, registry));

    let mut handles = vec![];

    for i in 0..5 {
        let isolation_clone = isolation.clone();
        let vault_path = vault_dir.path().to_str().unwrap().to_string();

        let handle = tokio::spawn(async move {
            let context = AgentContext {
                workflow_id: format!("wf_concurrent_{}", i),
                task: format!("task_{}", i),
                event_data: json!({"index": i}),
                vault_root: vault_path,
                execution_id: format!("exec_concurrent_{}", i),
                timeout_secs: 5,
            };

            isolation_clone.execute_isolated("echo", context).await
        });

        handles.push(handle);
    }

    for handle in handles {
        let result = handle.await;
        assert!(result.is_ok());
        let exec_result = result.unwrap();
        assert!(exec_result.is_ok());
    }
}

#[tokio::test]
async fn test_isolation_events_have_timestamps() {
    let vault_dir = tempdir().unwrap();
    let vault_path = PathBuf::from(vault_dir.path());
    let vault = VaultManager::new(vault_path).unwrap();
    let _vault = Arc::new(vault);

    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let registry = Arc::new(registry);

    let config = IsolationConfig::default();
    let isolation = ProcessIsolationLayer::new(config, registry);

    let vault_root = vault_dir.path().to_str().unwrap().to_string();
    let context = AgentContext {
        workflow_id: "wf_timestamp_test".to_string(),
        task: "test_timestamp".to_string(),
        event_data: json!({"test": "timestamp"}),
        vault_root,
        execution_id: "exec_timestamp_001".to_string(),
        timeout_secs: 5,
    };

    let _ = isolation.execute_isolated("echo", context).await;

    let trail = isolation.get_audit_trail("echo").await;
    assert!(!trail.is_empty());

    for event in trail {
        // All events must have a timestamp
        assert!(event.timestamp < Utc::now());
    }
}

#[tokio::test]
async fn test_isolation_config_per_agent_policy() {
    let config = IsolationConfig::default();
    let policy = AgentIsolationPolicy {
        agent_id: "test_agent".to_string(),
        memory_limit_mb: Some(1024),
        cpu_quota_percent: None,
        timeout_secs: Some(60),
    };

    assert_eq!(policy.get_memory_mb(config.max_memory_mb), 1024);
    assert_eq!(policy.get_cpu_percent(config.max_cpu_percent), 50.0);
    assert_eq!(policy.get_timeout_secs(config.timeout_secs), 60);
}
