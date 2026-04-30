use ignore::WalkBuilder;
use rayon::prelude::*;
use serde::Serialize;
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[derive(Clone)]
pub struct DirectoryCache {
    pub current_path: Arc<Mutex<String>>,
    pub entries: Arc<Mutex<Vec<FileEntry>>>,
}

impl DirectoryCache {
    pub fn new() -> Self {
        Self {
            current_path: Arc::new(Mutex::new(String::new())),
            entries: Arc::new(Mutex::new(Vec::new())),
        }
    }
    pub fn invalidate(&self) {
        if let Ok(mut path) = self.current_path.lock() {
            *path = String::new();
        }
    }
}

#[derive(Serialize, Debug, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub updated_at: Option<u64>,
}

impl FileEntry {
    fn from_path(path: &Path) -> Option<Self> {
        let name = path.file_name()?.to_string_lossy().into();
        let metadata = path.metadata().ok();
        
        let (is_dir, size, updated_at) = if let Some(m) = metadata {
            (
                m.is_dir(),
                Some(m.len()),
                m.modified().ok()
                    .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
            )
        } else {
            (path.is_dir(), None, None)
        };

        Some(FileEntry {
            name,
            path: path.to_string_lossy().into(),
            is_dir,
            size,
            updated_at,
        })
    }

    fn fast_from_path(entry: &std::fs::DirEntry) -> Option<Self> {
        let path = entry.path();
        let name = path.file_name()?.to_string_lossy().into();
        let is_dir = entry.file_type().ok()?.is_dir();

        Some(FileEntry {
            name,
            path: path.to_string_lossy().into(),
            is_dir,
            size: None,
            updated_at: None,
        })
    }
}


// --- Security & Validation ---

fn validate_path(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("Path does not exist".into());
    }

    let resolved = std::fs::canonicalize(p).map_err(|e| e.to_string())?;
    let resolved_str = resolved.to_string_lossy();

    // Ensure we are not accessing sensitive system roots directly
    let forbidden = [
        "/etc", "/var", "/bin", "/sbin", "/usr/bin", "/usr/sbin",
        "/private/etc", "/private/var"
    ];
    for f in forbidden {
        if resolved_str == f || resolved_str.starts_with(&format!("{}/", f)) {
             return Err(format!("Access to {} is restricted", f));
        }
    }

    Ok(())
}

// --- Directory Listing ---

#[derive(serde::Deserialize)]
pub struct ListOptions {
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub offset: Option<usize>,
    pub limit: Option<usize>,
    pub search: Option<String>,
    pub show_hidden: Option<bool>,
    pub known_paths: Option<Vec<String>>,
}

#[derive(serde::Serialize)]
pub struct ListResult {
    pub paths: Vec<String>,
    pub new_entries: Vec<FileEntry>,
    pub total_count: usize,
}

