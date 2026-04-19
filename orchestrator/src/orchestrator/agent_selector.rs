//! Agent selection logic for Phase 2.3
//! Non-linear agent switching based on event context
//! 
//! Supports dynamic agent selection without pipeline constraints

use serde_json::Value;
use crate::orchestrator::AgentError;

/// Selection rule for non-linear agent routing
#[derive(Debug, Clone)]
pub struct SelectionRule {
    pub name: String,
    pub condition: String, // Simple string matching on event_data
    pub agent_id: String,
    pub priority: u32, // Higher priority = checked first
}

/// Agent selector for non-linear switching
pub struct AgentSelector {
    rules: Vec<SelectionRule>,
}

impl AgentSelector {
    /// Create new agent selector
    pub fn new() -> Self {
        let mut selector = Self {
            rules: Vec::new(),
        };
        
        // Add default rules
        selector.add_default_rules();
        selector
    }

    /// Add a selection rule
    pub fn add_rule(&mut self, rule: SelectionRule) {
        self.rules.push(rule);
        // Sort by priority (highest first)
        self.rules.sort_by(|a, b| b.priority.cmp(&a.priority));
    }

    /// Select agent based on event context
    pub fn select_agent(&self, event_data: &Value) -> Result<String, AgentError> {
        // Try each rule in priority order
        for rule in &self.rules {
            if self.matches_condition(event_data, &rule.condition) {
                return Ok(rule.agent_id.clone());
            }
        }

        // Default fallback
        Ok("echo".to_string())
    }

    /// Check if event matches condition
    fn matches_condition(&self, event_data: &Value, condition: &str) -> bool {
        if condition.is_empty() {
            return true;
        }

        // Simple pattern matching: "field:value"
        if let Some((field, value)) = condition.split_once(':') {
            if let Some(field_value) = event_data.get(field) {
                if let Some(s) = field_value.as_str() {
                    return s.contains(value);
                }
            }
        }

        false
    }

    /// Add default rules for common workflows
    fn add_default_rules(&mut self) {
        // Rule 1: If content is present, use analyzer
        self.add_rule(SelectionRule {
            name: "analyze_content".to_string(),
            condition: "content:".to_string(),
            agent_id: "analyzer".to_string(),
            priority: 100,
        });

        // Rule 2: If project_id is present, use indexer
        self.add_rule(SelectionRule {
            name: "index_project".to_string(),
            condition: "project_id:".to_string(),
            agent_id: "indexer".to_string(),
            priority: 90,
        });

        // Rule 3: If task is echo, use echo agent
        self.add_rule(SelectionRule {
            name: "echo_task".to_string(),
            condition: "task:echo".to_string(),
            agent_id: "echo".to_string(),
            priority: 80,
        });
    }

    /// List all available rules
    pub fn list_rules(&self) -> Vec<String> {
        self.rules
            .iter()
            .map(|r| format!("{} (priority: {})", r.name, r.priority))
            .collect()
    }

    /// Get active rules count
    pub fn rule_count(&self) -> usize {
        self.rules.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_selector_creation() {
        let selector = AgentSelector::new();
        assert!(selector.rule_count() > 0);
    }

    #[test]
    fn test_select_analyzer_on_content() {
        let selector = AgentSelector::new();
        let event_data = json!({
            "content": "This is test content"
        });

        let result = selector.select_agent(&event_data);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "analyzer");
    }

    #[test]
    fn test_select_indexer_on_project() {
        let selector = AgentSelector::new();
        let event_data = json!({
            "project_id": "proj_123"
        });

        let result = selector.select_agent(&event_data);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "indexer");
    }

    #[test]
    fn test_select_echo_on_task() {
        let selector = AgentSelector::new();
        let event_data = json!({
            "task": "echo"
        });

        let result = selector.select_agent(&event_data);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "echo");
    }

    #[test]
    fn test_fallback_to_echo() {
        let selector = AgentSelector::new();
        let event_data = json!({
            "unknown": "data"
        });

        let result = selector.select_agent(&event_data);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "echo");
    }

    #[test]
    fn test_priority_ordering() {
        let mut selector = AgentSelector::new();
        
        // Add a high priority rule
        selector.add_rule(SelectionRule {
            name: "high_priority".to_string(),
            condition: "content:".to_string(),
            agent_id: "special_agent".to_string(),
            priority: 1000,
        });

        let event_data = json!({
            "content": "test"
        });

        let result = selector.select_agent(&event_data);
        assert!(result.is_ok());
        // Should match high priority rule first
        assert_eq!(result.unwrap(), "special_agent");
    }

    #[test]
    fn test_list_rules() {
        let selector = AgentSelector::new();
        let rules = selector.list_rules();
        assert!(rules.len() >= 3); // At least default rules
    }

    #[test]
    fn test_custom_rule_addition() {
        let mut selector = AgentSelector::new();
        let initial_count = selector.rule_count();

        selector.add_rule(SelectionRule {
            name: "custom".to_string(),
            condition: "custom_field:value".to_string(),
            agent_id: "custom_agent".to_string(),
            priority: 50,
        });

        assert_eq!(selector.rule_count(), initial_count + 1);
    }
}
