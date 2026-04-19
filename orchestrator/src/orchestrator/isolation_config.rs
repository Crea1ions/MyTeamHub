//! Isolation configuration module
//! 
//! Defines resource limits and isolation policies for agent execution

use serde::{Deserialize, Serialize};

/// Global isolation configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IsolationConfig {
    /// Maximum memory per agent in MB
    pub max_memory_mb: u64,
    
    /// Maximum CPU quota as percentage (0.0 - 100.0)
    pub max_cpu_percent: f32,
    
    /// Execution timeout in seconds
    pub timeout_secs: u64,
    
    /// Enable crash recovery
    pub crash_recovery_enabled: bool,
    
    /// Maximum retry attempts on crash
    pub max_retries: u32,
    
    /// Enable process isolation
    pub process_isolation_enabled: bool,
}

impl Default for IsolationConfig {
    fn default() -> Self {
        IsolationConfig {
            max_memory_mb: 512,
            max_cpu_percent: 50.0,
            timeout_secs: 30,
            crash_recovery_enabled: true,
            max_retries: 3,
            process_isolation_enabled: true,
        }
    }
}

impl IsolationConfig {
    /// Create a permissive configuration (for testing)
    pub fn permissive() -> Self {
        IsolationConfig {
            max_memory_mb: 2048,
            max_cpu_percent: 100.0,
            timeout_secs: 60,
            crash_recovery_enabled: true,
            max_retries: 5,
            process_isolation_enabled: true,
        }
    }

    /// Create a strict configuration (for production)
    pub fn strict() -> Self {
        IsolationConfig {
            max_memory_mb: 256,
            max_cpu_percent: 25.0,
            timeout_secs: 15,
            crash_recovery_enabled: true,
            max_retries: 1,
            process_isolation_enabled: true,
        }
    }
}

/// Per-agent isolation policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentIsolationPolicy {
    /// Agent identifier
    pub agent_id: String,
    
    /// Memory limit in MB (overrides global default)
    pub memory_limit_mb: Option<u64>,
    
    /// CPU quota as percentage (overrides global default)
    pub cpu_quota_percent: Option<f32>,
    
    /// Timeout in seconds (overrides global default)
    pub timeout_secs: Option<u64>,
}

impl AgentIsolationPolicy {
    /// Create policy with defaults from global config
    pub fn from_global(agent_id: String, config: &IsolationConfig) -> Self {
        AgentIsolationPolicy {
            agent_id,
            memory_limit_mb: Some(config.max_memory_mb),
            cpu_quota_percent: Some(config.max_cpu_percent),
            timeout_secs: Some(config.timeout_secs),
        }
    }

    /// Get effective memory limit
    pub fn get_memory_mb(&self, global: u64) -> u64 {
        self.memory_limit_mb.unwrap_or(global)
    }

    /// Get effective CPU quota
    pub fn get_cpu_percent(&self, global: f32) -> f32 {
        self.cpu_quota_percent.unwrap_or(global)
    }

    /// Get effective timeout
    pub fn get_timeout_secs(&self, global: u64) -> u64 {
        self.timeout_secs.unwrap_or(global)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = IsolationConfig::default();
        assert_eq!(config.max_memory_mb, 512);
        assert_eq!(config.max_cpu_percent, 50.0);
        assert_eq!(config.timeout_secs, 30);
        assert!(config.crash_recovery_enabled);
    }

    #[test]
    fn test_permissive_config() {
        let config = IsolationConfig::permissive();
        assert_eq!(config.max_memory_mb, 2048);
        assert_eq!(config.max_cpu_percent, 100.0);
        assert!(config.crash_recovery_enabled);
    }

    #[test]
    fn test_strict_config() {
        let config = IsolationConfig::strict();
        assert_eq!(config.max_memory_mb, 256);
        assert_eq!(config.max_cpu_percent, 25.0);
        assert_eq!(config.max_retries, 1);
    }

    #[test]
    fn test_policy_override() {
        let global = IsolationConfig::default();
        let policy = AgentIsolationPolicy {
            agent_id: "agent1".to_string(),
            memory_limit_mb: Some(1024),
            cpu_quota_percent: None,
            timeout_secs: None,
        };

        assert_eq!(policy.get_memory_mb(global.max_memory_mb), 1024);
        assert_eq!(policy.get_cpu_percent(global.max_cpu_percent), 50.0);
        assert_eq!(policy.get_timeout_secs(global.timeout_secs), 30);
    }
}
