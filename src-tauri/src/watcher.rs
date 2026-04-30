use notify_debouncer_mini::{new_debouncer, notify::*, DebounceEventResult, Debouncer};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

pub struct WatcherState {
    pub debouncer: Mutex<Option<Debouncer<RecommendedWatcher>>>,
    pub current_path: Mutex<Option<PathBuf>>,
}

impl WatcherState {
    pub fn new() -> Self {
        Self {
            debouncer: Mutex::new(None),
            current_path: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub fn watch_directory(
    path: String,
    app_handle: AppHandle,
    state: State<'_, WatcherState>,
    cache: State<'_, crate::commands::fs::DirectoryCache>,
) -> std::result::Result<(), String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() || !path_buf.is_dir() {
        return Err("Path is not a valid directory".into());
    }

    let mut current_path = state.current_path.lock().unwrap();
    if let Some(ref current) = *current_path {
        if current == &path_buf {
            // Already watching this directory
            return Ok(());
        }
    }
    *current_path = Some(path_buf.clone());

    let mut debouncer_guard = state.debouncer.lock().unwrap();

    // Setup new debouncer
    let app_handle_clone = app_handle.clone();
    let cache_clone = cache.inner().clone();
    let mut debouncer = new_debouncer(
        Duration::from_millis(200),
        move |res: DebounceEventResult| {
            match res {
                Ok(_) => {
                    cache_clone.invalidate();
                    let _ = app_handle_clone.emit("directory-changed", ());
                }
                Err(e) => println!("Watch error: {:?}", e),
            }
        },
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(&path_buf, RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    *debouncer_guard = Some(debouncer);

    Ok(())
}

#[tauri::command]
pub fn unwatch_directory(state: State<'_, WatcherState>) -> std::result::Result<(), String> {
    let mut debouncer_guard = state.debouncer.lock().unwrap();
    *debouncer_guard = None; // Dropping the debouncer stops the watcher

    let mut current_path = state.current_path.lock().unwrap();
    *current_path = None;

    Ok(())
}
