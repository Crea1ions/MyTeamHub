//! Configuration module for Phase 3.5 LLM integration
//!
//! Loads API keys and configuration from environment

use std::env;

/// Load Mistral API key from environment
/// 
/// Looks for MISTRAL_API_KEY in .env file or environment variables
pub fn load_mistral_api_key() -> Result<String, String> {
    dotenv::dotenv().ok();
    env::var("MISTRAL_API_KEY")
        .map_err(|_| "MISTRAL_API_KEY environment variable not set. Please set it in .env or environment.".to_string())
}

/// Get Mistral API endpoint
pub fn mistral_api_endpoint() -> &'static str {
    "https://api.mistral.ai/v1/chat/completions"
}

/// Mistral model to use
pub fn mistral_model() -> &'static str {
    "mistral-small"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_endpoints() {
        assert!(!mistral_api_endpoint().is_empty());
        assert!(!mistral_model().is_empty());
    }
}
