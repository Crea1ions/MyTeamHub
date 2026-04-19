//! Process-level isolation layer for agent execution
//!
//! Executes agents in separate processes with resource limits and isolation

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentError, AgentMetadata};
use crate::orchestrator::{AgentRegistry, IsolationConfig, CrashRecovery, CrashReason, IsolationAudit, IsolationEvent, IsolationEventType};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::time::sleep;
use serde_json::json;

/// Process isolation layer - executes agents with isolation
pub struct ProcessIsolationLayer {
    config: IsolationConfig,
    registry: Arc<AgentRegistry>,
    crash_recovery: Arc<CrashRecovery>,
    audit: Arc<IsolationAudit>,
}

impl ProcessIsolationLayer {
    /// Create new process isolation layer
    pub fn new(
        config: IsolationConfig,
        registry: Arc<AgentRegistry>,
    ) -> Self {
        let crash_recovery = Arc::new(CrashRecovery::new(config.clone()));
        let audit = Arc::new(IsolationAudit::new());

        ProcessIsolationLayer {
            config,
            registry,
            crash_recovery,
            audit,
        }
    }

    /// Execute agent with process isolation
    pub async fn execute_isolated(
        &self,
        agent_id: &str,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let execution_id = context.execution_id.clone();
        let timeout_secs = context.timeout_secs;

        // Log execution start
        let mut start_event = IsolationEvent::new(
            agent_id.to_string(),
            IsolationEventType::ProcessStarted,
            format!("Starting agent execution for task: {}", context.task),
        )
        .with_execution_id(execution_id.clone());

        // For Phase 3.1 MVP, we use in-process execution with timeout
        // Full process isolation requires additional OS-level setup (systemd-run, etc.)
        // This provides the architectural pattern for upgrading to true process isolation
        
        let start_time = Instant::now();
        let agent = self.registry.get(agent_id)?;

        // Get effective timeout
        let timeout_duration = Duration::from_secs(timeout_secs);

        // Log event
        self.audit.record_event(start_event).await;

        // Execute with timeout
        match tokio::time::timeout(timeout_duration, agent.execute(context.clone())).await {
            Ok(Ok(output)) => {
                let duration_ms = start_time.elapsed().as_millis() as u64;

                // Log success
                self.audit.record_event(
                    IsolationEvent::new(
                        agent_id.to_string(),
                        IsolationEventType::ProcessTerminated,
                        format!("Agent execution completed successfully in {}ms", duration_ms),
                    )
                    .with_execution_id(execution_id),
                ).await;

                // Reset crash history on success
                self.crash_recovery.reset_history(agent_id).await;

                Ok(output)
            }
            Ok(Err(err)) => {
                // Log error
                self.audit.record_event(
                    IsolationEvent::new(
                        agent_id.to_string(),
                        IsolationEventType::Crashed,
                        format!("Agent execution failed: {}", err),
                    )
                    .with_execution_id(execution_id.clone()),
                ).await;

                // Handle crash with recovery
                match self.crash_recovery.handle_crash(agent_id, CrashReason::UnknownCrash(err.to_string())).await {
                    Ok(true) => {
                        // Should retry
                        let backoff = self.crash_recovery.get_backoff_duration(agent_id).await;

                        self.audit.record_event(
                            IsolationEvent::new(
                                agent_id.to_string(),
                                IsolationEventType::RecoveryAttempted,
                                format!("Retrying after backoff: {:?}", backoff),
                            )
                            .with_execution_id(execution_id),
                        ).await;

                        sleep(backoff).await;

                        // Retry would happen at a higher level
                        Err(AgentError::ExecutionError(format!("Agent failed, will retry: {}", err)))
                    }
                    Ok(false) => {
                        Err(AgentError::ExecutionError(format!("Agent failed: {}", err)))
                    }
                    Err(retry_err) => {
                        self.audit.record_event(
                            IsolationEvent::new(
                                agent_id.to_string(),
                                IsolationEventType::RecoveryFailed,
                                format!("Exceeded max retries: {}", retry_err),
                            )
                            .with_execution_id(execution_id),
                        ).await;

                        Err(retry_err)
                    }
                }
            }
            Err(_) => {
                // Timeout
                self.audit.record_event(
                    IsolationEvent::new(
                        agent_id.to_string(),
                        IsolationEventType::Crashed,
                        format!("Agent execution timeout ({}s)", timeout_secs),
                    )
                    .with_execution_id(execution_id.clone()),
                ).await;

                // Handle timeout as crash
                match self.crash_recovery.handle_crash(agent_id, CrashReason::TimeoutExceeded).await {
                    Ok(true) => {
                        self.audit.record_event(
                            IsolationEvent::new(
                                agent_id.to_string(),
                                IsolationEventType::RecoveryAttempted,
                                "Retrying after timeout".to_string(),
                            )
                            .with_execution_id(execution_id),
                        ).await;

                        Err(AgentError::Timeout)
                    }
                    _ => {
                        self.audit.record_event(
                            IsolationEvent::new(
                                agent_id.to_string(),
                                IsolationEventType::RecoveryFailed,
                                "Max retry attempts exceeded for timeout".to_string(),
                            )
                            .with_execution_id(execution_id),
                        ).await;

                        Err(AgentError::Timeout)
                    }
                }
            }
        }
    }

    /// Get audit trail for an agent
    pub async fn get_audit_trail(&self, agent_id: &str) -> Vec<IsolationEvent> {
        self.audit.get_agent_events(agent_id).await
    }

    /// Get audit trail for an execution
    pub async fn get_execution_trail(&self, execution_id: &str) -> Vec<IsolationEvent> {
        self.audit.get_execution_events(execution_id).await
    }

    /// Get crash history for an agent
    pub async fn get_crash_history(&self, agent_id: &str) -> Option<crate::orchestrator::CrashHistory> {
        self.crash_recovery.get_history(agent_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::orchestrator::builtin_agents::EchoAgent;

    #[tokio::test]
    async fn test_process_isolation_basic() {
        let mut registry = AgentRegistry::new();
        registry.register("echo", Arc::new(EchoAgent));

        let config = IsolationConfig::default();
        let isolation = ProcessIsolationLayer::new(config, Arc::new(registry));

        let context = AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "test_task".to_string(),
            event_data: json!({"test": "data"}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 5,
        };

        let result = isolation.execute_isolated("echo", context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_audit_trail_recorded() {
        let mut registry = AgentRegistry::new();
        registry.register("echo", Arc::new(EchoAgent));

        let config = IsolationConfig::default();
        let isolation = ProcessIsolationLayer::new(config, Arc::new(registry));

        let context = AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "test_task".to_string(),
            event_data: json!({"test": "data"}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_123".to_string(),
            timeout_secs: 5,
        };

        let _ = isolation.execute_isolated("echo", context).await;

        let trail = isolation.get_audit_trail("echo").await;
        assert!(!trail.is_empty());
        assert_eq!(trail[0].event_type, IsolationEventType::ProcessStarted);
    }

    #[tokio::test]
    async fn test_crash_recovery_on_missing_agent() {
        let registry = AgentRegistry::new();

        let config = IsolationConfig::default();
        let isolation = ProcessIsolationLayer::new(config, Arc::new(registry));

        let context = AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "test_task".to_string(),
            event_data: json!({"test": "data"}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 5,
        };

        let result = isolation.execute_isolated("nonexistent", context).await;
        assert!(result.is_err());
    }
}
