use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use std::sync::Arc;
use std::time::SystemTime;
use chrono::Utc;

use crate::api::handlers::AppState;
use super::orchestrator::{
    WorkflowStatusResponse, ListWorkflowsResponse, WorkflowMetricsResponse,
    OrchestratorStatusResponse, AgentInfoResponse, AgentMetadata, 
    ArchiveWorkflowRequest, ApiErrorResponse,
};

/// Get orchestrator status summary
pub async fn get_orchestrator_status(
    State(_state): State<Arc<AppState>>,
) -> Result<Json<OrchestratorStatusResponse>, (StatusCode, Json<ApiErrorResponse>)> {
    // Phase 2.4: Simple health status without vault operations
    // Full metrics will be added in Phase 3
    let response = OrchestratorStatusResponse {
        status: "healthy".to_string(),
        active_workflows: 0, // Will track in Phase 3
        total_processed: 0, // Will track in Phase 3
        agents_available: vec![
            "collaborator".to_string(),
            "explorer".to_string(),
            "critical_analyst".to_string(),
            "deconstructor".to_string(),
            "stress_tester".to_string(),
            "user".to_string(),
            "echo".to_string(),
            "analyzer".to_string(),
            "indexer".to_string(),
        ],
        system_uptime_ms: 0, // Will track in Phase 3
        last_event: Some(Utc::now().to_rfc3339()),
        version: "2.4".to_string(),
    };
    Ok(Json(response))
}

/// List all active workflows
pub async fn list_workflows(
    State(_state): State<Arc<AppState>>,
) -> Result<Json<ListWorkflowsResponse>, (StatusCode, Json<ApiErrorResponse>)> {
    // Phase 2.4: Return empty list (full workflow tracking in Phase 3)
    // In production, would call: state.orchestrator.list_active_workflows().await
    Ok(Json(ListWorkflowsResponse {
        workflows: vec![],
        total: 0,
        active: 0,
    }))
}

/// Get specific workflow status
pub async fn get_workflow_status(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
) -> Result<Json<WorkflowStatusResponse>, (StatusCode, Json<ApiErrorResponse>)> {
    // Try to get from orchestrator first, fall back to vault
    match state.orchestrator.get_workflow_status(&workflow_id).await {
        Ok(context) => {
            let response = WorkflowStatusResponse::from_context(&context);
            Ok(Json(response))
        }
        Err(_) => {
            // Fall back to reading from vault
            let vault_path = format!("workflows/{}.md", workflow_id);
            match state.vault.read_file(&vault_path).await {
                Ok(_md_file) => {
                    // Return basic status from vault file
                    Ok(Json(WorkflowStatusResponse {
                        workflow_id,
                        state: "completed".to_string(),
                        last_transition: Utc::now().to_rfc3339(),
                        transition_count: 1,
                        event_data: serde_json::json!({}),
                    }))
                }
                Err(_) => Err((
                    StatusCode::NOT_FOUND,
                    Json(ApiErrorResponse::not_found("workflow")),
                )),
            }
        }
    }
}

/// Get workflow metrics
pub async fn get_workflow_metrics(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
) -> Result<Json<WorkflowMetricsResponse>, (StatusCode, Json<ApiErrorResponse>)> {
    // Try to get from orchestrator first, fall back to vault
    match state.orchestrator.get_workflow_status(&workflow_id).await {
        Ok(context) => {
            let response = WorkflowMetricsResponse::from_context(&context);
            Ok(Json(response))
        }
        Err(_) => {
            // Fall back to reading from vault
            let vault_path = format!("workflows/{}.md", workflow_id);
            match state.vault.read_file(&vault_path).await {
                Ok(_md_file) => {
                    // Return basic metrics from vault file
                    Ok(Json(WorkflowMetricsResponse {
                        workflow_id,
                        state: "running".to_string(),
                        duration_ms: 0,
                        event_data_size: 0,
                        transitions_count: 0,
                        last_agent_used: None,
                        status: "running".to_string(),
                    }))
                }
                Err(_) => Err((
                    StatusCode::NOT_FOUND,
                    Json(ApiErrorResponse::not_found("workflow")),
                )),
            }
        }
    }
}

/// Archive a completed workflow
pub async fn archive_workflow(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
) -> Result<StatusCode, (StatusCode, Json<ApiErrorResponse>)> {
    // Verify workflow exists
    match state.orchestrator.get_workflow_status(&workflow_id).await {
        Ok(_) => {
            // Archive it
            match state.orchestrator.archive_workflow(&workflow_id).await {
                Ok(_) => Ok(StatusCode::NO_CONTENT),
                Err(e) => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiErrorResponse::internal_error(&e.to_string())),
                )),
            }
        }
        Err(_) => Err((
            StatusCode::NOT_FOUND,
            Json(ApiErrorResponse::not_found("workflow")),
        )),
    }
}

/// List available agents
pub async fn list_agents(
    State(_state): State<Arc<AppState>>,
) -> Json<AgentInfoResponse> {
    let agents = vec![
        // Phase 5.3: Cognitive brainstorming agents (LLM-powered)
        AgentMetadata {
            id: "collaborator".to_string(),
            name: "Collaborator".to_string(),
            description: "Core Builder - transforms abstract concepts into structured systems".to_string(),
            status: "ready".to_string(),
        },
        AgentMetadata {
            id: "explorer".to_string(),
            name: "Explorer".to_string(),
            description: "Idea Generator - explores unconventional and creative directions".to_string(),
            status: "ready".to_string(),
        },
        AgentMetadata {
            id: "critical_analyst".to_string(),
            name: "Critical Analyst".to_string(),
            description: "Validator - identifies logical inconsistencies and risks".to_string(),
            status: "ready".to_string(),
        },
        AgentMetadata {
            id: "deconstructor".to_string(),
            name: "Deconstructor".to_string(),
            description: "System Breaker - challenges concepts and explores failure modes".to_string(),
            status: "ready".to_string(),
        },
        AgentMetadata {
            id: "stress_tester".to_string(),
            name: "Stress Tester".to_string(),
            description: "Reality Validator - evaluates under real-world constraints".to_string(),
            status: "ready".to_string(),
        },
        AgentMetadata {
            id: "user".to_string(),
            name: "User".to_string(),
            description: "Usage Simulator - imagines realistic end-user scenarios".to_string(),
            status: "ready".to_string(),
        },
        // Legacy agents (for backward compatibility)
        AgentMetadata {
            id: "echo".to_string(),
            name: "Echo Agent".to_string(),
            description: "Simple echo/passthrough agent for testing".to_string(),
            status: "ready".to_string(),
        },
        AgentMetadata {
            id: "analyzer".to_string(),
            name: "Analyzer Agent".to_string(),
            description: "Analyzes content and performs sentiment analysis".to_string(),
            status: "ready".to_string(),
        },
        AgentMetadata {
            id: "indexer".to_string(),
            name: "Indexer Agent".to_string(),
            description: "Indexes project files and creates search index".to_string(),
            status: "ready".to_string(),
        },
    ];

    Json(AgentInfoResponse {
        agents,
        total: 9,
    })
}
