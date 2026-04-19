//! Built-in agents for Phase 5.3 - Cognitive Brainstorming System
//! 
//! Six cognitive agents for multi-perspective analysis:
//! - CollaboratorAgent: Core Builder - structures concepts into systems
//! - ExplorerAgent: Idea Generator - explores divergent directions
//! - CriticalAnalystAgent: Validator - identifies risks and inconsistencies
//! - DeconstructorAgent: System Breaker - challenges and breaks concepts
//! - StressTesterAgent: Reality Validator - tests under real-world conditions
//! - UserAgent: Usage Simulator - imagines end-user scenarios
//!
//! Legacy agents (kept for compatibility):
//! - EchoAgent: Simple pass-through
//! - AnalyzerAgent: Basic analysis
//! - IndexerAgent: File indexing

pub mod collaborator_agent;
pub mod explorer_agent;
pub mod critical_analyst_agent;
pub mod deconstructor_agent;
pub mod stress_tester_agent;
pub mod user_agent;

// Legacy agents
pub mod echo_agent;
pub mod analyzer_agent;
pub mod indexer_agent;

pub use collaborator_agent::CollaboratorAgent;
pub use explorer_agent::ExplorerAgent;
pub use critical_analyst_agent::CriticalAnalystAgent;
pub use deconstructor_agent::DeconstructorAgent;
pub use stress_tester_agent::StressTesterAgent;
pub use user_agent::UserAgent;

// Legacy exports
pub use echo_agent::EchoAgent;
pub use analyzer_agent::AnalyzerAgent;
pub use indexer_agent::IndexerAgent;
