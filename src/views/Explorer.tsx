// src/views/Explorer.tsx
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
	createEffect,
	createMemo,
	createSignal,
	Show,
	Suspense,
} from "solid-js";

// Layout Components
import ContextMenu from "../components/ContextMenu";
import LoadingOverlay from "../components/LoadingOverlay";
import {
	ExplorerModals,
	type InfoModal,
	type PromptConfig,
} from "../features/explorer/components/ExplorerModals";
import FileBrowser from "../features/explorer/components/FileBrowser";
import QuickLook from "../features/explorer/components/QuickLook";
import Sidebar from "../features/explorer/components/Sidebar";
import StatusBar from "../features/explorer/components/StatusBar";
import TabBar from "../features/explorer/components/TabBar";
import Toolbar from "../features/explorer/components/Toolbar";
import TaskDrawer from "../features/explorer/components/TaskDrawer";

// Logic Hooks & Context
import { MenuBar } from "../features/explorer/components/MenuBar";
import { useMenuBarMenus } from "../features/explorer/hooks/useMenuBarMenus";
import { useNativeMenuListener } from "../features/explorer/hooks/useNativeMenuListener";
import { useCommandPalette } from "../features/explorer/hooks/useCommandPalette";

import { ExplorerProvider } from "../features/explorer/context/ExplorerContext";
import { useDirectoryWatcher } from "../features/explorer/hooks/useDirectoryWatcher";
import { useExplorerContextMenu } from "../features/explorer/hooks/useExplorerContextMenu";
import { useExplorerInteraction } from "../features/explorer/hooks/useExplorerInteraction";
import { useExplorerKeyboard } from "../features/explorer/hooks/useExplorerKeyboard";
import { useExternalDragDrop } from "../features/explorer/hooks/useExternalDragDrop";
import { useFolderSizes } from "../features/explorer/hooks/useFolderSizes";
import { createDragDropManager } from "../features/explorer/modules/DragDropManager";
import { createFileSystemManager } from "../features/explorer/modules/FileSystemManager";
import { createNavigationManager } from "../features/explorer/modules/NavigationManager";
import { createResourceManager } from "../features/explorer/modules/ResourceManager";
import { createSelectionManager } from "../features/explorer/modules/SelectionManager";
import { createTaskManager } from "../features/explorer/modules/TaskManager";
import { createUndoManager } from "../features/explorer/modules/UndoManager";
import { createResizeObserver } from "@solid-primitives/resize-observer";
import { useContextMenu } from "../hooks/useContextMenu";
import { useSettings } from "../hooks/useSettings";
import { fileSystem } from "../services/apiService";
import { BatchRenameConfig } from "../features/explorer/components/BatchRenameModal";

const MIN_GRID_ITEM_WIDTH = 120;

