import { Show } from "solid-js";
import type { IconPack } from "../../../components/AppIcon";
import { Modal } from "../../../components/Modal";
import { CommandPalette } from "../../../components/CommandPalette";
import { formatDate, formatSize } from "../../../utils/formatters";
import type { FileItem } from "../../../utils/mockData";
import { getFileExtension } from "../../../utils/path";
import { FileIcon } from "./FileBrowser/FileIcon";
import { BatchRenameModal, type BatchRenameConfig } from "./BatchRenameModal";

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
	batchRenameConfig: BatchRenameConfig | null;
	setBatchRenameConfig: (val: BatchRenameConfig | null) => void;
	isPaletteOpen: boolean;
	setIsPaletteOpen: (val: boolean) => void;
	paletteCommands: import("../../../components/CommandPalette").Command[];
	iconPack: IconPack;
}

/**
 * Orchestrator for Explorer dialogs.
 * Uses specialized components (Modal, CommandPalette) to keep UI logic thin.
 */
export function ExplorerModals(props: ExplorerModalsProps) {
	return (
		<>
			{/* File Information Modal (Centered because it's a detail view) */}
			<Show when={props.infoModal}>
				<Modal
					isOpen={true}
					onClose={() => props.setInfoModal(null)}
					class="info-modal"
				>
					<div class="info-header">
						<FileIcon
							id={props.infoModal?.file.id}
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

			{/* Global Command Palette */}
			<CommandPalette
				isOpen={props.isPaletteOpen}
				onClose={() => props.setIsPaletteOpen(false)}
				commands={props.paletteCommands}
				iconPack={props.iconPack}
			/>

			{/* Text Input Prompt (VS Code Style Palette) */}
			<CommandPalette
				isOpen={!!props.promptConfig}
				onClose={() => props.setPromptConfig(null)}
				iconPack={props.iconPack}
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
					<div class="palette-input-wrapper">
						<FileIcon
							type="file"
							name={props.promptConfig?.defaultValue || ""}
							pack={props.iconPack}
							size={16}
						/>
						<input
							name="promptInput"
							type="text"
							autofocus
							value={props.promptConfig?.defaultValue || ""}
							class="palette-input"
							placeholder={props.promptConfig?.title}
						/>
					</div>
					<div class="palette-actions">
						<span class="palette-hint">Press Enter to confirm</span>
						<button
							type="button"
							class="palette-btn palette-btn-secondary"
							onClick={() => props.setPromptConfig(null)}
						>
							Cancel
						</button>
						<button type="submit" class="palette-btn palette-btn-primary">
							Confirm
						</button>
					</div>
				</form>
			</CommandPalette>

			{/* Batch Rename Modal */}
			<BatchRenameModal
				config={props.batchRenameConfig}
				onClose={() => props.setBatchRenameConfig(null)}
			/>
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
