import { createResource } from "solid-js";
import { fileSystem } from "../../../services/apiService";
import { formatBytes } from "../../../utils/formatters";

type StatusBarProps = {
	itemCount: number;
	selectionCount: number;
	selectedSize: number;
	fileCount: number;
	folderCount: number;
	searchQuery?: string;
};

export default function StatusBar(props: StatusBarProps) {
	const [storage] = createResource(() => fileSystem.getStorageStats());

	const usagePercent = () => {
		const s = storage();
		if (!s || s.total_bytes === 0) return 0;
		return ((s.total_bytes - s.total_free_bytes) / s.total_bytes) * 100;
	};

	return (
		<footer class="status-bar">
			<div class="status-left">
				<Show when={props.searchQuery}>
					<span class="status-item search-status">
						Searching... {props.itemCount}{" "}
						{props.itemCount === 1 ? "result" : "results"} found
					</span>
				</Show>
				<span class="status-item">
					{props.folderCount} {props.folderCount === 1 ? "folder" : "folders"},{" "}
					{props.fileCount} {props.fileCount === 1 ? "file" : "files"}
				</span>
				{props.selectionCount > 0 && (
					<span class="status-item selection">
						{props.selectionCount}{" "}
						{props.selectionCount === 1 ? "item" : "items"} selected
						{props.selectedSize > 0 && ` (${formatBytes(props.selectedSize)})`}
					</span>
				)}
			</div>

			<div class="status-right">
				{storage() && (
					<div class="storage-info">
						<div class="storage-label">
							{formatBytes(storage()?.total_free_bytes)} free
						</div>
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
