pub mod vault;
pub mod api;
pub mod orchestrator;

pub use vault::{VaultError, VaultResult, VaultManager, Frontmatter, MarkdownFile, IndexManager, VaultIndex};
pub use orchestrator::{
    Agent, AgentContext, AgentOutput, AgentError, AgentMetadata,
    AgentRegistry, AgentExecutor, AgentSelector, SelectionRule,
    EchoAgent, AnalyzerAgent, IndexerAgent, LLMAnalyzerAgent,
    OrchestratorEngine, WorkflowState, WorkflowContext, StateMachine,
    IsolationConfig, AgentIsolationPolicy, CrashRecovery, CrashReason, CrashHistory,
    IsolationAudit, IsolationEvent, IsolationEventType, ProcessIsolationLayer,
    StructuredLog, LogLevel, TraceLogger, ExecutionReplay,
    InputValidator, ValidationError, OutputSanitizer, SanitizationError,
    StateInvariantChecker, StateViolation, PermissionChecker, Permission,
};

/// Commonly used types and traits
pub mod prelude {
    pub use crate::orchestrator::{
        Agent, AgentContext, AgentOutput, AgentError, AgentMetadata,
        AgentRegistry, AgentExecutor, AgentSelector, SelectionRule,
        EchoAgent, AnalyzerAgent, IndexerAgent,
        StateMachine, WorkflowState, WorkflowContext,
        OrchestratorEngine,
        IsolationConfig, CrashRecovery, IsolationAudit, ProcessIsolationLayer,
        StructuredLog, LogLevel, TraceLogger, ExecutionReplay,
        InputValidator, OutputSanitizer, StateInvariantChecker, PermissionChecker, Permission,
    };
}
