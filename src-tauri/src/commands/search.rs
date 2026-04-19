use serde::Serialize;
use std::path::Path;
use std::time::UNIX_EPOCH;
use ignore::WalkBuilder;

#[derive(Serialize, Debug)]
pub struct SearchResult {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub updated_at: u64,
}

use std::sync::{Arc, Mutex};

#[tauri::command]
pub fn search_files(root_path: String, query: String) -> Vec<SearchResult> {
    if query.len() < 2 {
        return Vec::new();
    }

    let results = Arc::new(Mutex::new(Vec::new()));
    let query_lower = query.to_lowercase();
    let root_path_clone = root_path.clone();
    let is_trash = root_path.contains(".Trash");
    
    // Parallel walking with ignore crate
    let mut builder = WalkBuilder::new(&root_path);
    builder.threads(num_cpus::get());

    if is_trash {
        builder.hidden(false).git_ignore(false);
    } else {
        builder.hidden(true).git_ignore(true);
    }

    let walker = builder.build_parallel();

    walker.run(|| {
        let results = Arc::clone(&results);
        let query_lower = query_lower.clone();
        let root_path = root_path_clone.clone();

        Box::new(move |result| {
            if let Ok(entry) = result {
                // Skip root directory
                if entry.path() == Path::new(&root_path) {
                    return ignore::WalkState::Continue;
                }

                let file_name = entry.file_name().to_string_lossy();
                if file_name.to_lowercase().contains(&query_lower) {
                    let path = entry.path();
                    let metadata = path.metadata().ok();
                    
                    let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
                    let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                    let updated_at = metadata.as_ref()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    let mut results = results.lock().unwrap();
                    if results.len() >= 1000 {
                        return ignore::WalkState::Quit;
                    }

                    results.push(SearchResult {
                        name: file_name.into(),
                        path: path.to_string_lossy().into(),
                        is_dir,
                        size,
                        updated_at,
                    });
                }
            }
            ignore::WalkState::Continue
        })
    });

    let mut final_results = Arc::try_unwrap(results).unwrap().into_inner().unwrap();
    
    // Sort results: Folders at top, then by name length (shorter names often more relevant)
    final_results.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.len().cmp(&b.name.len())
                .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        }
    });

    final_results
}
