// src/views/Settings.tsx
import { createResource, createSignal, For, Show } from "solid-js";
import "../assets/App.css";
import "../assets/Settings.css";
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
			<div class="app-container">
				<main class="settings-main-viewport">
					<header class="settings-header-v2">
						<div class="header-content-row">
							<nav class="settings-tabs">
								<For
									each={
										[
											{ id: "appearance", label: "Appearance" },
											{ id: "navigation", label: "Sidebar" },
											{ id: "icons", label: "Icon Packs" },
											{ id: "typography", label: "Fonts" },
										] as { id: SettingsTab; label: string }[]
									}
								>
									{(tab) => (
										<button
											type="button"
											class="tab-btn"
											classList={{ active: activeTab() === tab.id }}
											onClick={() => setActiveTab(tab.id)}
										>
											{tab.label}
										</button>
									)}
								</For>
							</nav>
						</div>
					</header>

					<div class="settings-scroll-area">
						<Show when={activeTab() === "appearance"}>
							<section class="settings-section animate-in">
								<h3 class="section-title">Theme</h3>
								<div class="theme-grid">
									<button
										type="button"
										class="theme-card"
										classList={{ active: theme() === "dark" }}
										onClick={() => setTheme("dark")}
									>
										<div class="theme-preview dark">
											<div class="preview-sidebar" />
											<div class="preview-content" />
										</div>
										<span>Dark Mode</span>
									</button>
									<button
										type="button"
										class="theme-card"
										classList={{ active: theme() === "light" }}
										onClick={() => setTheme("light")}
									>
										<div class="theme-preview light">
											<div class="preview-sidebar" />
											<div class="preview-content" />
										</div>
										<span>Light Mode</span>
									</button>
								</div>
							</section>
						</Show>

						<Show when={activeTab() === "navigation"}>
							<section class="settings-section animate-in">
								<h3 class="section-title">Sidebar Items</h3>
								<div class="nav-visibility-grid">
									<For
										each={[
											"home",
											"desktop",
											"documents",
											"downloads",
											"pictures",
											"music",
											"videos",
											"trash",
										]}
									>
										{(id) => (
											<div class="nav-toggle-item">
												<span class="capitalize">{id}</span>
												<button
													type="button"
													class="toggle-switch"
													classList={{ active: visibleNavIds().includes(id) }}
													onClick={() => toggleNavVisibility(id)}
												>
													<div class="switch-handle" />
												</button>
											</div>
										)}
									</For>
								</div>
							</section>
						</Show>

						<Show when={activeTab() === "icons"}>
							<section class="settings-section animate-in">
								<div class="section-header">
									<h3 class="section-title">Icon Packs</h3>
									<Show when={isDownloading()}>
										<div class="download-badge">
											<div class="spinner-mini" />
											{downloadProgress()?.status}
										</div>
									</Show>
								</div>

								<div class="packs-list">
									{[
										{ id: "vscode", name: "VSCode Icons" },
										{ id: "material", name: "Material Icons" },
										{ id: "lucide", name: "Lucide Icons" },
										{ id: "catppuccin/mocha", name: "Catppuccin Mocha" },
										{ id: "catppuccin/latte", name: "Catppuccin Latte" },
									].map((pack) => (
										<div
											class="pack-item"
											classList={{ active: iconPack() === pack.id }}
										>
											<div class="pack-info">
												<span class="pack-name">{pack.name}</span>
												<Show when={isInstalled(pack.id)}>
													<span class="installed-tag">Installed</span>
												</Show>
											</div>
											<div class="pack-actions">
												<Show
													when={isInstalled(pack.id)}
													fallback={
														<button
															type="button"
															class="action-btn download"
															onClick={() => downloadPack(pack.id)}
															disabled={isDownloading()}
														>
															Download
														</button>
													}
												>
													<button
														type="button"
														class="action-btn select"
														onClick={() => setIconPack(pack.id as IconPack)}
													>
														Apply
													</button>
													<button
														type="button"
														class="action-btn remove"
														onClick={() => removePack(pack.id)}
													>
														Remove
													</button>
												</Show>
											</div>
										</div>
									))}
								</div>
							</section>
						</Show>

						<Show when={activeTab() === "typography"}>
							<section class="settings-section animate-in">
								<h3 class="section-title">System Fonts</h3>
								<div class="fonts-grid">
									{[
										{ id: "inter", name: "Inter", url: "https://..." },
										{ id: "roboto", name: "Roboto", url: "https://..." },
										{ id: "outfit", name: "Outfit", url: "https://..." },
									].map((font) => (
										<div class="font-card" style={{ "font-family": font.name }}>
											<div class="font-preview">
												The quick brown fox jumps over the lazy dog.
											</div>
											<div class="font-footer">
												<span class="font-name">{font.name}</span>
												<Show
													when={isFontInstalled(font.id)}
													fallback={
														<button
															type="button"
															class="font-action"
															onClick={() => downloadFont(font.id, font.url)}
															disabled={isDownloading()}
														>
															Install
														</button>
													}
												>
													<span class="installed-tag">Active</span>
												</Show>
											</div>
										</div>
									))}
								</div>
							</section>
						</Show>
					</div>
				</main>
			</div>
		</div>
	);
}
