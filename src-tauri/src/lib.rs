mod commands;
mod menu;
mod watcher;

use commands::downloader::{
    download_icons, download_resource, delete_icon_pack, delete_resource, 
    get_installed_packs, get_installed_fonts, list_resources, get_base_icons_path
};

use crate::commands::size;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_drag::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(watcher::WatcherState::new())
        .setup(|app| {
            let menu = menu::create_menu(app.handle())?;
            app.set_menu(menu)?;

            app.on_menu_event(|app_handle, event| {
                menu::handle_menu_event(app_handle, event);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            watcher::watch_directory,
            watcher::unwatch_directory,
            size::calculate_dir_size,
            commands::storage::get_storage_stats,
            commands::navigation::get_user_locations,
            commands::search::search_files,
            commands::fs::list_directory,
            commands::fs::open_item,
            commands::fs::move_to_trash,
            commands::fs::delete_permanently,
            commands::fs::rename_item,
            commands::fs::create_directory,
            commands::fs::create_file,
            commands::fs::copy_items,
            commands::fs::move_items,
            commands::fs::duplicate_items,
            commands::fs::open_in_terminal,
            download_icons,
            download_resource,
            delete_icon_pack,
            delete_resource,
            get_installed_packs,
            get_installed_fonts,
            list_resources,
            get_base_icons_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
