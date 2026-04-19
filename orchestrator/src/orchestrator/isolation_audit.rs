//! Isolation audit trail module
//! 
//! Records all process execution events for debugging and replay capability

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Type of isolation event
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IsolationEventType {
    /// Process started
    ProcessStarted,
    
    /// Process terminated successfully
    ProcessTerminated,
    
    /// Memory quota exceeded
    MemoryQuotaExceeded,
    
    /// CPU quota exceeded
    CpuQuotaExceeded,
    
    /// Process crashed
    Crashed,
    
    /// Crash recovery attempted
    RecoveryAttempted,
    
    /// Crash recovery succeeded
    RecoverySucceeded,
    
    /// Crash recovery failed
    RecoveryFailed,
}

impl std::fmt::Display for IsolationEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            IsolationEventType::ProcessStarted => write!(f, "ProcessStarted"),
            IsolationEventType::ProcessTerminated => write!(f, "ProcessTerminated"),
            IsolationEventType::MemoryQuotaExceeded => write!(f, "MemoryQuotaExceeded"),
            IsolationEventType::CpuQuotaExceeded => write!(f, "CpuQuotaExceeded"),
            IsolationEventType::Crashed => write!(f, "Crashed"),
            IsolationEventType::RecoveryAttempted => write!(f, "RecoveryAttempted"),
            IsolationEventType::RecoverySucceeded => write!(f, "RecoverySucceeded"),
            IsolationEventType::RecoveryFailed => write!(f, "RecoveryFailed"),
        }
    }
}

/// Single audit event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IsolationEvent {
    /// When the event occurred
    pub timestamp: DateTime<Utc>,
    
    /// Agent identifier
    pub agent_id: String,
    
    /// Process ID (if applicable)
    pub pid: Option<u32>,
    
    /// Type of event
    pub event_type: IsolationEventType,
    
    /// Detailed information about the event
    pub details: String,
    
    /// Execution ID for correlation
    pub execution_id: Option<String>,
}

impl IsolationEvent {
    pub fn new(
        agent_id: String,
        event_type: IsolationEventType,
        details: String,
    ) -> Self {
        IsolationEvent {
            timestamp: Utc::now(),
            agent_id,
            pid: None,
            event_type,
            details,
            execution_id: None,
        }
    }

    pub fn with_pid(mut self, pid: u32) -> Self {
        self.pid = Some(pid);
        self
    }

    pub fn with_execution_id(mut self, execution_id: String) -> Self {
        self.execution_id = Some(execution_id);
        self
    }
}

/// Audit trail manager
pub struct IsolationAudit {
    events: Arc<Mutex<Vec<IsolationEvent>>>,
}

