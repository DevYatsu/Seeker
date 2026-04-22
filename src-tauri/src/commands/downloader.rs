use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager, AppHandle};
use tokio::sync::Semaphore;
use std::path::PathBuf;
use std::sync::Arc;
use futures::future::{join_all, BoxFuture};
use futures::FutureExt;
use reqwest::Client;

// --- Constants ---
const MAX_CONCURRENT_DOWNLOADS: usize = 25;
const MAX_RETRIES: usize = 3;
const INITIAL_BACKOFF_MS: u64 = 500;
const GITHUB_API_URL: &str = "https://api.github.com";

// --- Types ---

#[derive(Deserialize, Clone, Debug)]
pub(crate) struct GitHubItem {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub download_url: Option<String>,
}

#[derive(Serialize, Clone, Debug)]
pub struct DownloadProgress {
    pub pack_id: Arc<str>,
    pub total_files: usize,
    pub downloaded: usize,
    pub current_file: String,
    pub status: String,
}

#[derive(Debug, thiserror::Error)]
pub enum DownloadError {
    #[error("HTTP {0}: {1}")]
    Http(reqwest::StatusCode, String),
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
    #[error("IO error: {0} for file {1}")]
    Io(std::io::Error, String),
    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<DownloadError> for String {
    fn from(err: DownloadError) -> Self {
        err.to_string()
    }
}

// --- Downloader Core ---

pub struct Downloader {
    client: Client,
    semaphore: Arc<Semaphore>,
    app_handle: AppHandle,
    download_count: Arc<std::sync::atomic::AtomicUsize>,
}

impl Downloader {
    pub fn new(app_handle: AppHandle) -> Result<Self, String> {
        let client = Client::builder()
            .user_agent("seeker-downloader/1.0")
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

        Ok(Self {
            client,
            semaphore: Arc::new(Semaphore::new(MAX_CONCURRENT_DOWNLOADS)),
            app_handle,
            download_count: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
        })
    }

    pub async fn fetch_directory_contents(
        &self,
        owner: &str,
        repo: &str,
        path: &str,
        branch: &str,
    ) -> Result<Vec<GitHubItem>, DownloadError> {
        let api_url = format!(
            "{}/repos/{}/{}/contents/{}?ref={}",
            GITHUB_API_URL, owner, repo, path, branch
        );

        let response = self.fetch_with_retry(&api_url).await?;
        response.json::<Vec<GitHubItem>>().await.map_err(DownloadError::Network)
    }

    async fn fetch_with_retry(&self, url: &str) -> Result<reqwest::Response, DownloadError> {
        let mut retries_left = MAX_RETRIES;
        let mut backoff_ms = INITIAL_BACKOFF_MS;

        loop {
            match self.client.get(url).send().await {
                Ok(res) if res.status().is_success() => return Ok(res),
                Ok(res) => {
                    let status = res.status();
                    let should_retry = status.is_server_error() || status == reqwest::StatusCode::TOO_MANY_REQUESTS;
                    
                    if retries_left > 0 && should_retry {
                        retries_left -= 1;
                        tokio::time::sleep(std::time::Duration::from_millis(backoff_ms)).await;
                        backoff_ms = backoff_ms.saturating_mul(2);
                    } else {
                        return Err(DownloadError::Http(status, url.to_string()));
                    }
                }
                Err(_e) if retries_left > 0 => {
                    retries_left -= 1;
                    tokio::time::sleep(std::time::Duration::from_millis(backoff_ms)).await;
                    backoff_ms = backoff_ms.saturating_mul(2);
                }
                Err(e) => return Err(DownloadError::Network(e)),
            }
        }
    }

