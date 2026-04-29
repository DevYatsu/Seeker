import { makePersisted } from "@solid-primitives/storage";
import {
	batch,
	createMemo,
	createResource,
	createSignal,
	useTransition,
	type Accessor,
} from "solid-js";
import { fileSystem } from "../../../services/apiService";

export interface TabHistory {
	id: string;
	history: string[];
	index: number;
}

function generateTabId() {
	return Math.random().toString(36).substring(2, 9);
}

const STORAGE_KEY = "seeker-nav-tabs";

/**
 * Explorer Orchestrator Module (NavigationManager)
 *
 * Depth: High. Unifies tab management, history, and path resolution.
 * Leverage: Single module for all navigation needs. Handles persistence and async resolution.
 * Locality: All logic for path labels, trash detection, and tab lifecycle lives here.
 */
export function createNavigationManager() {
	const [isPending, startTransition] = useTransition();

	// 1. Raw Tab State
	const [tabs, setTabs] = makePersisted(
		createSignal<TabHistory[]>([
			{ id: generateTabId(), history: ["home"], index: 0 },
		]),
		{ name: STORAGE_KEY },
	);

	const [activeTabIndex, setActiveTabIndex] = makePersisted(createSignal(0), {
		name: `${STORAGE_KEY}-index`,
	});

	// 2. Async Locations (Bookmarks/Drives)
	const [locations] = createResource(() => fileSystem.getUserLocations());

	// 3. Derived State
	const activeTab = createMemo(() => {
		const currentTabs = tabs() || [];
		const index = activeTabIndex();
		const fallback = { id: "default", history: ["home"], index: 0 };
		return currentTabs[index] || currentTabs[0] || fallback;
	});

	const currentPath = createMemo(() => {
		const tab = activeTab();
		return tab.history[tab.index] || "home";
	});

	const currentAbsolutePath = createMemo(() => {
		const locs = locations() || [];
		const path = currentPath();
		const loc = locs.find((l) => l.id === path);
		return loc ? loc.path : path;
	});

	const canGoBack = createMemo(() => activeTab().index > 0);
	const canGoForward = createMemo(() => {
		const tab = activeTab();
		return tab.index < tab.history.length - 1;
	});

	const isTrash = createMemo(() => {
		const locs = locations() || [];
		const loc = locs.find((l) => l.id === "trash");
		const path = currentPath();
		return loc ? path === loc.id || path === loc.path : false;
	});

	// 4. Methods
	const navigate = (path: string) => {
		if (path === currentPath()) return;

		setTabs((prev) => {
			const current = Array.isArray(prev) && prev.length > 0 ? prev : [{ id: generateTabId(), history: ["home"], index: 0 }];
			const newTabs = [...current];
			let index = activeTabIndex();
			if (index < 0 || index >= newTabs.length) index = 0;

			const tab = newTabs[index];
			const nextHistory = tab.history.slice(0, tab.index + 1);

			newTabs[index] = {
				...tab,
				history: [...nextHistory, path],
				index: nextHistory.length,
			};
			return newTabs;
		});
	};

	const goBack = () => {
		if (canGoBack()) {
			setTabs((prev) => {
				const current = Array.isArray(prev) ? prev : [];
				const newTabs = [...current];
				const tab = newTabs[activeTabIndex()];
				if (!tab) return current;
				newTabs[activeTabIndex()] = { ...tab, index: tab.index - 1 };
				return newTabs;
			});
		}
	};

	const goForward = () => {
		if (canGoForward()) {
			setTabs((prev) => {
				const current = Array.isArray(prev) ? prev : [];
				const newTabs = [...current];
				const tab = newTabs[activeTabIndex()];
				if (!tab) return current;
				newTabs[activeTabIndex()] = { ...tab, index: tab.index + 1 };
				return newTabs;
			});
		}
	};

	const addTab = (path: string = currentPath()) => {
		batch(() => {
			let nextIndex = 0;
			setTabs((prev) => {
				const current = Array.isArray(prev) ? prev : [];
				const next = [
					...current,
					{ id: generateTabId(), history: [path], index: 0 },
				];
				nextIndex = next.length - 1;
				return next;
			});
			setActiveTabIndex(nextIndex);
		});
	};

	const closeTab = (index: number) => {
		batch(() => {
			const currentTabs = tabs() || [];
			if (currentTabs.length <= 1) return;

			const newTabs = currentTabs.filter((_, i) => i !== index);
			setTabs(newTabs);

			// Adjust active index
			const currentIndex = activeTabIndex();
			if (currentIndex >= index) {
				const nextIndex = Math.max(0, currentIndex - 1);
				setActiveTabIndex(nextIndex);
			}
		});
	};

	const moveTab = (fromIndex: number, toIndex: number) => {
		batch(() => {
			const newTabs = [...tabs()];
			const [moved] = newTabs.splice(fromIndex, 1);
			newTabs.splice(toIndex, 0, moved);
			setTabs(newTabs);

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
		const locs = locations() || [];
		const bestLoc = locs
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

	return {
		// State
		tabs,
		activeTabIndex,
		currentPath,
		currentAbsolutePath,
		canGoBack,
		canGoForward,
		isPending,
		isTrash,
		locations,
		activeLocationLabel,

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
