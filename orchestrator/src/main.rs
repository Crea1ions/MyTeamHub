use std::sync::Arc;
use std::path::PathBuf;
use orchestrator::{VaultManager, api, OrchestratorEngine};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Initialize Vault
    let vault_root = PathBuf::from("./vault");
    let vault = VaultManager::new(vault_root)?;
    let vault = Arc::new(vault);
    tracing::info!("Vault initialized at {:?}", vault.root());

    // Initialize Orchestrator Engine
    let orchestrator = Arc::new(OrchestratorEngine::new(vault.clone()).await);
    tracing::info!("OrchestratorEngine initialized");

    // Create app state
    let state = Arc::new(api::AppState { vault, orchestrator });

    // Create router
    let app = api::create_routes(state);

    // Start server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8001").await?;
    tracing::info!("Server listening on http://127.0.0.1:8001");

    axum::serve(listener, app).await?;

    Ok(())
}
