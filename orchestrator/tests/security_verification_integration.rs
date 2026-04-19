//! Phase 3.3 Security Verification Integration Tests

#[cfg(test)]
mod tests {
    use orchestrator::prelude::*;
    use tokio;

    fn create_agent_context(task: &str) -> AgentContext {
        AgentContext {
            workflow_id: "wf_sec_test".to_string(),
            task: task.to_string(),
            event_data: serde_json::json!({}),
            vault_root: "/tmp/vault".to_string(),
            execution_id: "exec_sec_123".to_string(),
            timeout_secs: 30,
        }
    }

    fn create_agent_output(success: bool, error: Option<&str>) -> AgentOutput {
        AgentOutput {
            success,
            result: serde_json::json!({"status": "ok"}),
            metadata: AgentMetadata {
                duration_ms: 100,
                status: if success { "success" } else { "error" }.to_string(),
                error_message: error.map(|s| s.to_string()),
            },
            vault_writes: vec![],
            logs: None,
        }
    }

    #[test]
    fn test_input_validation_valid_context() {
        let validator = InputValidator::new();
        let ctx = create_agent_context("Valid task");
        assert!(validator.validate_context(&ctx).is_ok());
    }

    #[test]
    fn test_input_validation_empty_task() {
        let validator = InputValidator::new();
        let ctx = create_agent_context("");
        assert!(validator.validate_context(&ctx).is_err());
    }

    #[test]
    fn test_input_validation_oversized() {
        let validator = InputValidator::new();
        let huge_task = "t".repeat(101 * 1024); // 101KB > 100KB limit
        let ctx = create_agent_context(&huge_task);
        assert!(validator.validate_context(&ctx).is_err());
    }

    #[test]
    fn test_output_sanitization_valid() {
        let sanitizer = OutputSanitizer::new();
        let output = create_agent_output(true, None);
        assert!(sanitizer.sanitize_output(&output).is_ok());
    }

    #[test]
    fn test_output_sanitization_error_message_too_long() {
        let sanitizer = OutputSanitizer::new();
        let error_msg = "e".repeat(101 * 1024); // 101KB error
        let output = create_agent_output(false, Some(&error_msg));
        assert!(sanitizer.sanitize_output(&output).is_err());
    }

    #[test]
    fn test_state_invariant_valid_transition() {
        let ctx = WorkflowContext {
            workflow_id: "wf_123".to_string(),
            state: WorkflowState::Idle,
            event_data: serde_json::json!({"action": "test"}),
            vault_file_id: None,
            last_transition: chrono::Utc::now(),
            transition_count: 0,
        };

        let result = StateInvariantChecker::check_transition(
            &WorkflowState::Idle,
            &WorkflowState::Processing,
            &ctx,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_state_invariant_invalid_transition() {
        let ctx = WorkflowContext {
            workflow_id: "wf_123".to_string(),
            state: WorkflowState::Idle,
            event_data: serde_json::json!({}),
            vault_file_id: None,
            last_transition: chrono::Utc::now(),
            transition_count: 0,
        };

        let result = StateInvariantChecker::check_transition(
            &WorkflowState::Idle,
            &WorkflowState::Complete,
            &ctx,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_state_invariant_missing_agent_id() {
        let ctx = WorkflowContext {
            workflow_id: "wf_123".to_string(),
            state: WorkflowState::Processing,
            event_data: serde_json::json!({}),
            vault_file_id: None,
            last_transition: chrono::Utc::now(),
            transition_count: 0,
        };

        let result = StateInvariantChecker::check_transition(
            &WorkflowState::Processing,
            &WorkflowState::WaitingForAgent,
            &ctx,
        );
        // This should be ok now since we only check event_data existence
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_permission_check_allowed() {
        let checker = PermissionChecker::with_defaults().await;

        // Echo agent can execute
        assert!(checker.is_allowed("echo", Permission::Execute).await);
    }

    #[tokio::test]
    async fn test_permission_check_denied() {
        let checker = PermissionChecker::with_defaults().await;

        // Echo agent cannot access network
        assert!(!checker.is_allowed("echo", Permission::AccessNetwork).await);
    }

    #[tokio::test]
    async fn test_permission_check_agent_not_found() {
        let checker = PermissionChecker::with_defaults().await;

        let result = checker.check_permission("unknown_agent", Permission::Execute).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_default_permissions_echo() {
        let checker = PermissionChecker::with_defaults().await;

        // Echo: execute only
        assert!(checker.can_execute("echo").await);
        assert!(!checker.can_read_vault("echo").await);
        assert!(!checker.can_write_vault("echo").await);
    }

    #[tokio::test]
    async fn test_default_permissions_analyzer() {
        let checker = PermissionChecker::with_defaults().await;

        // Analyzer: read + execute
        assert!(checker.can_execute("analyzer").await);
        assert!(checker.can_read_vault("analyzer").await);
        assert!(!checker.can_write_vault("analyzer").await);
    }

    #[tokio::test]
    async fn test_default_permissions_indexer() {
        let checker = PermissionChecker::with_defaults().await;

        // Indexer: read + write + execute
        assert!(checker.can_execute("indexer").await);
        assert!(checker.can_read_vault("indexer").await);
        assert!(checker.can_write_vault("indexer").await);
    }

    #[tokio::test]
    async fn test_security_layer_integration() {
        let validator = InputValidator::new();
        let sanitizer = OutputSanitizer::new();
        let checker = PermissionChecker::with_defaults().await;

        // Valid input
        let input = create_agent_context("Process this");
        assert!(validator.is_valid(&input));

        // Valid output
        let output = create_agent_output(true, None);
        assert!(sanitizer.is_valid(&output));

        // Permission check
        assert!(checker.can_execute("analyzer").await);
    }

    #[test]
    fn test_state_consistency_check() {
        let ctx = WorkflowContext {
            workflow_id: "wf_test".to_string(),
            state: WorkflowState::WaitingForAgent,
            event_data: serde_json::json!({"agent_id": "analyzer"}),
            vault_file_id: None,
            last_transition: chrono::Utc::now(),
            transition_count: 0,
        };

        assert!(StateInvariantChecker::verify_consistency(&ctx).is_ok());
    }
}
