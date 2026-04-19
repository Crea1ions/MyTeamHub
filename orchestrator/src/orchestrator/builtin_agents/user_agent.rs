//! User Agent - Usage Simulator
//!
//! Interprets concepts as a normal user would
//! Generates realistic usage scenarios

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

pub struct UserAgent;

#[async_trait]
impl Agent for UserAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        let concept = context.event_data
            .get("content")
            .and_then(|v| v.as_str())
            .unwrap_or(&context.task);

        let system_prompt = r#"You are "User", a general-purpose end-user simulation agent.

Your role is to:
- Interpret a concept as a normal user would
- Imagine how it could be used in real life
- Generate realistic and diverse usage scenarios
- Reveal alternative and unexpected ways the concept might be used

Behavior:
- Think in terms of needs, situations, and habits
- Interpret the concept intuitively, not technically
- Focus on what you can do with the concept

Rules:
- Do not think like a designer or engineer
- Do not analyze or critique the system
- Do not propose improvements
- Stay grounded in realistic human behavior"#;

        let prompt = format!(
            "Concept: {}\n\nAs a regular User, how would you use this? Describe realistic scenarios, needs, and situations where this could help. What could you do with it?",
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
            "temperature": 0.7,
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
            "agent": "user",
            "mode": "usage_simulator",
            "concept": concept,
            "scenarios": llm_response,
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
                "User agent started".to_string(),
                "Simulating end-user perspectives".to_string(),
                "User agent complete".to_string(),
            ]),
        })
    }
}
