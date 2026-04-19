use serde::{Deserialize, Serialize};
use crate::orchestrator::WorkflowContext;
use chrono::{DateTime, Utc};

/// Workflow status response
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowStatusResponse {
    pub workflow_id: String,
    pub state: String,
    pub last_transition: String,
    pub transition_count: u32,
    pub event_data: serde_json::Value,
}

impl WorkflowStatusResponse {
    pub fn from_context(context: &WorkflowContext) -> Self {
        Self {
            workflow_id: context.workflow_id.clone(),
            state: format!("{:?}", context.state),
            last_transition: context.last_transition.to_rfc3339(),
            transition_count: context.transition_count,
            event_data: context.event_data.clone(),
        }
    }
}

/// List workflows response
#[derive(Debug, Serialize, Deserialize)]
pub struct ListWorkflowsResponse {
    pub workflows: Vec<WorkflowStatusResponse>,
    pub total: usize,
    pub active: usize,
}

/// Workflow metrics response
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowMetricsResponse {
    pub workflow_id: String,
    pub state: String,
    pub duration_ms: i64,
    pub event_data_size: usize,
    pub transitions_count: u32,
    pub last_agent_used: Option<String>,
    pub status: String,
}

impl WorkflowMetricsResponse {
    pub fn from_context(context: &WorkflowContext) -> Self {
        let now = Utc::now();
        let duration_ms = (now - context.last_transition).num_milliseconds();
        let event_data_size = serde_json::to_string(&context.event_data)
            .map(|s| s.len())
            .unwrap_or(0);

        let last_agent = context.event_data
            .get("agent_results")
            .and_then(|v| v.get("agent_id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let status = format!("{:?}", context.state).to_lowercase();

        Self {
            workflow_id: context.workflow_id.clone(),
            state: format!("{:?}", context.state),
            duration_ms,
            event_data_size,
            transitions_count: context.transition_count,
            last_agent_used: last_agent,
            status,
        }
    }
}

/// Orchestrator status summary
#[derive(Debug, Serialize, Deserialize)]
pub struct OrchestratorStatusResponse {
    pub status: String,
    pub active_workflows: usize,
    pub total_processed: usize,
    pub agents_available: Vec<String>,
    pub system_uptime_ms: u64,
    pub last_event: Option<String>,
    pub version: String,
}

/// Agent info response
#[derive(Debug, Serialize, Deserialize)]
pub struct AgentInfoResponse {
    pub agents: Vec<AgentMetadata>,
    pub total: usize,
}

/// Agent metadata
#[derive(Debug, Serialize, Deserialize)]
pub struct AgentMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: String,
}

/// Agent metrics response
#[derive(Debug, Serialize, Deserialize)]
pub struct AgentMetricsResponse {
    pub agent_id: String,
    pub executions_total: u32,
    pub executions_success: u32,
    pub executions_failed: u32,
    pub avg_execution_time_ms: f64,
    pub status: String,
}

/// Archive request
#[derive(Debug, Serialize, Deserialize)]
pub struct ArchiveWorkflowRequest {
    pub reason: Option<String>,
}

/// Generic API error response
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiErrorResponse {
    pub error: String,
    pub code: u16,
    pub details: Option<String>,
}

impl ApiErrorResponse {
    pub fn not_found(resource: &str) -> Self {
        Self {
            error: format!("{} not found", resource),
            code: 404,
            details: None,
        }
    }

    pub fn internal_error(msg: &str) -> Self {
        Self {
            error: "Internal server error".to_string(),
            code: 500,
            details: Some(msg.to_string()),
        }
    }

    pub fn bad_request(msg: &str) -> Self {
        Self {
            error: "Bad request".to_string(),
            code: 400,
            details: Some(msg.to_string()),
        }
    }
}
