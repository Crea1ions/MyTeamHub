//! Crash recovery module
//! 
//! Handles detection, logging, and recovery of agent crashes with exponential backoff

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::Duration;
use chrono::{DateTime, Utc};
use crate::orchestrator::agent::AgentError;
use crate::orchestrator::isolation_config::IsolationConfig;

/// Reason for process crash
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CrashReason {
    /// Process exceeded memory quota
    MemoryExceeded,
    
    /// Execution timeout
    TimeoutExceeded,
    
    /// Segmentation fault or illegal instruction
    SegmentationFault,
    
    /// Process killed by signal
    KilledBySignal(i32),
    
    /// Unknown crash reason
    UnknownCrash(String),
}

impl std::fmt::Display for CrashReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CrashReason::MemoryExceeded => write!(f, "Memory quota exceeded"),
            CrashReason::TimeoutExceeded => write!(f, "Timeout exceeded"),
            CrashReason::SegmentationFault => write!(f, "Segmentation fault"),
            CrashReason::KilledBySignal(sig) => write!(f, "Killed by signal {}", sig),
            CrashReason::UnknownCrash(msg) => write!(f, "Unknown crash: {}", msg),
        }
    }
}

/// Crash history for a specific agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrashHistory {
    /// Agent identifier
    pub agent_id: String,
    
    /// Number of crashes so far
    pub crash_count: u32,
    
    /// Timestamp of last crash
    pub last_crash: Option<DateTime<Utc>>,
    
    /// Current exponential backoff level
    pub backoff_level: u32,
    
    /// Last crash reason
    pub last_reason: Option<String>,
}

impl CrashHistory {
    pub fn new(agent_id: String) -> Self {
        CrashHistory {
            agent_id,
            crash_count: 0,
            last_crash: None,
            backoff_level: 0,
            last_reason: None,
        }
    }

    pub fn increment_crash(&mut self, reason: &CrashReason) {
        self.crash_count += 1;
        self.last_crash = Some(Utc::now());
        self.last_reason = Some(reason.to_string());
        self.backoff_level += 1;
    }

    pub fn reset(&mut self) {
        self.crash_count = 0;
        self.backoff_level = 0;
    }
}

/// Crash recovery manager
pub struct CrashRecovery {
    config: IsolationConfig,
    crash_history: Arc<Mutex<HashMap<String, CrashHistory>>>,
}

impl CrashRecovery {
    /// Create a new crash recovery manager
    pub fn new(config: IsolationConfig) -> Self {
        CrashRecovery {
            config,
            crash_history: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Record a crash and determine if recovery should be attempted
    pub async fn handle_crash(
        &self,
        agent_id: &str,
        reason: CrashReason,
    ) -> Result<bool, AgentError> {
        if !self.config.crash_recovery_enabled {
            return Err(AgentError::ExecutionError(format!(
                "Agent crashed: {}",
                reason
            )));
        }

        let mut history = self.crash_history.lock().await;
        let mut agent_history = history
            .entry(agent_id.to_string())
            .or_insert_with(|| CrashHistory::new(agent_id.to_string()));

        agent_history.increment_crash(&reason);

        // Check if we should retry
        if agent_history.crash_count < self.config.max_retries {
            Ok(true) // Should retry
        } else {
            Err(AgentError::ExecutionError(format!(
                "Agent crashed {} times, exceeded max retries: {}",
                agent_history.crash_count, reason
            )))
        }
    }

    /// Calculate exponential backoff duration
    pub async fn get_backoff_duration(&self, agent_id: &str) -> Duration {
        let history = self.crash_history.lock().await;
        if let Some(agent_history) = history.get(agent_id) {
            self.calculate_backoff(agent_history.backoff_level)
        } else {
            Duration::from_millis(0)
        }
    }

    /// Calculate exponential backoff with jitter
    /// Formula: min(base * 2^attempt, max_backoff)
    fn calculate_backoff(&self, attempt: u32) -> Duration {
        const BASE_MS: u64 = 100;
        const MAX_MS: u64 = 5000;
        
        let ms = BASE_MS * (2_u64.pow(attempt));
        let capped_ms = ms.min(MAX_MS);
        
        Duration::from_millis(capped_ms)
    }

    /// Reset crash history for an agent
    pub async fn reset_history(&self, agent_id: &str) {
        let mut history = self.crash_history.lock().await;
        if let Some(agent_history) = history.get_mut(agent_id) {
            agent_history.reset();
        }
    }

    /// Get crash history for an agent
    pub async fn get_history(&self, agent_id: &str) -> Option<CrashHistory> {
        let history = self.crash_history.lock().await;
        history.get(agent_id).cloned()
    }

    /// Clear all crash history (for testing)
    #[cfg(test)]
    pub async fn clear_all(&self) {
        self.crash_history.lock().await.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crash_history_increment() {
        let mut history = CrashHistory::new("agent1".to_string());
        assert_eq!(history.crash_count, 0);

        history.increment_crash(&CrashReason::TimeoutExceeded);
        assert_eq!(history.crash_count, 1);
        assert_eq!(history.backoff_level, 1);

        history.increment_crash(&CrashReason::MemoryExceeded);
        assert_eq!(history.crash_count, 2);
        assert_eq!(history.backoff_level, 2);
    }

    #[test]
    fn test_crash_history_reset() {
        let mut history = CrashHistory::new("agent1".to_string());
        history.increment_crash(&CrashReason::TimeoutExceeded);
        assert_eq!(history.crash_count, 1);

        history.reset();
        assert_eq!(history.crash_count, 0);
        assert_eq!(history.backoff_level, 0);
    }

    #[tokio::test]
    async fn test_backoff_calculation() {
        let config = IsolationConfig::default();
        let recovery = CrashRecovery::new(config);

        // First attempt: 100ms * 2^0 = 100ms
        let backoff = recovery.calculate_backoff(0);
        assert_eq!(backoff, Duration::from_millis(100));

        // Second attempt: 100ms * 2^1 = 200ms
        let backoff = recovery.calculate_backoff(1);
        assert_eq!(backoff, Duration::from_millis(200));

        // Third attempt: 100ms * 2^2 = 400ms
        let backoff = recovery.calculate_backoff(2);
        assert_eq!(backoff, Duration::from_millis(400));

        // Fourth attempt: 100ms * 2^3 = 800ms
        let backoff = recovery.calculate_backoff(3);
        assert_eq!(backoff, Duration::from_millis(800));

        // Cap at 5000ms
        let backoff = recovery.calculate_backoff(10);
        assert_eq!(backoff, Duration::from_millis(5000));
    }

    #[tokio::test]
    async fn test_crash_recovery_disabled() {
        let config = IsolationConfig {
            crash_recovery_enabled: false,
            ..Default::default()
        };
        let recovery = CrashRecovery::new(config);

        let result = recovery.handle_crash("agent1", CrashReason::TimeoutExceeded).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_history() {
        let config = IsolationConfig::default();
        let recovery = CrashRecovery::new(config);

        let history = recovery.get_history("agent1").await;
        assert!(history.is_none());

        recovery.handle_crash("agent1", CrashReason::TimeoutExceeded).await.ok();

        let history = recovery.get_history("agent1").await;
        assert!(history.is_some());
        let h = history.unwrap();
        assert_eq!(h.crash_count, 1);
        assert_eq!(h.backoff_level, 1);
    }
}
