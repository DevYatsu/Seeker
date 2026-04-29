// src-tauri/src/commands/window.rs
use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn open_new_window(app: AppHandle, path: String) -> Result<(), String> {
    let label = format!("seeker-{}", uuid::Uuid::new_v4());
    let url = format!("/?path={}", urlencoding::encode(&path));
    
    WebviewWindowBuilder::new(&app, label, WebviewUrl::App(url.into()))
        .title("Seeker")
        .inner_size(1000.0, 700.0)
        .min_inner_size(800.0, 600.0)
        .build()
        .map_err(|e| e.to_string())?;
        
    Ok(())
}
