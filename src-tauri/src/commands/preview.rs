use std::fs::File;
use std::io::Read;
use std::path::Path;

#[tauri::command]
pub fn read_file_preview(path: String, max_bytes: Option<usize>) -> Result<String, String> {
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
    file.read_exact(&mut buffer).map_err(|e| e.to_string())?;

    // Attempt to parse as UTF-8 lossy
    Ok(String::from_utf8_lossy(&buffer).into_owned())
}
