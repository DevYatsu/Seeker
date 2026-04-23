import { type JSX, onCleanup, onMount } from "solid-js";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: JSX.Element;
	class?: string;
	title?: string;
}

/**
 * Generic Modal Wrapper
 * Handles overlays, transitions, and common keyboard interactions (ESC).
 * Adheres to KISS/DRY by centralizing modal behavior.
 */
export function Modal(props: ModalProps) {
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape" && props.isOpen) {
			props.onClose();
		}
	};

	onMount(() => document.addEventListener("keydown", handleKeyDown));
	onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop close is a standard pattern
		<div
			class={`modal-overlay ${props.isOpen ? "is-open" : ""}`}
			onClick={props.onClose}
			role="presentation"
		>
			<div
				class={`modal-content ${props.class || ""}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === "Escape") props.onClose();
				}}
				role="dialog"
				aria-modal="true"
				tabIndex={-1}
			>
				{props.title && <h3 class="modal-title">{props.title}</h3>}
				{props.children}
			</div>
		</div>
	);
}
