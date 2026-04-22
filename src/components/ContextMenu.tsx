import { For, onCleanup, onMount, Show } from "solid-js";
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

	const handleClickOutside = (e: MouseEvent) => {
		if (menuRef && !menuRef.contains(e.target as Node)) {
			props.onClose();
		}
	};

	onMount(() => {
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("wheel", props.onClose);
	});

	onCleanup(() => {
		document.removeEventListener("mousedown", handleClickOutside);
		document.removeEventListener("wheel", props.onClose);
	});

	// Ensure the menu stays within window bounds
	const getPosition = () => {
		let x = props.x;
		let y = props.y;

		if (menuRef) {
			const { offsetWidth, offsetHeight } = menuRef;
			if (x + offsetWidth > window.innerWidth) x -= offsetWidth;
			if (y + offsetHeight > window.innerHeight) y -= offsetHeight;
		}

		return { x, y };
	};

	return (
		<Show when={props.visible}>
			<div
				ref={menuRef}
				class="context-menu"
				style={{
					left: `${getPosition().x}px`,
					top: `${getPosition().y}px`,
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
