//! Analyzer Agent - Performs simple text analysis
//!
//! Demonstrates agent that does real work:
//! - Extracts content field
//! - Analyzes length and basic metrics
//! - Returns structured result

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

/// Analyzer agent - analyzes text content
pub struct AnalyzerAgent;

#[async_trait]
impl Agent for AnalyzerAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        // ✅ Read from context (immutable)
        let content = context.event_data
            .get("content")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AgentError::MissingField("content".to_string()))?;

        // ✅ Perform analysis
        let char_count = content.len();
        let word_count = content.split_whitespace().count();
        let line_count = content.lines().count();

        // Basic sentiment approximation (just for demo)
        let positive_words = ["good", "great", "excellent", "amazing", "wonderful"];
        let negative_words = ["bad", "terrible", "awful", "horrible", "poor"];

        let text_lower = content.to_lowercase();
        let positive_count = positive_words.iter().filter(|w| text_lower.contains(*w)).count();
        let negative_count = negative_words.iter().filter(|w| text_lower.contains(*w)).count();

        let sentiment = if positive_count > negative_count {
            "positive"
        } else if negative_count > positive_count {
            "negative"
        } else {
            "neutral"
        };

        // ✅ Return structured result
        let result = serde_json::json!({
            "workflow_id": context.workflow_id,
            "content_length": char_count,
            "word_count": word_count,
            "line_count": line_count,
            "sentiment": sentiment,
            "positive_indicators": positive_count,
            "negative_indicators": negative_count,
        });

        Ok(AgentOutput {
            success: true,
            result,
            metadata: AgentMetadata {
                duration_ms: start.elapsed().as_millis() as u64,
                status: "success".to_string(),
                error_message: None,
            },
            vault_writes: vec![],
            logs: Some(vec![
                "Analyzer agent started".to_string(),
                format!("Analyzed {} characters", char_count),
                format!("Detected sentiment: {}", sentiment),
                "Analyzer agent complete".to_string(),
            ]),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_analyzer_agent_success() {
        let agent = AnalyzerAgent;
        let context = AgentContext {
            workflow_id: "wf_analyze".to_string(),
            task: "analyze".to_string(),
            event_data: serde_json::json!({
                "content": "This is great and amazing text"
            }),
            vault_root: "/vault".to_string(),
            execution_id: "exec_analyze".to_string(),
            timeout_secs: 30,
        };

        let result = agent.execute(context).await;
        assert!(result.is_ok());

        let output = result.unwrap();
        assert!(output.success);
        assert_eq!(output.metadata.status, "success");
        assert!(output.result["content_length"].is_number());
        assert_eq!(output.result["sentiment"].as_str(), Some("positive"));
    }

    #[tokio::test]
    async fn test_analyzer_agent_missing_content() {
        let agent = AnalyzerAgent;
        let context = AgentContext {
            workflow_id: "wf_error".to_string(),
            task: "analyze".to_string(),
            event_data: serde_json::json!({}), // Missing content
            vault_root: "/vault".to_string(),
            execution_id: "exec_error".to_string(),
            timeout_secs: 30,
        };

        let result = agent.execute(context).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_analyzer_agent_neutral_sentiment() {
        let agent = AnalyzerAgent;
        let context = AgentContext {
            workflow_id: "wf_neutral".to_string(),
            task: "analyze".to_string(),
            event_data: serde_json::json!({
                "content": "This is some neutral text without sentiment"
            }),
            vault_root: "/vault".to_string(),
            execution_id: "exec_neutral".to_string(),
            timeout_secs: 30,
        };

        let output = agent.execute(context).await.unwrap();
        assert_eq!(output.result["sentiment"].as_str(), Some("neutral"));
    }

    #[tokio::test]
    async fn test_analyzer_agent_word_count() {
        let agent = AnalyzerAgent;
        let content = "one two three four five";
        let context = AgentContext {
            workflow_id: "wf_count".to_string(),
            task: "analyze".to_string(),
            event_data: serde_json::json!({"content": content}),
            vault_root: "/vault".to_string(),
            execution_id: "exec_count".to_string(),
            timeout_secs: 30,
        };

        let output = agent.execute(context).await.unwrap();
        assert_eq!(output.result["word_count"].as_u64(), Some(5));
    }
}
