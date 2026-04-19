pub mod types;
pub mod handlers;
pub mod orchestrator;
pub mod orchestrator_handlers;

pub use handlers::AppState;
pub use types::*;
pub use orchestrator::*;

use axum::{
    routing::{get, post, put, delete},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

/// Create all API routes (Vault + Orchestrator + LLM)
pub fn create_routes(app_state: Arc<AppState>) -> Router {
    // Configure CORS - permissive for development (localhost:3000 and :3001)
    let cors = CorsLayer::permissive();

    Router::new()
        // Vault file operations
        .route("/vault/health", get(handlers::health))
        .route("/vault/files", post(handlers::create_file))
        .route("/vault/files", get(handlers::list_files))
        .route("/vault/file/:path", get(handlers::read_file))
        .route("/vault/file/:path", put(handlers::update_file))
        .route("/vault/file/:path", delete(handlers::delete_file))
        .route("/vault/raw/:path", get(handlers::read_file_raw))  // NEW: Raw file fallback endpoint
        .route("/vault/search", get(handlers::search_files))
        // Orchestrator status and monitoring endpoints
        .route("/orchestrator/status", get(orchestrator_handlers::get_orchestrator_status))
        .route("/orchestrator/workflows", get(orchestrator_handlers::list_workflows))
        .route("/orchestrator/workflows/:workflow_id", get(orchestrator_handlers::get_workflow_status))
        .route("/orchestrator/workflows/:workflow_id/metrics", get(orchestrator_handlers::get_workflow_metrics))
        .route("/orchestrator/workflows/:workflow_id/archive", post(orchestrator_handlers::archive_workflow))
        .route("/orchestrator/agents", get(orchestrator_handlers::list_agents))
        // LLM endpoints
        .route("/orchestrator/llm/chat/completions", post(handlers::proxy_mistral_chat))
        .route("/api/chat", post(handlers::direct_chat))  // NEW: Direct chat (no workflow, fast path)
        // Event handling (from Team-Studio)
        .route("/api/events", post(crate::orchestrator::handle_event))
        .layer(cors)
        .with_state(app_state)
}
