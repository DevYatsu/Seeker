import { For, Show } from "solid-js";
import { useExplorer } from "../context/ExplorerContext";
import { AppIcon } from "../../../components/AppIcon";

/**
 * Task Drawer Component
 *
 * Displays background filesystem operations from the TaskManager.
 * Premium Aesthetic: Floating glassmorphism card, subtle animations.
 */
export default function TaskDrawer() {
	const { tasks, iconPack } = useExplorer();

	return (
		<Show when={tasks.activeTasks().length > 0}>
			<div class="task-drawer animate-in-up">
				<div class="task-drawer-header">
					<AppIcon pack={iconPack()} name="Activity" size={14} />
					<span>Background Tasks</span>
					<span class="task-count">{tasks.activeTasks().length}</span>
				</div>
				<div class="task-list">
					<For each={tasks.activeTasks()}>
						{(task) => (
							<div class="task-item" classList={{ error: task.status === "error" }}>
								<div class="task-icon">
									{task.status === "running" ? (
										<div class="mini-spinner" />
									) : (
										<AppIcon pack={iconPack()} name="AlertCircle" size={14} />
									)}
								</div>
								<div class="task-info">
									<span class="task-name">{task.name}</span>
									<span class="task-status">
										{task.status === "running" ? "Processing..." : "Failed"}
									</span>
								</div>
							</div>
						)}
					</For>
				</div>
			</div>
		</Show>
	);
}
