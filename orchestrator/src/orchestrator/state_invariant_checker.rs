//! State invariant checking module
//!
//! Verifies that all state transitions are valid and invariants are maintained

use crate::orchestrator::{WorkflowState, WorkflowContext};
use std::collections::HashSet;

/// State violation types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StateViolation {
    InvalidTransition { from: String, to: String },
    MissingRequiredField(String),
    InvalidStateValue,
    ContextCorrupted,
}

impl std::fmt::Display for StateViolation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StateViolation::InvalidTransition { from, to } => {
                write!(f, "Invalid state transition: {} → {}", from, to)
            }
            StateViolation::MissingRequiredField(name) => {
                write!(f, "Missing required field: {}", name)
            }
            StateViolation::InvalidStateValue => write!(f, "Invalid state value"),
            StateViolation::ContextCorrupted => write!(f, "Context appears corrupted"),
        }
    }
}

/// Invariant check result
pub type InvariantResult = Result<(), StateViolation>;

/// State invariant checker
pub struct StateInvariantChecker;

impl StateInvariantChecker {
    /// Check if a state transition is valid
    pub fn check_transition(
        from: &WorkflowState,
        to: &WorkflowState,
        context: &WorkflowContext,
    ) -> InvariantResult {
        use WorkflowState::*;

        // Verify transition is allowed
        match (from, to) {
            // Idle → Processing: requires event data (not null)
            (Idle, Processing) => {
                if context.event_data.is_null() {
                    return Err(StateViolation::MissingRequiredField(
                        "event_data".to_string(),
                    ));
                }
                Ok(())
            }

            // Processing → WaitingForAgent: valid transition
            (Processing, WaitingForAgent) => Ok(()),

            // WaitingForAgent → Complete/Error: valid transitions
            (WaitingForAgent, Complete) | (WaitingForAgent, Error) => Ok(()),

            // Processing → Error: always allowed
            (Processing, Error) => Ok(()),

            // No other transitions allowed
            (from_state, to_state) => Err(StateViolation::InvalidTransition {
                from: format!("{:?}", from_state),
                to: format!("{:?}", to_state),
            }),
        }
    }

    /// Check all invariants on context
    pub fn check_invariants(context: &WorkflowContext) -> InvariantResult {
        // Check workflow_id is non-empty
        if context.workflow_id.is_empty() {
            return Err(StateViolation::MissingRequiredField(
                "workflow_id".to_string(),
            ));
        }

        // Check state is valid
        match context.state {
            WorkflowState::Idle
            | WorkflowState::Processing
            | WorkflowState::WaitingForAgent
            | WorkflowState::Complete
            | WorkflowState::Error => {}
        }

        Ok(())
    }

    /// Check if state is well-formed
    pub fn is_valid_state(context: &WorkflowContext) -> bool {
        Self::check_invariants(context).is_ok()
    }

    /// Get all valid next states from current state
    pub fn get_valid_next_states(current: &WorkflowState) -> HashSet<WorkflowState> {
        use WorkflowState::*;
        match current {
            Idle => vec![Processing].into_iter().collect(),
            Processing => vec![WaitingForAgent, Error].into_iter().collect(),
            WaitingForAgent => vec![Complete, Error].into_iter().collect(),
            Complete | Error => HashSet::new(), // Terminal states
        }
    }

    /// Verify context consistency
    pub fn verify_consistency(context: &WorkflowContext) -> InvariantResult {
        // All basic invariants
        Self::check_invariants(context)?;

        // Verify transition count is reasonable
        if context.transition_count > 1000 {
            return Err(StateViolation::ContextCorrupted);
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn create_context(state: WorkflowState) -> WorkflowContext {
        WorkflowContext {
            workflow_id: "wf_test".to_string(),
            state,
            event_data: json!({"action": "process"}),
            vault_file_id: None,
            last_transition: chrono::Utc::now(),
            transition_count: 0,
        }
    }

    #[test]
    fn test_valid_idle_to_processing() {
        let ctx = create_context(WorkflowState::Idle);
        assert!(
            StateInvariantChecker::check_transition(
                &WorkflowState::Idle,
                &WorkflowState::Processing,
                &ctx
            )
            .is_ok()
        );
    }

    #[test]
    fn test_invalid_transition() {
        let ctx = create_context(WorkflowState::Idle);
        assert!(matches!(
            StateInvariantChecker::check_transition(
                &WorkflowState::Idle,
                &WorkflowState::Complete,
                &ctx
            ),
            Err(StateViolation::InvalidTransition { .. })
        ));
    }

    #[test]
    fn test_empty_event_data() {
        let mut ctx = create_context(WorkflowState::Idle);
        ctx.event_data = json!({});
        
        // Empty object should still work
        assert!(
            StateInvariantChecker::check_transition(
                &WorkflowState::Idle,
                &WorkflowState::Processing,
                &ctx
            )
            .is_ok()
        );
    }

    #[test]
    fn test_valid_next_states() {
        let valid = StateInvariantChecker::get_valid_next_states(&WorkflowState::Processing);
        assert!(valid.contains(&WorkflowState::WaitingForAgent));
        assert!(valid.contains(&WorkflowState::Error));
        assert!(!valid.contains(&WorkflowState::Idle));
    }

    #[test]
    fn test_terminal_states_no_transitions() {
        let valid = StateInvariantChecker::get_valid_next_states(&WorkflowState::Complete);
        assert!(valid.is_empty());
    }

    #[test]
    fn test_context_consistency() {
        let ctx = create_context(WorkflowState::Processing);
        assert!(StateInvariantChecker::verify_consistency(&ctx).is_ok());
    }
}
