// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let settings_m = MenuItem::with_id(app, "settings", "Preferences...", true, Some("CmdOrCtrl+,"))?;
            
            let app_m = Submenu::with_items(
                app,
                "Seeker",
                true,
                &[
                    &settings_m,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::quit(app, None)?,
                ],
            )?;

            let menu = Menu::with_items(app, &[&app_m])?;
            app.set_menu(menu)?;
            
            app.on_menu_event(|app_handle, event| {
                if event.id().as_ref() == "settings" {
                    if let Some(window) = app_handle.get_webview_window("settings") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        let _ = tauri::WebviewWindowBuilder::new(
                            app_handle,
                            "settings",
                            tauri::WebviewUrl::App("/?window=settings".into())
                        )
                        .title("Preferences")
                        .inner_size(400.0, 350.0)
                        .resizable(false)
                        .build();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
