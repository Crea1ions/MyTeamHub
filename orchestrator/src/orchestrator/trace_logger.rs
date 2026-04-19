//! Trace logger module
//!
//! Collects structured logs and provides querying by workflow/execution

use super::structured_logs::{StructuredLog, LogLevel};
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{DateTime, Utc};

/// Trace logger - collects all structured logs
pub struct TraceLogger {
    logs: Arc<Mutex<Vec<StructuredLog>>>,
}

impl TraceLogger {
    /// Create new trace logger
    pub fn new() -> Self {
        TraceLogger {
            logs: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Log a structured log entry
    pub async fn log(&self, log: StructuredLog) {
        let mut logs = self.logs.lock().await;
        logs.push(log);
    }

    /// Get all logs for a workflow
    pub async fn get_workflow_logs(&self, workflow_id: &str) -> Vec<StructuredLog> {
        let logs = self.logs.lock().await;
        logs.iter()
            .filter(|log| log.workflow_id == workflow_id)
            .cloned()
            .collect()
    }

    /// Get all logs for an execution
    pub async fn get_execution_logs(&self, execution_id: &str) -> Vec<StructuredLog> {
        let logs = self.logs.lock().await;
        logs.iter()
            .filter(|log| log.execution_id.as_deref() == Some(execution_id))
            .cloned()
            .collect()
    }

    /// Get all logs in a time range
    pub async fn get_logs_in_range(
        &self,
        workflow_id: &str,
        start: DateTime<Utc>,
        end: DateTime<Utc>,
    ) -> Vec<StructuredLog> {
        let logs = self.logs.lock().await;
        logs.iter()
            .filter(|log| {
                log.workflow_id == workflow_id
                    && log.timestamp >= start
                    && log.timestamp <= end
            })
            .cloned()
            .collect()
    }

    /// Get logs by level
    pub async fn get_logs_by_level(
        &self,
        workflow_id: &str,
        level: LogLevel,
    ) -> Vec<StructuredLog> {
        let logs = self.logs.lock().await;
        logs.iter()
            .filter(|log| log.workflow_id == workflow_id && log.level == level)
            .cloned()
            .collect()
    }

    /// Export workflow logs as JSON
    pub async fn export_as_json(&self, workflow_id: &str) -> Result<String, serde_json::Error> {
        let logs = self.get_workflow_logs(workflow_id).await;
        serde_json::to_string_pretty(&logs)
    }

    /// Export all logs as JSON
    pub async fn export_all_as_json(&self) -> Result<String, serde_json::Error> {
        let logs = self.logs.lock().await;
        serde_json::to_string_pretty(&*logs)
    }

    /// Get total log count
    pub async fn count(&self) -> usize {
        let logs = self.logs.lock().await;
        logs.len()
    }

    /// Get log count for workflow
    pub async fn count_workflow(&self, workflow_id: &str) -> usize {
        let logs = self.logs.lock().await;
        logs.iter().filter(|log| log.workflow_id == workflow_id).count()
    }

    /// Clear all logs (for testing)
    #[cfg(test)]
    pub async fn clear(&self) {
        self.logs.lock().await.clear();
    }
}

impl Default for TraceLogger {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_log_and_retrieve() {
        let logger = TraceLogger::new();

        let log1 = StructuredLog::new(LogLevel::Info, "First log", "wf_123".to_string());
        let log2 = StructuredLog::new(LogLevel::Error, "Error log", "wf_123".to_string());

        logger.log(log1).await;
        logger.log(log2).await;

        let logs = logger.get_workflow_logs("wf_123").await;
        assert_eq!(logs.len(), 2);
    }

    #[tokio::test]
    async fn test_execution_logs() {
        let logger = TraceLogger::new();

        let log1 = StructuredLog::new(LogLevel::Info, "Exec log", "wf_123".to_string())
            .with_execution("exec_456".to_string());

        logger.log(log1).await;

        let logs = logger.get_execution_logs("exec_456").await;
        assert_eq!(logs.len(), 1);
    }

    #[tokio::test]
    async fn test_log_by_level() {
        let logger = TraceLogger::new();

        logger
            .log(StructuredLog::new(LogLevel::Info, "Info", "wf_123".to_string()))
            .await;
        logger
            .log(StructuredLog::new(LogLevel::Error, "Error", "wf_123".to_string()))
            .await;

        let errors = logger.get_logs_by_level("wf_123", LogLevel::Error).await;
        assert_eq!(errors.len(), 1);

        let infos = logger.get_logs_by_level("wf_123", LogLevel::Info).await;
        assert_eq!(infos.len(), 1);
    }

    #[tokio::test]
    async fn test_export_json() {
        let logger = TraceLogger::new();

        logger
            .log(StructuredLog::new(
                LogLevel::Info,
                "Test log",
                "wf_123".to_string(),
            ))
            .await;

        let json = logger.export_as_json("wf_123").await.unwrap();
        assert!(json.contains("wf_123"));
        assert!(json.contains("INFO"));
    }

    #[tokio::test]
    async fn test_count() {
        let logger = TraceLogger::new();

        logger
            .log(StructuredLog::new(LogLevel::Info, "Log 1", "wf_123".to_string()))
            .await;
        logger
            .log(StructuredLog::new(LogLevel::Info, "Log 2", "wf_456".to_string()))
            .await;

        assert_eq!(logger.count().await, 2);
        assert_eq!(logger.count_workflow("wf_123").await, 1);
        assert_eq!(logger.count_workflow("wf_456").await, 1);
    }
}
