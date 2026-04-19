//! Output sanitization module
//!
//! Sanitizes agent output before persistence to prevent issues

use crate::orchestrator::AgentOutput;

/// Sanitization error types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SanitizationError {
    ResultTooLarge(usize),
    ErrorMessageTooLong(usize),
    VaultWritesTooMany(usize),
}

impl std::fmt::Display for SanitizationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SanitizationError::ResultTooLarge(size) => {
                write!(f, "Result JSON too large: {} bytes (max 10MB)", size)
            }
            SanitizationError::ErrorMessageTooLong(size) => {
                write!(f, "Error message too long: {} bytes (max 100KB)", size)
            }
            SanitizationError::VaultWritesTooMany(count) => {
                write!(f, "Too many vault writes: {} (max 100)", count)
            }
        }
    }
}

/// Sanitization result
pub type SanitizationResult = Result<(), SanitizationError>;

/// Output sanitizer for agent results
pub struct OutputSanitizer {
    max_result_size: usize,        // bytes
    max_error_message_size: usize, // bytes
    max_vault_writes: usize,
}

impl OutputSanitizer {
    /// Create new output sanitizer with defaults
    pub fn new() -> Self {
        OutputSanitizer {
            max_result_size: 10 * 1024 * 1024, // 10MB
            max_error_message_size: 100 * 1024, // 100KB
            max_vault_writes: 100,
        }
    }

    /// Create strict sanitizer (smaller limits)
    pub fn strict() -> Self {
        OutputSanitizer {
            max_result_size: 1 * 1024 * 1024, // 1MB
            max_error_message_size: 10 * 1024, // 10KB
            max_vault_writes: 10,
        }
    }

    /// Create permissive sanitizer (larger limits)
    pub fn permissive() -> Self {
        OutputSanitizer {
            max_result_size: 100 * 1024 * 1024, // 100MB
            max_error_message_size: 1 * 1024 * 1024, // 1MB
            max_vault_writes: 1000,
        }
    }

    /// Sanitize agent output
    pub fn sanitize_output(&self, output: &AgentOutput) -> SanitizationResult {
        // Check result size (serialized JSON)
        let result_json = serde_json::to_string(&output.result).unwrap_or_default();
        if result_json.len() > self.max_result_size {
            return Err(SanitizationError::ResultTooLarge(result_json.len()));
        }

        // Check error message size if present
        if let Some(error) = &output.metadata.error_message {
            if error.len() > self.max_error_message_size {
                return Err(SanitizationError::ErrorMessageTooLong(error.len()));
            }
        }

        // Check vault writes count
        if output.vault_writes.len() > self.max_vault_writes {
            return Err(SanitizationError::VaultWritesTooMany(output.vault_writes.len()));
        }

        Ok(())
    }

    /// Check if output is valid
    pub fn is_valid(&self, output: &AgentOutput) -> bool {
        self.sanitize_output(output).is_ok()
    }

    /// Check if result JSON size is valid
    pub fn is_result_size_valid(&self, result: &serde_json::Value) -> bool {
        let json_str = serde_json::to_string(result).unwrap_or_default();
        json_str.len() <= self.max_result_size
    }
}

impl Default for OutputSanitizer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_output(success: bool, error: Option<&str>) -> AgentOutput {
        AgentOutput {
            success,
            result: serde_json::json!({"status": "ok"}),
            metadata: crate::orchestrator::agent::AgentMetadata {
                duration_ms: 100,
                status: if success { "success" } else { "error" }.to_string(),
                error_message: error.map(|s| s.to_string()),
            },
            vault_writes: vec![],
            logs: None,
        }
    }

    #[test]
    fn test_valid_output() {
        let sanitizer = OutputSanitizer::new();
        let output = create_output(true, None);
        assert!(sanitizer.sanitize_output(&output).is_ok());
    }

    #[test]
    fn test_error_message_too_long() {
        let sanitizer = OutputSanitizer::new();
        let large_error = "e".repeat(101 * 1024);
        let output = create_output(false, Some(&large_error));
        assert!(matches!(
            sanitizer.sanitize_output(&output),
            Err(SanitizationError::ErrorMessageTooLong(_))
        ));
    }

    #[test]
    fn test_too_many_vault_writes() {
        let sanitizer = OutputSanitizer::new();
        let mut output = create_output(true, None);
        output.vault_writes = vec![
            crate::orchestrator::agent::VaultWriteRecord {
                path: "test.md".to_string(),
                file_id: "id".to_string(),
                size_bytes: 100,
            };
            101 // 101 writes > max 100
        ];
        assert!(matches!(
            sanitizer.sanitize_output(&output),
            Err(SanitizationError::VaultWritesTooMany(101))
        ));
    }

    #[test]
    fn test_strict_rejects_large() {
        let sanitizer = OutputSanitizer::strict();
        let mut output = create_output(true, None);
        let large_error = "e".repeat(11 * 1024);
        output.metadata.error_message = Some(large_error);
        assert!(matches!(
            sanitizer.sanitize_output(&output),
            Err(SanitizationError::ErrorMessageTooLong(_))
        ));
    }
}
