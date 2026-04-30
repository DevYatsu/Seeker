use ignore::WalkBuilder;
use serde::Serialize;
use std::collections::HashSet;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, UNIX_EPOCH};

/// Maximum depth to recurse when searching
const MAX_SEARCH_DEPTH: usize = 6;
/// Maximum number of results to return
const MAX_RESULTS: usize = 100;
/// Time budget: return whatever we have after this duration
const TIME_BUDGET: Duration = Duration::from_millis(400);

#[derive(Serialize, Debug, Clone)]
pub struct SearchResult {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub updated_at: u64,
}

#[derive(Serialize)]
pub struct SearchDeltaResult {
    pub paths: Vec<String>,
    pub new_entries: Vec<SearchResult>,
}

#[tauri::command]
pub async fn search_files(
    root_path: String, 
    query: String,
    known_paths: Option<Vec<String>>
) -> SearchDeltaResult {
    if query.len() < 2 {
        return SearchDeltaResult {
            paths: Vec::new(),
            new_entries: Vec::new(),
        };
    }

    // Run the blocking walk on a background thread so we don't freeze the UI
    tokio::task::spawn_blocking(move || search_blocking(&root_path, &query, known_paths.unwrap_or_default()))
        .await
        .unwrap()
}

fn search_blocking(root_path: &str, query: &str, known_paths: Vec<String>) -> SearchDeltaResult {
    let results = Arc::new(Mutex::new(Vec::with_capacity(MAX_RESULTS)));
    let seen_paths = Arc::new(Mutex::new(HashSet::with_capacity(MAX_RESULTS)));
    let should_stop = Arc::new(AtomicBool::new(false));
    let query_lower = query.to_lowercase();
    let root_owned = root_path.to_string();
    let is_trash = root_path.contains(".Trash");
    let start = Instant::now();

    let mut builder = WalkBuilder::new(root_path);
    builder
        .max_depth(Some(MAX_SEARCH_DEPTH))
        .threads(num_cpus::get().min(4));

    if is_trash {
        builder.hidden(false).git_ignore(false);
    } else {
        builder.hidden(true).git_ignore(true);
    }

    builder.build_parallel().run(|| {
        let results = Arc::clone(&results);
        let seen_paths = Arc::clone(&seen_paths);
        let should_stop = Arc::clone(&should_stop);
        let query_lower = query_lower.clone();
        let root_path = root_owned.clone();
        let start = start;

        Box::new(move |result| {
            // Time budget check — return partial results rather than hang
            if should_stop.load(Ordering::Relaxed) || start.elapsed() > TIME_BUDGET {
                should_stop.store(true, Ordering::Relaxed);
                return ignore::WalkState::Quit;
            }

            if let Ok(entry) = result {
                if entry.path() == Path::new(&root_path) {
                    return ignore::WalkState::Continue;
                }

                let file_name = entry.file_name().to_string_lossy();
                if file_name.to_lowercase().contains(&query_lower) {
                    let path_str = entry.path().to_string_lossy().into_owned();

                    // Deduplicate: skip if we've already seen this path
                    if let Ok(mut seen) = seen_paths.lock() {
                        if !seen.insert(path_str.clone()) {
                            return ignore::WalkState::Continue;
                        }
                    }

                    let path = entry.path();
                    let metadata = path.metadata().ok();

                    let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
                    let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                    let updated_at = metadata
                        .as_ref()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    if let Ok(mut locked) = results.lock() {
                        locked.push(SearchResult {
                            name: file_name.into(),
                            path: path_str,
                            is_dir,
                            size,
                            updated_at,
                        });
                        if locked.len() >= MAX_RESULTS {
                            should_stop.store(true, Ordering::Relaxed);
                            return ignore::WalkState::Quit;
                        }
                    }
                }
            }
            ignore::WalkState::Continue
        })
    });

    let mut final_results = Arc::try_unwrap(results).unwrap().into_inner().unwrap();

    // Sort: folders first, then by name length (shorter = more relevant)
    final_results.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name
                .len()
                .cmp(&b.name.len())
                .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        }
    });

    let mut paths = Vec::with_capacity(final_results.len());
    let mut new_entries = Vec::new();
    let known_set: HashSet<&String> = known_paths.iter().collect();

    for res in final_results {
        paths.push(res.path.clone());
        if !known_set.contains(&res.path) {
            new_entries.push(res);
        }
    }

    SearchDeltaResult {
        paths,
        new_entries,
    }
}
