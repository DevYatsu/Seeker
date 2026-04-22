import { batch, createEffect, createMemo, createSignal } from "solid-js";

const STORAGE_KEY = "seeker-nav-tabs";

export interface TabHistory {
	id: string;
	history: string[];
	index: number;
}

interface PersistedTabs {
	tabs: TabHistory[];
	activeIndex: number;
}

function generateTabId() {
	return Math.random().toString(36).substring(2, 9);
}

function loadPersistedTabs(fallback: string): PersistedTabs {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const data = JSON.parse(raw) as PersistedTabs;
			if (
				Array.isArray(data.tabs) &&
				data.tabs.length > 0 &&
				typeof data.activeIndex === "number" &&
				data.activeIndex >= 0 &&
				data.activeIndex < data.tabs.length
			) {
				return data;
			}
		}
	} catch {
		// Corrupted data, fall through
	}
	return {
		tabs: [{ id: generateTabId(), history: [fallback], index: 0 }],
		activeIndex: 0,
	};
}

export function useTabs(initialPath: string = "home") {
	const persisted = loadPersistedTabs(initialPath);

	const [tabs, setTabs] = createSignal<TabHistory[]>(persisted.tabs);
	const [activeTabIndex, setActiveTabIndex] = createSignal(persisted.activeIndex);

	const activeTab = createMemo(() => tabs()[activeTabIndex()]);

	const currentPath = createMemo(() => activeTab().history[activeTab().index]);

	const canGoBack = createMemo(() => activeTab().index > 0);
	const canGoForward = createMemo(() => activeTab().index < activeTab().history.length - 1);

	// Persist to localStorage whenever tabs or index changes
	createEffect(() => {
		const data: PersistedTabs = {
			tabs: tabs(),
			activeIndex: activeTabIndex(),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	});

	const push = (path: string) => {
		if (path === currentPath()) return;

		batch(() => {
			setTabs((prev) => {
				const newTabs = [...prev];
				const tab = newTabs[activeTabIndex()];
				const nextHistory = tab.history.slice(0, tab.index + 1);
				newTabs[activeTabIndex()] = {
					...tab,
					history: [...nextHistory, path],
					index: nextHistory.length,
				};
				return newTabs;
			});
		});
	};

	const goBack = () => {
		if (canGoBack()) {
			setTabs((prev) => {
				const newTabs = [...prev];
				const tab = newTabs[activeTabIndex()];
				newTabs[activeTabIndex()] = { ...tab, index: tab.index - 1 };
				return newTabs;
			});
		}
	};

	const goForward = () => {
		if (canGoForward()) {
			setTabs((prev) => {
				const newTabs = [...prev];
				const tab = newTabs[activeTabIndex()];
				newTabs[activeTabIndex()] = { ...tab, index: tab.index + 1 };
				return newTabs;
			});
		}
	};

	const addTab = (path: string = currentPath()) => {
		batch(() => {
			setTabs((prev) => [...prev, { id: generateTabId(), history: [path], index: 0 }]);
			setActiveTabIndex(tabs().length - 1);
		});
	};

	const closeTab = (index: number) => {
		batch(() => {
			const currentTabs = tabs();
			if (currentTabs.length <= 1) return; // Prevent closing the last tab

			const newTabs = [...currentTabs];
			newTabs.splice(index, 1);
			setTabs(newTabs);

			if (activeTabIndex() >= index && activeTabIndex() > 0) {
				setActiveTabIndex(activeTabIndex() - 1);
			}
		});
	};

	const setActiveTab = (index: number) => {
		if (index >= 0 && index < tabs().length) {
			setActiveTabIndex(index);
		}
	};

	const moveTab = (fromIndex: number, toIndex: number) => {
		batch(() => {
			const newTabs = [...tabs()];
			const [moved] = newTabs.splice(fromIndex, 1);
			newTabs.splice(toIndex, 0, moved);
			setTabs(newTabs);

			// Update active index
			if (activeTabIndex() === fromIndex) {
				setActiveTabIndex(toIndex);
			} else if (activeTabIndex() > fromIndex && activeTabIndex() <= toIndex) {
				setActiveTabIndex(activeTabIndex() - 1);
			} else if (activeTabIndex() < fromIndex && activeTabIndex() >= toIndex) {
				setActiveTabIndex(activeTabIndex() + 1);
			}
		});
	};

	return {
		get currentPath() {
			return currentPath();
		},
		get canGoBack() {
			return canGoBack();
		},
		get canGoForward() {
			return canGoForward();
		},
		push,
		goBack,
		goForward,
		tabs,
		activeTabIndex,
		setActiveTab,
		addTab,
		closeTab,
		moveTab,
	};
}
