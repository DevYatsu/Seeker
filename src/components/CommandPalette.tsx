// src/components/CommandPalette.tsx
import {
	createSignal,
	createMemo,
	For,
	onCleanup,
	onMount,
	Show,
	type JSX,
} from "solid-js";
import { AppIcon } from "./AppIcon";

export interface Command {
	id: string;
	label: string;
	description?: string;
	icon?: string;
	shortcut?: string;
	category?: string;
	action: () => void;
}

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
	commands?: Command[];
	placeholder?: string;
	children?: JSX.Element; // For custom input modes like Rename
	iconPack: string;
}

/**
 * CommandPalette Component
 * A premium, powerful command palette for searching and executing actions.
 * Supports fuzzy-like filtering, keyboard navigation, and custom child modes.
 */
export function CommandPalette(props: CommandPaletteProps) {
	const [query, setQuery] = createSignal("");
	const [activeIndex, setActiveIndex] = createSignal(0);

	const filteredCommands = createMemo(() => {
		const q = query().toLowerCase();
		if (!props.commands) return [];
		if (!q) return props.commands;
		return props.commands.filter(
			(cmd) =>
				cmd.label.toLowerCase().includes(q) ||
				cmd.category?.toLowerCase().includes(q) ||
				cmd.description?.toLowerCase().includes(q),
		);
	});

	// Reset selection when query changes
	createMemo(() => {
		query();
		setActiveIndex(0);
	});

	const handleKeyDown = (e: KeyboardEvent) => {
		if (!props.isOpen) return;

		if (e.key === "Escape") {
			props.onClose();
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => (i + 1) % filteredCommands().length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex(
				(i) => (i - 1 + filteredCommands().length) % filteredCommands().length,
			);
		} else if (e.key === "Enter" && !props.children) {
			e.preventDefault();
			const cmd = filteredCommands()[activeIndex()];
			if (cmd) {
				cmd.action();
				props.onClose();
			}
		}
	};

	onMount(() => {
		document.addEventListener("keydown", handleKeyDown);
	});

	onCleanup(() => {
		document.removeEventListener("keydown", handleKeyDown);
	});

	return (
		<Show when={props.isOpen}>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop close is a standard pattern */}
			<div class="command-palette-overlay" onClick={props.onClose}>
				<div
					class="command-palette-content"
					onClick={(e) => e.stopPropagation()}
					role="dialog"
					aria-modal="true"
				>
					<Show
						when={props.children}
						fallback={
							<div class="palette-command-mode">
								<div class="palette-input-wrapper">
									<AppIcon pack={props.iconPack} name="Search" size={16} />
									<input
										type="text"
										class="palette-input"
										placeholder={
											props.placeholder || "Type a command or search..."
										}
										value={query()}
										onInput={(e) => setQuery(e.currentTarget.value)}
										autofocus
									/>
								</div>

								<div class="palette-results">
									<For
										each={filteredCommands()}
										fallback={
											<div class="palette-no-results">No commands found</div>
										}
									>
										{(cmd, i) => (
											<button
												type="button"
												class="palette-result-item"
												classList={{ active: activeIndex() === i() }}
												onClick={() => {
													cmd.action();
													props.onClose();
												}}
												onMouseEnter={() => setActiveIndex(i())}
											>
												<div class="result-left">
													<Show
														when={cmd.icon}
														fallback={<div class="result-icon-placeholder" />}
													>
														<AppIcon
															pack={props.iconPack}
															name={cmd.icon!}
															size={16}
														/>
													</Show>
													<div class="result-text">
														<span class="result-label">{cmd.label}</span>
														<Show when={cmd.category}>
															<span class="result-category">
																{cmd.category}
															</span>
														</Show>
													</div>
												</div>
												<Show when={cmd.shortcut}>
													<span class="result-shortcut">{cmd.shortcut}</span>
												</Show>
											</button>
										)}
									</For>
								</div>

								<div class="palette-footer">
									<div class="footer-hint">
										<kbd>↑</kbd> <kbd>↓</kbd> to navigate
									</div>
									<div class="footer-hint">
										<kbd>↵</kbd> to select
									</div>
									<div class="footer-hint">
										<kbd>esc</kbd> to dismiss
									</div>
								</div>
							</div>
						}
					>
						{props.children}
					</Show>
				</div>
			</div>
		</Show>
	);
}