function createExplorerState() {
	const { iconPack, addFavorite } = useSettings();
	const contextMenu = useContextMenu();
	const nav = createNavigationManager();
	const folderSizes = useFolderSizes();
	const resources = createResourceManager({
		currentPath: nav.currentAbsolutePath,
		folderSizes: folderSizes.sizes,
	});
	const [gridWidth, setGridWidth] = createSignal(0);
	const gridColumns = createMemo(() => {
		if (resources.viewMode() === "list") return 1;
		return Math.floor(gridWidth() / MIN_GRID_ITEM_WIDTH) || 1;
	});

	const selection = createSelectionManager({
		files: resources.items,
		viewMode: resources.viewMode,
		gridColumns,
	});
	const tasks = createTaskManager();
	const ops = createFileSystemManager({
		refresh: resources.refresh,
		mutate: resources.mutate,
		runTask: tasks.runTask,
		onExecuted: (op, inverse) => undo.push(op, inverse),
	});
	const undo = createUndoManager({
		execute: (op) => ops.execute(op, true),
	});
	const dnd = createDragDropManager({
		execute: ops.execute,
	});

	const [promptConfig, setPromptConfig] = createSignal<PromptConfig | null>(
		null,
	);
	const [infoModal, setInfoModal] = createSignal<InfoModal | null>(null);
	const [batchRenameConfig, setBatchRenameConfig] =
		createSignal<BatchRenameConfig | null>(null);
	const [quickLookIds, setQuickLookIds] = createSignal<string[] | null>(null);
	const [isPaletteOpen, setIsPaletteOpen] = createSignal(false);

	const handleQuickLook = async (ids: string[] | null) => {
		if (!ids || ids.length === 0) {
			setQuickLookIds(null);
			return;
		}

		setQuickLookIds(ids);

		try {
			const winLabel = `quicklook-${crypto.randomUUID()}`;
			const win = new WebviewWindow(winLabel, {
				url: `/?window=quicklook&ids=${encodeURIComponent(ids.join(","))}`,
				title: "Quick Look",
				width: 900,
				height: 700,
				decorations: false,
				transparent: true,
				shadow: true,
			});
			await win.onCloseRequested(() => {
				setQuickLookIds(null);
			});
			await win.setFocus();
		} catch (e) {
			console.error("Failed to open Quick Look window", e);
		}
	};

	const handleOpen = async (id: string) => {
		const file = resources.items().find((f) => f.id === id);
		if (!file) return;
		if (file.type === "folder") {
			nav.navigate(id);
		} else {
			try {
				const winLabel = `editor-${crypto.randomUUID()}`;
				const win = new WebviewWindow(winLabel, {
					url: `/?window=editor&path=${encodeURIComponent(id)}`,
					title: file.name,
					width: 800,
					height: 600,
					decorations: false,
					transparent: true,
					shadow: true,
				});
				await win.setFocus();
			} catch (_e) {
				fileSystem.openItem(id).catch(console.error);
			}
		}
	};

	const { handleItemInteract } = useExplorerInteraction({
		selection,
		contextMenu,
	});

	const handleBackgroundInteract = (e: MouseEvent) => {
		if (e.type === "contextmenu") {
			selection.clear();
			contextMenu.open(e);
		} else if (e.type === "click") {
			selection.clear();
			contextMenu.close();
		}
	};

	const menuItems = useExplorerContextMenu({
		selection,
		ops,
		nav,
		resources,
		handlers: {
			onOpen: handleOpen,
			setPromptConfig,
			setInfoModal,
			setBatchRenameConfig,
			openInTerminal: fileSystem.openInTerminal,
			addFavorite,
		},
	});

	useExplorerKeyboard({
		selection,
		ops,
		nav,
		resources,
		undo,
		handlers: {
			handleOpen,
			setQuickLookFileId: handleQuickLook,
			quickLookFileId: quickLookIds,
			setIsPaletteOpen,
		},
	});

	useDirectoryWatcher({
		currentPath: nav.currentAbsolutePath,
		onChanged: resources.refresh,
	});

	useExternalDragDrop({
		currentPath: nav.currentAbsolutePath,
		onSuccess: resources.refresh,
	});

	createEffect(() => {
		nav.currentPath();
		selection.clear();
		resources.setSearchQuery("");
		folderSizes.clearCache();
		setQuickLookIds(null);
	});

	const menuBarMenus = useMenuBarMenus({
		selection,
		ops,
		nav,
		resources,
		undo,
		handlers: {
			setPromptConfig,
			setBatchRenameConfig,
		},
	});

	useNativeMenuListener({
		selection,
		ops,
		nav,
		resources,
		undo,
		handlers: {
			setPromptConfig,
		},
	});

	const paletteCommands = useCommandPalette({
		selection,
		items: resources.items,
		ops,
		nav,
		resources,
		undo,
		handlers: {
			setPromptConfig,
			setInfoModal,
			setBatchRenameConfig,
		},
	});

	return {
		selection,
		ops,
		nav,
		resources,
		undo,
		dnd,
		tasks,
		iconPack,
		folderSizes,
		fetchMetadata: resources.fetchMetadata,
		contextMenu,
		promptConfig,
		setPromptConfig,
		infoModal,
		setInfoModal,
		batchRenameConfig,
		setBatchRenameConfig,
		isPaletteOpen,
		setIsPaletteOpen,
		paletteCommands,
		quickLookIds,
		setQuickLookIds,
		menuItems,
		menuBarMenus,
		handleItemInteract,
		setGridWidth,
		handlers: { onOpen: handleOpen },
		handleBackgroundInteract,
	};
}

/**
 * Explorer Page
 * Smart Container orchestrating specialized logic.
 * Adheres to Separation of Concerns, KISS, and DRY.
 */
