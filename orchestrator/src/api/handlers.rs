use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;

use crate::vault::VaultManager;
use crate::orchestrator::OrchestratorEngine;
use super::types::{
    CreateFileRequest, UpdateFileRequest, FileResponse, RawFileResponse, ListFilesResponse,
    SearchResponse, ErrorResponse,
};

/// Application state (shared Vault manager and Orchestrator engine)
#[derive(Clone)]
pub struct AppState {
    pub vault: Arc<VaultManager>,
    pub orchestrator: Arc<OrchestratorEngine>,
}

/// Create a new file
pub async fn create_file(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateFileRequest>,
) -> Result<(StatusCode, Json<FileResponse>), (StatusCode, Json<ErrorResponse>)> {
    match state.vault.write_file(
        &req.path,
        &req.content,
        req.file_type,
        req.title,
    ).await {
        Ok(_file_id) => {
            // Read back the created file
            match state.vault.read_file(&req.path).await {
                Ok(md_file) => {
                    let response = FileResponse::from_markdown_file(&md_file, req.path);
                    Ok((StatusCode::CREATED, Json(response)))
                }
                Err(e) => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse::new(format!("Failed to read created file: {}", e))),
                )),
            }
        }
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}

/// Read a file
pub async fn read_file(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
) -> Result<Json<FileResponse>, (StatusCode, Json<ErrorResponse>)> {
    match state.vault.read_file(&path).await {
        Ok(md_file) => {
            let response = FileResponse::from_markdown_file(&md_file, path);
            Ok(Json(response))
        }
        Err(e) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}

/// Read a file in raw format (no frontmatter parsing)
/// Useful as fallback when frontmatter parsing fails
pub async fn read_file_raw(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
) -> Result<Json<RawFileResponse>, (StatusCode, Json<ErrorResponse>)> {
    match state.vault.read_file_raw(&path).await {
        Ok(content) => {
            let response = RawFileResponse {
                path: path.clone(),
                content,
            };
            Ok(Json(response))
        }
        Err(e) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}

/// Update a file
pub async fn update_file(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
    Json(req): Json<UpdateFileRequest>,
) -> Result<Json<FileResponse>, (StatusCode, Json<ErrorResponse>)> {
    match state.vault.update_file(&path, &req.content).await {
        Ok(_) => {
            // Read back the updated file
            match state.vault.read_file(&path).await {
                Ok(md_file) => {
                    let response = FileResponse::from_markdown_file(&md_file, path);
                    Ok(Json(response))
                }
                Err(e) => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse::new(format!("Failed to read updated file: {}", e))),
                )),
            }
        }
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}

/// Delete a file (soft delete to archive)
pub async fn delete_file(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    match state.vault.delete_file(&path).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}

/// List files in directory
#[derive(Deserialize)]
pub struct ListQuery {
    directory: Option<String>,
}

pub async fn list_files(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<ListFilesResponse>, (StatusCode, Json<ErrorResponse>)> {
    let directory = params.directory.unwrap_or_else(|| ".".to_string());
    
    match state.vault.list_files(&directory).await {
        Ok(files) => Ok(Json(ListFilesResponse { files })),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}

/// Search files by pattern
#[derive(Deserialize)]
pub struct SearchQuery {
    q: String,
}

pub async fn search_files(
    State(state): State<Arc<AppState>>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<SearchResponse>, (StatusCode, Json<ErrorResponse>)> {
    match state.vault.search_files(&params.q).await {
        Ok(results) => Ok(Json(SearchResponse {
            query: params.q,
            results,
        })),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(e.to_string())),
        )),
    }
}

/// Health check
pub async fn health() -> &'static str {
    "OK"
}

/// Mistral API proxy handler for secure LLM access
/// This endpoint securely proxies chat completion requests to Mistral API
/// The API key is kept on the backend and never exposed to the frontend
#[derive(Debug, Deserialize, Serialize)]
pub struct MistralChatRequest {
    pub model: Option<String>,
    pub messages: Vec<MistralMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MistralMessage {
    pub role: String,
    pub content: String,
}

pub async fn proxy_mistral_chat(
    State(state): State<Arc<AppState>>,
    Json(req): Json<MistralChatRequest>,
) -> Result<Json<Value>, (StatusCode, Json<ErrorResponse>)> {
    // Get API key from environment
    let api_key = std::env::var("MISTRAL_API_KEY")
        .map_err(|_| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("Mistral API key not configured".to_string())),
        ))?;

    // Get model from request or use default
    let model = req.model.unwrap_or_else(|| "mistral-small".to_string());

    // Validate messages
    if req.messages.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new("Messages array cannot be empty".to_string())),
        ));
    }

    // Build request body for Mistral API
    let mut mistral_request = json!({
        "model": model,
        "messages": req.messages,
    });

    // Add optional parameters if provided
    if let Some(temp) = req.temperature {
        mistral_request["temperature"] = json!(temp);
    }
    if let Some(max_tokens) = req.max_tokens {
        mistral_request["max_tokens"] = json!(max_tokens);
    }

    // Make request to Mistral API
    let client = reqwest::Client::new();
    
    match client
        .post("https://api.mistral.ai/v1/chat/completions")
        .bearer_auth(&api_key)
        .json(&mistral_request)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status().as_u16();
            
            match status {
                200 => {
                    match response.json::<Value>().await {
                        Ok(body) => Ok(Json(body)),
                        Err(_) => Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(ErrorResponse::new("Failed to parse Mistral response".to_string())),
                        )),
                    }
                }
                401 => Err((
                    StatusCode::UNAUTHORIZED,
                    Json(ErrorResponse::new("Invalid Mistral API key".to_string())),
                )),
                429 => Err((
                    StatusCode::TOO_MANY_REQUESTS,
                    Json(ErrorResponse::new("Mistral API rate limit exceeded".to_string())),
                )),
                _ => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse::new(format!(
                        "Mistral API error: HTTP {}",
                        status
                    ))),
                )),
            }
        }
        Err(e) => {
            eprintln!("Mistral API proxy error: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Failed to call Mistral API: {}",
                    e
                ))),
            ))
        }
    }
}

