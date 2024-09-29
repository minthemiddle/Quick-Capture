use std::fs;
use std::path::Path;
use tauri::api::path::local_data_dir;
use super::{save_thought, prepend_date_header};

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_dir() -> String {
        let test_dir = local_data_dir().unwrap().join("test_quick_capture");
        if !test_dir.exists() {
            fs::create_dir_all(&test_dir).unwrap();
        }
        test_dir.to_str().unwrap().to_string()
    }

    fn cleanup_test_dir(test_dir: &str) {
        if Path::new(test_dir).exists() {
            fs::remove_dir_all(test_dir).unwrap();
        }
    }

    #[test]
    fn test_save_thought_daily_mode() {
        let test_dir = setup_test_dir();
        let path = format!("{}/daily", test_dir);
        let thought = "Test thought for daily mode".to_string();
        let mode = "daily".to_string();

        let result = save_thought(thought.clone(), path.clone(), mode.clone()).await;
        assert!(result.is_ok());

        let file_content = fs::read_to_string(format!("{}/2024-09-29.md", path)).unwrap();
        assert!(file_content.contains(&format!("## 2409291200\n{}", thought)));

        cleanup_test_dir(&test_dir);
    }

    #[test]
    fn test_save_thought_standalone_mode() {
        let test_dir = setup_test_dir();
        let path = format!("{}/standalone", test_dir);
        let thought = "Test thought for standalone mode".to_string();
        let mode = "standalone".to_string();

        let result = save_thought(thought.clone(), path.clone(), mode.clone()).await;
        assert!(result.is_ok());

        let file_content = fs::read_to_string(format!("{}/2409291200.md", path)).unwrap();
        assert!(file_content.contains(&format!("# 2409291200\n{}", thought)));

        cleanup_test_dir(&test_dir);
    }
}
