use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Generic event from Team-Studio
#[derive(Debug, Serialize, Deserialize)]
pub struct Event {
    pub event_type: String,
    pub timestamp: String,
    pub data: Value,
}

/// Event response
#[derive(Debug, Serialize, Deserialize)]
pub struct EventResponse {
    pub success: bool,
    pub file_id: Option<String>,
    pub message: String,
}