impl IsolationAudit {
    pub fn new() -> Self {
        IsolationAudit {
            events: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Record an execution event
    pub async fn record_event(&self, event: IsolationEvent) {
        let mut events = self.events.lock().await;
        events.push(event);
    }

    /// Get all events for an agent
    pub async fn get_agent_events(&self, agent_id: &str) -> Vec<IsolationEvent> {
        let events = self.events.lock().await;
        events
            .iter()
            .filter(|e| e.agent_id == agent_id)
            .cloned()
            .collect()
    }

    /// Get all events in a time range
    pub async fn get_events_in_range(
        &self,
        agent_id: &str,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> Vec<IsolationEvent> {
        let events = self.events.lock().await;
        events
            .iter()
            .filter(|e| {
                e.agent_id == agent_id && e.timestamp >= start && e.timestamp <= end
            })
            .cloned()
            .collect()
    }

    /// Get events for an execution ID
    pub async fn get_execution_events(&self, execution_id: &str) -> Vec<IsolationEvent> {
        let events = self.events.lock().await;
        events
            .iter()
            .filter(|e| e.execution_id.as_deref() == Some(execution_id))
            .cloned()
            .collect()
    }

    /// Get all events (for testing)
    pub async fn get_all_events(&self) -> Vec<IsolationEvent> {
        let events = self.events.lock().await;
        events.clone()
    }

    /// Clear all events (for testing)
    #[cfg(test)]
    pub async fn clear_all(&self) {
        self.events.lock().await.clear();
    }

    /// Get event timeline for replay
    pub async fn get_timeline(&self, agent_id: &str) -> Vec<(DateTime<Utc>, IsolationEventType, String)> {
        let events = self.get_agent_events(agent_id).await;
        events
            .iter()
            .map(|e| (e.timestamp, e.event_type.clone(), e.details.clone()))
            .collect()
    }

    /// Count events by type for an agent
    pub async fn count_events_by_type(
        &self,
        agent_id: &str,
    ) -> std::collections::HashMap<String, u32> {
        let events = self.get_agent_events(agent_id).await;
        let mut counts = std::collections::HashMap::new();
        
        for event in events {
            let type_str = event.event_type.to_string();
            *counts.entry(type_str).or_insert(0) += 1;
        }
        
        counts
    }
}

impl Default for IsolationAudit {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_record_and_retrieve_events() {
        let audit = IsolationAudit::new();

        let event1 = IsolationEvent::new(
            "agent1".to_string(),
            IsolationEventType::ProcessStarted,
            "Starting agent execution".to_string(),
        )
        .with_pid(12345);

        audit.record_event(event1).await;

        let events = audit.get_agent_events("agent1").await;
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].event_type, IsolationEventType::ProcessStarted);
        assert_eq!(events[0].pid, Some(12345));
    }

    #[tokio::test]
    async fn test_get_execution_events() {
        let audit = IsolationAudit::new();

        let event1 = IsolationEvent::new(
            "agent1".to_string(),
            IsolationEventType::ProcessStarted,
            "Starting".to_string(),
        )
        .with_execution_id("exec_123".to_string());

        let event2 = IsolationEvent::new(
            "agent1".to_string(),
            IsolationEventType::ProcessTerminated,
            "Completed".to_string(),
        )
        .with_execution_id("exec_123".to_string());

        audit.record_event(event1).await;
        audit.record_event(event2).await;

        let events = audit.get_execution_events("exec_123").await;
        assert_eq!(events.len(), 2);
    }

    #[tokio::test]
    async fn test_get_events_in_range() {
        let audit = IsolationAudit::new();

        let now = Utc::now();
        let past = now - chrono::Duration::hours(1);
        let future = now + chrono::Duration::hours(1);

        let event = IsolationEvent {
            timestamp: now,
            agent_id: "agent1".to_string(),
            pid: None,
            event_type: IsolationEventType::ProcessStarted,
            details: "Test".to_string(),
            execution_id: None,
        };

        audit.record_event(event).await;

        let events = audit.get_events_in_range("agent1", past, future).await;
        assert_eq!(events.len(), 1);

        let events = audit.get_events_in_range("agent1", future, future + chrono::Duration::hours(1)).await;
        assert_eq!(events.len(), 0);
    }

    #[tokio::test]
    async fn test_count_events_by_type() {
        let audit = IsolationAudit::new();

        audit.record_event(IsolationEvent::new(
            "agent1".to_string(),
            IsolationEventType::ProcessStarted,
            "Start".to_string(),
        )).await;

        audit.record_event(IsolationEvent::new(
            "agent1".to_string(),
            IsolationEventType::ProcessStarted,
            "Start again".to_string(),
        )).await;

        audit.record_event(IsolationEvent::new(
            "agent1".to_string(),
            IsolationEventType::Crashed,
            "Crash".to_string(),
        )).await;

        let counts = audit.count_events_by_type("agent1").await;
        assert_eq!(counts.get("ProcessStarted"), Some(&2));
        assert_eq!(counts.get("Crashed"), Some(&1));
    }

    #[test]
    fn test_event_creation() {
        let event = IsolationEvent::new(
            "agent1".to_string(),
            IsolationEventType::ProcessStarted,
            "Testing".to_string(),
        )
        .with_pid(999)
        .with_execution_id("exec_456".to_string());

        assert_eq!(event.agent_id, "agent1");
        assert_eq!(event.event_type, IsolationEventType::ProcessStarted);
        assert_eq!(event.pid, Some(999));
        assert_eq!(event.execution_id, Some("exec_456".to_string()));
    }
}
