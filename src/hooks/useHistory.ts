import { createSignal, createMemo, batch } from "solid-js";

export function useHistory(initialPath: string = "home") {
  const [history, setHistory] = createSignal<string[]>([initialPath]);
  const [currentIndex, setCurrentIndex] = createSignal(0);

  const currentPath = createMemo(() => history()[currentIndex()]);

  const canGoBack = createMemo(() => currentIndex() > 0);
  const canGoForward = createMemo(() => currentIndex() < history().length - 1);

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
    get currentPath() { return currentPath(); },
    get canGoBack() { return canGoBack(); },
    get canGoForward() { return canGoForward(); },
    push,
    goBack,
    goForward,
    history,
    currentIndex,
    setIndex,
  };
}
