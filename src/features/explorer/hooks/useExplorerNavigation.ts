import { createMemo, createResource, useTransition } from "solid-js";
import { useTabs } from "../../../hooks/useTabs";
import { fileSystem } from "../../../services/apiService";

export function useExplorerNavigation() {
	const history = useTabs("home");
	const [isPending, startTransition] = useTransition();
	const [locations] = createResource(() => fileSystem.getUserLocations());

	const currentAbsolutePath = createMemo(() => {
		const locs = locations() || [];
		const loc = locs.find((l) => l.id === history.currentPath);
		return loc ? loc.path : history.currentPath;
	});

	const navigate = (path: string) => {
		startTransition(() => {
			history.push(path);
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

	const isTrash = createMemo(() => {
		const locs = locations() || [];
		const loc = locs.find((l) => l.id === "trash");
		return loc
			? history.currentPath === loc.id || history.currentPath === loc.path
			: false;
	});

	return {
		history,
		isPending,
		locations,
		currentAbsolutePath,
		navigate,
		activeLocationLabel,
		getLabel,
		isTrash,
	};
}
