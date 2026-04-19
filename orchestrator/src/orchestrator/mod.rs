//! Event-driven orchestrator system
//! 
//! Handles events from Team-Studio and routes them to appropriate handlers
//! All persistence goes through Vault (source of truth)
//! 
//! Phase 2.1: Adds deterministic state machine for multi-step workflows
//! Phase 2.2: Adds agent execution framework

pub mod events;
pub mod handlers;
pub mod state_machine;
pub mod workflow;
pub mod rules_engine;
pub mod state_manager;
pub mod orchestrator_engine;
pub mod agent;
pub mod agent_registry;
pub mod agent_executor;
pub mod builtin_agents;
pub mod agent_selector;
pub mod isolation_config;
pub mod crash_recovery;
pub mod isolation_audit;
pub mod process_isolation;
pub mod structured_logs;
pub mod trace_logger;
pub mod simple_replay;
pub mod input_validator;
pub mod output_sanitizer;
pub mod state_invariant_checker;
pub mod agent_permission_model;
pub mod config;
pub mod llm_analyzer;

pub use events::{Event, EventResponse};
pub use handlers::handle_event;
pub use state_machine::{StateMachine, WorkflowState, WorkflowContext};
pub use workflow::workflows;
pub use rules_engine::RulesEngine;
pub use state_manager::StateManager;
pub use orchestrator_engine::OrchestratorEngine;
pub use agent::{Agent, AgentContext, AgentOutput, AgentError, AgentMetadata};
pub use agent_registry::AgentRegistry;
pub use isolation_config::{IsolationConfig, AgentIsolationPolicy};
pub use crash_recovery::{CrashRecovery, CrashReason, CrashHistory};
pub use isolation_audit::{IsolationAudit, IsolationEvent, IsolationEventType};
pub use process_isolation::ProcessIsolationLayer;
pub use structured_logs::{StructuredLog, LogLevel};
pub use trace_logger::TraceLogger;
pub use simple_replay::ExecutionReplay;
pub use input_validator::{InputValidator, ValidationError, ValidationResult};
pub use output_sanitizer::{OutputSanitizer, SanitizationError, SanitizationResult};
pub use state_invariant_checker::{StateInvariantChecker, StateViolation};
pub use agent_permission_model::{PermissionChecker, Permission, PermissionError};
pub use agent_executor::AgentExecutor;
// Phase 5.3: New cognitive agents
pub use builtin_agents::{
    CollaboratorAgent, ExplorerAgent, CriticalAnalystAgent, DeconstructorAgent,
    StressTesterAgent, UserAgent,
    // Legacy agents
    EchoAgent, AnalyzerAgent, IndexerAgent
};
pub use agent_selector::{AgentSelector, SelectionRule};
pub use config::{load_mistral_api_key, mistral_api_endpoint, mistral_model};
pub use llm_analyzer::LLMAnalyzerAgent;
