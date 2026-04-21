// Tauri main entry point for MyTeamHub Desktop
// Phase 6.1 - Interim Web Desktop with HTTP binding to Orchestrator

#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::path::PathBuf;

fn main() {
  tauri::Builder::default()
    .setup(|_app| {
      // Initialize app data directory
      let myteamhub_dir = PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| ".".to_string()))
        .join(".myteamhub");
      
      std::fs::create_dir_all(&myteamhub_dir)
        .expect("Failed to create ~/.myteamhub");
      
      println!("[Tauri] MyTeamHub dir: {:?}", myteamhub_dir);
      println!("[Tauri] Frontend served at: http://localhost:3002");
      println!("[Tauri] Orchestrator at: http://localhost:8001");
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
