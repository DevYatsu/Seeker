interface ToolbarOptions {
	sortBy: "name" | "size" | "date";
	setSortBy: (val: "name" | "size" | "date") => void;
	sortOrder: "asc" | "desc";
	setSortOrder: (val: "asc" | "desc") => void;
	separateFolders: boolean;
	setSeparateFolders: (val: boolean) => void;
	showHidden: boolean;
	setShowHidden: (val: boolean) => void;
	currentAbsolutePath: string;
	activeLocationLabel: string;
}

/** Split an absolute path into clickable breadcrumb segments */
export function buildBreadcrumbs(
	absPath: string,
	label: string,
): { name: string; path: string }[] {
	if (!absPath || absPath === "home") return [{ name: label, path: absPath }];

	const parts = absPath.split("/").filter(Boolean);
	if (parts.length === 0) return [{ name: "/", path: "/" }];

	const segments: { name: string; path: string }[] = [];
	for (let i = 0; i < parts.length; i++) {
		segments.push({
			name: parts[i],
			path: `/${parts.slice(0, i + 1).join("/")}`,
		});
	}

	if (segments.length > 3) {
		return [
			{ name: "…", path: segments[segments.length - 4].path },
			...segments.slice(-3),
		];
	}

	return segments;
}

/**
 * Logic hook for Toolbar.
 * Encapsulates breadcrumb logic and toggle handlers.
 */
export function useToolbar(opts: ToolbarOptions) {
	const breadcrumbs = () =>
		buildBreadcrumbs(opts.currentAbsolutePath, opts.activeLocationLabel);

	const toggleSortOrder = () =>
		opts.setSortOrder(opts.sortOrder === "asc" ? "desc" : "asc");
	const toggleSeparateFolders = () =>
		opts.setSeparateFolders(!opts.separateFolders);
	const toggleShowHidden = () => opts.setShowHidden(!opts.showHidden);

	return {
		breadcrumbs,
		toggleSortOrder,
		toggleSeparateFolders,
		toggleShowHidden,
	};
}
