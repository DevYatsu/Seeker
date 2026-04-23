import { createResource, createSignal, For, Show } from "solid-js";
import "../assets/App.css";
import "../assets/Settings.css";
import { AppIcon } from "../components/AppIcon";
import TitleBar from "../components/TitleBar";
import { type IconPack, useSettings } from "../hooks/useSettings";
import { fileSystem } from "../services/apiService";

type SettingsTab = "appearance" | "typography" | "icons" | "navigation";

export default function Settings() {
	const {
		theme,
		setTheme,
		iconPack,
		setIconPack,
		visibleNavIds,
		toggleNavVisibility,
		downloadPack,
		downloadFont,
		removePack,
		removeFont,
		isDownloading,
		downloadProgress,
		installedPacks,
		installedFonts,
	} = useSettings();

	const [locations] = createResource(() => fileSystem.getUserLocations());
	const [activeTab, setActiveTab] = createSignal<SettingsTab>("appearance");

	const isInstalled = (id: string) => installedPacks().includes(id);
	const isFontInstalled = (id: string) =>
		installedFonts().includes(id.toLowerCase());

	return (
		<div class="root-view settings-page">
			<TitleBar title="Settings" />

			<div class="app-container">
				<main class="settings-main-viewport">
					<header class="settings-header-v2">
						<div class="header-content-row">
							<nav class="settings-tabs">
								<For
									each={
										[
											{
												id: "appearance",
												label: "Appearance",
												icon: "Palette",
											},
											{ id: "typography", label: "Typography", icon: "Type" },
											{ id: "icons", label: "Icons", icon: "Grid" },
											{ id: "navigation", label: "Sidebar", icon: "Sidebar" },
										] as const
									}
								>
									{(tab) => (
										<button
											type="button"
											class={`tab-btn ${activeTab() === tab.id ? "active" : ""}`}
											onClick={() => setActiveTab(tab.id)}
										>
											<AppIcon pack={iconPack()} name={tab.icon} size={14} />
											{tab.label}
										</button>
									)}
								</For>
							</nav>

							<div class="status-indicator">
								<div
									class={`status-dot ${isDownloading() ? "pulse" : ""}`}
								></div>
								<span>
									{isDownloading()
										? downloadProgress()?.status || "Processing"
										: "Synced"}
								</span>
							</div>
						</div>
					</header>

					<div class="settings-viewport">
						<div class="tab-content-wrapper">
							<Show when={activeTab() === "appearance"}>
								<section class="settings-panel animate-in">
									<div class="panel-header">
										<h3>Appearance</h3>
										<p>Customize the visual style and theme of Seeker.</p>
									</div>
									<div class="theme-selection-grid">
										<For
											each={
												[
													{ id: "dark", label: "Dark", icon: "Moon" },
													{ id: "light", label: "Light", icon: "Sun" },
												] as const
											}
										>
											{(t) => (
												<label
													class={`theme-card ${theme() === t.id ? "active" : ""}`}
												>
													<input
														type="radio"
														class="sr-only"
														name="theme-selection"
														checked={theme() === t.id}
														onChange={() => setTheme(t.id)}
													/>
													<div
														class="theme-preview-box"
														style={{
															background:
																t.id === "dark" ? "#0b0b0c" : "#f5f5f7",
														}}
													>
														<div class="preview-accent"></div>
													</div>
													<div class="theme-title">
														<AppIcon
															pack={iconPack()}
															name={t.icon}
															size={14}
														/>
														<span>{t.label}</span>
													</div>
												</label>
											)}
										</For>
									</div>
								</section>
							</Show>

							<Show when={activeTab() === "typography"}>
								<section class="settings-panel animate-in">
									<div class="panel-header">
										<h3>Typography</h3>
										<p>Manage fonts used for menus and file names.</p>
									</div>
									<div class="settings-group">
										<For
											each={[
												{
													id: "inter",
													name: "Inter",
													desc: "Standard Sans-Serif",
													url: "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip",
												},
												{
													id: "jetbrains",
													name: "JetBrains Mono",
													desc: "Technical Monospace",
													url: "https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip",
												},
											]}
										>
											{(font) => (
												<div class="settings-row">
													<div class="row-info">
														<span
															class="row-label"
															style={{ "font-family": font.name }}
														>
															{font.name}
														</span>
														<span class="row-desc">{font.desc}</span>
													</div>
													<div class="row-actions">
														<Show
															when={isFontInstalled(font.id)}
															fallback={
																<button
																	type="button"
																	onClick={() =>
																		downloadFont(font.id, font.url)
																	}
																	disabled={isDownloading()}
																	class="btn-ui"
																>
																	<AppIcon
																		pack={iconPack()}
																		name="DownloadCloud"
																		size={14}
																	/>
																	{downloadProgress()?.pack === font.id
																		? "Downloading..."
																		: "Download"}
																</button>
															}
														>
															<div style="display: flex; gap: 8px; align-items: center;">
																<span class="row-desc" style="color: #34c759;">
																	Installed
																</span>
																<button
																	type="button"
																	onClick={() => removeFont(font.id)}
																	disabled={isDownloading()}
																	class="btn-ui danger"
																>
																	<AppIcon
																		pack={iconPack()}
																		name="Trash"
																		size={14}
																	/>
																</button>
															</div>
														</Show>
													</div>
												</div>
											)}
										</For>
									</div>
								</section>
							</Show>

							<Show when={activeTab() === "icons"}>
								<section class="settings-panel animate-in">
									<div class="panel-header">
										<h3>Icon Packs</h3>
										<p>
											Switch between different icon libraries for files and
											folders.
										</p>
									</div>
									<div class="icon-packs-grid">
										<For
											each={[
												{ id: "vscode", name: "VSCode", color: "#007acc" },
												{ id: "material", name: "Material", color: "#4285f4" },
												{
													id: "catppuccin/frappe",
													name: "Frappé",
													color: "#d097d7",
												},
												{
													id: "catppuccin/mocha",
													name: "Mocha",
													color: "#f4c3d3",
												},
												{
													id: "catppuccin/macchiato",
													name: "Macchiato",
													color: "#94a1b2",
												},
												{
													id: "catppuccin/latte",
													name: "Latte",
													color: "#7b8bc4",
												},
											]}
										>
											{(pack) => (
												<div
													class={`icon-pack-item ${iconPack() === pack.id ? "active" : ""}`}
													style={{ "--pack-accent": pack.color }}
												>
													<div class="pack-visual">
														<AppIcon
															pack={iconPack()}
															name="Grid"
															size={20}
															style={{ color: pack.color }}
														/>
													</div>
													<span class="pack-title">{pack.name}</span>
													<Show
														when={isInstalled(pack.id)}
														fallback={
															<button
																type="button"
																onClick={() => downloadPack(pack.id)}
																disabled={isDownloading()}
																class="btn-ui"
																style="width: 100%; justify-content: center;"
															>
																{downloadProgress()?.pack === pack.id
																	? "Downloading..."
																	: "Download"}
															</button>
														}
													>
														<div style="display: flex; gap: 4px;">
															<button
																type="button"
																onClick={() => setIconPack(pack.id as IconPack)}
																class={`btn-ui ${iconPack() === pack.id ? "primary" : ""}`}
																style="flex: 1; justify-content: center;"
															>
																{iconPack() === pack.id ? "Active" : "Apply"}
															</button>
															<button
																type="button"
																onClick={() => removePack(pack.id)}
																disabled={isDownloading()}
																class="btn-ui danger"
															>
																<AppIcon
																	pack={iconPack()}
																	name="Trash"
																	size={14}
																/>
															</button>
														</div>
													</Show>
												</div>
											)}
										</For>
									</div>
								</section>
							</Show>

							<Show when={activeTab() === "navigation"}>
								<section class="settings-panel animate-in">
									<div class="panel-header">
										<h3>Sidebar</h3>
										<p>
											Select which locations to display in the main sidebar.
										</p>
									</div>
									<div class="settings-group">
										<For each={locations() || []}>
											{(loc) => (
												<label
													class={`settings-row ${visibleNavIds().includes(loc.id) ? "enabled" : ""}`}
													style="cursor: pointer;"
												>
													<input
														type="checkbox"
														class="sr-only"
														checked={visibleNavIds().includes(loc.id)}
														onChange={() => toggleNavVisibility(loc.id)}
													/>
													<div
														class="row-info"
														style="flex-direction: row; align-items: center; gap: 12px;"
													>
														<div style="color: var(--settings-accent)">
															<AppIcon
																pack={iconPack()}
																name="Folder"
																size={16}
															/>
														</div>
														<span class="row-label">{loc.label}</span>
													</div>
													<div class="toggle-switch">
														<div class="switch-handle"></div>
													</div>
												</label>
											)}
										</For>
									</div>
								</section>
							</Show>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
