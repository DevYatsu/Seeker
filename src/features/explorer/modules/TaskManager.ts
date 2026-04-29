import { createSignal } from "solid-js";

export interface Task {
	id: string;
	name: string;
	status: "running" | "done" | "error";
	startTime: number;
}

/**
 * Task Queue / Progress Manager
 *
 * Depth: High. Tracks long-running background operations.
 * Leverage: Single module to monitor all filesystem tasks.
 * Locality: All task state and history lives here.
 */
export function createTaskManager() {
	const [activeTasks, setActiveTasks] = createSignal<Task[]>([]);

	const runTask = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
		const id = crypto.randomUUID();
		const newTask: Task = { id, name, status: "running", startTime: Date.now() };

		setActiveTasks((prev) => [...prev, newTask]);

		try {
			const result = await fn();
			setActiveTasks((prev) => prev.filter((t) => t.id !== id));
			return result;
		} catch (err) {
			setActiveTasks((prev) =>
				prev.map((t) => (t.id === id ? { ...t, status: "error" } : t)),
			);
			// Auto-remove error after 5s
			setTimeout(() => {
				setActiveTasks((prev) => prev.filter((t) => t.id !== id));
			}, 5000);
			throw err;
		}
	};

	return {
		activeTasks,
		runTask,
		isBusy: () => activeTasks().length > 0,
	};
}
