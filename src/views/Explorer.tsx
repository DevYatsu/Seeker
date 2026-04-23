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

// Logic Hooks & Context
import { ExplorerProvider } from "../features/explorer/context/ExplorerContext";
import { useDirectoryWatcher } from "../features/explorer/hooks/useDirectoryWatcher";
import { useExplorerContextMenu } from "../features/explorer/hooks/useExplorerContextMenu";
import { useExplorerData } from "../features/explorer/hooks/useExplorerData";
import { useExplorerInteraction } from "../features/explorer/hooks/useExplorerInteraction";
import { useExplorerKeyboard } from "../features/explorer/hooks/useExplorerKeyboard";
import { useExplorerNavigation } from "../features/explorer/hooks/useExplorerNavigation";
import { useExplorerState } from "../features/explorer/hooks/useExplorerState";
import { useExternalDragDrop } from "../features/explorer/hooks/useExternalDragDrop";
import { useFileOperations } from "../features/explorer/hooks/useFileOperations";
import { useFolderSizes } from "../features/explorer/hooks/useFolderSizes";
import { useSelectionLogic } from "../features/explorer/hooks/useSelectionLogic";
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
	const state = useExplorerState();
	const nav = useExplorerNavigation();

	const data = useExplorerData({
		currentPath: nav.currentAbsolutePath,
		refreshTrigger: state.refreshTrigger,
		searchQuery: state.searchQuery,
		sortBy: state.sortBy,
		sortOrder: state.sortOrder,
		separateFolders: state.separateFolders,
		showHidden: state.showHidden,
	});

	const selection = useSelectionLogic(data.displayedFiles);
	const folderSizes = useFolderSizes();
	const ops = useFileOperations({
		currentRoot: nav.currentAbsolutePath,
		refresh: state.refresh,
		mutate: data.mutate,
	});

	const [promptConfig, setPromptConfig] = createSignal<PromptConfig | null>(
		null,
	);
	const [infoModal, setInfoModal] = createSignal<InfoModal | null>(null);
	const [quickLookId, setQuickLookId] = createSignal<string | null>(null);

	const quickLookFile = createMemo(() => {
		const id = quickLookId();
		return id ? data.displayedFiles().find((f) => f.id === id) || null : null;
	});

	// --- 2. Action Handlers ---
	const { handleItemInteract } = useExplorerInteraction({
		selection,
		contextMenu,
	});

	const handleOpen = async (id: string) => {
		const file = data.displayedFiles().find((f) => f.id === id);
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
		ops: {
			clipboard: ops.clipboard,
			clipboardMode: ops.clipboardMode,
			handleMove: ops.handleMove,
		},
		iconPack,
		folderSizes,
		handlers: { onOpen: handleOpen },
	};

	// --- 4. Logic Orchestration Hooks ---
	const menuItems = useExplorerContextMenu({
		selection,
		ops,
		nav,
		data,
		handlers: {
			onOpen: handleOpen,
			setPromptConfig,
			setInfoModal,
			openInTerminal: fileSystem.openInTerminal,
			refresh: state.refresh,
			addFavorite,
		},
	});

	useExplorerKeyboard({
		selection,
		ops,
		nav,
		state,
		handlers: {
			handleOpen,
			setQuickLookFileId: setQuickLookId,
			quickLookFileId: quickLookId,
		},
		getGridColumns: () => getGridColumns(".folder-grid, .file-grid"),
	});

	useDirectoryWatcher({
		currentPath: nav.currentAbsolutePath,
		onChanged: state.refresh,
	});

	useExternalDragDrop({
		currentPath: nav.currentAbsolutePath,
		onSuccess: state.refresh,
	});

	createEffect(() => {
		nav.history.currentPath;
		selection.clearSelection();
		state.setSearchQuery("");
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
						activeLocation={nav.history.currentPath}
						setActiveLocation={nav.navigate}
						locations={nav.locations() || []}
						onMove={ops.handleMove}
					/>

					<main class="main-content">
						<TabBar
							tabs={nav.history.tabs()}
							activeIndex={nav.history.activeTabIndex()}
							onSelect={nav.history.setActiveTab}
							onClose={nav.history.closeTab}
							onAdd={() => nav.history.addTab()}
							onMove={nav.history.moveTab}
							iconPack={iconPack()}
							getPathLabel={nav.getLabel}
						/>

						<Toolbar
							activeLocation={nav.history.currentPath}
							activeLocationLabel={nav.activeLocationLabel()}
							currentAbsolutePath={nav.currentAbsolutePath()}
							onNavigate={nav.navigate}
							viewMode={state.viewMode()}
							setViewMode={state.setViewMode}
							searchQuery={state.searchQuery()}
							setSearchQuery={state.setSearchQuery}
							iconPack={iconPack()}
							canGoBack={nav.history.canGoBack}
							canGoForward={nav.history.canGoForward}
							onBack={nav.history.goBack}
							onForward={nav.history.goForward}
							sortBy={state.sortBy()}
							setSortBy={state.setSortBy}
							sortOrder={state.sortOrder()}
							setSortOrder={state.setSortOrder}
							separateFolders={state.separateFolders()}
							setSeparateFolders={state.setSeparateFolders}
							showHidden={state.showHidden()}
							setShowHidden={state.setShowHidden}
						/>

						<div class="browser-wrapper">
							<Suspense fallback={<LoadingOverlay active={true} />}>
								<FileBrowser
									files={data.displayedFiles()}
									viewMode={state.viewMode()}
									onItemInteract={handleItemInteract}
									onBackgroundInteract={() => selection.clearSelection()}
								/>
							</Suspense>
							<LoadingOverlay active={nav.isPending() || state.isLoading} />
						</div>

						<StatusBar
							itemCount={data.displayedFiles().length}
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
							file={file}
							onClose={() => setQuickLookId(null)}
							iconPack={iconPack()}
						/>
					)}
				</Show>
			</div>
		</ExplorerProvider>
	);
}