#[tauri::command]
pub fn list_directory(
    path: String, 
    options: ListOptions,
    cache: tauri::State<'_, DirectoryCache>
) -> Result<ListResult, String> {
    validate_path(&path)?;
    
    // For now, Trash still returns everything as new entries
    if path.contains(".Trash") {
        let entries = list_trash(&path)?;
        let count = entries.len();
        let paths = entries.iter().map(|e| e.path.clone()).collect();
        return Ok(ListResult {
            paths,
            new_entries: entries,
            total_count: count,
        });
    }

    let hide_hidden = !options.show_hidden.unwrap_or(false);
    
    let needs_refresh = {
        let current = cache.current_path.lock().unwrap();
        *current != path
    };

    if needs_refresh {
        let entries_res: Result<Vec<_>, _> = std::fs::read_dir(&path)
            .map_err(|e| e.to_string())?
            .collect();
        
        let all_entries = entries_res.map_err(|e| e.to_string())?;
        
        let files: Vec<FileEntry> = all_entries
            .into_par_iter()
            .filter_map(|entry| FileEntry::fast_from_path(&entry))
            .collect();

        let mut entries_guard = cache.entries.lock().unwrap();
        *entries_guard = files;

        let mut path_guard = cache.current_path.lock().unwrap();
        *path_guard = path.clone();
    }

    let entries_guard = cache.entries.lock().unwrap();
    let mut files: Vec<FileEntry> = entries_guard
        .iter()
        .filter(|f| {
            if hide_hidden && f.name.starts_with('.') {
                return false;
            }
            if let Some(ref search) = options.search {
                if !f.name.to_lowercase().contains(&search.to_lowercase()) {
                    return false;
                }
            }
            true
        })
        .cloned()
        .collect();

    let total_count = files.len();

    // Sort
    let sort_by = options.sort_by.unwrap_or_else(|| "name".into());
    let sort_order = options.sort_order.unwrap_or_else(|| "asc".into());
    
    files.par_sort_unstable_by(|a, b| {
        let comparison = match sort_by.as_str() {
            "name" => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            "size" => a.size.unwrap_or(0).cmp(&b.size.unwrap_or(0)),
            "date" => a.updated_at.unwrap_or(0).cmp(&b.updated_at.unwrap_or(0)),
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        };
        
        if sort_order == "desc" {
            comparison.reverse()
        } else {
            comparison
        }
    });

    // Folders always first (optional, but standard for explorers)
    files.sort_by_key(|f| !f.is_dir);

    // Paginate
    let offset = options.offset.unwrap_or(0);
    let limit = options.limit.unwrap_or(total_count);
    
    let end = (offset + limit).min(total_count);
    if offset >= total_count {
        return Ok(ListResult {
            paths: vec![],
            new_entries: vec![],
            total_count,
        });
    }

    let paged_files = &files[offset..end];
    
    let mut paths = Vec::with_capacity(paged_files.len());
    let mut new_entries = Vec::new();
    
    let known_paths = options.known_paths.unwrap_or_default();
    use std::collections::HashSet;
    let known_set: HashSet<&String> = known_paths.iter().collect();

    for file in paged_files {
        paths.push(file.path.clone());
        if !known_set.contains(&file.path) {
            new_entries.push(file.clone());
        }
    }
    
    Ok(ListResult {
        paths,
        new_entries,
        total_count,
    })
}

