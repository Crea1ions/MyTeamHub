use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use std::sync::Arc;
use chrono::Utc;

use crate::api::{AppState, ErrorResponse};
use super::events::{Event, EventResponse};

/// Handle incoming events from Team-Studio
pub async fn handle_event(
    State(state): State<Arc<AppState>>,
    Json(event): Json<Event>,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    let result = match event.event_type.as_str() {
        "agent_task" => handle_agent_task(&state, &event).await,
        "output_generated" => handle_output_generated(&state, &event).await,
        "session_created" => handle_session_created(&state, &event).await,
        "project_updated" => handle_project_updated(&state, &event).await,
        "custom_agent_created" => handle_custom_agent_created(&state, &event).await,
        _ => {
            log_event(&state, &event.event_type, "error", "Unknown event type").await;
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse::new(format!("Unknown event type: {}", event.event_type))),
            ));
        }
    };

    // Log event status
    let status = if result.is_ok() { "success" } else { "error" };
    log_event(&state, &event.event_type, status, "").await;
    
    result
}

/// Handle: agent_task
/// Execute a task with a specified agent and return workflow_id
async fn handle_agent_task(
    state: &AppState,
    event: &Event,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    let data = &event.data;

    let task = extract_string(data, "task")
        .ok_or_else(|| missing_field_error("task"))?;
    let agent_id = extract_string(data, "agent_id")
        .unwrap_or_else(|| "collaborator".to_string());
    let context = extract_string(data, "context").unwrap_or_default();

    // Validate task is not empty
    if !validate_not_empty(&task, "task") {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("task cannot be empty".to_string())),
        ));
    }

    // Create unique workflow ID
    let workflow_id = uuid::Uuid::new_v4().to_string();
    
    // Store workflow state
    let vault_path = format!("workflows/{}.md", workflow_id);
    let workflow_data = format!(
        "# Workflow {}\n\n- Agent: {}\n- Task: {}\n- Context: {}\n- Created: {}\n- Status: running\n",
        workflow_id, agent_id, task, context, Utc::now().to_rfc3339()
    );

    match state.vault.write_file(
        &vault_path,
        &workflow_data,
        "workflow".to_string(),
        Some(format!("Workflow for agent {}", agent_id)),
    ).await {
        Ok(_) => {
            Ok(Json(EventResponse {
                success: true,
                file_id: Some(workflow_id.clone()),
                message: format!("Workflow {} started with agent {} (using mistral-large-latest)", workflow_id, agent_id),
            }))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!("Failed to create workflow: {}", e))),
        )),
    }
}

/// Handle: output_generated
/// Team-Studio generated LLM output, persist to Vault
async fn handle_output_generated(
    state: &AppState,
    event: &Event,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    let data = &event.data;

    let session_id = extract_string(data, "session_id")
        .ok_or_else(|| missing_field_error("session_id"))?;
    let project_id = extract_string(data, "project_id")
        .ok_or_else(|| missing_field_error("project_id"))?;
    let content = extract_string(data, "content")
        .ok_or_else(|| missing_field_error("content"))?;

    // Minimal validation: ensure non-empty
    if !validate_not_empty(&session_id, "session_id")
        || !validate_not_empty(&project_id, "project_id")
        || !validate_not_empty(&content, "content") {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("Fields cannot be empty".to_string())),
        ));
    }

    // Write to Vault
    let vault_path = format!("outputs/{}/{}.md", project_id, session_id);

    match state.vault.write_file(
        &vault_path,
        &content,
        "output".to_string(),
        Some("Team-Studio LLM Output".to_string()),
    ).await {
        Ok(file_id) => Ok(Json(EventResponse {
            success: true,
            file_id: Some(file_id),
            message: format!("Output persisted to Vault: {}", vault_path),
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!("Failed to persist output: {}", e))),
        )),
    }
}

/// Handle: session_created
/// Log session creation in Vault
async fn handle_session_created(
    state: &AppState,
    event: &Event,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    let data = &event.data;

    let _session_id = extract_string(data, "session_id")
        .ok_or_else(|| missing_field_error("session_id"))?;
    let project_id = extract_string(data, "project_id")
        .ok_or_else(|| missing_field_error("project_id"))?;

    // Minimal validation
    if !validate_not_empty(&project_id, "project_id") {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("project_id cannot be empty".to_string())),
        ));
    }

    // Log session creation (append to sessions.json)
    let log_path = format!("projects/{}/sessions.json", project_id);

    // Read existing sessions
    let sessions_content = match state.vault.read_file(&log_path).await {
        Ok(md_file) => md_file.content,
        Err(_) => "[]".to_string(), // New project
    };

    // Parse and append new session (simplified)
    let updated_content = format!(
        "{}\n// Session event logged at {}\n",
        sessions_content,
        Utc::now().to_rfc3339()
    );

    // Update or create
    if state.vault.read_file(&log_path).await.is_ok() {
        let _ = state.vault.update_file(&log_path, &updated_content).await;
    } else {
        let _ = state.vault.write_file(
            &log_path,
            &updated_content,
            "sessions".to_string(),
            Some("Project Sessions".to_string()),
        ).await;
    }

    Ok(Json(EventResponse {
        success: true,
        file_id: None,
        message: "Session logged".to_string(),
    }))
}

