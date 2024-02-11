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
fn save_thought(thought: String) -> Result<String, String> {
    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let timestamp = now.format("%y%m%d%H%M").to_string();
    let file_name = format!("/Users/martinbetz/Notes/Daily/{}.md", date);
    let path = PathBuf::from(file_name);

    if let Some(parent) = path.parent() {
        create_dir_all(parent).expect("Failed to create directories");
    }

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .expect("Failed to open file");

    if let Err(e) = writeln!(file, "\n**{}**\n{}\n", timestamp, thought) {
        return Err(format!("Failed to write to file: {}", e));
    }

    Ok("Thought saved successfully".to_string())
}
