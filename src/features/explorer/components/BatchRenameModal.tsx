// src/features/explorer/components/BatchRenameModal.tsx
import { createMemo, createSignal, For, Show } from "solid-js";
import { CommandPalette } from "../../../components/CommandPalette";
import type { FileItem } from "../../../utils/mockData";

export interface BatchRenameConfig {
	items: FileItem[];
	onSubmit: (results: { id: string; newName: string }[]) => void;
}

interface BatchRenameModalProps {
	config: BatchRenameConfig | null;
	onClose: () => void;
}

type RenameMode = "replace" | "add" | "number";

export function BatchRenameModal(props: BatchRenameModalProps) {
	const [mode, setMode] = createSignal<RenameMode>("replace");
	const [findText, setFindText] = createSignal("");
	const [replaceText, setReplaceText] = createSignal("");
	const [prefix, setPrefix] = createSignal("");
	const [suffix, setSuffix] = createSignal("");
	const [startNumber, setStartNumber] = createSignal(1);

	const preview = createMemo(() => {
		const items = props.config?.items || [];
		return items.map((item, index) => {
			let newName = item.name;

			if (mode() === "replace" && findText()) {
				newName = item.name.replaceAll(findText(), replaceText());
			} else if (mode() === "add") {
				const extIndex = item.name.lastIndexOf(".");
				const namePart =
					extIndex !== -1 ? item.name.slice(0, extIndex) : item.name;
				const extPart = extIndex !== -1 ? item.name.slice(extIndex) : "";
				newName = `${prefix()}${namePart}${suffix()}${extPart}`;
			} else if (mode() === "number") {
				const extIndex = item.name.lastIndexOf(".");
				const extPart = extIndex !== -1 ? item.name.slice(extIndex) : "";
				const num = String(startNumber() + index).padStart(2, "0");
				newName = `${replaceText()}${num}${extPart}`;
			}

			return { id: item.id, oldName: item.name, newName };
		});
	});

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		if (!props.config) return;
		props.config.onSubmit(
			preview().map((p) => ({ id: p.id, newName: p.newName })),
		);
		props.onClose();
	};

	return (
		<CommandPalette isOpen={!!props.config} onClose={props.onClose}>
			<div class="batch-rename-palette">
				<div class="palette-header">
					<span class="palette-title">
						Batch Rename {props.config?.items.length} Items
					</span>
					<div class="mode-tabs">
						<button
							type="button"
							class={mode() === "replace" ? "active" : ""}
							onClick={() => setMode("replace")}
						>
							Replace
						</button>
						<button
							type="button"
							class={mode() === "add" ? "active" : ""}
							onClick={() => setMode("add")}
						>
							Add Text
						</button>
						<button
							type="button"
							class={mode() === "number" ? "active" : ""}
							onClick={() => setMode("number")}
						>
							Number
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<div class="rename-controls-palette">
						<Show when={mode() === "replace"}>
							<div class="palette-field">
								<input
									type="text"
									value={findText()}
									onInput={(e) => setFindText(e.currentTarget.value)}
									placeholder="Find..."
									autofocus
								/>
								<div class="field-divider" />
								<input
									type="text"
									value={replaceText()}
									onInput={(e) => setReplaceText(e.currentTarget.value)}
									placeholder="Replace with..."
								/>
							</div>
						</Show>

						<Show when={mode() === "add"}>
							<div class="palette-field">
								<input
									type="text"
									value={prefix()}
									onInput={(e) => setPrefix(e.currentTarget.value)}
									placeholder="Prefix..."
								/>
								<div class="field-divider" />
								<input
									type="text"
									value={suffix()}
									onInput={(e) => setSuffix(e.currentTarget.value)}
									placeholder="Suffix (before extension)..."
								/>
							</div>
						</Show>

						<Show when={mode() === "number"}>
							<div class="palette-field">
								<input
									type="text"
									value={replaceText()}
									onInput={(e) => setReplaceText(e.currentTarget.value)}
									placeholder="Base name..."
								/>
								<div class="field-divider" />
								<input
									type="number"
									value={startNumber()}
									onInput={(e) => setStartNumber(Number(e.currentTarget.value))}
									style={{ width: "80px" }}
								/>
							</div>
						</Show>
					</div>

					<div class="palette-preview">
						<div class="preview-list">
							<For each={preview().slice(0, 50)}>
								{(item) => (
									<div class="preview-row">
										<span class="old-name">{item.oldName}</span>
										<span class="arrow">→</span>
										<span
											class="new-name"
											classList={{ changed: item.oldName !== item.newName }}
										>
											{item.newName}
										</span>
									</div>
								)}
							</For>
						</div>
					</div>

					<div class="palette-actions">
						<span class="palette-hint">Press Enter to rename all items</span>
						<button
							type="button"
							class="palette-btn palette-btn-secondary"
							onClick={props.onClose}
						>
							Cancel
						</button>
						<button type="submit" class="palette-btn palette-btn-primary">
							Rename Items
						</button>
					</div>
				</form>
			</div>
		</CommandPalette>
	);
}
