import { Show } from "solid-js";
import type { IconPack } from "../../../components/AppIcon";
import { Modal } from "../../../components/Modal";
import { formatDate, formatSize } from "../../../utils/formatters";
import type { FileItem } from "../../../utils/mockData";
import { getFileExtension } from "../../../utils/path";
import { FileIcon } from "./FileBrowser/FileIcon";

export interface PromptConfig {
	title: string;
	defaultValue?: string;
	onSubmit: (val: string) => void;
}

export interface InfoModal {
	file: FileItem;
}

interface ExplorerModalsProps {
	infoModal: InfoModal | null;
	setInfoModal: (val: InfoModal | null) => void;
	promptConfig: PromptConfig | null;
	setPromptConfig: (val: PromptConfig | null) => void;
	iconPack: IconPack;
}

/**
 * Orchestrator for Explorer dialogs.
 * Uses the generic Modal component to keep the UI logic thin and focused.
 */
export function ExplorerModals(props: ExplorerModalsProps) {
	return (
		<>
			{/* File Information Modal */}
			<Show when={props.infoModal}>
				<Modal
					isOpen={true}
					onClose={() => props.setInfoModal(null)}
					class="info-modal"
				>
					<div class="info-header">
						<FileIcon
							type={props.infoModal?.file.type}
							name={props.infoModal?.file.name || ""}
							pack={props.iconPack}
							size={56}
						/>
						<h3 class="info-title">{props.infoModal?.file.name}</h3>
					</div>

					<div class="info-body">
						<InfoRow
							label="Kind"
							value={
								props.infoModal?.file.type === "folder"
									? "Folder"
									: `${getFileExtension(props.infoModal?.file.name || "").toUpperCase() || "--"} Document`
							}
						/>
						<InfoRow
							label="Size"
							value={
								props.infoModal?.file.type === "folder"
									? "--"
									: formatSize(props.infoModal?.file.size || 0)
							}
						/>
						<InfoRow
							label="Where"
							value={props.infoModal?.file.id || ""}
							isPath
						/>
						<InfoRow
							label="Modified"
							value={formatDate(props.infoModal?.file.updatedAt || "")}
						/>
					</div>

					<div class="modal-actions">
						<button
							type="button"
							class="ok-btn"
							onClick={() => props.setInfoModal(null)}
						>
							Close
						</button>
					</div>
				</Modal>
			</Show>

			{/* Text Input Prompt Modal */}
			<Show when={props.promptConfig}>
				<Modal
					isOpen={true}
					onClose={() => props.setPromptConfig(null)}
					title={props.promptConfig?.title}
				>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const input = new FormData(e.currentTarget).get(
								"promptInput",
							) as string;
							if (input?.trim()) {
								props.promptConfig?.onSubmit(input.trim());
							}
							props.setPromptConfig(null);
						}}
					>
						<input
							name="promptInput"
							type="text"
							autofocus
							value={props.promptConfig?.defaultValue || ""}
							class="modal-input"
						/>
						<div class="modal-actions">
							<button
								type="button"
								class="cancel-btn"
								onClick={() => props.setPromptConfig(null)}
							>
								Cancel
							</button>
							<button type="submit" class="ok-btn">
								Confirm
							</button>
						</div>
					</form>
				</Modal>
			</Show>
		</>
	);
}

/** Internal helper for info rows to keep the main component clean */
function InfoRow(props: { label: string; value: string; isPath?: boolean }) {
	return (
		<div class="info-row">
			<span class="info-label">{props.label}</span>
			<span
				class={`info-value ${props.isPath ? "path-value" : ""}`}
				title={props.isPath ? props.value : ""}
			>
				{props.value}
			</span>
		</div>
	);
}
