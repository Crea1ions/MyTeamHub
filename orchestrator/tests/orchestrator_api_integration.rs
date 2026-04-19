use orchestrator::{VaultManager, OrchestratorEngine, api};
use std::sync::Arc;
use tempfile::TempDir;

async fn setup_test_app() -> (Arc<api::AppState>, TempDir) {
    let tmpdir = TempDir::new().unwrap();
    let vault_path = tmpdir.path().to_path_buf();
    let vault = VaultManager::new(vault_path).unwrap();
    let vault = Arc::new(vault);

    let orchestrator = Arc::new(OrchestratorEngine::new(vault.clone()).await);
    let app_state = Arc::new(api::AppState { vault, orchestrator });

    (app_state, tmpdir)
}

#[tokio::test]
async fn test_get_orchestrator_status_endpoint() {
    let (app_state, _tmpdir) = setup_test_app().await;
    
    let response = api::orchestrator_handlers::get_orchestrator_status(
        axum::extract::State(app_state),
    )
    .await;

    if let Err(e) = response { panic!("Status endpoint failed: {:?}", e); }

    let status = response.unwrap().0;
    assert_eq!(status.version, "2.4");
    assert_eq!(status.status, "healthy");
    assert_eq!(status.agents_available.len(), 3);
}

#[tokio::test]
async fn test_list_agents_endpoint() {
    let (app_state, _tmpdir) = setup_test_app().await;

    let agents_response = api::orchestrator_handlers::list_agents(
        axum::extract::State(app_state),
    )
    .await
    .0;

    assert_eq!(agents_response.total, 3);
    assert_eq!(agents_response.agents.len(), 3);
    
    let agent_ids: Vec<&str> = agents_response
        .agents
        .iter()
        .map(|a| a.id.as_str())
        .collect();
    
    assert!(agent_ids.contains(&"echo"));
    assert!(agent_ids.contains(&"analyzer"));
    assert!(agent_ids.contains(&"indexer"));
}

#[tokio::test]
async fn test_get_workflow_status_not_found() {
    let (app_state, _tmpdir) = setup_test_app().await;

    let response = api::orchestrator_handlers::get_workflow_status(
        axum::extract::State(app_state),
        axum::extract::Path("nonexistent_workflow".to_string()),
    )
    .await;

    assert!(response.is_err(), "Should return error for non-existent workflow");
}

#[tokio::test]
async fn test_get_workflow_metrics_not_found() {
    let (app_state, _tmpdir) = setup_test_app().await;

    let response = api::orchestrator_handlers::get_workflow_metrics(
        axum::extract::State(app_state),
        axum::extract::Path("nonexistent_workflow".to_string()),
    )
    .await;

    assert!(response.is_err(), "Should return error for non-existent workflow");
}

#[tokio::test]
async fn test_archive_workflow_not_found() {
    let (app_state, _tmpdir) = setup_test_app().await;

    let response = api::orchestrator_handlers::archive_workflow(
        axum::extract::State(app_state),
        axum::extract::Path("nonexistent_workflow".to_string()),
    )
    .await;

    assert!(response.is_err(), "Should return error for non-existent workflow");
}

#[tokio::test]
async fn test_agent_info_response_structure() {
    let (app_state, _tmpdir) = setup_test_app().await;

    let agents_response = api::orchestrator_handlers::list_agents(
        axum::extract::State(app_state),
    )
    .await
    .0;

    // Verify each agent has required fields
    for agent in &agents_response.agents {
        assert!(!agent.id.is_empty(), "Agent ID should not be empty");
        assert!(!agent.name.is_empty(), "Agent name should not be empty");
        assert!(!agent.status.is_empty(), "Agent status should not be empty");
        assert_eq!(agent.status, "ready", "All agents should be ready");
    }
}

#[tokio::test]
async fn test_orchestrator_status_response_structure() {
    let (app_state, _tmpdir) = setup_test_app().await;

    let response = api::orchestrator_handlers::get_orchestrator_status(
        axum::extract::State(app_state),
    )
    .await;

    assert!(response.is_ok());
    let status = response.unwrap().0;
    
    // Verify response structure
    assert_eq!(status.status, "healthy");
    assert_eq!(status.version, "2.4");
    assert!(status.agents_available.len() > 0, "Should have available agents");
    assert!(status.last_event.is_some(), "Should have last event timestamp");
}

#[tokio::test]
async fn test_api_phase_2_4_endpoints_respond() {
    let (app_state, _tmpdir) = setup_test_app().await;

    // Test status endpoint
    let status = api::orchestrator_handlers::get_orchestrator_status(
        axum::extract::State(app_state.clone()),
    )
    .await;
    assert!(status.is_ok(), "Status endpoint should respond");

    // Test agents endpoint
    let agents = api::orchestrator_handlers::list_agents(
        axum::extract::State(app_state.clone()),
    )
    .await;
    assert_eq!(agents.0.total, 3, "Should list 3 agents");

    // Test workflow status with invalid ID (should error cleanly)
    let workflow = api::orchestrator_handlers::get_workflow_status(
        axum::extract::State(app_state.clone()),
        axum::extract::Path("test".to_string()),
    )
    .await;
    assert!(workflow.is_err(), "Should error for non-existent workflow");

    println!("✅ All Phase 2.4 API endpoints responding correctly");
}
