import { createSignal, onMount } from "solid-js";
import { getStorageStats, type StorageStats } from "../services/apiService";
import { formatBytes } from "../utils/formatters";

type StatusBarProps = {
  itemCount: number;
  selectionCount: number;
};

export default function StatusBar(props: StatusBarProps) {
  const [storage, setStorage] = createSignal<StorageStats | null>(null);

  onMount(async () => {
    try {
      const stats = await getStorageStats();
      setStorage(stats);
    } catch (err) {
      console.error("Failed to fetch storage stats:", err);
    }
  });


  const usagePercent = () => {
    const s = storage();
    if (!s || s.total_bytes === 0) return 0;
    return ((s.total_bytes - s.total_free_bytes) / s.total_bytes) * 100;
  };

  return (
    <footer class="status-bar">
      <div class="status-left">
        <span class="status-item">{props.itemCount} items</span>
        {props.selectionCount > 0 && (
          <span class="status-item selection">
            {props.selectionCount}{" "}
            {props.selectionCount === 1 ? "item" : "items"} selected
          </span>
        )}
      </div>

      <div class="status-right">
        {storage() && (
          <div class="storage-info">
            <div class="storage-label">{formatBytes(storage()!.total_free_bytes)} free</div>
            <div class="storage-meter">
              <div
                class="storage-fill"
                style={{ width: `${usagePercent()}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

