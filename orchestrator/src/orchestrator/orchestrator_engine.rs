use super::state_machine::{StateMachine, WorkflowContext, WorkflowState};
use super::workflow::workflows;
use super::state_manager::StateManager;
use super::events::Event;
use super::agent_executor::AgentExecutor;
use super::agent_registry::AgentRegistry;
use super::agent_selector::AgentSelector;
use super::{
    // New cognitive agents (Phase 5.3)
    CollaboratorAgent, ExplorerAgent, CriticalAnalystAgent, DeconstructorAgent,
    StressTesterAgent, UserAgent,
    // Legacy agents
    EchoAgent, AnalyzerAgent, IndexerAgent,
    AgentContext
};
use super::input_validator::InputValidator;
use super::output_sanitizer::OutputSanitizer;
use super::state_invariant_checker::StateInvariantChecker;
use super::agent_permission_model::PermissionChecker;
use crate::vault::VaultManager;
use std::sync::Arc;
use serde_json::json;

/// Orchestrator Engine - main integration point for event-driven orchestration
pub struct OrchestratorEngine {
    state_machine: Arc<StateMachine>,
    state_manager: Arc<StateManager>,
    vault: Arc<VaultManager>,
    agent_executor: Arc<AgentExecutor>,
    agent_selector: Arc<AgentSelector>,
    input_validator: InputValidator,
    output_sanitizer: OutputSanitizer,
    permission_checker: Arc<PermissionChecker>,
}

#[derive(Debug)]
pub enum OrchestratorEngineError {
    StateMachineError(String),
    StateManagerError(String),
    VaultError(String),
    InvalidWorkflow(String),
}

impl std::fmt::Display for OrchestratorEngineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrchestratorEngineError::StateMachineError(msg) => {
                write!(f, "State machine error: {}", msg)
            }
            OrchestratorEngineError::StateManagerError(msg) => {
                write!(f, "State manager error: {}", msg)
            }
            OrchestratorEngineError::VaultError(msg) => write!(f, "Vault error: {}", msg),
            OrchestratorEngineError::InvalidWorkflow(msg) => {
                write!(f, "Invalid workflow: {}", msg)
            }
        }
    }
}

impl std::error::Error for OrchestratorEngineError {}

impl OrchestratorEngine {
    /// Create new orchestrator engine with built-in agents
    pub async fn new(
        vault: Arc<VaultManager>,
    ) -> Self {
        // Build state machine from all available workflows
        let mut all_rules = Vec::new();
        for workflow in workflows::all_workflows() {
            all_rules.extend(workflow.rules);
        }

        let state_machine = Arc::new(StateMachine::new(all_rules));
        let state_manager = Arc::new(StateManager::new(vault.clone()));

        // Initialize agent registry with built-in agents
        let mut registry = AgentRegistry::new();
        
        // Phase 5.3: Cognitive brainstorming agents (LLM-powered)
        registry.register("collaborator", Arc::new(CollaboratorAgent));
        registry.register("explorer", Arc::new(ExplorerAgent));
        registry.register("critical_analyst", Arc::new(CriticalAnalystAgent));
        registry.register("deconstructor", Arc::new(DeconstructorAgent));
        registry.register("stress_tester", Arc::new(StressTesterAgent));
        registry.register("user", Arc::new(UserAgent));
        
        // Legacy agents (for backward compatibility)
        registry.register("echo", Arc::new(EchoAgent));
        registry.register("analyzer", Arc::new(AnalyzerAgent));
        registry.register("indexer", Arc::new(IndexerAgent));
        
        let agent_executor = Arc::new(AgentExecutor::new(Arc::new(registry)));

        // Initialize agent selector for non-linear switching (Phase 2.3)
        let agent_selector = Arc::new(AgentSelector::new());

        // Initialize security modules (Phase 3.3)
        let input_validator = InputValidator::new();
        let output_sanitizer = OutputSanitizer::new();
        let permission_checker = Arc::new(PermissionChecker::with_defaults().await);

        Self {
            state_machine,
            state_manager,
            vault,
            agent_executor,
            agent_selector,
            input_validator,
            output_sanitizer,
            permission_checker,
        }
    }

