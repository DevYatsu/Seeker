import { createEventListener } from "@solid-primitives/event-listener";
import { createEffect, createSignal, For, Show } from "solid-js";
import { AppIcon, type IconPack } from "./AppIcon";

export interface ContextMenuItem {
	label: string;
	icon: string;
	action: () => void;
	danger?: boolean;
	disabled?: boolean;
	separator?: boolean;
}

type ContextMenuProps = {
	x: number;
	y: number;
	visible: boolean;
	onClose: () => void;
	items: ContextMenuItem[];
	iconPack: IconPack;
};

export default function ContextMenu(props: ContextMenuProps) {
	let menuRef: HTMLDivElement | undefined;
	const [pos, setPos] = createSignal({ x: props.x, y: props.y });

	const handleClickOutside = (e: MouseEvent) => {
		if (menuRef && !menuRef.contains(e.target as Node)) {
			props.onClose();
		}
	};

	createEventListener(document, "mousedown", handleClickOutside);
	createEventListener(document, "wheel", props.onClose);

	// Calculate bounded position when menu becomes visible or x/y changes
	createEffect(() => {
		if (props.visible) {
			// Start with default position
			setPos({ x: props.x, y: props.y });

			// Wait for DOM to paint to get actual dimensions
			requestAnimationFrame(() => {
				if (menuRef) {
					let x = props.x;
					let y = props.y;
					const { offsetWidth, offsetHeight } = menuRef;

					if (x + offsetWidth > window.innerWidth) x -= offsetWidth;
					if (y + offsetHeight > window.innerHeight) y -= offsetHeight;

					setPos({ x, y });
				}
			});
		}
	});

	return (
		<Show when={props.visible}>
			<div
				ref={menuRef}
				class="context-menu"
				role="menu"
				style={{
					left: `${pos().x}px`,
					top: `${pos().y}px`,
				}}
			>
				<div class="menu-list">
					<For each={props.items}>
						{(item) => (
							<>
								<Show when={item.separator}>
									<div class="menu-separator" />
								</Show>
								<button
									type="button"
									class="menu-item"
									classList={{
										danger: item.danger,
										disabled: item.disabled,
									}}
									onClick={() => {
										if (item.disabled) return;
										item.action();
										props.onClose();
									}}
									role="menuitem"
									disabled={item.disabled}
								>
									<AppIcon pack={props.iconPack} name={item.icon} size={14} />
									<span>{item.label}</span>
								</button>
							</>
						)}
					</For>
				</div>
			</div>
		</Show>
	);
}
