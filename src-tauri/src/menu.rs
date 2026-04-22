use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Manager, Wry};

pub fn create_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let settings_m =
        MenuItem::with_id(app, "settings", "Preferences...", true, Some("CmdOrCtrl+,"))?;

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

    Menu::with_items(app, &[&app_m])
}

pub fn handle_menu_event(app_handle: &AppHandle, event: tauri::menu::MenuEvent) {
    if event.id().as_ref() == "settings" {
        if let Some(window) = app_handle.get_webview_window("settings") {
            let _ = window.show();
            let _ = window.set_focus();
        } else {
            let _ = tauri::WebviewWindowBuilder::new(
                app_handle,
                "settings",
                tauri::WebviewUrl::App("/?window=settings".into()),
            )
            .title("")
            .inner_size(850.0, 650.0)
            .resizable(true)
            .always_on_top(true)
            .transparent(true)
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .build();
        }
    }
}
