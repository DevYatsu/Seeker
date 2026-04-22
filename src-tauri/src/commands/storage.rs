use serde::Serialize;
use sysinfo::Disks;

#[derive(Serialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub file_system: String,
    pub total_space: u64,
    pub available_space: u64,
    pub is_removable: bool,
    pub is_read_only: bool,
    pub disk_kind: String,
}

#[derive(Serialize)]
pub struct StorageStats {
    pub disks: Vec<DiskInfo>,
    pub total_free_bytes: u64,
    pub total_bytes: u64,
}

#[tauri::command]
pub fn get_storage_stats() -> StorageStats {
    let disks = Disks::new_with_refreshed_list();

    let mut disk_infos = Vec::new();
    let mut total_free = 0;
    let mut total_space = 0;

    for disk in &disks {
        let kind = match disk.kind() {
            sysinfo::DiskKind::HDD => "HDD".to_string(),
            sysinfo::DiskKind::SSD => "SSD".to_string(),
            _ => "Unknown".to_string(),
        };

        let mount = disk.mount_point().to_string_lossy().to_string();
        let name = disk.name().to_string_lossy().to_string();

        disk_infos.push(DiskInfo {
            name,
            mount_point: mount.clone(),
            file_system: disk.file_system().to_string_lossy().to_string(),
            total_space: disk.total_space(),
            available_space: disk.available_space(),
            is_removable: disk.is_removable(),
            is_read_only: disk.is_read_only(),
            disk_kind: kind,
        });

        #[cfg(not(windows))]
        {
            if mount == "/" {
                total_free = disk.available_space();
                total_space = disk.total_space();
            }
        }

        #[cfg(windows)]
        {
            if mount.starts_with("C:") {
                total_free = disk.available_space();
                total_space = disk.total_space();
            }
        }
    }

    if total_space == 0 && !disk_infos.is_empty() {
        total_free = disk_infos[0].available_space;
        total_space = disk_infos[0].total_space;
    }

    StorageStats {
        disks: disk_infos,
        total_free_bytes: total_free,
        total_bytes: total_space,
    }
}
