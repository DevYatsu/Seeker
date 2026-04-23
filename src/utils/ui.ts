/**
 * Utility for UI-related measurements and calculations.
 */

/**
 * Estimates the number of columns in a CSS grid container.
 * @param selector CSS selector for the grid container
 * @returns Number of columns or 1 as fallback
 */
export function getGridColumns(selector: string): number {
	const grid = document.querySelector(selector);
	if (!grid) return 1;
	const style = getComputedStyle(grid);
	const cols = style.gridTemplateColumns.split(" ").length;
	return cols || 1;
}

/**
 * Detects selection modifiers (multi/range) from an event.
 */
export function getSelectionModifiers(e: MouseEvent | KeyboardEvent) {
	const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	const multi = e.metaKey || (!isMac && e.ctrlKey);
	const range = e.shiftKey;
	return { multi, range };
}
