use super::state_machine::WorkflowContext;
use crate::vault::VaultManager;
use serde_json::json;
use std::sync::Arc;

/// State persistence manager - saves/loads workflow contexts to/from Vault
pub struct StateManager {
    vault: Arc<VaultManager>,
}

#[derive(Debug)]
pub enum StateManagerError {
    VaultError(String),
    SerializationError(String),
    DeserializationError(String),
}

impl std::fmt::Display for StateManagerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StateManagerError::VaultError(msg) => write!(f, "Vault error: {}", msg),
            StateManagerError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            StateManagerError::DeserializationError(msg) => write!(f, "Deserialization error: {}", msg),
        }
    }
}

impl std::error::Error for StateManagerError {}

impl StateManager {
    pub fn new(vault: Arc<VaultManager>) -> Self {
        Self { vault }
    }

    /// Save workflow context to Vault
    pub async fn save_context(&self, context: &WorkflowContext) -> Result<(), StateManagerError> {
        let path = format!("system/workflows/{}.json", context.workflow_id);

        let content = serde_json::to_string_pretty(context)
            .map_err(|e| StateManagerError::SerializationError(e.to_string()))?;

        self.vault
            .write_file(&path, &content, "workflow_state".to_string(), Some("Workflow State".to_string()))
            .await
            .map_err(|e| StateManagerError::VaultError(e.to_string()))?;

        Ok(())
    }

    /// Load workflow context from Vault
    pub async fn load_context(
        &self,
        workflow_id: &str,
    ) -> Result<WorkflowContext, StateManagerError> {
        let path = format!("system/workflows/{}.json", workflow_id);

        let file = self
            .vault
            .read_file(&path)
            .await
            .map_err(|e| StateManagerError::VaultError(e.to_string()))?;

        serde_json::from_str(&file.content)
            .map_err(|e| StateManagerError::DeserializationError(e.to_string()))
    }

    /// List all active workflow contexts
    pub async fn list_active_workflows(&self) -> Result<Vec<WorkflowContext>, StateManagerError> {
        let files = self
            .vault
            .list_files("system/workflows")
            .await
            .map_err(|e| StateManagerError::VaultError(e.to_string()))?;

        let mut contexts = Vec::new();
        for file in files {
            if file.ends_with(".json") {
                match self
                    .load_context(&file.replace(".json", "").split('/').last().unwrap_or(&file).to_string())
                    .await
                {
                    Ok(context) => contexts.push(context),
                    Err(_) => continue, // Skip invalid contexts
                }
            }
        }

        Ok(contexts)
    }

    /// Delete workflow context from Vault
    pub async fn delete_context(&self, workflow_id: &str) -> Result<(), StateManagerError> {
        let path = format!("system/workflows/{}.json", workflow_id);

        self.vault
            .delete_file(&path)
            .await
            .map_err(|e| StateManagerError::VaultError(e.to_string()))?;

        Ok(())
    }

    /// Archive completed workflow
    pub async fn archive_workflow(&self, context: &WorkflowContext) -> Result<(), StateManagerError> {
        let path = format!(
            "system/workflows/archive/{}.json",
            context.workflow_id
        );

        let content = serde_json::to_string_pretty(context)
            .map_err(|e| StateManagerError::SerializationError(e.to_string()))?;

        self.vault
            .write_file(&path, &content, "workflow_archive".to_string(), Some("Workflow Archive".to_string()))
            .await
            .map_err(|e| StateManagerError::VaultError(e.to_string()))?;

        Ok(())
    }

    /// Get workflow status summary
    pub async fn get_status_summary(&self) -> Result<serde_json::Value, StateManagerError> {
        let workflows = self.list_active_workflows().await?;

        let by_state = workflows.iter().fold(
            std::collections::HashMap::new(),
            |mut acc, wf| {
                let state = wf.state.to_string();
                *acc.entry(state).or_insert(0) += 1;
                acc
            },
        );

        Ok(json!({
            "total_active": workflows.len(),
            "by_state": by_state,
            "last_update": chrono::Utc::now().to_rfc3339(),
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use tempfile::TempDir;
    use tokio;

    // Helper to create a test vault manager
    async fn create_test_vault() -> (Arc<VaultManager>, TempDir) {
        let tmpdir = TempDir::new().unwrap();
        let vault_path = tmpdir.path().to_path_buf();
        let vault = VaultManager::new(vault_path).unwrap();
        (Arc::new(vault), tmpdir)
    }

    #[tokio::test]
    async fn test_save_and_load_context() {
        let (vault, _tmpdir) = create_test_vault().await;
        let manager = StateManager::new(vault);

        let context = WorkflowContext::new(
            "test_workflow".to_string(),
            json!({"project_id": "proj1"}),
        );

        // Save
        assert!(manager.save_context(&context).await.is_ok());

        // Load
        let loaded = manager.load_context("test_workflow").await;
        assert!(loaded.is_ok());
        assert_eq!(loaded.unwrap().workflow_id, "test_workflow");
    }

    #[tokio::test]
    async fn test_delete_context() {
        let (vault, _tmpdir) = create_test_vault().await;
        let manager = StateManager::new(vault);

        let context = WorkflowContext::new(
            "test_workflow_2".to_string(),
            json!({"project_id": "proj2"}),
        );

        manager.save_context(&context).await.unwrap();
        assert!(manager.delete_context("test_workflow_2").await.is_ok());
    }
}
