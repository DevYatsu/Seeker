use serde::Serialize;
use std::fs::File;
use std::io::Read;
use std::path::Path;

#[derive(Serialize)]
pub struct PreviewResult {
    pub content: String,
    pub is_binary: bool,
}

#[tauri::command]
pub fn read_file_preview(path: String, max_bytes: Option<usize>) -> Result<PreviewResult, String> {
    let p = Path::new(&path);
    if !p.exists() || p.is_dir() {
        return Err("Path is not a valid file".into());
    }

    let mut file = File::open(p).map_err(|e| e.to_string())?;
    let max = max_bytes.unwrap_or(8192); // Default to 8KB preview
    let metadata = file.metadata().map_err(|e| e.to_string())?;

    let read_len = if metadata.len() > max as u64 {
        max as u64
    } else {
        metadata.len()
    };

    let mut buffer = vec![0; read_len as usize];
    // Use read instead of read_exact to handle files smaller than expected if metadata was stale
    let bytes_read = file.read(&mut buffer).map_err(|e| e.to_string())?;
    buffer.truncate(bytes_read);

    // Heuristic: Check for null bytes or a very high percentage of control characters
    let is_binary = buffer.iter().any(|&b| b == 0);

    Ok(PreviewResult {
        content: String::from_utf8_lossy(&buffer).into_owned(),
        is_binary,
    })
}

