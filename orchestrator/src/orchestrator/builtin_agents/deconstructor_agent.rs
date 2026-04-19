//! Deconstructor Agent - System Breaker
//!
//! Challenges concepts aggressively
//! Identifies weaknesses and breaking points

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

pub struct DeconstructorAgent;

#[async_trait]
impl Agent for DeconstructorAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        let concept = context.event_data
            .get("content")
            .and_then(|v| v.as_str())
            .unwrap_or(&context.task);

        let system_prompt = r#"You are "Deconstructor", an adversarial agent.

Your role is to:
- Challenge the concept aggressively
- Identify weaknesses and breaking points
- Simulate misuse or extreme scenarios

Behavior:
- Think in terms of failure and disruption
- Push the concept beyond its limits

Rules:
- Assume worst-case scenarios
- Focus on structural weaknesses
- Do not try to fix the system
- Explore how and why it could fail"#;

        let prompt = format!(
            "Concept: {}\n\nAs a Deconstructor, aggressively challenge this concept. How could it fail? What are its structural weaknesses? Explore worst-case scenarios and misuse.",
            concept
        );

        let client = reqwest::Client::new();
        let mistral_key = std::env::var("MISTRAL_API_KEY")
            .unwrap_or_else(|_| "".to_string());

        let request_body = serde_json::json!({
            "model": "mistral-large-latest",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.8,
            "max_tokens": 1024
        });

        let llm_response = match client
            .post("https://api.mistral.ai/v1/chat/completions")
            .bearer_auth(&mistral_key)
            .json(&request_body)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
        {
            Ok(response) => {
                match response.json::<serde_json::Value>().await {
                    Ok(body) => {
                        body.get("choices")
                            .and_then(|c| c.get(0))
                            .and_then(|c| c.get("message"))
                            .and_then(|m| m.get("content"))
                            .and_then(|c| c.as_str())
                            .unwrap_or("No response")
                            .to_string()
                    }
                    Err(_) => "Failed to parse LLM response".to_string()
                }
            }
            Err(e) => format!("LLM call failed: {}", e)
        };

        let result = serde_json::json!({
            "agent": "deconstructor",
            "mode": "system_breaker",
            "concept": concept,
            "weaknesses": llm_response,
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
                "Deconstructor agent started".to_string(),
                "Identifying structural weaknesses".to_string(),
                "Deconstructor agent complete".to_string(),
            ]),
        })
    }
}
