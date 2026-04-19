//! Simple execution replay system
//!
//! Combines logs and events for debugging without external dependencies

use crate::orchestrator::structured_logs::{StructuredLog, LogLevel};
use crate::orchestrator::{IsolationEvent, IsolationEventType, TraceLogger};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Simple replay of execution timeline
pub struct ExecutionReplay {
    /// All logs for this execution
    pub logs: Vec<StructuredLog>,
    
    /// All events for this execution
    pub events: Vec<IsolationEvent>,
    
    /// Workflow ID for correlation
    pub workflow_id: String,
}

impl ExecutionReplay {
    /// Create replay from workflow logs and events
    pub fn from_workflow(
        workflow_id: &str,
        logs: Vec<StructuredLog>,
        events: Vec<IsolationEvent>,
    ) -> Self {
        ExecutionReplay {
            logs,
            events,
            workflow_id: workflow_id.to_string(),
        }
    }

    /// Get timeline as (timestamp, description) tuples
    pub fn timeline(&self) -> Vec<(DateTime<Utc>, String)> {
        let mut timeline = Vec::new();

        // Add log entries
        for log in &self.logs {
            let desc = format!(
                "[{}] {} - {}",
                log.level, log.message,
                log.context.get("agent").map(|v| v.to_string()).unwrap_or_default()
            );
            timeline.push((log.timestamp, desc));
        }

        // Add event entries
        for event in &self.events {
            let desc = format!("[EVENT] {} - {}", event.event_type, event.details);
            timeline.push((event.timestamp, desc));
        }

        // Sort by timestamp
        timeline.sort_by_key(|entry| entry.0);
        timeline
    }

    /// Export as human-readable string
    pub fn export_human_readable(&self) -> String {
        let mut output = String::new();

        output.push_str(&format!("=== Execution Replay: {} ===\n\n", self.workflow_id));

        let timeline = self.timeline();
        for (timestamp, desc) in timeline {
            output.push_str(&format!("[{}] {}\n", timestamp.format("%H:%M:%S%.3f"), desc));
        }

        output.push_str("\n=== Summary ===\n");
        output.push_str(&format!("Total Events: {}\n", self.events.len()));
        output.push_str(&format!("Total Logs: {}\n", self.logs.len()));

        // Count by level
        let mut level_counts = HashMap::new();
        for log in &self.logs {
            *level_counts.entry(log.level).or_insert(0) += 1;
        }

        for (level, count) in level_counts {
            output.push_str(&format!("  {}: {}\n", level, count));
        }

        // Count by event type
        let mut event_counts = HashMap::new();
        for event in &self.events {
            let key = format!("{:?}", event.event_type);
            *event_counts.entry(key).or_insert(0) += 1;
        }

        if !event_counts.is_empty() {
            output.push_str("\nEvent Types:\n");
            for (event_type, count) in event_counts {
                output.push_str(&format!("  {}: {}\n", event_type, count));
            }
        }

        output
    }

    /// Get point-in-time snapshot
    pub fn get_at_point(&self, timestamp: DateTime<Utc>) -> String {
        let mut output = String::new();
        output.push_str(&format!(
            "=== State at {} ===\n\n",
            timestamp.format("%H:%M:%S")
        ));

        output.push_str("Logs up to this point:\n");
        for log in &self.logs {
            if log.timestamp <= timestamp {
                output.push_str(&format!("[{}] {}\n", log.level, log.message));
            }
        }

        output.push_str("\nEvents up to this point:\n");
        for event in &self.events {
            if event.timestamp <= timestamp {
                output.push_str(&format!("[{}] {}\n", event.event_type, event.details));
            }
        }

        output
    }

    /// Get all errors and warnings
    pub fn get_issues(&self) -> Vec<String> {
        let mut issues = Vec::new();

        for log in &self.logs {
            if matches!(log.level, LogLevel::Error | LogLevel::Warn) {
                issues.push(format!("[{}] {}", log.level, log.message));
            }
        }

        for event in &self.events {
            if matches!(
                event.event_type,
                IsolationEventType::Crashed | IsolationEventType::RecoveryFailed
            ) {
                issues.push(format!("[EVENT] {}", event.details));
            }
        }

        issues
    }

    /// Duration of execution
    pub fn duration(&self) -> Option<std::time::Duration> {
        if self.logs.is_empty() && self.events.is_empty() {
            return None;
        }

        let min_time = self
            .logs
            .iter()
            .map(|l| l.timestamp)
            .chain(self.events.iter().map(|e| e.timestamp))
            .min()?;

        let max_time = self
            .logs
            .iter()
            .map(|l| l.timestamp)
            .chain(self.events.iter().map(|e| e.timestamp))
            .max()?;

        max_time.signed_duration_since(min_time).to_std().ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_logs() -> Vec<StructuredLog> {
        vec![
            StructuredLog::new(LogLevel::Info, "Starting workflow", "wf_test".to_string()),
            StructuredLog::new(LogLevel::Info, "Agent executed", "wf_test".to_string()),
            StructuredLog::new(LogLevel::Error, "Agent failed", "wf_test".to_string()),
        ]
    }

    #[test]
    fn test_timeline_generation() {
        let logs = create_test_logs();
        let replay = ExecutionReplay::from_workflow("wf_test", logs, vec![]);

        let timeline = replay.timeline();
        assert_eq!(timeline.len(), 3);
    }

    #[test]
    fn test_human_readable_export() {
        let logs = create_test_logs();
        let replay = ExecutionReplay::from_workflow("wf_test", logs, vec![]);

        let output = replay.export_human_readable();
        assert!(output.contains("wf_test"));
        assert!(output.contains("Starting workflow"));
    }

    #[test]
    fn test_get_issues() {
        let logs = create_test_logs();
        let replay = ExecutionReplay::from_workflow("wf_test", logs, vec![]);

        let issues = replay.get_issues();
        assert_eq!(issues.len(), 1); // One error
        assert!(issues[0].contains("failed"));
    }

    #[test]
    fn test_duration() {
        let logs = create_test_logs();
        let replay = ExecutionReplay::from_workflow("wf_test", logs, vec![]);

        let duration = replay.duration();
        assert!(duration.is_some());
    }
}
