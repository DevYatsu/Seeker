use jwalk::WalkDir;
use std::path::PathBuf;

#[tauri::command]
pub async fn calculate_dir_size(path: String) -> Result<u64, String> {
    let path_buf = PathBuf::from(path);
    if !path_buf.exists() || !path_buf.is_dir() {
        return Err("Not a valid directory".into());
    }

    // Use multi-threaded walk for speed
    let total_size: u64 = WalkDir::new(&path_buf)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            // Only count files, not directories themselves
            if entry.file_type().is_file() {
                entry.metadata().ok().map(|m| m.len())
            } else {
                None
            }
        })
        .sum();

    Ok(total_size)
}
