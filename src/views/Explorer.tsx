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
import TitleBar from "../components/TitleBar";
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
// Global Hooks & Services
import { useContextMenu } from "../hooks/useContextMenu";
import { useSettings } from "../hooks/useSettings";
import { fileSystem } from "../services/apiService";
import { getGridColumns } from "../utils/ui";

/**
 * Explorer Page
 * Smart Container orchestrating specialized logic.
 * Adheres to Separation of Concerns, KISS, and DRY.
 */
export default function Explorer() {
	// --- 1. State Orchestration ---
	const { iconPack, addFavorite } = useSettings();
	const contextMenu = useContextMenu();
	const nav = createNavigationManager();
	const folderSizes = useFolderSizes();
	const resources = createResourceManager({
		currentPath: nav.currentAbsolutePath,
	});

	const selection = createSelectionManager({
		files: resources.items,
		viewMode: resources.viewMode,
		gridColumns: () => getGridColumns(".folder-grid, .file-grid"),
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
	const [quickLookId, setQuickLookId] = createSignal<string | null>(null);

	const quickLookFile = createMemo(() => {
		const id = quickLookId();
		return id ? resources.items().find((f) => f.id === id) || null : null;
	});

	// --- 2. Action Handlers ---
	const { handleItemInteract } = useExplorerInteraction({
		selection,
		contextMenu,
	});

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

	// --- 3. Composite State (Context Value) ---
	const explorerContextValue = {
		selection,
		ops,
		nav,
		resources,
		undo,
		dnd,
		tasks,
		iconPack,
		folderSizes,
		handlers: { onOpen: handleOpen },
	};

	// --- 4. Logic Orchestration Hooks ---
	const menuItems = useExplorerContextMenu({
		selection,
		ops,
		nav,
		resources,
		handlers: {
			onOpen: handleOpen,
			setPromptConfig,
			setInfoModal,
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
			setQuickLookFileId: setQuickLookId,
			quickLookFileId: quickLookId,
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
		setQuickLookId(null);
	});

	// --- 5. Render ---
	return (
		<ExplorerProvider value={explorerContextValue}>
			<div class="root-view" classList={{ "is-navigating": nav.isPending() }}>
				<TitleBar />

				<div class="app-container">
					<Sidebar
						activeLocation={nav.currentPath()}
						setActiveLocation={nav.navigate}
						locations={nav.locations() || []}
						onMove={(sourceIds, targetId) =>
							ops.execute({ type: "move", sourceIds, targetDirId: targetId })
						}
					/>

					<main class="main-content">
						<TabBar
							tabs={nav.tabs()}
							activeIndex={nav.activeTabIndex()}
							onSelect={nav.setActiveTab}
							onClose={nav.closeTab}
							onAdd={() => nav.addTab()}
							onMove={nav.moveTab}
							iconPack={iconPack()}
							getPathLabel={nav.getLabel}
						/>

						<Toolbar
							activeLocation={nav.currentPath()}
							activeLocationLabel={nav.activeLocationLabel()}
							currentAbsolutePath={nav.currentAbsolutePath()}
							onNavigate={nav.navigate}
							viewMode={resources.viewMode()}
							setViewMode={resources.setViewMode}
							searchQuery={resources.searchQuery()}
							setSearchQuery={resources.setSearchQuery}
							iconPack={iconPack()}
							canGoBack={nav.canGoBack()}
							canGoForward={nav.canGoForward()}
							onBack={nav.goBack}
							onForward={nav.goForward}
							sortBy={resources.sortBy()}
							setSortBy={resources.setSortBy}
							sortOrder={resources.sortOrder()}
							setSortOrder={resources.setSortOrder}
							separateFolders={resources.separateFolders()}
							setSeparateFolders={resources.setSeparateFolders}
							showHidden={resources.showHidden()}
							setShowHidden={resources.setShowHidden}
						/>

						<div class="browser-wrapper">
							<Suspense fallback={<LoadingOverlay active={true} />}>
								<FileBrowser
									files={resources.items()}
									viewMode={resources.viewMode()}
									onItemInteract={handleItemInteract}
									onBackgroundInteract={() => selection.clear()}
								/>
							</Suspense>

							<LoadingOverlay active={nav.isPending() || resources.isLoading()} />
						</div>

						<StatusBar
							itemCount={resources.items().length}
							selectionCount={selection.selectedIds().length}
						/>
					</main>
				</div>

				<ExplorerModals
					infoModal={infoModal()}
					setInfoModal={setInfoModal}
					promptConfig={promptConfig()}
					setPromptConfig={setPromptConfig}
					iconPack={iconPack()}
				/>

				<ContextMenu
					x={contextMenu.pos().x}
					y={contextMenu.pos().y}
					visible={contextMenu.visible()}
					onClose={contextMenu.close}
					items={menuItems()}
					iconPack={iconPack()}
				/>

				<Show when={quickLookFile()}>
					{(file) => (
						<QuickLook
							file={file()}
							onClose={() => setQuickLookId(null)}
							iconPack={iconPack()}
						/>
					)}
				</Show>
				<TaskDrawer />
			</div>
		</ExplorerProvider>
	);
}
