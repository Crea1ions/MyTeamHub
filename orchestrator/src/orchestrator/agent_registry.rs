//! Agent registry for Phase 2.2
//!
//! Manages agent storage and lookup
//! Simple key-value store for agent instances

use crate::orchestrator::agent::{Agent, AgentError};
use std::collections::HashMap;
use std::sync::Arc;

/// Agent registry - stores and retrieves agents
pub struct AgentRegistry {
    /// Map of agent_id -> Agent instance
    agents: HashMap<String, Arc<dyn Agent>>,
}

impl AgentRegistry {
    /// Create a new empty registry
    pub fn new() -> Self {
        AgentRegistry {
            agents: HashMap::new(),
        }
    }

    /// Register an agent
    pub fn register(&mut self, id: impl Into<String>, agent: Arc<dyn Agent>) {
        self.agents.insert(id.into(), agent);
    }

    /// Get an agent by ID
    pub fn get(&self, id: &str) -> Result<Arc<dyn Agent>, AgentError> {
        self.agents
            .get(id)
            .cloned()
            .ok_or_else(|| AgentError::NotFound(id.to_string()))
    }

    /// List all registered agent IDs
    pub fn list_ids(&self) -> Vec<String> {
        self.agents.keys().cloned().collect()
    }

    /// Check if agent exists
    pub fn exists(&self, id: &str) -> bool {
        self.agents.contains_key(id)
    }

    /// Get count of registered agents
    pub fn count(&self) -> usize {
        self.agents.len()
    }

    /// Clear all agents
    pub fn clear(&mut self) {
        self.agents.clear();
    }
}

impl Default for AgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use crate::orchestrator::agent::{AgentContext, AgentOutput, AgentMetadata};

    /// Test dummy agent
    struct TestAgent;

    #[async_trait]
    impl Agent for TestAgent {
        async fn execute(
            &self,
            _context: AgentContext,
        ) -> Result<AgentOutput, AgentError> {
            Ok(AgentOutput {
                success: true,
                result: serde_json::json!({"test": "ok"}),
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

    #[test]
    fn test_registry_register_get() {
        let mut registry = AgentRegistry::new();
        let agent = Arc::new(TestAgent);

        registry.register("test_agent", agent.clone());
        assert!(registry.exists("test_agent"));

        let retrieved = registry.get("test_agent").expect("Should get agent");
        assert_eq!(Arc::strong_count(&retrieved), 3); // original + registry + retrieved
    }

    #[test]
    fn test_registry_get_nonexistent() {
        let registry = AgentRegistry::new();
        let result = registry.get("nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_registry_list_ids() {
        let mut registry = AgentRegistry::new();
        let agent = Arc::new(TestAgent);

        registry.register("agent1", agent.clone());
        registry.register("agent2", agent.clone());

        let ids = registry.list_ids();
        assert_eq!(ids.len(), 2);
        assert!(ids.contains(&"agent1".to_string()));
        assert!(ids.contains(&"agent2".to_string()));
    }

    #[test]
    fn test_registry_count() {
        let mut registry = AgentRegistry::new();
        let agent = Arc::new(TestAgent);

        registry.register("agent1", agent.clone());
        registry.register("agent2", agent.clone());

        assert_eq!(registry.count(), 2);
    }

    #[test]
    fn test_registry_clear() {
        let mut registry = AgentRegistry::new();
        let agent = Arc::new(TestAgent);

        registry.register("agent1", agent);
        registry.clear();

        assert_eq!(registry.count(), 0);
    }
}
