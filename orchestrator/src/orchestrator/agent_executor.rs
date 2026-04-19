//! Agent Executor - Executes agents with timeout and resource protection
//!
//! Handles:
//! - Timeout enforcement via tokio::time::timeout
//! - Execution metrics collection
//! - Error handling and reporting
//! - Integration with AgentRegistry

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentError};
use crate::orchestrator::AgentRegistry;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::timeout;

/// Agent executor - runs agents with safety guarantees
pub struct AgentExecutor {
    registry: Arc<AgentRegistry>,
}

impl AgentExecutor {
    /// Create a new executor with agent registry
    pub fn new(registry: Arc<AgentRegistry>) -> Self {
        AgentExecutor { registry }
    }

    /// Execute an agent by ID
    /// 
    /// Enforces:
    /// - Timeout protection
    /// - Error handling
    /// - Metric collection
    pub async fn execute(
        &self,
        agent_id: &str,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        // Get agent from registry
        let agent = self.registry.get(agent_id)?;

        // Get timeout from context
        let timeout_duration = Duration::from_secs(context.timeout_secs);

        // Execute with timeout protection
        match timeout(timeout_duration, agent.execute(context)).await {
            Ok(result) => result,
            Err(_) => Err(AgentError::Timeout),
        }
    }

    /// List all available agent IDs
    pub fn list_agents(&self) -> Vec<String> {
        self.registry.list_ids()
    }

    /// Check if agent exists
    pub fn agent_exists(&self, id: &str) -> bool {
        self.registry.exists(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::orchestrator::agent::AgentMetadata;
    use async_trait::async_trait;

    /// Test agent that completes quickly
    struct FastAgent;

    #[async_trait]
    impl Agent for FastAgent {
        async fn execute(
            &self,
            context: AgentContext,
        ) -> Result<AgentOutput, AgentError> {
            Ok(AgentOutput {
                success: true,
                result: serde_json::json!({"type": "fast"}),
                metadata: AgentMetadata {
                    duration_ms: 10,
                    status: "success".to_string(),
                    error_message: None,
                },
                vault_writes: vec![],
                logs: None,
            })
        }
    }

    /// Test agent that errors
    struct ErrorAgent;

    #[async_trait]
    impl Agent for ErrorAgent {
        async fn execute(
            &self,
            _context: AgentContext,
        ) -> Result<AgentOutput, AgentError> {
            Err(AgentError::ExecutionError("Test error".to_string()))
        }
    }

    /// Test agent that times out (sleeps longer than timeout)
    struct SlowAgent {
        sleep_ms: u64,
    }

    #[async_trait]
    impl Agent for SlowAgent {
        async fn execute(
            &self,
            _context: AgentContext,
        ) -> Result<AgentOutput, AgentError> {
            tokio::time::sleep(Duration::from_millis(self.sleep_ms)).await;
            Ok(AgentOutput {
                success: true,
                result: serde_json::json!({"type": "slow"}),
                metadata: AgentMetadata {
                    duration_ms: self.sleep_ms,
                    status: "success".to_string(),
                    error_message: None,
                },
                vault_writes: vec![],
                logs: None,
            })
        }
    }

    fn create_test_context() -> AgentContext {
        AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "test".to_string(),
            event_data: serde_json::json!({"test": "data"}),
            vault_root: "/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 1,
        }
    }

    #[tokio::test]
    async fn test_executor_execute_success() {
        let mut registry = AgentRegistry::new();
        registry.register("fast", Arc::new(FastAgent));
        let executor = AgentExecutor::new(Arc::new(registry));

        let context = create_test_context();
        let result = executor.execute("fast", context).await;

        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.success);
    }

    #[tokio::test]
    async fn test_executor_execute_error() {
        let mut registry = AgentRegistry::new();
        registry.register("error", Arc::new(ErrorAgent));
        let executor = AgentExecutor::new(Arc::new(registry));

        let context = create_test_context();
        let result = executor.execute("error", context).await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_executor_agent_not_found() {
        let registry = AgentRegistry::new();
        let executor = AgentExecutor::new(Arc::new(registry));

        let context = create_test_context();
        let result = executor.execute("nonexistent", context).await;

        assert!(result.is_err());
        match result {
            Err(AgentError::NotFound(_)) => {},
            _ => panic!("Expected NotFound error"),
        }
    }

    #[tokio::test]
    async fn test_executor_timeout() {
        let mut registry = AgentRegistry::new();
        registry.register("slow", Arc::new(SlowAgent { sleep_ms: 5000 }));
        let executor = AgentExecutor::new(Arc::new(registry));

        let context = AgentContext {
            workflow_id: "wf_timeout".to_string(),
            task: "test".to_string(),
            event_data: serde_json::json!({}),
            vault_root: "/vault".to_string(),
            execution_id: "exec_timeout".to_string(),
            timeout_secs: 1, // Will timeout
        };

        let result = executor.execute("slow", context).await;
        assert!(result.is_err());
        match result {
            Err(AgentError::Timeout) => {},
            _ => panic!("Expected Timeout error"),
        }
    }

    #[tokio::test]
    async fn test_executor_list_agents() {
        let mut registry = AgentRegistry::new();
        registry.register("agent1", Arc::new(FastAgent));
        registry.register("agent2", Arc::new(FastAgent));
        let executor = AgentExecutor::new(Arc::new(registry));

        let agents = executor.list_agents();
        assert_eq!(agents.len(), 2);
        assert!(agents.contains(&"agent1".to_string()));
        assert!(agents.contains(&"agent2".to_string()));
    }

    #[tokio::test]
    async fn test_executor_agent_exists() {
        let mut registry = AgentRegistry::new();
        registry.register("exists", Arc::new(FastAgent));
        let executor = AgentExecutor::new(Arc::new(registry));

        assert!(executor.agent_exists("exists"));
        assert!(!executor.agent_exists("nonexistent"));
    }
}
