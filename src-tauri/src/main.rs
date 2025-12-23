#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use std::collections::HashMap;
use std::fs::{create_dir_all, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_thought, post_to_endpoint])
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
async fn save_thought(thought: String, path: String, mode: String, daily_path: Option<String>) -> Result<String, String> {
    // Check if the path is empty
    if path.is_empty() {
        return Err("Error: Path cannot be empty".to_string());
    }

    let now = Local::now();
    let date = now.format("%Y-%m-%d").to_string();
    let timestamp = now.format("%y%m%d%H%M").to_string();

    let mut path_buf = PathBuf::from(&path);

    match mode.as_str() {
        "daily" => path_buf.push(format!("{}.md", date)),
        "standalone" => path_buf.push(format!("{}.md", timestamp)),
        _ => return Err("Error: Invalid save mode".to_string()),
    };

    if let Some(parent) = path_buf.parent() {
        create_dir_all(parent).expect("Failed to create directories");
    }

    let mut content = if path_buf.exists() {
        match std::fs::read_to_string(&path_buf) {
            Ok(c) => c,
            Err(_) => String::new(),
        }
    } else {
        String::new()
    };

    if mode == "daily" {
        if !path_buf.exists() {
            prepend_date_header(&mut content, &date);
        }
        content.push_str(&format!("\n## {}\n{}\n", timestamp, thought));
    } else if mode == "standalone" {
        // Save standalone note
        content.push_str(&format!("# {}\n{}\n", timestamp, thought));

        // Create/update daily note with backlink using the provided daily_path
        let daily_path = if let Some(daily_dir) = daily_path {
            if daily_dir.is_empty() {
                return Err("Error: Daily path is required for standalone notes".to_string());
            }
            let mut daily_buf = PathBuf::from(daily_dir);
            daily_buf.push(format!("{}.md", date));
            daily_buf
        } else {
            return Err("Error: Daily path is required for standalone notes".to_string());
        };
        let mut daily_content = if daily_path.exists() {
            match std::fs::read_to_string(&daily_path) {
                Ok(c) => c,
                Err(_) => String::new(),
            }
        } else {
            let mut new_content = String::new();
            prepend_date_header(&mut new_content, &date);
            new_content
        };

        // Get first line of thought for link description (up to 10 chars, no special chars)
        let desc = thought
            .lines()
            .next()
            .unwrap_or("")
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace())
            .take(10)
            .collect::<String>();

        daily_content.push_str(&format!("\n## {}\n[[{}|{}]]\n", timestamp, timestamp, desc));

        let mut daily_file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(daily_path)
            .expect("Failed to open daily file");

        if let Err(e) = daily_file.write_all(daily_content.as_bytes()) {
            return Err(format!("Failed to write to daily file: {}", e));
        }
    }

    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&path_buf)
        .expect("Failed to open file");

    if let Err(e) = file.write_all(content.as_bytes()) {
        return Err(format!("Failed to write to file: {}", e));
    }

    Ok("Thought saved successfully".to_string())
}

#[tauri::command]
async fn post_to_endpoint(
    content: String,
    url: String,
    auth_type: String,
    auth_token: Option<String>,
    username: Option<String>,
    password: Option<String>,
    extra_headers: Option<String>,
) -> Result<String, String> {
    // Check if the URL is empty
    if url.is_empty() {
        return Err("Error: URL cannot be empty".to_string());
    }

    // Validate URL format
    let url_parsed = url.parse::<reqwest::Url>()
        .map_err(|e| format!("Error: Invalid URL: {}", e))?;

    // Build JSON body with timestamp and markdown content
    let now = Local::now();
    let timestamp = now.to_rfc3339();

    let mut body = HashMap::new();
    body.insert("timestamp", timestamp);
    body.insert("body", content);

    // Build the request with authentication
    let mut request_builder = reqwest::Client::new()
        .post(url_parsed);

    // Add authentication
    match auth_type.as_str() {
        "bearer" => {
            if let Some(token) = auth_token {
                request_builder = request_builder.bearer_auth(&token);
            } else {
                return Err("Error: Bearer token required for bearer auth".to_string());
            }
        }
        "basic" => {
            if let (Some(user), Some(pass)) = (username, password) {
                request_builder = request_builder.basic_auth(&user, Some(&pass));
            } else {
                return Err("Error: Username and password required for basic auth".to_string());
            }
        }
        "none" | _ => {
            // No authentication
        }
    }

    // Parse and add extra headers
    let mut headers_map = HashMap::new();
    if let Some(headers_str) = extra_headers {
        if !headers_str.trim().is_empty() {
            let headers: Vec<&str> = headers_str.split(',').collect();
            for header_pair in headers {
                let parts: Vec<&str> = header_pair.trim().splitn(2, ':').collect();
                if parts.len() == 2 {
                    headers_map.insert(parts[0].trim().to_string(), parts[1].trim().to_string());
                }
            }
        }
    }

    // Build request with headers
    let mut request = request_builder.json(&body);
    for (key, value) in headers_map {
        request = request.header(&key, &value);
    }

    // Send the request
    let response = request
        .send()
        .await
        .map_err(|e| format!("Error: Failed to send request: {}", e))?;

    // Check response status
    if response.status().is_success() {
        Ok("Thought sent successfully".to_string())
    } else {
        let status = response.status();
        Err(format!("Error: Server returned status {}", status))
    }
}
