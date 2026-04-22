import { batch, createEffect, createMemo, createSignal } from "solid-js";

const STORAGE_KEY = "seeker-nav-history";

interface PersistedHistory {
	history: string[];
	index: number;
}

function loadPersistedHistory(fallback: string): PersistedHistory {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const data = JSON.parse(raw) as PersistedHistory;
			if (
				Array.isArray(data.history) &&
				data.history.length > 0 &&
				typeof data.index === "number" &&
				data.index >= 0 &&
				data.index < data.history.length
			) {
				return data;
			}
		}
	} catch {
		// Corrupted data, fall through
	}
	return { history: [fallback], index: 0 };
}

export function useHistory(initialPath: string = "home") {
	const persisted = loadPersistedHistory(initialPath);

	const [history, setHistory] = createSignal<string[]>(persisted.history);
	const [currentIndex, setCurrentIndex] = createSignal(persisted.index);

	const currentPath = createMemo(() => history()[currentIndex()]);

	const canGoBack = createMemo(() => currentIndex() > 0);
	const canGoForward = createMemo(() => currentIndex() < history().length - 1);

	// Persist to localStorage whenever history or index changes
	createEffect(() => {
		const data: PersistedHistory = {
			history: history(),
			index: currentIndex(),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	});

	const push = (path: string) => {
		if (path === currentPath()) return;

		batch(() => {
			const nextHistory = history().slice(0, currentIndex() + 1);
			setHistory([...nextHistory, path]);
			setCurrentIndex(nextHistory.length);
		});
	};

	const goBack = () => {
		if (canGoBack()) {
			setCurrentIndex(currentIndex() - 1);
		}
	};

	const goForward = () => {
		if (canGoForward()) {
			setCurrentIndex(currentIndex() + 1);
		}
	};

	const setIndex = (index: number) => {
		if (index >= 0 && index < history().length) {
			setCurrentIndex(index);
		}
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
		history,
		currentIndex,
		setIndex,
	};
}