export default function Explorer() {
	const state = createExplorerState();
	let browserRef: HTMLDivElement | undefined;

	createResizeObserver(
		() => browserRef,
		({ width }) => state.setGridWidth(width),
	);

	return (
		<ExplorerProvider value={state}>
			<div class="root-view">
				<MenuBar menus={state.menuBarMenus()} iconPack={state.iconPack()} />
				<div class="app-container">
					<Sidebar
						activeLocation={state.nav.currentPath()}
						setActiveLocation={state.nav.navigate}
						locations={state.nav.locations() || []}
						storage={state.nav.storage()}
						onMove={(sourceIds, targetId) =>
							state.ops.execute({
								type: "move",
								sourceIds,
								targetDirId: targetId,
							})
						}
					/>

					<main class="main-content">
						<TabBar
							tabs={state.nav.tabs()}
							activeIndex={state.nav.activeTabIndex()}
							onSelect={state.nav.setActiveTab}
							onClose={state.nav.closeTab}
							onAdd={() => state.nav.addTab()}
							onMove={state.nav.moveTab}
							iconPack={state.iconPack()}
							getPathLabel={state.nav.getLabel}
						/>

						<Toolbar
							activeLocation={state.nav.currentPath()}
							activeLocationLabel={state.nav.activeLocationLabel()}
							currentAbsolutePath={state.nav.currentAbsolutePath()}
							onNavigate={state.nav.navigate}
							viewMode={state.resources.viewMode()}
							setViewMode={state.resources.setViewMode}
							searchQuery={state.resources.searchQuery()}
							setSearchQuery={state.resources.setSearchQuery}
							iconPack={state.iconPack()}
							canGoBack={state.nav.canGoBack()}
							canGoForward={state.nav.canGoForward()}
							onBack={state.nav.goBack}
							onForward={state.nav.goForward}
							sortBy={state.resources.sortBy()}
							setSortBy={state.resources.setSortBy}
							sortOrder={state.resources.sortOrder()}
							setSortOrder={state.resources.setSortOrder}
							separateFolders={state.resources.separateFolders()}
							setSeparateFolders={state.resources.setSeparateFolders}
							showHidden={state.resources.showHidden()}
							setShowHidden={state.resources.setShowHidden}
						/>

						<div class="browser-wrapper" ref={browserRef}>
							<FileBrowser
								files={state.resources.items()}
								viewMode={state.resources.viewMode()}
								onItemInteract={state.handleItemInteract}
								onBackgroundInteract={state.handleBackgroundInteract}
								onNavigate={state.nav.navigate}
								iconPack={state.iconPack}
							/>
						</div>

						<StatusBar
							itemCount={state.resources.items().length}
							selectionCount={state.selection.selectedIds().length}
							selectedSize={state.selection.selectedIds().reduce((acc, id) => {
								const item = state.resources.items().find((f) => f.id === id);
								if (!item) return acc;
								const itemSize =
									item.type === "folder"
										? state.folderSizes.sizes()[id] || 0
										: item.size;
								return acc + itemSize;
							}, 0)}
							fileCount={state.resources
								.items()
								.reduce(
									(count, f) => (f.type === "file" ? count + 1 : count),
									0,
								)}
							folderCount={state.resources
								.items()
								.reduce(
									(count, f) => (f.type === "folder" ? count + 1 : count),
									0,
								)}
							searchQuery={state.resources.searchQuery()}
						/>
					</main>
				</div>

				<ExplorerModals
					infoModal={state.infoModal()}
					setInfoModal={state.setInfoModal}
					promptConfig={state.promptConfig()}
					setPromptConfig={state.setPromptConfig}
					batchRenameConfig={state.batchRenameConfig()}
					setBatchRenameConfig={state.setBatchRenameConfig}
					isPaletteOpen={state.isPaletteOpen()}
					setIsPaletteOpen={state.setIsPaletteOpen}
					paletteCommands={state.paletteCommands()}
					iconPack={state.iconPack()}
				/>

				<ContextMenu
					x={state.contextMenu.pos().x}
					y={state.contextMenu.pos().y}
					visible={state.contextMenu.visible()}
					onClose={state.contextMenu.close}
					items={state.menuItems()}
					iconPack={state.iconPack()}
				/>

				<TaskDrawer />
			</div>
		</ExplorerProvider>
	);
}
