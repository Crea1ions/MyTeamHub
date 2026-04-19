//! Agent permission model
//!
//! Defines and enforces agent capabilities

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Agent permissions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Permission {
    /// Read from Vault
    ReadVault,
    /// Write to Vault
    WriteVault,
    /// Execute scripts/tasks
    Execute,
    /// Access network
    AccessNetwork,
    /// Modify configuration
    ModifyConfig,
    /// Access external APIs
    AccessAPIs,
}

impl std::fmt::Display for Permission {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Permission::ReadVault => write!(f, "ReadVault"),
            Permission::WriteVault => write!(f, "WriteVault"),
            Permission::Execute => write!(f, "Execute"),
            Permission::AccessNetwork => write!(f, "AccessNetwork"),
            Permission::ModifyConfig => write!(f, "ModifyConfig"),
            Permission::AccessAPIs => write!(f, "AccessAPIs"),
        }
    }
}

/// Permission check result
pub type PermissionResult = Result<(), PermissionError>;

/// Permission errors
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PermissionError {
    PermissionDenied { agent_id: String, permission: String },
    AgentNotFound(String),
}

impl std::fmt::Display for PermissionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionError::PermissionDenied {
                agent_id,
                permission,
            } => write!(f, "Agent {} denied permission: {}", agent_id, permission),
            PermissionError::AgentNotFound(id) => write!(f, "Agent not found: {}", id),
        }
    }
}

/// Permission checker
pub struct PermissionChecker {
    capabilities: Arc<Mutex<HashMap<String, HashSet<Permission>>>>,
}

impl PermissionChecker {
    /// Create new permission checker
    pub fn new() -> Self {
        PermissionChecker {
            capabilities: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Initialize with default capabilities
    pub async fn with_defaults() -> Self {
        let checker = Self::new();

        // Echo: only execute
        checker
            .grant_permission("echo", Permission::Execute)
            .await;

        // Analyzer: read vault + execute
        checker
            .grant_permission("analyzer", Permission::ReadVault)
            .await;
        checker
            .grant_permission("analyzer", Permission::Execute)
            .await;

        // Indexer: read + write vault + execute
        checker
            .grant_permission("indexer", Permission::ReadVault)
            .await;
        checker
            .grant_permission("indexer", Permission::WriteVault)
            .await;
        checker
            .grant_permission("indexer", Permission::Execute)
            .await;

        checker
    }

    /// Grant permission to agent
    pub async fn grant_permission(&self, agent_id: &str, permission: Permission) {
        let mut caps = self.capabilities.lock().await;
        caps.entry(agent_id.to_string())
            .or_insert_with(HashSet::new)
            .insert(permission);
    }

    /// Revoke permission from agent
    pub async fn revoke_permission(&self, agent_id: &str, permission: Permission) {
        let mut caps = self.capabilities.lock().await;
        if let Some(perms) = caps.get_mut(agent_id) {
            perms.remove(&permission);
        }
    }

    /// Check if agent has permission
    pub async fn check_permission(
        &self,
        agent_id: &str,
        permission: Permission,
    ) -> PermissionResult {
        let caps = self.capabilities.lock().await;

        match caps.get(agent_id) {
            Some(perms) if perms.contains(&permission) => Ok(()),
            Some(_) => Err(PermissionError::PermissionDenied {
                agent_id: agent_id.to_string(),
                permission: permission.to_string(),
            }),
            None => Err(PermissionError::AgentNotFound(agent_id.to_string())),
        }
    }

    /// Simple boolean check
    pub async fn is_allowed(&self, agent_id: &str, permission: Permission) -> bool {
        self.check_permission(agent_id, permission).await.is_ok()
    }

    /// Get all permissions for agent
    pub async fn get_permissions(&self, agent_id: &str) -> Option<Vec<Permission>> {
        let caps = self.capabilities.lock().await;
        caps.get(agent_id).map(|perms| {
            let mut v: Vec<_> = perms.iter().copied().collect();
            v.sort_by_key(|p| format!("{}", p));
            v
        })
    }

    /// Check if agent can read vault
    pub async fn can_read_vault(&self, agent_id: &str) -> bool {
        self.is_allowed(agent_id, Permission::ReadVault).await
    }

    /// Check if agent can write vault
    pub async fn can_write_vault(&self, agent_id: &str) -> bool {
        self.is_allowed(agent_id, Permission::WriteVault).await
    }

    /// Check if agent can execute
    pub async fn can_execute(&self, agent_id: &str) -> bool {
        self.is_allowed(agent_id, Permission::Execute).await
    }

    /// Get total agent count
    pub async fn agent_count(&self) -> usize {
        self.capabilities.lock().await.len()
    }

    /// Clear all permissions (for testing)
    #[cfg(test)]
    pub async fn clear(&self) {
        self.capabilities.lock().await.clear();
    }
}

impl Default for PermissionChecker {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_grant_permission() {
        let checker = PermissionChecker::new();
        checker.grant_permission("test_agent", Permission::Execute).await;

        assert!(checker.is_allowed("test_agent", Permission::Execute).await);
    }

    #[tokio::test]
    async fn test_permission_denied() {
        let checker = PermissionChecker::new();
        checker.grant_permission("test_agent", Permission::Execute).await;

        assert!(!checker
            .is_allowed("test_agent", Permission::ReadVault)
            .await);
    }

    #[tokio::test]
    async fn test_agent_not_found() {
        let checker = PermissionChecker::new();

        assert_eq!(
            checker
                .check_permission("nonexistent", Permission::Execute)
                .await,
            Err(PermissionError::AgentNotFound("nonexistent".to_string()))
        );
    }

    #[tokio::test]
    async fn test_revoke_permission() {
        let checker = PermissionChecker::new();
        checker.grant_permission("test_agent", Permission::Execute).await;
        assert!(checker.is_allowed("test_agent", Permission::Execute).await);

        checker
            .revoke_permission("test_agent", Permission::Execute)
            .await;
        assert!(!checker.is_allowed("test_agent", Permission::Execute).await);
    }

    #[tokio::test]
    async fn test_default_capabilities() {
        let checker = PermissionChecker::with_defaults().await;

        // Echo: execute only
        assert!(checker.is_allowed("echo", Permission::Execute).await);
        assert!(!checker.is_allowed("echo", Permission::ReadVault).await);

        // Analyzer: read + execute
        assert!(checker.is_allowed("analyzer", Permission::Execute).await);
        assert!(checker.is_allowed("analyzer", Permission::ReadVault).await);
        assert!(!checker.is_allowed("analyzer", Permission::WriteVault).await);

        // Indexer: read + write + execute
        assert!(checker.is_allowed("indexer", Permission::ReadVault).await);
        assert!(checker.is_allowed("indexer", Permission::WriteVault).await);
        assert!(checker.is_allowed("indexer", Permission::Execute).await);
    }

    #[tokio::test]
    async fn test_get_permissions() {
        let checker = PermissionChecker::new();
        checker.grant_permission("test", Permission::Execute).await;
        checker.grant_permission("test", Permission::ReadVault).await;

        let perms = checker.get_permissions("test").await;
        assert_eq!(perms.unwrap().len(), 2);
    }

    #[tokio::test]
    async fn test_convenience_methods() {
        let checker = PermissionChecker::new();
        checker.grant_permission("agent", Permission::ReadVault).await;
        checker.grant_permission("agent", Permission::Execute).await;

        assert!(checker.can_read_vault("agent").await);
        assert!(!checker.can_write_vault("agent").await);
        assert!(checker.can_execute("agent").await);
    }
}
