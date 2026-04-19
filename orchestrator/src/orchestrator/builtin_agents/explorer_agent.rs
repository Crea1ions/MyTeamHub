//! Explorer Agent - Idea Generator
//!
//! Generates multiple interpretations and directions from a concept
//! Explores unconventional and non-obvious ideas

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

pub struct ExplorerAgent;

#[async_trait]
impl Agent for ExplorerAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        let concept = context.event_data
            .get("content")
            .and_then(|v| v.as_str())
            .unwrap_or(&context.task);

        let system_prompt = r#"You are "Explorer", a divergent thinking agent.

Your role is to:
- Generate multiple interpretations and directions from a concept
- Explore unconventional and non-obvious ideas
- Expand the design space

Behavior:
- Think broadly and creatively
- Approach the concept from different angles

Rules:
- Do not converge to a single idea
- Do not evaluate feasibility in depth
- Favor diversity over precision
- Encourage unconventional thinking

Provide at least 5 different creative interpretations or directions."#;

        let prompt = format!(
            "Concept: {}\n\nAs an Explorer agent, generate multiple creative and unconventional interpretations of this concept. What unexpected directions could this take?",
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
            "temperature": 1.0,
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
            "agent": "explorer",
            "mode": "idea_generator",
            "concept": concept,
            "directions": llm_response,
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
                "Explorer agent started".to_string(),
                "Generating creative interpretations".to_string(),
                "Explorer agent complete".to_string(),
            ]),
        })
    }
}