#[tauri::command]
pub fn get_items_metadata(paths: Vec<String>) -> Result<Vec<FileEntry>, String> {
    Ok(paths
        .into_par_iter()
        .filter_map(|p| FileEntry::from_path(Path::new(&p)))
        .collect())
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
    // Advanced Optimization: Use parallel unstable sort by key
    // Unstable sort is faster and doesn't allocate extra memory for order preservation
    files.par_sort_unstable_by_key(|f| {
        (
            !f.is_dir,
            f.name.to_lowercase()
        )
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
    validate_path(&parent_path)?;
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        return Err("Invalid characters in directory name".into());
    }
    let path = Path::new(&parent_path).join(name);
    std::fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_file(parent_path: String, name: String) -> Result<(), String> {
    validate_path(&parent_path)?;
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        return Err("Invalid characters in file name".into());
    }
    let path = Path::new(&parent_path).join(name);
    std::fs::File::create(path)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    validate_path(&path)?;
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file_content(path: String, content: String) -> Result<(), String> {
    validate_path(&path)?;
    std::fs::write(path, content).map_err(|e| e.to_string())
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
    validate_path(&target_dir)?;
    
    sources.into_par_iter().try_for_each(|source| {
        validate_path(&source)?;
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
    
    let entries: Vec<_> = std::fs::read_dir(source)
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    entries.into_par_iter().try_for_each(|entry| {
        let path = entry.path();
        let target_path = target.join(entry.file_name());
        if path.is_dir() {
            copy_dir_recursive(&path, &target_path)
        } else {
            std::fs::copy(&path, &target_path)
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
    })
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
                .is_ok()
            {
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
#[tauri::command]
pub fn compress_items(sources: Vec<String>, output_path: String) -> Result<(), String> {
    let path = Path::new(&output_path);
    let file = File::create(path).map_err(|e| {
        println!("Error creating file {}: {}", output_path, e);
        e.to_string()
    })?;
    
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    for source in sources {
        let source_path = Path::new(&source);
        let base_name = source_path
            .file_name()
            .ok_or_else(|| {
                println!("Invalid source name for {}", source);
                "Invalid source name".to_string()
            })?
            .to_string_lossy();

        if source_path.is_dir() {
            let walk = WalkDir::new(source_path);
            for entry in walk {
                let entry = entry.map_err(|e| {
                    println!("Walkdir error: {}", e);
                    e.to_string()
                })?;
                let path = entry.path();
                let name = path
                    .strip_prefix(source_path.parent().unwrap())
                    .map_err(|e| {
                        println!("Strip prefix error: {}", e);
                        e.to_string()
                    })?;

                // Zip files must use '/' as directory separator
                let zip_name = name.to_string_lossy().replace("\\", "/");

                if path.is_file() {
                    zip.start_file(zip_name, options)
                        .map_err(|e| {
                            println!("Zip start_file error: {}", e);
                            e.to_string()
                        })?;
                    let mut f = File::open(path).map_err(|e| {
                        println!("File open error: {}", e);
                        e.to_string()
                    })?;
                    let mut buffer = Vec::new();
                    f.read_to_end(&mut buffer).map_err(|e| {
                        println!("File read error: {}", e);
                        e.to_string()
                    })?;
                    zip.write_all(&buffer).map_err(|e| {
                        println!("Zip write error: {}", e);
                        e.to_string()
                    })?;
                } else if !name.as_os_str().is_empty() {
                    zip.add_directory(zip_name, options)
                        .map_err(|e| {
                            println!("Zip add_directory error: {}", e);
                            e.to_string()
                        })?;
                }
            }
        } else {
            zip.start_file(base_name.to_string(), options)
                .map_err(|e| {
                    println!("Zip start_file error for file: {}", e);
                    e.to_string()
                })?;
            let mut f = File::open(source_path).map_err(|e| {
                println!("File open error: {}", e);
                e.to_string()
            })?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer).map_err(|e| {
                println!("File read error: {}", e);
                e.to_string()
            })?;
            zip.write_all(&buffer).map_err(|e| {
                println!("Zip write error: {}", e);
                e.to_string()
            })?;
        }
    }

    zip.finish().map_err(|e| {
        println!("Zip finish error: {}", e);
        e.to_string()
    })?;
    Ok(())
}

#[tauri::command]
pub fn extract_archive(path: String, target_dir: String) -> Result<(), String> {
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    let target_path = Path::new(&target_dir);

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => target_path.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }

        // Set permissions on Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                std::fs::set_permissions(&outpath, std::fs::Permissions::from_mode(mode))
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_app_icon(app_path: String) -> Result<String, String> {
    let resources_path = Path::new(&app_path).join("Contents").join("Resources");
    if !resources_path.exists() {
        return Err("No Resources folder".into());
    }

    let mut icns_files = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&resources_path) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("icns") {
                icns_files.push(path);
            }
        }
    }

    if icns_files.is_empty() {
        return Err("No icns found".into());
    }

    icns_files.sort_by(|a, b| {
        let a_name = a.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
        let b_name = b.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
        let a_score = if a_name.contains("appicon") { 2 } else if a_name.contains("icon") { 1 } else { 0 };
        let b_score = if b_name.contains("appicon") { 2 } else if b_name.contains("icon") { 1 } else { 0 };
        b_score.cmp(&a_score)
    });

    let icns_path = &icns_files[0];

    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    app_path.hash(&mut hasher);
    let hash = hasher.finish();

    let cache_dir = std::env::temp_dir().join("seeker_icons");
    if !cache_dir.exists() {
        let _ = std::fs::create_dir_all(&cache_dir);
    }

    let png_path = cache_dir.join(format!("{}.png", hash));

    if !png_path.exists() {
        let status = std::process::Command::new("sips")
            .arg("-s")
            .arg("format")
            .arg("png")
            .arg("-z")
            .arg("256")
            .arg("256")
            .arg(icns_path)
            .arg("--out")
            .arg(&png_path)
            .output()
            .map_err(|e| e.to_string())?;

        if !status.status.success() {
            // fallback if sips fails for some reason
            return Ok(icns_path.to_string_lossy().into_owned());
        }
    }

    Ok(png_path.to_string_lossy().into_owned())
}
