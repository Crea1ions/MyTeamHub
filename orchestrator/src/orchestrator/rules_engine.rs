use super::state_machine::WorkflowContext;
use serde_json::json;

/// Rule evaluation engine for deterministic condition checking
pub struct RulesEngine {
    rules: Vec<(String, Box<dyn Fn(&WorkflowContext) -> bool>)>,
}

impl RulesEngine {
    pub fn new() -> Self {
        Self {
            rules: Vec::new(),
        }
    }

    /// Evaluate a rule by name against a workflow context
    pub fn evaluate_rule(&self, rule_name: &str, context: &WorkflowContext) -> bool {
        self.rules
            .iter()
            .find(|(name, _)| name == rule_name)
            .map(|(_, predicate)| predicate(context))
            .unwrap_or(false)
    }

    /// Create default rules engine with built-in predicates
    pub fn with_defaults() -> Self {
        let mut engine = Self::new();
        engine.register_builtin_rules();
        engine
    }

    fn register_builtin_rules(&mut self) {
        // Rule: has_project_id
        self.rules.push((
            "has_project_id".to_string(),
            Box::new(|ctx: &WorkflowContext| {
                ctx.event_data.get("project_id").is_some()
                    && !ctx.event_data["project_id"].as_str().unwrap_or("").is_empty()
            }),
        ));

        // Rule: has_content
        self.rules.push((
            "has_content".to_string(),
            Box::new(|ctx: &WorkflowContext| {
                ctx.event_data.get("content").is_some()
                    && !ctx.event_data["content"].as_str().unwrap_or("").is_empty()
            }),
        ));

        // Rule: has_session_id
        self.rules.push((
            "has_session_id".to_string(),
            Box::new(|ctx: &WorkflowContext| {
                ctx.event_data.get("session_id").is_some()
                    && !ctx.event_data["session_id"].as_str().unwrap_or("").is_empty()
            }),
        ));

        // Rule: has_agent_id
        self.rules.push((
            "has_agent_id".to_string(),
            Box::new(|ctx: &WorkflowContext| {
                ctx.event_data.get("agent_id").is_some()
                    && !ctx.event_data["agent_id"].as_str().unwrap_or("").is_empty()
            }),
        ));

        // Rule: has_title
        self.rules.push((
            "has_title".to_string(),
            Box::new(|ctx: &WorkflowContext| {
                ctx.event_data.get("title").is_some()
                    && !ctx.event_data["title"].as_str().unwrap_or("").is_empty()
            }),
        ));

        // Rule: is_valid_json
        self.rules.push((
            "is_valid_json".to_string(),
            Box::new(|_ctx: &WorkflowContext| {
                // event_data is already parsed, so this is always true in our case
                true
            }),
        ));

        // Rule: transition_count_less_than_10
        self.rules.push((
            "transition_count_less_than_10".to_string(),
            Box::new(|ctx: &WorkflowContext| ctx.transition_count < 10),
        ));
    }
}

/// Built-in rule predicates for common scenarios
pub mod rules {
    use super::*;

    pub fn has_project_id(ctx: &WorkflowContext) -> bool {
        ctx.event_data.get("project_id").is_some()
            && !ctx.event_data["project_id"].as_str().unwrap_or("").is_empty()
    }

    pub fn has_content(ctx: &WorkflowContext) -> bool {
        ctx.event_data.get("content").is_some()
            && !ctx.event_data["content"].as_str().unwrap_or("").is_empty()
    }

    pub fn has_session_id(ctx: &WorkflowContext) -> bool {
        ctx.event_data.get("session_id").is_some()
            && !ctx.event_data["session_id"].as_str().unwrap_or("").is_empty()
    }

    pub fn has_agent_id(ctx: &WorkflowContext) -> bool {
        ctx.event_data.get("agent_id").is_some()
            && !ctx.event_data["agent_id"].as_str().unwrap_or("").is_empty()
    }

    pub fn has_title(ctx: &WorkflowContext) -> bool {
        ctx.event_data.get("title").is_some()
            && !ctx.event_data["title"].as_str().unwrap_or("").is_empty()
    }

    pub fn is_valid_event(ctx: &WorkflowContext) -> bool {
        has_project_id(ctx) || has_session_id(ctx) || has_agent_id(ctx)
    }

    pub fn transition_count_ok(ctx: &WorkflowContext) -> bool {
        ctx.transition_count < 100 // Prevent infinite loops
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_has_project_id() {
        let ctx = WorkflowContext::new(
            "test".to_string(),
            json!({"project_id": "proj1"}),
        );
        assert!(rules::has_project_id(&ctx));
    }

    #[test]
    fn test_has_project_id_empty() {
        let ctx = WorkflowContext::new(
            "test".to_string(),
            json!({"project_id": ""}),
        );
        assert!(!rules::has_project_id(&ctx));
    }

    #[test]
    fn test_has_content() {
        let ctx = WorkflowContext::new(
            "test".to_string(),
            json!({"content": "some content"}),
        );
        assert!(rules::has_content(&ctx));
    }

    #[test]
    fn test_rules_engine_creation() {
        let engine = RulesEngine::with_defaults();
        // The engine should have the default rules
        let ctx = WorkflowContext::new(
            "test".to_string(),
            json!({"project_id": "proj1"}),
        );
        assert!(engine.evaluate_rule("has_project_id", &ctx));
    }

    #[test]
    fn test_rules_engine_missing_rule() {
        let engine = RulesEngine::with_defaults();
        let ctx = WorkflowContext::new(
            "test".to_string(),
            json!({"project_id": "proj1"}),
        );
        assert!(!engine.evaluate_rule("nonexistent_rule", &ctx));
    }

    #[test]
    fn test_is_valid_event() {
        let ctx = WorkflowContext::new(
            "test".to_string(),
            json!({"project_id": "proj1", "content": "data"}),
        );
        assert!(rules::is_valid_event(&ctx));
    }
}