    pub async fn download_file(&self, url: &str, dest: PathBuf) -> Result<(), DownloadError> {
        let _permit = self.semaphore.acquire().await.map_err(|e| DownloadError::Internal(e.to_string()))?;
        
        let response = self.fetch_with_retry(url).await?;
        let bytes = response.bytes().await.map_err(DownloadError::Network)?;
        
        if let Some(parent) = dest.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                DownloadError::Io(e, parent.display().to_string())
            })?;
        }

        std::fs::write(&dest, bytes).map_err(|e| {
            DownloadError::Io(e, dest.display().to_string())
        })?;

        Ok(())
    }

    pub fn download_recursive(
        self: Arc<Self>,
        pack_id: Arc<str>,
        owner: Arc<str>,
        repo: Arc<str>,
        path: String,
        branch: Arc<str>,
        target_root: PathBuf,
    ) -> BoxFuture<'static, Result<(), String>> {
        let this = Arc::clone(&self);
        async move {
            let items = this.fetch_directory_contents(&owner, &repo, &path, &branch)
                .await
                .map_err(|e| e.to_string())?;

            let mut tasks = Vec::new();

            for item in items {
                let this = Arc::clone(&this);
                let pack_id = Arc::clone(&pack_id);
                let owner = Arc::clone(&owner);
                let repo = Arc::clone(&repo);
                let branch = Arc::clone(&branch);
                let target_root = target_root.clone();

                if item.item_type == "dir" {
                    let sub_target = target_root.join(&item.name);
                    tasks.push(tokio::spawn(async move {
                        this.download_recursive(pack_id, owner, repo, item.path, branch, sub_target).await
                    }));
                } else if item.item_type == "file" && item.name.ends_with(".svg") {
                    if let Some(url) = item.download_url {
                        let dest = target_root.join(&item.name);
                        let item_name = item.name.clone();
                        tasks.push(tokio::spawn(async move {
                            match this.download_file(&url, dest).await {
                                Ok(_) => {
                                    let current = this.download_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;
                                    let _ = this.app_handle.emit("download-progress", DownloadProgress {
                                        pack_id,
                                        total_files: 0,
                                        downloaded: current,
                                        current_file: item_name,
                                        status: "downloading".to_string(),
                                    });
                                    Ok(())
                                }
                                Err(e) => Err(e.to_string()),
                            }
                        }));
                    }
                }
            }

            let results = join_all(tasks).await;
            for res in results {
                match res {
                    Ok(Err(e)) => eprintln!("Download task error: {}", e),
                    Err(e) => eprintln!("Task join error: {}", e),
                    _ => {}
                }
            }

            Ok(())
        }.boxed()
    }
}

// --- Resource Management Helpers ---

fn get_resources_root(handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    handle.path()
        .app_local_data_dir()
        .map(|p| p.join("resources"))
        .map_err(|_| "Could not determine app data directory".to_string())
}

fn get_subfolder_path(handle: &tauri::AppHandle, subfolder: &str) -> Result<PathBuf, String> {
    let root = get_resources_root(handle)?;
    let path = root.join(subfolder);
    if !path.exists() {
        std::fs::create_dir_all(&path).map_err(|e| format!("Failed to create subfolder {}: {}", subfolder, e))?;
    }
    Ok(path)
}

// --- Tauri Commands ---

#[::tauri::command]
pub async fn download_icons(
    handle: tauri::AppHandle,
    folder_path: String,
) -> Result<(), String> {
    let downloader = Arc::new(Downloader::new(handle.clone())?);
    let target_dir = get_subfolder_path(&handle, "icons")?.join(folder_path.replace("/", "_"));

    downloader.clone().download_recursive(
        folder_path.clone().into(),
        "DevYatsu".into(),
        "icons".into(),
        folder_path,
        "master".into(),
        target_dir,
    ).await?;

    Ok(())
}

#[::tauri::command]
pub async fn download_resource(
    handle: tauri::AppHandle,
    url: String,
    filename: String,
    resource_type: String,
) -> Result<(), String> {
    let downloader = Arc::new(Downloader::new(handle.clone())?);
    let target_path = get_subfolder_path(&handle, &resource_type)?.join(filename);

    downloader.download_file(&url, target_path).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[::tauri::command]
pub async fn delete_resource(
    handle: tauri::AppHandle,
    filename: String,
    resource_type: String,
) -> Result<(), String> {
    let path = get_subfolder_path(&handle, &resource_type)?.join(filename.replace("/", "_"));

    if path.exists() {
        if path.is_dir() {
            tokio::fs::remove_dir_all(path).await
                .map_err(|e| format!("Failed to delete directory: {}", e))?;
        } else {
            tokio::fs::remove_file(path).await
                .map_err(|e| format!("Failed to delete file: {}", e))?;
        }
    }

    Ok(())
}

#[::tauri::command]
pub async fn list_resources(
    handle: tauri::AppHandle,
    resource_type: String,
) -> Result<Vec<String>, String> {
    let base_path = get_subfolder_path(&handle, &resource_type)?;

    let mut installed = Vec::new();
    let mut entries = tokio::fs::read_dir(base_path)
        .await
        .map_err(|e| format!("Failed to read resource directory: {}", e))?;

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        let name = entry.file_name().to_string_lossy().into_owned();
        if resource_type == "icons" {
            installed.push(name.replace("_", "/"));
        } else if name.ends_with(".zip") {
            installed.push(name.trim_end_matches(".zip").to_string());
        } else {
            installed.push(name);
        }
    }

    Ok(installed)
}

// Deprecated or legacy compatibility wrappers if needed
#[::tauri::command]
pub async fn delete_icon_pack(handle: tauri::AppHandle, pack_id: String) -> Result<(), String> {
    delete_resource(handle, pack_id, "icons".to_string()).await
}

#[::tauri::command]
pub async fn get_installed_packs(handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    list_resources(handle, "icons".to_string()).await
}

#[::tauri::command]
pub async fn get_installed_fonts(handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    list_resources(handle, "fonts".to_string()).await
}
#[::tauri::command]
pub async fn get_base_icons_path(handle: tauri::AppHandle) -> Result<String, String> {
    get_subfolder_path(&handle, "icons").map(|p| p.to_string_lossy().into_owned())
}
