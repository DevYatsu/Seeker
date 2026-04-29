// src/features/explorer/modules/NavigationManager.ts
import { makePersisted } from "@solid-primitives/storage";
import { batch, createMemo, createResource, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { fileSystem } from "../../../services/apiService";

export interface TabHistory {
	id: string;
	history: string[];
	index: number;
}

function generateTabId() {
	return Math.random().toString(36).substring(2, 9);
}

const BASE_STORAGE_KEY = "seeker-nav-tabs";

/**
 * Explorer Orchestrator Module (NavigationManager)
 */
export function createNavigationManager() {
	// 0. Detect Window and Initial Path
	const params = new URLSearchParams(window.location.search);
	const initialPath = params.get("path");
	const windowLabel =
		(window as any).__TAURI_INTERNALS__?.metadata?.windowLabel || "main";
	const storageKey = `${BASE_STORAGE_KEY}-${windowLabel}`;

	// 1. Raw Tab State
	const defaultTabs: TabHistory[] = initialPath
		? [{ id: generateTabId(), history: [initialPath], index: 0 }]
		: [{ id: generateTabId(), history: ["home"], index: 0 }];

	const [tabs, setTabs] = makePersisted(
		createStore<TabHistory[]>(defaultTabs),
		{ name: storageKey },
	);

	const [activeTabIndex, setActiveTabIndex] = makePersisted(createSignal(0), {
		name: `${storageKey}-index`,
	});

	// If initialPath was provided, force navigation for the active tab if it's the first run
	if (
		initialPath &&
		tabs.length === 1 &&
		tabs[0].history.length === 1 &&
		tabs[0].history[0] === "home"
	) {
		setTabs(0, "history", [initialPath]);
	}

	// 2. Async Locations (Bookmarks/Drives)
	const [locations] = createResource(() => fileSystem.getUserLocations());
	const [storage] = createResource(() => fileSystem.getStorageStats());

	// 3. Derived State
	const activeTab = createMemo(() => {
		const index = activeTabIndex();
		return (
			tabs[index] || tabs[0] || { id: "default", history: ["home"], index: 0 }
		);
	});

	const currentPath = createMemo(() => {
		const tab = activeTab();
		return tab.history[tab.index] || "home";
	});

	const currentAbsolutePath = createMemo(() => {
		const locs = locations();
		const path = currentPath();

		// Symbolic ID (no path separator) — needs location mapping
		if (!path.includes("/") && !path.includes("\\")) {
			if (!locs) return ""; // locations still loading — return empty string, not null
			const loc = locs.find((l) => l.id === path);
			return loc ? loc.path : path;
		}

		return path;
	});

	const canGoBack = createMemo(() => activeTab().index > 0);
	const canGoForward = createMemo(() => {
		const tab = activeTab();
		return tab.index < tab.history.length - 1;
	});

	// 4. Methods
	const navigate = (path: string) => {
		if (path === currentPath()) return;

		setTabs(
			activeTabIndex(),
			produce((tab) => {
				tab.history = [...tab.history.slice(0, tab.index + 1), path];
				tab.index = tab.history.length - 1;
			}),
		);
	};

	const goBack = () => {
		if (canGoBack()) {
			setTabs(activeTabIndex(), "index", (i) => i - 1);
		}
	};

	const goForward = () => {
		if (canGoForward()) {
			setTabs(activeTabIndex(), "index", (i) => i + 1);
		}
	};

	const addTab = (path: string = currentPath()) => {
		batch(() => {
			const newId = generateTabId();
			setTabs(tabs.length, { id: newId, history: [path], index: 0 });
			setActiveTabIndex(tabs.length - 1);
		});
	};

	const closeTab = (index: number) => {
		if (tabs.length <= 1) return;
		batch(() => {
			setTabs((prev) => prev.filter((_, i) => i !== index));
			const currentIndex = activeTabIndex();
			if (currentIndex >= index) {
				setActiveTabIndex(Math.max(0, currentIndex - 1));
			}
		});
	};

	const moveTab = (fromIndex: number, toIndex: number) => {
		batch(() => {
			const tabToMove = { ...tabs[fromIndex] };
			setTabs(
				produce((state) => {
					state.splice(fromIndex, 1);
					state.splice(toIndex, 0, tabToMove);
				}),
			);

			if (activeTabIndex() === fromIndex) {
				setActiveTabIndex(toIndex);
			} else if (activeTabIndex() > fromIndex && activeTabIndex() <= toIndex) {
				setActiveTabIndex(activeTabIndex() - 1);
			} else if (activeTabIndex() < fromIndex && activeTabIndex() >= toIndex) {
				setActiveTabIndex(activeTabIndex() + 1);
			}
		});
	};

	const getLabel = (path: string) => {
		if (!path) return ""; // handles the "" loading state
		const locs = locations() || [];
		const disks = storage()?.disks || [];

		const allLocs = [
			...locs,
			...disks.map((d) => ({
				id: d.mount_point,
				path: d.mount_point,
				label: d.name || (d.mount_point === "/" ? "Root" : d.mount_point),
			})),
		];

		const bestLoc = allLocs
			.filter((l) => path.startsWith(l.path))
			.sort((a, b) => b.path.length - a.path.length)[0];

		if (bestLoc) {
			if (path === bestLoc.path) return bestLoc.label;
			const relative = path.slice(bestLoc.path.length).replace(/^[\\/]/, "");
			if (!relative) return bestLoc.label;

			const parts = relative.split(/[\\/]/).filter(Boolean);
			if (parts.length > 2) {
				const intermediate = parts
					.slice(0, -1)
					.map((p) => p.charAt(0).toUpperCase());
				return `${bestLoc.label} / ${intermediate.join(" / ")} / ${parts[parts.length - 1]}`;
			}
			return `${bestLoc.label} / ${parts.join(" / ")}`;
		}
		return path.length > 35 ? `...${path.slice(-32)}` : path;
	};

	const activeLocationLabel = createMemo(() => getLabel(currentAbsolutePath()));

	const isTrash = createMemo(() => {
		const path = currentPath();
		return path === "trash" || path.startsWith("trash/");
	});

	return {
		// State
		tabs: () => tabs,
		activeTabIndex,
		currentPath,
		currentAbsolutePath,
		canGoBack,
		canGoForward,
		locations,
		storage,
		activeLocationLabel,
		isTrash,

		// Actions
		navigate,
		goBack,
		goForward,
		addTab,
		closeTab,
		moveTab,
		getLabel,
		setActiveTab: setActiveTabIndex,
	};
}
