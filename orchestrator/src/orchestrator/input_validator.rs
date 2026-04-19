//! Input validation module
//!
//! Validates agent contexts before execution

use crate::orchestrator::AgentContext;

/// Validation error types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ValidationError {
    EmptyTask,
    TaskTooLong(usize),
    InvalidWorkflowId,
    InvalidExecutionId,
    TimeoutTooLarge,
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ValidationError::EmptyTask => write!(f, "Task cannot be empty"),
            ValidationError::TaskTooLong(len) => {
                write!(f, "Task too long: {} bytes (max 100KB)", len)
            }
            ValidationError::InvalidWorkflowId => write!(f, "Invalid workflow ID format"),
            ValidationError::InvalidExecutionId => write!(f, "Invalid execution ID format"),
            ValidationError::TimeoutTooLarge => write!(f, "Timeout too large (max 3600s)"),
        }
    }
}

/// Validation result
pub type ValidationResult = Result<(), ValidationError>;

/// Input validator for agent contexts
pub struct InputValidator {
    max_task_size: usize,      // bytes
    max_workflow_id_len: usize, // chars
    max_timeout_secs: u64,      // seconds
}

impl InputValidator {
    /// Create new input validator with defaults
    pub fn new() -> Self {
        InputValidator {
            max_task_size: 100 * 1024, // 100KB
            max_workflow_id_len: 256,
            max_timeout_secs: 3600, // 1 hour
        }
    }

    /// Create permissive validator
    pub fn permissive() -> Self {
        InputValidator {
            max_task_size: 10 * 1024 * 1024, // 10MB
            max_workflow_id_len: 1024,
            max_timeout_secs: 86400, // 24 hours
        }
    }

    /// Create strict validator
    pub fn strict() -> Self {
        InputValidator {
            max_task_size: 10 * 1024, // 10KB
            max_workflow_id_len: 128,
            max_timeout_secs: 600, // 10 minutes
        }
    }

    /// Validate agent context
    pub fn validate_context(&self, context: &AgentContext) -> ValidationResult {
        // Check task not empty
        if context.task.is_empty() {
            return Err(ValidationError::EmptyTask);
        }

        // Check task size
        let task_size = context.task.len();
        if task_size > self.max_task_size {
            return Err(ValidationError::TaskTooLong(task_size));
        }

        // Check workflow_id format
        if context.workflow_id.is_empty() || context.workflow_id.len() > self.max_workflow_id_len {
            return Err(ValidationError::InvalidWorkflowId);
        }

        // Check execution_id format
        if context.execution_id.is_empty() || context.execution_id.len() > self.max_workflow_id_len {
            return Err(ValidationError::InvalidExecutionId);
        }

        // Check timeout
        if context.timeout_secs > self.max_timeout_secs {
            return Err(ValidationError::TimeoutTooLarge);
        }

        Ok(())
    }

    /// Check if input is valid
    pub fn is_valid(&self, context: &AgentContext) -> bool {
        self.validate_context(context).is_ok()
    }
}

impl Default for InputValidator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_context(task: &str) -> AgentContext {
        AgentContext {
            workflow_id: "wf_test".to_string(),
            task: task.to_string(),
            event_data: serde_json::json!({}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 30,
        }
    }

    #[test]
    fn test_valid_context() {
        let validator = InputValidator::new();
        let ctx = create_test_context("Valid task");
        assert!(validator.validate_context(&ctx).is_ok());
    }

    #[test]
    fn test_empty_task() {
        let validator = InputValidator::new();
        let ctx = create_test_context("");
        assert_eq!(
            validator.validate_context(&ctx),
            Err(ValidationError::EmptyTask)
        );
    }

    #[test]
    fn test_task_too_long() {
        let validator = InputValidator::new();
        let long_task = "t".repeat(101 * 1024);
        let ctx = create_test_context(&long_task);
        assert!(matches!(
            validator.validate_context(&ctx),
            Err(ValidationError::TaskTooLong(_))
        ));
    }

    #[test]
    fn test_timeout_too_large() {
        let validator = InputValidator::new();
        let mut ctx = create_test_context("Valid task");
        ctx.timeout_secs = 7200; // 2 hours
        assert_eq!(
            validator.validate_context(&ctx),
            Err(ValidationError::TimeoutTooLarge)
        );
    }

    #[test]
    fn test_permissive_allows_large() {
        let validator = InputValidator::permissive();
        let large_task = "t".repeat(5 * 1024 * 1024); // 5MB
        let ctx = create_test_context(&large_task);
        assert!(validator.validate_context(&ctx).is_ok());
    }
}
