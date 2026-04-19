use super::state_machine::{TransitionRule, WorkflowState};

/// Workflow definition - pre-built workflow templates
#[derive(Debug, Clone)]
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub initial_state: WorkflowState,
    pub rules: Vec<TransitionRule>,
}

impl WorkflowDefinition {
    pub fn new(
        id: &str,
        name: &str,
        description: &str,
        initial_state: WorkflowState,
        rules: Vec<TransitionRule>,
    ) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            initial_state,
            rules,
        }
    }
}

/// Pre-built workflow templates for common orchestration scenarios
pub mod workflows {
    use super::*;

    /// Output generation workflow: Idle → Processing → Complete
    /// Triggered by: output_generated event
    /// Action: Write to Vault + log
    pub fn output_generation_workflow() -> WorkflowDefinition {
        WorkflowDefinition::new(
            "output_generation",
            "Output Generation Workflow",
            "Processes generated outputs and persists to Vault",
            WorkflowState::Idle,
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
                TransitionRule {
                    from_state: WorkflowState::Processing,
                    event_type: "process_error".to_string(),
                    to_state: WorkflowState::Error,
                    action: "log_error".to_string(),
                },
            ],
        )
    }

    /// Session creation workflow: Idle → Processing → Complete
    /// Triggered by: session_created event
    /// Action: Index session metadata
    pub fn session_workflow() -> WorkflowDefinition {
        WorkflowDefinition::new(
            "session_creation",
            "Session Creation Workflow",
            "Creates and indexes new session metadata",
            WorkflowState::Idle,
            vec![
                TransitionRule {
                    from_state: WorkflowState::Idle,
                    event_type: "session_created".to_string(),
                    to_state: WorkflowState::Processing,
                    action: "index_metadata".to_string(),
                },
                TransitionRule {
                    from_state: WorkflowState::Processing,
                    event_type: "index_complete".to_string(),
                    to_state: WorkflowState::Complete,
                    action: "log_success".to_string(),
                },
            ],
        )
    }

    /// Project update workflow: Idle → Processing → Complete
    /// Triggered by: project_updated event
    /// Action: Update context.md
    pub fn project_workflow() -> WorkflowDefinition {
        WorkflowDefinition::new(
            "project_update",
            "Project Update Workflow",
            "Updates project context and metadata",
            WorkflowState::Idle,
            vec![
                TransitionRule {
                    from_state: WorkflowState::Idle,
                    event_type: "project_updated".to_string(),
                    to_state: WorkflowState::Processing,
                    action: "update_context".to_string(),
                },
                TransitionRule {
                    from_state: WorkflowState::Processing,
                    event_type: "update_complete".to_string(),
                    to_state: WorkflowState::Complete,
                    action: "log_success".to_string(),
                },
            ],
        )
    }

    /// Custom agent creation workflow: Idle → Processing → WaitingForAgent → Complete
    /// Triggered by: custom_agent_created event
    /// Action: Provision agent + wait for ready signal
    pub fn custom_agent_workflow() -> WorkflowDefinition {
        WorkflowDefinition::new(
            "custom_agent_creation",
            "Custom Agent Creation Workflow",
            "Provisions and initializes custom cognitive agents",
            WorkflowState::Idle,
            vec![
                TransitionRule {
                    from_state: WorkflowState::Idle,
                    event_type: "custom_agent_created".to_string(),
                    to_state: WorkflowState::Processing,
                    action: "provision_agent".to_string(),
                },
                TransitionRule {
                    from_state: WorkflowState::Processing,
                    event_type: "agent_ready".to_string(),
                    to_state: WorkflowState::WaitingForAgent,
                    action: "register_agent".to_string(),
                },
                TransitionRule {
                    from_state: WorkflowState::WaitingForAgent,
                    event_type: "initialization_complete".to_string(),
                    to_state: WorkflowState::Complete,
                    action: "log_success".to_string(),
                },
                TransitionRule {
                    from_state: WorkflowState::Processing,
                    event_type: "provision_error".to_string(),
                    to_state: WorkflowState::Error,
                    action: "log_error".to_string(),
                },
            ],
        )
    }

    /// Get all workflow definitions
    pub fn all_workflows() -> Vec<WorkflowDefinition> {
        vec![
            output_generation_workflow(),
            session_workflow(),
            project_workflow(),
            custom_agent_workflow(),
        ]
    }

    /// Get workflow definition by name
    pub fn get_workflow(name: &str) -> Option<WorkflowDefinition> {
        all_workflows()
            .into_iter()
            .find(|w| w.id == name || w.name == name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_output_generation_workflow() {
        let wf = workflows::output_generation_workflow();
        assert_eq!(wf.id, "output_generation");
        assert_eq!(wf.initial_state, WorkflowState::Idle);
        assert_eq!(wf.rules.len(), 3);
    }

    #[test]
    fn test_session_workflow() {
        let wf = workflows::session_workflow();
        assert_eq!(wf.id, "session_creation");
        assert_eq!(wf.rules.len(), 2);
    }

    #[test]
    fn test_custom_agent_workflow() {
        let wf = workflows::custom_agent_workflow();
        assert_eq!(wf.id, "custom_agent_creation");
        assert_eq!(wf.rules.len(), 4);
    }

    #[test]
    fn test_get_workflow() {
        let wf = workflows::get_workflow("output_generation");
        assert!(wf.is_some());
        assert_eq!(wf.unwrap().id, "output_generation");
    }

    #[test]
    fn test_all_workflows() {
        let workflows = workflows::all_workflows();
        assert_eq!(workflows.len(), 4);
    }
}
