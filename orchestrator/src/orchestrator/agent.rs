//! Agent trait and types for Phase 2.2 Agent Execution Engine
//!
//! Agents are isolated execution workers that:
//! - Receive immutable AgentContext (read-only)
//! - Execute their task
//! - Return structured AgentOutput
//! - Write to vault_root if needed
//!
//! Design principles:
//! - Simple interface (1 trait, 2 types)
//! - Immutable input (no side effects)
//! - Structured output (clear results)
//! - Isolated execution (no coordination)

use serde::{Deserialize, Serialize};
use std::fmt;

/// Immutable context passed to agents
/// Agents can only READ this, not modify
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentContext {
    /// Unique workflow identifier
    pub workflow_id: String,
    
    /// Task description / what to execute
    pub task: String,
    
    /// Event data (immutable)
    pub event_data: serde_json::Value,
    
    /// Vault root directory (agents can write here)
    pub vault_root: String,
    
    /// Unique execution identifier
    pub execution_id: String,
    
    /// Execution timeout in seconds
    pub timeout_secs: u64,
}

/// Output returned by agent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentOutput {
    /// Was execution successful?
    pub success: bool,
    
    /// Execution result (any JSON structure)
    pub result: serde_json::Value,
    
    /// Execution metadata (timing, status)
    pub metadata: AgentMetadata,
    
    /// Files written to Vault during execution
    pub vault_writes: Vec<VaultWriteRecord>,
    
    /// Optional execution logs
    pub logs: Option<Vec<String>>,
}

/// Execution metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetadata {
    /// Duration in milliseconds
    pub duration_ms: u64,
    
    /// Status: "success", "error", "timeout"
    pub status: String,
    
    /// Error message (if failed)
    pub error_message: Option<String>,
}

/// Record of a vault write operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultWriteRecord {
    /// Relative path in vault (e.g., "outputs/result.md")
    pub path: String,
    
    /// File ID from vault
    pub file_id: String,
    
    /// File size in bytes
    pub size_bytes: usize,
}

/// Agent errors
#[derive(Debug, Clone)]
pub enum AgentError {
    /// Missing required field in context
    MissingField(String),
    
    /// Vault operation failed
    VaultError(String),
    
    /// Execution timeout
    Timeout,
    
    /// Generic execution error
    ExecutionError(String),
    
    /// Agent not found
    NotFound(String),
}

impl fmt::Display for AgentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AgentError::MissingField(field) => write!(f, "Missing field: {}", field),
            AgentError::VaultError(err) => write!(f, "Vault error: {}", err),
            AgentError::Timeout => write!(f, "Execution timeout"),
            AgentError::ExecutionError(err) => write!(f, "Execution error: {}", err),
            AgentError::NotFound(id) => write!(f, "Agent not found: {}", id),
        }
    }
}

impl std::error::Error for AgentError {}

/// Core Agent trait
/// Agents implement this single method to execute their task
#[async_trait::async_trait]
pub trait Agent: Send + Sync {
    /// Execute the agent's task
    /// 
    /// # Arguments
    /// * `context` - Immutable execution context (read-only)
    /// 
    /// # Returns
    /// AgentOutput with results, or AgentError if failed
    /// 
    /// # Guarantees
    /// - Timeout enforced by execution engine
    /// - Vault writes isolated to vault_root
    /// - No modification of state machine
    /// - No coordination with other agents
    async fn execute(&self, context: AgentContext) -> Result<AgentOutput, AgentError>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_context_serialization() {
        let ctx = AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "test_task".to_string(),
            event_data: serde_json::json!({"key": "value"}),
            vault_root: "/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 30,
        };

        let json = serde_json::to_string(&ctx).expect("Serialize context");
        let _ctx2: AgentContext = serde_json::from_str(&json).expect("Deserialize context");
    }

    #[test]
    fn test_agent_output_serialization() {
        let output = AgentOutput {
            success: true,
            result: serde_json::json!({"data": "test"}),
            metadata: AgentMetadata {
                duration_ms: 100,
                status: "success".to_string(),
                error_message: None,
            },
            vault_writes: vec![],
            logs: Some(vec!["test".to_string()]),
        };

        let json = serde_json::to_string(&output).expect("Serialize output");
        let _output2: AgentOutput = serde_json::from_str(&json).expect("Deserialize output");
    }

    #[test]
    fn test_agent_error_display() {
        let err = AgentError::MissingField("project_id".to_string());
        assert_eq!(err.to_string(), "Missing field: project_id");

        let err = AgentError::Timeout;
        assert_eq!(err.to_string(), "Execution timeout");
    }
}
