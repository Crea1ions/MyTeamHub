//! Indexer Agent - Demonstrates vault interaction
//!
//! Shows how agents can work with vault metadata
//! In this MVP: reports on projects that would be indexed

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

/// Indexer agent - would index vault files
/// MVP version: reports on what would be indexed
pub struct IndexerAgent;

#[async_trait]
impl Agent for IndexerAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        // ✅ Read from context
        let project_id = context.event_data
            .get("project_id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        // In a real implementation, we would scan the vault
        // For MVP, we just report what we would index
        let index_plan = serde_json::json!({
            "project_id": project_id,
            "would_index": [
                "outputs/",
                "sessions/",
                "metadata/",
            ],
            "estimated_files": 42, // Placeholder
            "status": "ready_for_indexing"
        });

        // ✅ Return result
        Ok(AgentOutput {
            success: true,
            result: index_plan,
            metadata: AgentMetadata {
                duration_ms: start.elapsed().as_millis() as u64,
                status: "success".to_string(),
                error_message: None,
            },
            vault_writes: vec![],
            logs: Some(vec![
                "Indexer agent started".to_string(),
                format!("Planning index for project: {}", project_id),
                "Ready for indexing".to_string(),
                "Indexer agent complete".to_string(),
            ]),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_indexer_agent_success() {
        let agent = IndexerAgent;
        let context = AgentContext {
            workflow_id: "wf_index".to_string(),
            task: "index".to_string(),
            event_data: serde_json::json!({
                "project_id": "test_project"
            }),
            vault_root: "/vault".to_string(),
            execution_id: "exec_index".to_string(),
            timeout_secs: 30,
        };

        let result = agent.execute(context).await;
        assert!(result.is_ok());

        let output = result.unwrap();
        assert!(output.success);
        assert_eq!(output.metadata.status, "success");
        assert_eq!(output.result["project_id"].as_str(), Some("test_project"));
    }

    #[tokio::test]
    async fn test_indexer_agent_no_project_id() {
        let agent = IndexerAgent;
        let context = AgentContext {
            workflow_id: "wf_no_id".to_string(),
            task: "index".to_string(),
            event_data: serde_json::json!({}), // No project_id
            vault_root: "/vault".to_string(),
            execution_id: "exec_no_id".to_string(),
            timeout_secs: 30,
        };

        let output = agent.execute(context).await.unwrap();
        assert_eq!(output.result["project_id"].as_str(), Some("unknown"));
    }

    #[tokio::test]
    async fn test_indexer_agent_has_logs() {
        let agent = IndexerAgent;
        let context = AgentContext {
            workflow_id: "wf_logs".to_string(),
            task: "index".to_string(),
            event_data: serde_json::json!({"project_id": "logs_test"}),
            vault_root: "/vault".to_string(),
            execution_id: "exec_logs".to_string(),
            timeout_secs: 30,
        };

        let output = agent.execute(context).await.unwrap();
        assert!(output.logs.is_some());
        assert_eq!(output.logs.unwrap().len(), 4);
    }
}
