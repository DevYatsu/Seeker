import { createSignal } from "solid-js";
import { fileSystem } from "../../../services/apiService";

/**
 * Hook to manage folder size calculations and caching.
 */
export function useFolderSizes() {
	const [sizes, setSizes] = createSignal<Record<string, number>>({});
	const [calculating, setCalculating] = createSignal<Set<string>>(new Set());

	const calculateSize = async (path: string) => {
		// Avoid double calculations
		if (calculating().has(path)) return;
		if (sizes()[path] !== undefined) return;

		setCalculating((prev) => {
			const next = new Set(prev);
			next.add(path);
			return next;
		});

		try {
			const size = await fileSystem.calculateDirSize(path);
			setSizes((prev) => ({ ...prev, [path]: size }));
		} catch (error) {
			console.error(`Failed to calculate size for ${path}:`, error);
		} finally {
			setCalculating((prev) => {
				const next = new Set(prev);
				next.delete(path);
				return next;
			});
		}
	};

	const clearCache = () => {
		setSizes({});
		setCalculating(new Set());
	};

	return {
		sizes,
		calculating,
		calculateSize,
		clearCache,
	};
}
