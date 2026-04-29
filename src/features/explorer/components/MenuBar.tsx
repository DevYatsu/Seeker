// src/features/explorer/components/MenuBar.tsx
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { AppIcon, type IconPack } from "../../../components/AppIcon";

interface MenuItem {
	label: string;
	shortcut?: string;
	icon?: string;
	action?: () => void;
	disabled?: boolean;
	separator?: boolean;
	danger?: boolean;
}

interface Menu {
	label: string;
	items: MenuItem[];
}

interface MenuBarProps {
	menus: Menu[];
	iconPack: IconPack;
}

export function MenuBar(props: MenuBarProps) {
	const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	if (isMac) return null;

	const [activeMenu, setActiveMenu] = createSignal<number | null>(null);

	const handleMouseEnter = (index: number) => {
		if (activeMenu() !== null) {
			setActiveMenu(index);
		}
	};

	const handleClickOutside = (e: MouseEvent) => {
		if (!(e.target as HTMLElement).closest(".menubar-root")) {
			setActiveMenu(null);
		}
	};

	onMount(() => {
		document.addEventListener("click", handleClickOutside);
	});

	onCleanup(() => {
		document.removeEventListener("click", handleClickOutside);
	});

	return (
		<div class="menubar-root" onMouseLeave={() => {}}>
			<div class="menubar-list">
				<For each={props.menus}>
					{(menu, i) => (
						<div
							class="menubar-item-container"
							classList={{ active: activeMenu() === i() }}
						>
							<button
								type="button"
								class="menubar-label"
								onClick={(e) => {
									e.stopPropagation();
									setActiveMenu(activeMenu() === i() ? null : i());
								}}
								onMouseEnter={() => handleMouseEnter(i())}
							>
								{menu.label}
							</button>

							<Show when={activeMenu() === i()}>
								<div class="menu-dropdown animate-in-fade-scale">
									<For each={menu.items}>
										{(item) => (
											<Show
												when={!item.separator}
												fallback={<div class="menu-separator" />}
											>
												<button
													type="button"
													class="menu-item"
													classList={{
														danger: item.danger,
														disabled: item.disabled,
													}}
													onClick={() => {
														item.action?.();
														setActiveMenu(null);
													}}
													disabled={item.disabled}
												>
													<div class="menu-item-left">
														<Show when={item.icon}>
															<AppIcon
																pack={props.iconPack}
																name={item.icon!}
																size={14}
															/>
														</Show>
														<span class="menu-item-label">{item.label}</span>
													</div>
													<Show when={item.shortcut}>
														<span class="menu-item-shortcut">
															{item.shortcut}
														</span>
													</Show>
												</button>
											</Show>
										)}
									</For>
								</div>
							</Show>
						</div>
					)}
				</For>
			</div>
		</div>
	);
}
