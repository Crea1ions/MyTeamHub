//! Echo Agent - Simple pass-through agent
//!
//! Demonstrates basic agent interface
//! Returns input as output with execution metadata

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

/// Echo agent - returns input as output
/// Used for testing and as MVP demonstration
pub struct EchoAgent;

#[async_trait]
impl Agent for EchoAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        // ✅ Read context (immutable)
        let task = context.task.clone();
        let workflow_id = context.workflow_id.clone();

        // ✅ Echo back the task and context
        let result = serde_json::json!({
            "task": task,
            "workflow_id": workflow_id,
            "received_data": context.event_data,
            "echo": "success"
        });

        // ✅ Return structured output
        Ok(AgentOutput {
            success: true,
            result,
            metadata: AgentMetadata {
                duration_ms: start.elapsed().as_millis() as u64,
                status: "success".to_string(),
                error_message: None,
            },
            vault_writes: vec![],
            logs: Some(vec![
                "Echo agent started".to_string(),
                format!("Echoed task: {}", task),
                "Echo agent complete".to_string(),
            ]),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_echo_agent() {
        let agent = EchoAgent;
        let context = AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "echo_test".to_string(),
            event_data: serde_json::json!({"test": "data"}),
            vault_root: "/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 30,
        };

        let result = agent.execute(context).await;
        assert!(result.is_ok());

        let output = result.unwrap();
        assert!(output.success);
        assert_eq!(output.metadata.status, "success");
        assert!(output.logs.is_some());
        assert_eq!(output.logs.unwrap().len(), 3);
    }

    #[tokio::test]
    async fn test_echo_agent_returns_event_data() {
        let agent = EchoAgent;
        let event_data = serde_json::json!({"key": "value", "number": 42});
        let context = AgentContext {
            workflow_id: "wf_data".to_string(),
            task: "test".to_string(),
            event_data: event_data.clone(),
            vault_root: "/vault".to_string(),
            execution_id: "exec_data".to_string(),
            timeout_secs: 30,
        };

        let output = agent.execute(context).await.unwrap();
        let received = output.result["received_data"].clone();
        assert_eq!(received, event_data);
    }
}
