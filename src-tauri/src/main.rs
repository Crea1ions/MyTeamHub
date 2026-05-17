// Tauri main entry point for MyTeamHub Desktop
// Phase 6.1 - Interim Web Desktop with HTTP binding to Orchestrator
// Phase 8 - Auto-spawn backend services

#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use lazy_static::lazy_static;
use std::path::PathBuf;
use std::sync::Mutex;
use std::process::{Command, Child};
use std::thread;

lazy_static! {
  static ref SPAWNED_PROCESSES: Mutex<Vec<Child>> = Mutex::new(Vec::new());
}

/// Check if port is already in use
fn is_port_in_use(port: u16) -> bool {
  std::net::TcpListener::bind(format!("127.0.0.1:{}", port)).is_err()
}

/// Spawn backend services in background thread
fn spawn_services() {
  thread::spawn(|| {
    // Spawn Orchestrator (Rust API on port 8001)
    if !is_port_in_use(8001) {
      let orchestrator_path = "/home/devdipper/dev/APP/001-APP-MyTeamHub/orchestrator/target/release/orchestrator";
      match Command::new(orchestrator_path).spawn() {
        Ok(child) => {
          let pid = child.id();
          SPAWNED_PROCESSES.lock().unwrap().push(child);
          println!("[Tauri] ✓ Orchestrator spawned (PID: {})", pid);
        }
        Err(e) => {
          println!("[Tauri] ✗ Failed to spawn Orchestrator: {}", e);
        }
      }
    } else {
      println!("[Tauri] ℹ Port 8001 already in use, skipping Orchestrator");
    }

    // Spawn Proxy-LLM (Node.js on port 3001)
    if !is_port_in_use(3001) {
      let proxy_path = "/home/devdipper/dev/APP/001-APP-MyTeamHub/proxy-llm/server.js";
      match Command::new("node").arg(proxy_path).spawn() {
        Ok(child) => {
          let pid = child.id();
          SPAWNED_PROCESSES.lock().unwrap().push(child);
          println!("[Tauri] ✓ Proxy-LLM spawned (PID: {})", pid);
        }
        Err(e) => {
          println!("[Tauri] ✗ Failed to spawn Proxy-LLM: {}", e);
        }
      }
    } else {
      println!("[Tauri] ℹ Port 3001 already in use, skipping Proxy-LLM");
    }
  });
}

/// Kill only the processes WE spawned
fn cleanup_spawned_processes() {
  let mut processes = SPAWNED_PROCESSES.lock().unwrap();
  for mut child in processes.drain(..) {
    let pid = child.id();
    match child.kill() {
      Ok(_) => println!("[Tauri] ✓ Killed spawned process (PID: {})", pid),
      Err(e) => println!("[Tauri] ✗ Failed to kill process (PID: {}): {}", pid, e),
    }
  }
}

fn main() {
  tauri::Builder::default()
    .setup(|_app| {
      // Initialize app data directory
      let myteamhub_dir = PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| ".".to_string()))
        .join(".myteamhub");
      
      std::fs::create_dir_all(&myteamhub_dir)
        .expect("Failed to create ~/.myteamhub");
      
      println!("[Tauri] ✓ MyTeamHub dir: {:?}", myteamhub_dir);
      println!("[Tauri] ✓ Frontend served at: http://localhost:3002");
      println!("[Tauri] ✓ Orchestrator will run on: http://localhost:8001");
      println!("[Tauri] ✓ Proxy-LLM will run on: http://localhost:3001");
      
      // Spawn backend services in background (non-blocking)
      spawn_services();
      
      Ok(())
    })
    .on_window_event(|_window, event| {
      // Cleanup spawned processes when app is closed
      if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
        println!("[Tauri] Cleaning up spawned processes...");
        cleanup_spawned_processes();
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