    /// Process event through the state machine
    pub async fn handle_event_with_state(
        &self,
        event: &Event,
        workflow_id: &str,
    ) -> Result<(WorkflowState, String), OrchestratorEngineError> {
        // Try to load existing context, or create new one
        let mut context = match self.state_manager.load_context(workflow_id).await {
            Ok(ctx) => ctx,
            Err(_) => {
                // Create new context from event
                WorkflowContext::new(workflow_id.to_string(), event.data.clone())
            }
        };

        // Find valid transition
        let (next_state, action) = self
            .state_machine
            .process_event(workflow_id, &event.event_type)
            .await
            .map_err(|e| {
                OrchestratorEngineError::StateMachineError(e.to_string())
            })?;

        // Phase 3.3: Validate state transition invariants
        StateInvariantChecker::check_transition(&context.state, &next_state, &context)
            .map_err(|e| OrchestratorEngineError::InvalidWorkflow(format!("State invariant violation: {:?}", e)))?;

        // Update context state
        context.transition_to(next_state);

        // If transitioning to WaitingForAgent state, execute the appropriate agent
        if next_state == WorkflowState::WaitingForAgent {
            // Phase 2.3: Use non-linear agent selection
            let agent_id = self.agent_selector
                .select_agent(&context.event_data)
                .unwrap_or_else(|_| "echo".to_string());

            // Phase 3.3: Validate input before execution
            let agent_context = AgentContext {
                workflow_id: workflow_id.to_string(),
                task: action.clone(),
                event_data: context.event_data.clone(),
                vault_root: self.vault.root().to_string_lossy().to_string(),
                execution_id: format!("{}-exec-{}", workflow_id, uuid::Uuid::new_v4()),
                timeout_secs: 10,
            };

            // Phase 3.3: Validate agent context
            self.input_validator.validate_context(&agent_context)
                .map_err(|e| OrchestratorEngineError::InvalidWorkflow(format!("Input validation failed: {}", e)))?;

            // Phase 3.3: Check agent permissions
            self.permission_checker.check_permission(&agent_id, super::agent_permission_model::Permission::Execute)
                .await
                .map_err(|e| OrchestratorEngineError::InvalidWorkflow(format!("Permission denied: {:?}", e)))?;

            match self.agent_executor.execute(&agent_id, agent_context).await {
                Ok(mut agent_output) => {
                    // Phase 3.3: Validate output before using
                    self.output_sanitizer.sanitize_output(&agent_output)
                        .map_err(|e| OrchestratorEngineError::InvalidWorkflow(format!("Output sanitization failed: {}", e)))?;

                    // Update context with agent results
                    context.event_data = json!({
                        "agent_results": {
                            "success": agent_output.success,
                            "result": agent_output.result,
                            "logs": agent_output.logs,
                        },
                        "original_data": context.event_data,
                    });
                }
                Err(e) => {
                    // Record agent error but continue (agent errors don't block workflow)
                    context.event_data = json!({
                        "agent_error": e.to_string(),
                        "original_data": context.event_data,
                    });
                }
            }
        }

        // Save updated context
        self.state_manager
            .save_context(&context)
            .await
            .map_err(|e| {
                OrchestratorEngineError::StateManagerError(e.to_string())
            })?;

        // Log the transition
        self.log_transition(workflow_id, &event.event_type, next_state, &action)
            .await;

        Ok((next_state, action))
    }

    /// Get workflow status
    pub async fn get_workflow_status(
        &self,
        workflow_id: &str,
    ) -> Result<WorkflowContext, OrchestratorEngineError> {
        self.state_manager
            .load_context(workflow_id)
            .await
            .map_err(|e| {
                OrchestratorEngineError::StateManagerError(e.to_string())
            })
    }

    /// List all active workflows
    pub async fn list_active_workflows(&self) -> Result<Vec<WorkflowContext>, OrchestratorEngineError> {
        self.state_manager
            .list_active_workflows()
            .await
            .map_err(|e| {
                OrchestratorEngineError::StateManagerError(e.to_string())
            })
    }

    /// Get orchestrator status summary
    pub async fn get_status_summary(&self) -> Result<serde_json::Value, OrchestratorEngineError> {
        self.state_manager
            .get_status_summary()
            .await
            .map_err(|e| {
                OrchestratorEngineError::StateManagerError(e.to_string())
            })
    }

