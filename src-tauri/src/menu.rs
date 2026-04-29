use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Emitter, Manager, Wry};

pub fn create_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let settings_m = MenuItem::with_id(app, "settings", "Settings...", true, Some("CmdOrCtrl+,"))?;

    let app_m = Submenu::with_items(
        app,
        "Seeker",
        true,
        &[
            &PredefinedMenuItem::about(
                app,
                None,
                Some(tauri::menu::AboutMetadata {
                    name: Some("Seeker".to_string()),
                    version: Some("0.1.0".to_string()),
                    short_version: Some("0.1.0".to_string()),
                    authors: Some(vec!["DevYatsu".to_string()]),
                    comments: Some("The invisible file explorer.".to_string()),
                    copyright: Some("Copyright © 2024 DevYatsu".to_string()),
                    license: Some("MIT".to_string()),
                    website: Some("https://github.com/DevYatsu/Seeker".to_string()),
                    website_label: Some("Website".to_string()),
                    ..Default::default()
                }),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &settings_m,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::services(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, Some("Hide Seeker"))?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Quit Seeker"))?,
        ],
    )?;

    let file_m = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &MenuItem::with_id(app, "new-tab", "New Tab", true, Some("CmdOrCtrl+T"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "new-folder", "New Folder", true, Some("CmdOrCtrl+Shift+F"))?,
            &MenuItem::with_id(app, "new-file", "New File", true, Some("CmdOrCtrl+N"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "close-tab", "Close Tab", true, Some("CmdOrCtrl+W"))?,
        ],
    )?;

    let edit_m = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &MenuItem::with_id(app, "undo", "Undo", true, Some("CmdOrCtrl+Z"))?,
            &MenuItem::with_id(app, "redo", "Redo", true, Some("CmdOrCtrl+Shift+Z"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "cut", "Cut", true, Some("CmdOrCtrl+X"))?,
            &MenuItem::with_id(app, "copy", "Copy", true, Some("CmdOrCtrl+C"))?,
            &MenuItem::with_id(app, "paste", "Paste", true, Some("CmdOrCtrl+V"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    let view_m = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &MenuItem::with_id(app, "view-grid", "as Icons", true, Some("CmdOrCtrl+1"))?,
            &MenuItem::with_id(app, "view-list", "as List", true, Some("CmdOrCtrl+2"))?,
            &MenuItem::with_id(app, "view-column", "as Columns", true, Some("CmdOrCtrl+3"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "toggle-hidden", "Toggle Hidden Files", true, Some("CmdOrCtrl+Shift+."))?,
            &MenuItem::with_id(app, "refresh", "Refresh", true, Some("CmdOrCtrl+R"))?,
        ],
    )?;

    let go_m = Submenu::with_items(
        app,
        "Go",
        true,
        &[
            &MenuItem::with_id(app, "go-back", "Back", true, Some("CmdOrCtrl+["))?,
            &MenuItem::with_id(app, "go-forward", "Forward", true, Some("CmdOrCtrl+]"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "go-home", "Home", true, None::<&str>)?,
            &MenuItem::with_id(app, "go-desktop", "Desktop", true, None::<&str>)?,
            &MenuItem::with_id(app, "go-downloads", "Downloads", true, None::<&str>)?,
        ],
    )?;

    let window_m = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::fullscreen(app, None)?,
        ],
    )?;

    Menu::with_items(app, &[&app_m, &file_m, &edit_m, &view_m, &go_m, &window_m])
}

pub fn handle_menu_event(app_handle: &AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().as_ref();
    
    if id == "settings" {
        if let Some(window) = app_handle.get_webview_window("settings") {
            let _ = window.show();
            let _ = window.set_focus();
        } else {
            let win_label = format!(
                "settings-{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos()
            );
            let _ = tauri::WebviewWindowBuilder::new(
                app_handle,
                win_label,
                tauri::WebviewUrl::App("/?window=settings".into()),
            )
            .title("Settings")
            .inner_size(800.0, 600.0)
            .resizable(true)
            .always_on_top(true)
            .transparent(true)
            .decorations(false)
            .build();
        }
    } else {
        // Broadcast all other menu events to the frontend
        let _ = app_handle.emit("menu-event", id);
    }
}
