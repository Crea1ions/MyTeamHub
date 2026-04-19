use serde::{Deserialize, Serialize};
use crate::vault::MarkdownFile;

/// Request to create a file
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFileRequest {
    pub path: String,
    pub content: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub title: Option<String>,
}

/// Request to update a file
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateFileRequest {
    pub content: String,
}

/// Response after file operation
#[derive(Debug, Serialize, Deserialize)]
pub struct FileResponse {
    pub id: String,
    pub path: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub title: String,
    pub created: String,
    pub updated: String,
    pub content: String,
}

impl FileResponse {
    pub fn from_markdown_file(md_file: &MarkdownFile, path: String) -> Self {
        Self {
            id: md_file.frontmatter.id.clone(),
            path,
            file_type: md_file.frontmatter.file_type.clone(),
            title: md_file.frontmatter.title.clone(),
            created: md_file.frontmatter.created.clone(),
            updated: md_file.frontmatter.updated.clone(),
            content: md_file.content.clone(),
        }
    }
}

/// Raw file response (bypass frontmatter parsing, useful as fallback)
#[derive(Debug, Serialize, Deserialize)]
pub struct RawFileResponse {
    pub path: String,
    pub content: String,
}

/// List files response
#[derive(Debug, Serialize, Deserialize)]
pub struct ListFilesResponse {
    pub files: Vec<String>,
}

/// Search results
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResponse {
    pub query: String,
    pub results: Vec<String>,
}

/// Error response
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub details: Option<String>,
}

impl ErrorResponse {
    pub fn new(error: String) -> Self {
        Self {
            error,
            details: None,
        }
    }

    pub fn with_details(error: String, details: String) -> Self {
        Self {
            error,
            details: Some(details),
        }
    }
}
