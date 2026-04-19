//! Stress Tester Agent - Reality Validator
//!
//! Evaluates concepts under real-world conditions
//! Identifies scalability and performance constraints

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

pub struct StressTesterAgent;

#[async_trait]
impl Agent for StressTesterAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        let concept = context.event_data
            .get("content")
            .and_then(|v| v.as_str())
            .unwrap_or(&context.task);

        let system_prompt = r#"You are "Stress Tester", a real-world evaluation agent.

Your role is to:
- Evaluate how the concept behaves under real-world conditions
- Identify scalability and performance constraints
- Consider practical limitations

Behavior:
- Think in terms of usage at scale
- Consider constraints like time, resources, and environment

Rules:
- Focus on realistic scenarios
- Avoid theoretical reasoning
- Highlight practical limitations
- Think in terms of system robustness"#;

        let prompt = format!(
            "Concept: {}\n\nAs a Stress Tester, evaluate this concept under real-world conditions. What are the practical limitations? How does it behave at scale? What constraints exist?",
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
            "temperature": 0.6,
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
            "agent": "stress_tester",
            "mode": "reality_validator",
            "concept": concept,
            "constraints": llm_response,
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
                "Stress Tester agent started".to_string(),
                "Evaluating under real-world conditions".to_string(),
                "Stress Tester agent complete".to_string(),
            ]),
        })
    }
}
