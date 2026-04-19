//! Integration tests for Phase 2.3 — Agent Switching (Consolidation)
//! 
//! Tests non-linear agent selection based on event context

use std::sync::Arc;
use orchestrator::{
    AgentContext, AgentRegistry, AgentExecutor, AgentSelector, SelectionRule,
    EchoAgent, AnalyzerAgent, IndexerAgent,
};

#[tokio::test]
async fn integration_agent_selector_analyzer() {
    let selector = AgentSelector::new();

    // Event with content field should select analyzer
    let event_data = serde_json::json!({
        "content": "This is text to analyze"
    });

    let result = selector.select_agent(&event_data);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "analyzer");
}

#[tokio::test]
async fn integration_agent_selector_indexer() {
    let selector = AgentSelector::new();

    // Event with project_id should select indexer
    let event_data = serde_json::json!({
        "project_id": "my_project"
    });

    let result = selector.select_agent(&event_data);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "indexer");
}

#[tokio::test]
async fn integration_agent_selector_echo() {
    let selector = AgentSelector::new();

    // Event with echo task should select echo agent
    let event_data = serde_json::json!({
        "task": "echo"
    });

    let result = selector.select_agent(&event_data);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "echo");
}

#[tokio::test]
async fn integration_agent_selector_fallback() {
    let selector = AgentSelector::new();

    // Event with no matching criteria should fallback to echo
    let event_data = serde_json::json!({
        "unknown_field": "value"
    });

    let result = selector.select_agent(&event_data);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "echo");
}

#[tokio::test]
async fn integration_nonlinear_switching() {
    let mut registry = AgentRegistry::new();
    registry.register("echo", Arc::new(EchoAgent));
    registry.register("analyzer", Arc::new(AnalyzerAgent));
    registry.register("indexer", Arc::new(IndexerAgent));
    let executor = AgentExecutor::new(Arc::new(registry));

    let selector = AgentSelector::new();

    // Scenario 1: Content-based selection → Analyzer
    let ctx1 = AgentContext {
        workflow_id: "wf_content".to_string(),
        task: "analyze".to_string(),
        event_data: serde_json::json!({
            "content": "Good and excellent"
        }),
        vault_root: "/vault".to_string(),
        execution_id: "exec_1".to_string(),
        timeout_secs: 5,
    };

    let selected_agent_1 = selector.select_agent(&ctx1.event_data).unwrap();
    assert_eq!(selected_agent_1, "analyzer");

    let result1 = executor.execute(&selected_agent_1, ctx1).await;
    assert!(result1.is_ok());

    // Scenario 2: Project-based selection → Indexer  
    let ctx2 = AgentContext {
        workflow_id: "wf_project".to_string(),
        task: "index".to_string(),
        event_data: serde_json::json!({
            "project_id": "proj_123"
        }),
        vault_root: "/vault".to_string(),
        execution_id: "exec_2".to_string(),
        timeout_secs: 5,
    };

    let selected_agent_2 = selector.select_agent(&ctx2.event_data).unwrap();
    assert_eq!(selected_agent_2, "indexer");

    let result2 = executor.execute(&selected_agent_2, ctx2).await;
    assert!(result2.is_ok());

    // Scenario 3: Generic selection → Echo
    let ctx3 = AgentContext {
        workflow_id: "wf_echo".to_string(),
        task: "process".to_string(),
        event_data: serde_json::json!({
            "data": "just pass through"
        }),
        vault_root: "/vault".to_string(),
        execution_id: "exec_3".to_string(),
        timeout_secs: 5,
    };

    let selected_agent_3 = selector.select_agent(&ctx3.event_data).unwrap();
    assert_eq!(selected_agent_3, "echo");

    let result3 = executor.execute(&selected_agent_3, ctx3).await;
    assert!(result3.is_ok());
}

#[tokio::test]
async fn integration_priority_switching() {
    let mut selector = AgentSelector::new();

    // Add high-priority rule
    selector.add_rule(SelectionRule {
        name: "urgent".to_string(),
        condition: "priority:high".to_string(),
        agent_id: "analyzer".to_string(),
        priority: 1000,
    });

    // Even with content field, high-priority rule should win
    let event_data = serde_json::json!({
        "priority": "high",
        "content": "analysis data"
    });

    let result = selector.select_agent(&event_data);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "analyzer");
}

#[tokio::test]
async fn integration_selector_list_rules() {
    let selector = AgentSelector::new();
    let rules = selector.list_rules();

    // Should have default rules
    assert!(rules.len() >= 3);
    
    // Rules should be properly formatted
    for rule in &rules {
        assert!(rule.contains("priority:"));
    }
}
