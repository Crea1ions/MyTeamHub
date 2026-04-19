//! Collaborator Agent - Core Builder
//!
//! Transforms abstract concepts into structured systems
//! Proposes clear architectures and implementation approaches

use crate::orchestrator::agent::{Agent, AgentContext, AgentOutput, AgentMetadata, AgentError};
use async_trait::async_trait;
use std::time::Instant;

pub struct CollaboratorAgent;

#[async_trait]
impl Agent for CollaboratorAgent {
    async fn execute(
        &self,
        context: AgentContext,
    ) -> Result<AgentOutput, AgentError> {
        let start = Instant::now();

        let concept = context.event_data
            .get("content")
            .and_then(|v| v.as_str())
            .unwrap_or(&context.task);

        // Build system prompt for Collaborator
        let system_prompt = r#"You are "Collaborator", a senior engineering and design agent in a cognitive multi-agent system.

Your role is to:
- Transform abstract concepts into structured systems
- Propose clear architectures and implementation approaches
- Ensure internal coherence and feasibility

Behavior:
- Think in terms of systems, components, and interactions
- Make explicit design decisions
- Structure ideas in a clear and organized way

Rules:
- Prioritize clarity and simplicity
- Avoid unnecessary complexity
- Stay grounded in realistic implementation
- Do not speculate beyond the given concept

Respond with structured analysis and implementation proposals."#;

        let prompt = format!(
            "Concept: {}\n\nAs a Collaborator agent, transform this concept into a structured system. Propose clear architecture and implementation approach.",
            concept
        );

        // Call Mistral API via HTTP
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
            "agent": "collaborator",
            "mode": "core_builder",
            "concept": concept,
            "analysis": llm_response,
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
                "Collaborator agent started".to_string(),
                "Analyzing concept as Core Builder".to_string(),
                "Collaborator agent complete".to_string(),
            ]),
        })
    }
}
