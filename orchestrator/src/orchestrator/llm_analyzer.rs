//! Phase 3.5: LLMAnalyzer agent for real-world LLM integration
//!
//! Simple agent that calls Mistral API to analyze content

use super::agent::{Agent, AgentContext, AgentOutput, AgentError, AgentMetadata, VaultWriteRecord};
use super::config::{load_mistral_api_key, mistral_api_endpoint, mistral_model};
use async_trait::async_trait;
use serde_json::json;
use std::time::Instant;

/// LLM-based analyzer agent
pub struct LLMAnalyzerAgent {
    api_key: String,
}

impl LLMAnalyzerAgent {
    /// Create new LLM analyzer with API key
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    /// Build analysis prompt from task and event data
    fn build_prompt(&self, context: &AgentContext) -> String {
        format!(
            "Analyze the following project content and provide:\n\n1. A concise summary (max 3 bullet points)\n2. Key technical challenges\n3. Suggested next steps\n\nContent:\n{}",
            serde_json::to_string_pretty(&context.event_data).unwrap_or_else(|_| context.task.clone())
        )
    }

    /// Call Mistral API
    async fn call_mistral(&self, prompt: &str) -> Result<String, String> {
        let client = reqwest::Client::new();
        
        let request_body = json!({
            "model": mistral_model(),
            "messages": [
                { "role": "user", "content": prompt }
            ]
        });

        match client
            .post(mistral_api_endpoint())
            .bearer_auth(&self.api_key)
            .json(&request_body)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
        {
            Ok(response) => {
                match response.json::<serde_json::Value>().await {
                    Ok(body) => {
                        // Extract message from response
                        if let Some(content) = body
                            .get("choices")
                            .and_then(|c| c.get(0))
                            .and_then(|c| c.get("message"))
                            .and_then(|m| m.get("content"))
                            .and_then(|c| c.as_str())
                        {
                            Ok(content.to_string())
                        } else {
                            Err("Invalid response format from Mistral API".to_string())
                        }
                    }
                    Err(e) => Err(format!("Failed to parse Mistral response: {}", e)),
                }
            }
            Err(e) => Err(format!("Mistral API call failed: {}", e)),
        }
    }
}

#[async_trait]
impl Agent for LLMAnalyzerAgent {
    async fn execute(&self, context: AgentContext) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        // Phase 3.5: Validate input size (important for API costs)
        let input_size = serde_json::to_string(&context.event_data)
            .map(|s| s.len())
            .unwrap_or(0);

        if input_size > 50_000 {
            return Ok(AgentOutput {
                success: false,
                result: json!({
                    "error": "Input too large for analysis",
                    "input_size_bytes": input_size,
                    "limit": 50_000,
                    "suggestion": "Please provide summarized content"
                }),
                metadata: AgentMetadata {
                    duration_ms: start.elapsed().as_millis() as u64,
                    status: "error".to_string(),
                    error_message: Some("Input size limit exceeded".to_string()),
                },
                vault_writes: vec![],
                logs: Some(vec![format!("Input validation failed: {} bytes > 50KB limit", input_size)]),
            });
        }

        // Build prompt from context
        let prompt = self.build_prompt(&context);

        // Call Mistral API
        match self.call_mistral(&prompt).await {
            Ok(analysis) => {
                let duration_ms = start.elapsed().as_millis() as u64;
                
                Ok(AgentOutput {
                    success: true,
                    result: json!({
                        "analysis": analysis,
                        "model": mistral_model(),
                        "duration_ms": duration_ms,
                    }),
                    metadata: AgentMetadata {
                        duration_ms,
                        status: "success".to_string(),
                        error_message: None,
                    },
                    vault_writes: vec![],
                    logs: Some(vec![
                        format!("LLM analysis completed in {}ms", duration_ms),
                        format!("Input size: {} bytes", input_size),
                    ]),
                })
            }
            Err(error) => {
                let duration_ms = start.elapsed().as_millis() as u64;
                
                Ok(AgentOutput {
                    success: false,
                    result: json!({
                        "error": error,
                        "model": mistral_model(),
                    }),
                    metadata: AgentMetadata {
                        duration_ms,
                        status: "error".to_string(),
                        error_message: Some(error.clone()),
                    },
                    vault_writes: vec![],
                    logs: Some(vec![
                        format!("LLM analysis failed: {}", error),
                        format!("Failed after {}ms", duration_ms),
                    ]),
                })
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_building() {
        let api_key = "test_key".to_string();
        let analyzer = LLMAnalyzerAgent::new(api_key);
        
        let context = AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "Analyze this".to_string(),
            event_data: json!({"content": "test"}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 30,
        };

        let prompt = analyzer.build_prompt(&context);
        assert!(prompt.contains("Analyze the following"));
        assert!(prompt.contains("test"));
    }

    #[tokio::test]
    async fn test_input_size_validation() {
        let api_key = "test_key".to_string();
        let analyzer = LLMAnalyzerAgent::new(api_key);

        // Create context with large input
        let large_data = "x".repeat(60_000);
        let context = AgentContext {
            workflow_id: "wf_test".to_string(),
            task: "Analyze".to_string(),
            event_data: json!({"content": large_data}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_test".to_string(),
            timeout_secs: 30,
        };

        let result = analyzer.execute(context).await;
        assert!(result.is_ok());
        
        let output = result.unwrap();
        assert!(!output.success);
        assert_eq!(output.metadata.status, "error");
    }
}
