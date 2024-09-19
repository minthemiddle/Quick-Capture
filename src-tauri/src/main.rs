#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use std::fs::{create_dir_all, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_thought])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn save_thought(thought: String, path: String, mode: String) -> Result<String, String> {
    // Check if the path is empty
    if path.is_empty() {
        return Err("Error: Path cannot be empty".to_string());
    }

    let now = Local::now();
    let timestamp = now.format("%y%m%d%H%M").to_string();

    let file_name = match mode.as_str() {
        "daily" => format!("{}/{}.md", path, now.format("%Y-%m-%d").to_string()),
        "standalone" => format!("{}/{}.md", path, timestamp),
        _ => return Err("Error: Invalid save mode".to_string()),
    };

    let path = PathBuf::from(file_name);

    if let Some(parent) = path.parent() {
        create_dir_all(parent).expect("Failed to create directories");
    }

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .expect("Failed to open file");

    let heading_level = if mode == "standalone" { "#" } else { "##" };
    if let Err(e) = writeln!(file, "\n{} {}\n{}\n", heading_level, timestamp, thought) {
        return Err(format!("Failed to write to file: {}", e));
    }

    Ok("Thought saved successfully".to_string())
}