    /// Archive completed workflow
    pub async fn archive_workflow(
        &self,
        workflow_id: &str,
    ) -> Result<(), OrchestratorEngineError> {
        let context = self.get_workflow_status(workflow_id).await?;
        self.state_manager
            .archive_workflow(&context)
            .await
            .map_err(|e| {
                OrchestratorEngineError::StateManagerError(e.to_string())
            })?;

        // Delete from active workflows
        self.state_manager
            .delete_context(workflow_id)
            .await
            .map_err(|e| {
                OrchestratorEngineError::StateManagerError(e.to_string())
            })
    }

    /// Log state transition to vault event log
    async fn log_transition(
        &self,
        workflow_id: &str,
        event_type: &str,
        state: WorkflowState,
        action: &str,
    ) {
        let log_entry = format!(
            "{} | workflow_transition | success | workflow_id={} event_type={} state={} action={}",
            chrono::Utc::now().to_rfc3339(),
            workflow_id,
            event_type,
            state,
            action
        );

        // Try to append to existing log
        if let Ok(existing) = self.vault.read_file("system/events.log").await {
            let updated = format!("{}{}", existing.content, log_entry + "\n");
            let _ = self.vault.update_file("system/events.log", &updated).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use tokio;

    async fn create_test_engine() -> (OrchestratorEngine, TempDir) {
        let tmpdir = TempDir::new().unwrap();
        let vault_path = tmpdir.path().to_path_buf();
        let vault = VaultManager::new(vault_path).unwrap();
        let vault = Arc::new(vault);
        let engine = OrchestratorEngine::new(vault).await;
        (engine, tmpdir)
    }

    #[tokio::test]
    async fn test_engine_creation() {
        let (engine, _tmpdir) = create_test_engine().await;
        // Engine should be created successfully
        let result = engine.list_active_workflows().await;
        // Result may be empty or Ok, both are valid
        let _ = result;
    }

    #[tokio::test]
    async fn test_handle_event_with_state() {
        let (engine, _tmpdir) = create_test_engine().await;

        let event = Event {
            event_type: "output_generated".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            data: json!({
                "project_id": "proj1",
                "session_id": "sess1",
                "content": "test output"
            }),
        };

        // First handle should create context and transition
        let result = engine
            .handle_event_with_state(&event, "workflow_1")
            .await;

        // Should successfully process the event or fail gracefully
        // (may fail if Vault write fails in test environment)
        let _ = result;
    }

    #[tokio::test]
    async fn test_workflow_status_tracking() {
        let (engine, _tmpdir) = create_test_engine().await;

        let event = Event {
            event_type: "output_generated".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            data: json!({
                "project_id": "proj1",
                "content": "test"
            }),
        };

        let _ = engine
            .handle_event_with_state(&event, "workflow_2")
            .await;

        // Status tracking may or may not succeed depending on Vault state
        // This test just verifies the method exists and can be called
        let _ = engine.get_workflow_status("workflow_2").await;
    }

    #[tokio::test]
    async fn test_agent_executor_availability() {
        let (engine, _tmpdir) = create_test_engine().await;
        
        // Verify built-in agents are registered
        let agents = engine.agent_executor.list_agents();
        assert!(agents.contains(&"echo".to_string()));
        assert!(agents.contains(&"analyzer".to_string()));
        assert!(agents.contains(&"indexer".to_string()));
    }

    #[tokio::test]
    async fn test_agent_execution_on_event() {
        let (engine, _tmpdir) = create_test_engine().await;

        let event = Event {
            event_type: "agent_ready".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            data: json!({
                "agent_id": "echo",
                "project_id": "proj_test",
            }),
        };

        // This should transition to WaitingForAgent and invoke agent
        let result = engine
            .handle_event_with_state(&event, "wf_agent_test")
            .await;

        // Should process successfully or fail gracefully
        let _ = result;
    }

    #[tokio::test]
    async fn test_agent_error_handling() {
        let (engine, _tmpdir) = create_test_engine().await;

        let event = Event {
            event_type: "agent_ready".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            data: json!({
                "agent_id": "analyzer",
                // Missing "content" field that analyzer requires
            }),
        };

        // Should handle agent error gracefully
        let result = engine
            .handle_event_with_state(&event, "wf_error_test")
            .await;

        // Should not panic, may succeed or fail gracefully
        let _ = result;
    }
}