/// Direct chat endpoint (no workflow, no orchestrator delay)
/// Fast path for interactive LLM chat from Studio
#[derive(Debug, Deserialize)]
pub struct DirectChatRequest {
    pub message: String,
    pub agent: Option<String>,
    pub temperature: Option<f32>,
    pub context: Option<EditorContext>,
}

#[derive(Debug, Deserialize)]
pub struct EditorContext {
    pub editor_content: String,
    pub file_name: String,
    pub project_id: String,
    pub line_count: i32,
}

#[derive(Debug, Serialize)]
pub struct DirectChatResponse {
    pub response: String,
    pub agent: String,
    pub model: String,
}

pub async fn direct_chat(
    Json(req): Json<DirectChatRequest>,
) -> Result<Json<DirectChatResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get API key from environment
    let api_key = std::env::var("MISTRAL_API_KEY")
        .map_err(|_| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new("Mistral API key not configured".to_string())),
        ))?;

    let agent = req.agent.unwrap_or_else(|| "collaborator".to_string());
    let temperature = req.temperature.unwrap_or(0.7);
    let model = "mistral-large-latest".to_string();

    // Build system prompt based on agent
    let base_system_prompt = match agent.as_str() {
        "explorer" => "You are Explorer, a creative idea generator. Generate multiple unconventional interpretations. Expand the design space.",
        "critical_analyst" => "You are Critical Analyst. Analyze implications, identify inconsistencies, and challenge assumptions.",
        "deconstructor" => "You are Deconstructor. Identify weaknesses, failure modes, and how systems could break.",
        "stress_tester" => "You are Stress Tester. Analyze scalability, resource constraints, and real-world limitations.",
        "user" => "You are User. Interpret as a normal user, generate realistic scenarios, stay intuitive.",
        _ => "You are Collaborator, a senior architect. Transform concepts into structured systems. Prioritize clarity.",
    };

    // Inject editor context into system prompt if provided
    let system_prompt = if let Some(ctx) = &req.context {
        format!(
            "{}\n\n## CURRENT EDITOR CONTEXT\n**Project**: {}\n**File**: {}\n**Lines**: {}\n\n### File Content:\n```\n{}\n```",
            base_system_prompt,
            ctx.project_id,
            ctx.file_name,
            ctx.line_count,
            ctx.editor_content
        )
    } else {
        base_system_prompt.to_string()
    };

    // Build Mistral request
    let mistral_request = json!({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.message}
        ],
        "temperature": temperature,
        "max_tokens": 4096
    });

    // Call Mistral API
    let client = reqwest::Client::new();
    
    match client
        .post("https://api.mistral.ai/v1/chat/completions")
        .bearer_auth(&api_key)
        .json(&mistral_request)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status().as_u16();
            
            match status {
                200 => {
                    match response.json::<Value>().await {
                        Ok(body) => {
                            // Extract assistant's response
                            let content = body
                                .get("choices")
                                .and_then(|c| c.get(0))
                                .and_then(|c| c.get("message"))
                                .and_then(|m| m.get("content"))
                                .and_then(|c| c.as_str())
                                .unwrap_or("No response");

                            Ok(Json(DirectChatResponse {
                                response: content.to_string(),
                                agent: agent.clone(),
                                model: "mistral-large-latest".to_string(),
                            }))
                        }
                        Err(_) => Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(ErrorResponse::new("Failed to parse Mistral response".to_string())),
                        )),
                    }
                }
                401 => Err((
                    StatusCode::UNAUTHORIZED,
                    Json(ErrorResponse::new("Invalid Mistral API key".to_string())),
                )),
                429 => Err((
                    StatusCode::TOO_MANY_REQUESTS,
                    Json(ErrorResponse::new("Rate limit exceeded".to_string())),
                )),
                _ => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse::new(format!("API error: HTTP {}", status))),
                )),
            }
        }
        Err(e) => {
            eprintln!("Direct chat error: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse::new(format!(
                    "Failed to process chat: {}",
                    e
                ))),
            ))
        }
    }
}