/// Handle: project_updated
/// Update project context in Vault
async fn handle_project_updated(
    state: &AppState,
    event: &Event,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    let data = &event.data;

    let project_id = extract_string(data, "project_id")
        .ok_or_else(|| missing_field_error("project_id"))?;
    let context = extract_string(data, "context")
        .ok_or_else(|| missing_field_error("context"))?;

    // Minimal validation
    if !validate_not_empty(&project_id, "project_id")
        || !validate_not_empty(&context, "context") {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("Fields cannot be empty".to_string())),
        ));
    }

    let vault_path = format!("projects/{}/context.md", project_id);

    // Check if project exists
    if state.vault.read_file(&vault_path).await.is_ok() {
        // Update existing
        match state.vault.update_file(&vault_path, &context).await {
            Ok(_) => Ok(Json(EventResponse {
                success: true,
                file_id: None,
                message: "Project context updated".to_string(),
            })),
            Err(e) => Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Failed to update project: {}", e))),
            )),
        }
    } else {
        // Create new project context
        match state.vault.write_file(
            &vault_path,
            &context,
            "project".to_string(),
            Some("Project Context".to_string()),
        ).await {
            Ok(file_id) => Ok(Json(EventResponse {
                success: true,
                file_id: Some(file_id),
                message: "Project created in Vault".to_string(),
            })),
            Err(e) => Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!("Failed to create project: {}", e))),
            )),
        }
    }
}

/// Handle: custom_agent_created
/// Store custom agent metadata in Vault
async fn handle_custom_agent_created(
    state: &AppState,
    event: &Event,
) -> Result<Json<EventResponse>, (StatusCode, Json<ErrorResponse>)> {
    let data = &event.data;

    let agent_id = extract_string(data, "agent_id")
        .ok_or_else(|| missing_field_error("agent_id"))?;
    let project_id = extract_string(data, "project_id")
        .ok_or_else(|| missing_field_error("project_id"))?;
    let _name = extract_string(data, "name")
        .ok_or_else(|| missing_field_error("name"))?;
    let prompt = extract_string(data, "prompt")
        .ok_or_else(|| missing_field_error("prompt"))?;

    // Minimal validation
    if !validate_not_empty(&agent_id, "agent_id")
        || !validate_not_empty(&project_id, "project_id")
        || !validate_not_empty(&prompt, "prompt") {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("Fields cannot be empty".to_string())),
        ));
    }

    let vault_path = format!("agents/{}.md", agent_id);

    match state.vault.write_file(
        &vault_path,
        &prompt,
        "agent".to_string(),
        Some(format!("Custom Agent (project: {})", project_id)),
    ).await {
        Ok(file_id) => Ok(Json(EventResponse {
            success: true,
            file_id: Some(file_id),
            message: "Custom agent stored in Vault".to_string(),
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(format!("Failed to store agent: {}", e))),
        )),
    }
}

// ---- Utility Functions ----

/// Extract string value from JSON
fn extract_string(data: &serde_json::Value, key: &str) -> Option<String> {
    data.get(key)?.as_str().map(|s| s.to_string())
}

/// Create "missing field" error response
fn missing_field_error(field: &str) -> (StatusCode, Json<ErrorResponse>) {
    (
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse::new(format!("Missing required field: {}", field))),
    )
}

/// Validate that a string is not empty
fn validate_not_empty(value: &str, field_name: &str) -> bool {
    if value.trim().is_empty() {
        eprintln!("Validation error: {} is empty", field_name);
        false
    } else {
        true
    }
}

/// Log event to system log (simple append-only)
pub async fn log_event(state: &AppState, event_type: &str, status: &str, details: &str) {
    let timestamp = Utc::now().to_rfc3339();
    let log_entry = format!(
        "{} | {} | {} | {}\n",
        timestamp, event_type, status, details
    );

    let log_path = "system/events.log";
    
    // Try to read existing log
    match state.vault.read_file(log_path).await {
        Ok(existing) => {
            let updated = format!("{}{}", existing.content, log_entry);
            let _ = state.vault.update_file(log_path, &updated.clone()).await;
        }
        Err(_) => {
            // Create new log
            let _ = state.vault.write_file(
                log_path,
                &log_entry,
                "log".to_string(),
                Some("Orchestrator Event Log".to_string()),
            ).await;
        }
    }
}
