//! Structured logging module
//!
//! Simple JSON logs with workflow/execution correlation
//! No external dependencies, just in-memory storage and JSON export

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Log level
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[derive(Hash)]
pub enum LogLevel {
    #[serde(rename = "DEBUG")]
    Debug,
    #[serde(rename = "INFO")]
    Info,
    #[serde(rename = "WARN")]
    Warn,
    #[serde(rename = "ERROR")]
    Error,
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Debug => write!(f, "DEBUG"),
            LogLevel::Info => write!(f, "INFO"),
            LogLevel::Warn => write!(f, "WARN"),
            LogLevel::Error => write!(f, "ERROR"),
        }
    }
}

/// Structured log entry with workflow correlation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructuredLog {
    /// When log was created
    pub timestamp: DateTime<Utc>,
    
    /// Workflow identifier for correlation
    pub workflow_id: String,
    
    /// Execution identifier for tracing
    pub execution_id: Option<String>,
    
    /// Log level
    pub level: LogLevel,
    
    /// Human-readable message
    pub message: String,
    
    /// Additional context (agent, task, etc.)
    pub context: HashMap<String, serde_json::Value>,
}

impl StructuredLog {
    /// Create new log entry
    pub fn new(level: LogLevel, message: &str, workflow_id: String) -> Self {
        StructuredLog {
            timestamp: Utc::now(),
            workflow_id,
            execution_id: None,
            level,
            message: message.to_string(),
            context: HashMap::new(),
        }
    }

    /// Add execution ID for tracing
    pub fn with_execution(mut self, execution_id: String) -> Self {
        self.execution_id = Some(execution_id);
        self
    }

    /// Add context key-value pair
    pub fn with_context(mut self, key: String, value: serde_json::Value) -> Self {
        self.context.insert(key, value);
        self
    }

    /// Add multiple context items
    pub fn with_contexts(mut self, contexts: HashMap<String, serde_json::Value>) -> Self {
        self.context.extend(contexts);
        self
    }

    /// Convenience: add agent name to context
    pub fn with_agent(self, agent_id: &str) -> Self {
        self.with_context("agent".to_string(), serde_json::Value::String(agent_id.to_string()))
    }

    /// Convenience: add task name to context
    pub fn with_task(self, task: &str) -> Self {
        self.with_context("task".to_string(), serde_json::Value::String(task.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_creation() {
        let log = StructuredLog::new(LogLevel::Info, "Test message", "wf_123".to_string());
        assert_eq!(log.workflow_id, "wf_123");
        assert_eq!(log.message, "Test message");
        assert_eq!(log.level, LogLevel::Info);
        assert!(log.execution_id.is_none());
    }

    #[test]
    fn test_log_with_execution() {
        let log = StructuredLog::new(LogLevel::Debug, "Test", "wf_123".to_string())
            .with_execution("exec_456".to_string());
        
        assert_eq!(log.execution_id, Some("exec_456".to_string()));
    }

    #[test]
    fn test_log_with_context() {
        let log = StructuredLog::new(LogLevel::Info, "Test", "wf_123".to_string())
            .with_agent("echo")
            .with_task("analyze");
        
        assert_eq!(log.context.get("agent").map(|v| v.as_str().unwrap()), Some("echo"));
        assert_eq!(log.context.get("task").map(|v| v.as_str().unwrap()), Some("analyze"));
    }

    #[test]
    fn test_log_serialization() {
        let log = StructuredLog::new(LogLevel::Warn, "Warning", "wf_123".to_string())
            .with_execution("exec_789".to_string());
        
        let json = serde_json::to_string(&log).unwrap();
        assert!(json.contains("wf_123"));
        assert!(json.contains("WARN"));
        assert!(json.contains("Warning"));
    }
}
