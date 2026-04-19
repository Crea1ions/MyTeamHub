use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Workflow execution states - deterministic state machine
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowState {
    #[serde(rename = "idle")]
    Idle,
    #[serde(rename = "processing")]
    Processing,
    #[serde(rename = "waiting_for_agent")]
    WaitingForAgent,
    #[serde(rename = "complete")]
    Complete,
    #[serde(rename = "error")]
    Error,
}

impl std::fmt::Display for WorkflowState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkflowState::Idle => write!(f, "Idle"),
            WorkflowState::Processing => write!(f, "Processing"),
            WorkflowState::WaitingForAgent => write!(f, "WaitingForAgent"),
            WorkflowState::Complete => write!(f, "Complete"),
            WorkflowState::Error => write!(f, "Error"),
        }
    }
}

/// Transition rule with deterministic condition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionRule {
    pub from_state: WorkflowState,
    pub event_type: String,
    pub to_state: WorkflowState,
    pub action: String, // "write_vault", "trigger_agent", "log_error", etc.
}

/// Workflow context - state and data for a workflow execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowContext {
    pub workflow_id: String,
    pub state: WorkflowState,
    pub event_data: serde_json::Value,
    pub vault_file_id: Option<String>,
    pub last_transition: DateTime<Utc>,
    pub transition_count: u32,
}

impl WorkflowContext {
    pub fn new(workflow_id: String, event_data: serde_json::Value) -> Self {
        Self {
            workflow_id,
            state: WorkflowState::Idle,
            event_data,
            vault_file_id: None,
            last_transition: Utc::now(),
            transition_count: 0,
        }
    }

    pub fn transition_to(&mut self, new_state: WorkflowState) {
        self.state = new_state;
        self.last_transition = Utc::now();
        self.transition_count += 1;
    }
}

/// Core state machine for deterministic workflow orchestration
pub struct StateMachine {
    rules: Vec<TransitionRule>,
    contexts: Arc<RwLock<HashMap<String, WorkflowContext>>>,
}

#[derive(Debug)]
pub enum StateMachineError {
    WorkflowNotFound(String),
    NoValidTransition(String, String), // workflow_id, current_state
    InvalidState,
}

impl std::fmt::Display for StateMachineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StateMachineError::WorkflowNotFound(id) => write!(f, "Workflow not found: {}", id),
            StateMachineError::NoValidTransition(id, state) => {
                write!(f, "No valid transition for workflow {} in state {}", id, state)
            }
            StateMachineError::InvalidState => write!(f, "Invalid state"),
        }
    }
}

impl std::error::Error for StateMachineError {}

impl StateMachine {
    pub fn new(rules: Vec<TransitionRule>) -> Self {
        Self {
            rules,
            contexts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Find valid transition for current state and event type
    pub fn find_transition(
        &self,
        current_state: WorkflowState,
        event_type: &str,
    ) -> Option<TransitionRule> {
        self.rules
            .iter()
            .find(|r| r.from_state == current_state && r.event_type == event_type)
            .cloned()
    }

    /// Create or update workflow context
    pub async fn create_context(&self, context: WorkflowContext) {
        let mut contexts = self.contexts.write().await;
        contexts.insert(context.workflow_id.clone(), context);
    }

    /// Get workflow context by ID
    pub async fn get_context(&self, workflow_id: &str) -> Result<WorkflowContext, StateMachineError> {
        let contexts = self.contexts.read().await;
        contexts
            .get(workflow_id)
            .cloned()
            .ok_or_else(|| StateMachineError::WorkflowNotFound(workflow_id.to_string()))
    }

    /// Update workflow state
    pub async fn update_context(
        &self,
        workflow_id: &str,
        new_state: WorkflowState,
    ) -> Result<WorkflowContext, StateMachineError> {
        let mut contexts = self.contexts.write().await;
        let context = contexts
            .get_mut(workflow_id)
            .ok_or_else(|| StateMachineError::WorkflowNotFound(workflow_id.to_string()))?;

        context.transition_to(new_state);
        Ok(context.clone())
    }

    /// List all active workflow contexts
    pub async fn list_contexts(&self) -> Vec<WorkflowContext> {
        let contexts = self.contexts.read().await;
        contexts.values().cloned().collect()
    }

    /// Process event through state machine
    pub async fn process_event(
        &self,
        workflow_id: &str,
        event_type: &str,
    ) -> Result<(WorkflowState, String), StateMachineError> {
        // Get current context
        let context = self.get_context(workflow_id).await?;

        // Find valid transition
        let transition = self
            .find_transition(context.state, event_type)
            .ok_or_else(|| {
                StateMachineError::NoValidTransition(workflow_id.to_string(), context.state.to_string())
            })?;

        // Apply transition
        self.update_context(workflow_id, transition.to_state).await?;

        Ok((transition.to_state, transition.action))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_rules() -> Vec<TransitionRule> {
        vec![
            TransitionRule {
                from_state: WorkflowState::Idle,
                event_type: "output_generated".to_string(),
                to_state: WorkflowState::Processing,
                action: "write_vault".to_string(),
            },
            TransitionRule {
                from_state: WorkflowState::Processing,
                event_type: "process_complete".to_string(),
                to_state: WorkflowState::Complete,
                action: "log_success".to_string(),
            },
        ]
    }

    #[tokio::test]
    async fn test_create_context() {
        let sm = StateMachine::new(create_test_rules());
        let context = WorkflowContext::new(
            "workflow_1".to_string(),
            serde_json::json!({"project_id": "proj1"}),
        );

        sm.create_context(context.clone()).await;
        let retrieved = sm.get_context("workflow_1").await.unwrap();
        assert_eq!(retrieved.workflow_id, "workflow_1");
        assert_eq!(retrieved.state, WorkflowState::Idle);
    }

    #[tokio::test]
    async fn test_find_transition() {
        let sm = StateMachine::new(create_test_rules());
        let transition = sm.find_transition(WorkflowState::Idle, "output_generated");
        assert!(transition.is_some());
        assert_eq!(transition.unwrap().to_state, WorkflowState::Processing);
    }

    #[tokio::test]
    async fn test_state_transition() {
        let sm = StateMachine::new(create_test_rules());
        let context = WorkflowContext::new(
            "workflow_2".to_string(),
            serde_json::json!({"project_id": "proj2"}),
        );

        sm.create_context(context).await;
        let result = sm.process_event("workflow_2", "output_generated").await;
        assert!(result.is_ok());

        let (state, action) = result.unwrap();
        assert_eq!(state, WorkflowState::Processing);
        assert_eq!(action, "write_vault");
    }

    #[tokio::test]
    async fn test_invalid_transition() {
        let sm = StateMachine::new(create_test_rules());
        let context = WorkflowContext::new(
            "workflow_3".to_string(),
            serde_json::json!({"project_id": "proj3"}),
        );

        sm.create_context(context).await;
        let result = sm.process_event("workflow_3", "unknown_event").await;
        assert!(result.is_err());
    }
}
