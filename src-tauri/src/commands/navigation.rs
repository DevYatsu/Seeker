use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
pub struct NavigationLocation {
    pub id: String,
    pub path: String,
    pub label: String,
}

#[tauri::command]
pub fn get_user_locations(app: AppHandle) -> Vec<NavigationLocation> {
    let mut locations = Vec::new();
    let path_resolver = app.path();

    let configs = [
        ("home", "Home"),
        ("applications", "Applications"),
        ("desktop", "Desktop"),
        ("documents", "Documents"),
        ("downloads", "Downloads"),
        ("pictures", "Pictures"),
        ("music", "Music"),
        ("videos", "Movies"),
        ("public", "Public"),
        ("templates", "Templates"),
        ("trash", "Trash"),
    ];

    for (id, label) in configs {
        let dir_result = match id {
            "home" => path_resolver.home_dir(),
            "desktop" => path_resolver.desktop_dir(),
            "documents" => path_resolver.document_dir(),
            "downloads" => path_resolver.download_dir(),
            "pictures" => path_resolver.picture_dir(),
            "music" => path_resolver.audio_dir(),
            "videos" => path_resolver.video_dir(),
            "public" => path_resolver.public_dir(),
            "templates" => path_resolver.template_dir(),
            "trash" => path_resolver.home_dir().map(|mut p| { p.push(".Trash"); p }),
            "applications" => {
                #[cfg(target_os = "macos")]
                {
                    Ok(std::path::PathBuf::from("/Applications"))
                }
                #[cfg(not(target_os = "macos"))]
                {
                    // Fallback or skip for other OS as "Applications" is a macOS specific navigation item
                    Err(tauri::path::Error::Generic("Applications dir only supported on macOS".into()))
                }
            },
            _ => path_resolver.home_dir(),
        };

        if let Ok(path) = dir_result {
            locations.push(NavigationLocation {
                id: id.into(),
                path: path.to_string_lossy().into(),
                label: label.into(),
            });
        }
    }

    locations
}

