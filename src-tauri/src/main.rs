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
fn prepend_date_header(content: &mut String, date: &str) {
    if !content.contains(&format!("# {}", date)) {
        content.insert_str(0, &format!("# {}\n\n", date));
    }
}

#[tauri::command]
async fn save_thought(thought: String, path: String, mode: String) -> Result<String, String> {
    // Check if the path is empty
    if path.is_empty() {
        return Err("Error: Path cannot be empty".to_string());
    }

    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let timestamp = now.format("%y%m%d%H%M").to_string();

    let file_name = match mode.as_str() {
        "daily" => format!("{}/{}.md", path, date),
        "standalone" => format!("{}/{}.md", path, timestamp),
        _ => return Err("Error: Invalid save mode".to_string()),
    };

    let path = PathBuf::from(file_name);

    if let Some(parent) = path.parent() {
        create_dir_all(parent).expect("Failed to create directories");
    }

    let mut content = if path.exists() {
        match std::fs::read_to_string(&path) {
            Ok(c) => c,
            Err(_) => String::new(),
        }
    } else {
        String::new()
    };

    if mode == "daily" {
        if !path.exists() {
            prepend_date_header(&mut content, &date);
        }
        content.push_str(&format!("\n## {}\n{}\n", timestamp, thought));
    } else if mode == "standalone" {
        content.push_str(&format!("# {}\n{}\n", timestamp, thought));
    }

    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(path)
        .expect("Failed to open file");

    if let Err(e) = file.write_all(content.as_bytes()) {
        return Err(format!("Failed to write to file: {}", e));
    }

    Ok("Thought saved successfully".to_string())
}
