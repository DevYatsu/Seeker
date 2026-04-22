use ignore::WalkBuilder;
use rayon::prelude::*;
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;

#[derive(Serialize, Debug)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub updated_at: u64,
}

impl FileEntry {
    fn from_path(path: &Path) -> Option<Self> {
        let name = path.file_name()?.to_string_lossy().into();
        let metadata = path.metadata().ok();

        let is_dir = path.is_dir();
        let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
        let updated_at = metadata
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        Some(FileEntry {
            name,
            path: path.to_string_lossy().into(),
            is_dir,
            size,
            updated_at,
        })
    }
}

// --- Security & Validation ---

fn validate_path(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("Path does not exist".into());
    }
    // Add additional scope checks here if needed
    Ok(())
}

// --- Directory Listing ---

#[tauri::command]
pub fn list_directory(path: String, show_hidden: Option<bool>) -> Result<Vec<FileEntry>, String> {
    validate_path(&path)?;
    if path.contains(".Trash") {
        return list_trash(&path);
    }

    let hide_hidden = !show_hidden.unwrap_or(false);
    let files = Arc::new(Mutex::new(Vec::new()));

    WalkBuilder::new(&path)
        .max_depth(Some(1))
        .hidden(hide_hidden)
        .git_ignore(true)
        .threads(num_cpus::get())
        .build_parallel()
        .run(|| {
            let files = Arc::clone(&files);
            Box::new(move |result| {
                if let Ok(entry) = result {
                    if entry.depth() > 0 {
                        if let Some(file) = FileEntry::from_path(entry.path()) {
                            let mut files = files.lock().unwrap();
                            files.push(file);
                        }
                    }
                }
                ignore::WalkState::Continue
            })
        });

    let mut result = Arc::try_unwrap(files).unwrap().into_inner().unwrap();
    sort_files(&mut result);
    Ok(result)
}

fn list_trash(_path: &str) -> Result<Vec<FileEntry>, String> {
    #[cfg(target_os = "macos")]
    {
        // On macOS, reading ~/.Trash directly requires Full Disk Access.
        // We can bypass this by asking Finder (which already has access) via AppleScript.
        let script = r#"
        tell application "Finder"
            set trashItems to every item of trash
            set outStr to ""
            repeat with i in trashItems
                set outStr to outStr & POSIX path of (i as alias) & "\n"
            end repeat
            return outStr
        end tell
        "#;

        let output = std::process::Command::new("osascript")
            .arg("-e")
            .arg(script)
            .output()
            .map_err(|e| e.to_string())?;

        let out_str = String::from_utf8_lossy(&output.stdout);
        let mut files: Vec<FileEntry> = out_str
            .lines()
            .filter(|l| !l.trim().is_empty())
            .filter_map(|p| FileEntry::from_path(std::path::Path::new(p)))
            .collect();

        sort_files(&mut files);
        return Ok(files);
    }

    #[cfg(not(target_os = "macos"))]
    {
        let entries: Vec<_> = std::fs::read_dir(_path)
            .map_err(|e| e.to_string())?
            .filter_map(|res| res.ok())
            .collect();

        let mut files: Vec<FileEntry> = entries
            .into_par_iter()
            .filter_map(|entry| FileEntry::from_path(&entry.path()))
            .collect();

        sort_files(&mut files);
        return Ok(files);
    }
}

fn sort_files(files: &mut [FileEntry]) {
    files.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });
}

// --- Core Operations ---

