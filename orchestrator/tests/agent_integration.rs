//! Integration tests for Phase 2.2 Agent Execution Engine

use std::sync::Arc;
use orchestrator::{
    AgentContext, AgentRegistry, AgentExecutor,
    EchoAgent, AnalyzerAgent, IndexerAgent,
};

#[tokio::test]
async fn integration_echo_agent() {
    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    let executor = AgentExecutor::new(Arc::new(registry));

    let context = AgentContext {
        workflow_id: "wf_echo_test".to_string(),
        task: "echo_message".to_string(),
        event_data: serde_json::json!({"message": "Hello"}),
        vault_root: "/vault/test".to_string(),
        execution_id: "exec_echo_1".to_string(),
        timeout_secs: 5,
    };

    let result = executor.execute("echo", context).await;
    assert!(result.is_ok());
    let output = result.unwrap();
    assert!(output.success);
}

#[tokio::test]
async fn integration_analyzer_agent() {
    let mut registry = AgentRegistry::new();
    registry.register("analyzer", Arc::new(AnalyzerAgent));
    let executor = AgentExecutor::new(Arc::new(registry));

    let context = AgentContext {
        workflow_id: "wf_analyze".to_string(),
        task: "analyze".to_string(),
        event_data: serde_json::json!({"content": "This is great!"}),
        vault_root: "/vault".to_string(),
        execution_id: "exec_analyzer_1".to_string(),
        timeout_secs: 5,
    };

    let result = executor.execute("analyzer", context).await;
    assert!(result.is_ok());
    let output = result.unwrap();
    assert_eq!(output.result["sentiment"], "positive");
}

#[tokio::test]
async fn integration_indexer_agent() {
    let mut registry = AgentRegistry::new();
    registry.register("indexer", Arc::new(IndexerAgent));
    let executor = AgentExecutor::new(Arc::new(registry));

    let context = AgentContext {
        workflow_id: "wf_index".to_string(),
        task: "index".to_string(),
        event_data: serde_json::json!({"project_id": "test"}),
        vault_root: "/vault".to_string(),
        execution_id: "exec_indexer_1".to_string(),
        timeout_secs: 5,
    };

    let result = executor.execute("indexer", context).await;
    assert!(result.is_ok());
    let output = result.unwrap();
    assert!(output.success);
}

#[tokio::test]
async fn integration_registry_lists_agents() {
    let mut registry = AgentRegistry::new();
    registry.register("agent1", Arc::new(EchoAgent));
    registry.register("agent2", Arc::new(AnalyzerAgent));
    let executor = AgentExecutor::new(Arc::new(registry));

    let agents = executor.list_agents();
    assert_eq!(agents.len(), 2);
}

#[tokio::test]
async fn integration_error_handling() {
    let mut registry = AgentRegistry::new();
    registry.register("analyzer", Arc::new(AnalyzerAgent));
    let executor = AgentExecutor::new(Arc::new(registry));

    let context = AgentContext {
        workflow_id: "wf_error".to_string(),
        task: "analyze".to_string(),
        event_data: serde_json::json!({}), // Missing content
        vault_root: "/vault".to_string(),
        execution_id: "exec_error".to_string(),
        timeout_secs: 5,
    };

    let result = executor.execute("analyzer", context).await;
    assert!(result.is_err());
}