#[tauri::command]
pub fn open_item(path: String) -> Result<(), String> {
    validate_path(&path)?;
    opener::open(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn move_to_trash(paths: Vec<String>) -> Result<(), String> {
    let path_bufs: Vec<PathBuf> = paths.iter().map(PathBuf::from).collect();
    trash::delete_all(path_bufs).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_permanently(paths: Vec<String>) -> Result<(), String> {
    paths
        .into_par_iter()
        .try_for_each(|path| {
            let p = Path::new(&path);
            if p.is_dir() {
                std::fs::remove_dir_all(p)
            } else {
                std::fs::remove_file(p)
            }
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn duplicate_items(paths: Vec<String>) -> Result<(), String> {
    paths.into_par_iter().try_for_each(|path| {
        let source_path = Path::new(&path);
        let parent = source_path.parent().ok_or("Invalid path")?;
        let name_str = source_path
            .file_name()
            .ok_or("Invalid name")?
            .to_string_lossy();

        // Construct new name logic
        let (base, ext) = if source_path.is_file() {
            if let Some(pos) = name_str.rfind('.') {
                (&name_str[..pos], format!(".{}", &name_str[pos + 1..]))
            } else {
                (&name_str[..], "".to_string())
            }
        } else {
            (&name_str[..], "".to_string())
        };

        let mut counter = 1;
        let mut target_path = parent.join(format!("{} copy{}", base, ext));

        while target_path.exists() {
            counter += 1;
            target_path = parent.join(format!("{} copy {}{}", base, counter, ext));
        }

        if source_path.is_dir() {
            copy_dir_recursive(source_path, &target_path)
        } else {
            std::fs::copy(source_path, target_path)
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
    })
}

#[tauri::command]
pub fn rename_item(path: String, new_name: String) -> Result<(), String> {
    let source = Path::new(&path);
    let parent = source.parent().ok_or("Invalid path")?;
    let target = parent.join(new_name);
    std::fs::rename(source, target).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_directory(parent_path: String, name: String) -> Result<(), String> {
    let path = Path::new(&parent_path).join(name);
    std::fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_file(parent_path: String, name: String) -> Result<(), String> {
    let path = Path::new(&parent_path).join(name);
    std::fs::File::create(path)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn copy_items(sources: Vec<String>, target_dir: String) -> Result<(), String> {
    sources.into_par_iter().try_for_each(|source| {
        let source_path = Path::new(&source);
        let name = source_path.file_name().ok_or("Invalid source name")?;
        let target_path = Path::new(&target_dir).join(name);

        if source_path.is_dir() {
            copy_dir_recursive(source_path, &target_path)
        } else {
            std::fs::copy(source_path, target_path)
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
    })
}

#[tauri::command]
pub fn move_items(sources: Vec<String>, target_dir: String) -> Result<(), String> {
    sources.into_par_iter().try_for_each(|source| {
        let source_path = Path::new(&source);
        let name = source_path.file_name().ok_or("Invalid source name")?;
        let target_path = Path::new(&target_dir).join(name);
        
        // Prevent moving a directory into itself or its children
        if target_path.starts_with(source_path) {
            return Err("Cannot move a directory into itself".into());
        }

        std::fs::rename(source_path, target_path).map_err(|e| e.to_string())
    })
}

fn copy_dir_recursive(source: &Path, target: &Path) -> Result<(), String> {
    std::fs::create_dir_all(target).map_err(|e| e.to_string())?;
    for entry in std::fs::read_dir(source).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let target_path = target.join(entry.file_name());
        if path.is_dir() {
            copy_dir_recursive(&path, &target_path)?;
        } else {
            std::fs::copy(&path, &target_path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_in_terminal(path: String) -> Result<(), String> {
    validate_path(&path)?;
    let p = Path::new(&path);
    let dir = if p.is_dir() {
        p
    } else {
        p.parent().unwrap_or(p)
    };

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-a")
            .arg("Terminal")
            .arg(dir)
            .status()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Use common terminal emulators instead of EDITOR for clarity
        let terminals = ["gnome-terminal", "konsole", "xfce4-terminal", "xterm"];
        let mut launched = false;
        
        for term in terminals {
            if Command::new(term)
                .arg("--working-directory")
                .arg(dir)
                .status()
                .is_ok() {
                launched = true;
                break;
            }
        }

        if !launched {
            return Err("Could not find a supported terminal emulator".into());
        }
    }

    Ok(())
}
