import { createSignal, batch } from "solid-js";
import type { FileOperation } from "./FileSystemManager";

export interface UndoableAction {
	id: string;
	operation: FileOperation;
	inverse: FileOperation;
	timestamp: number;
}

/**
 * Undo/Redo Engine
 *
 * Depth: High. Manages history of mutations and their inverses.
 * Leverage: Simple undo/redo API for the entire application state.
 * Locality: All history tracking and stack management lives here.
 */
export function createUndoManager(config: {
	execute: (op: FileOperation) => Promise<void>;
}) {
	const [undoStack, setUndoStack] = createSignal<UndoableAction[]>([]);
	const [redoStack, setRedoStack] = createSignal<UndoableAction[]>([]);

	const push = (op: FileOperation, inverse: FileOperation) => {
		const action: UndoableAction = {
			id: crypto.randomUUID(),
			operation: op,
			inverse,
			timestamp: Date.now(),
		};

		batch(() => {
			setUndoStack((prev) => [...prev, action]);
			setRedoStack([]); // Clear redo on new action
		});
	};

	const undo = async () => {
		const stack = undoStack();
		if (stack.length === 0) return;

		const action = stack[stack.length - 1];
		await config.execute(action.inverse);

		batch(() => {
			setUndoStack((prev) => prev.slice(0, -1));
			setRedoStack((prev) => [...prev, action]);
		});
	};

	const redo = async () => {
		const stack = redoStack();
		if (stack.length === 0) return;

		const action = stack[stack.length - 1];
		await config.execute(action.operation);

		batch(() => {
			setRedoStack((prev) => prev.slice(0, -1));
			setUndoStack((prev) => [...prev, action]);
		});
	};

	return {
		undoStack,
		redoStack,
		push,
		undo,
		redo,
		canUndo: () => undoStack().length > 0,
		canRedo: () => redoStack().length > 0,
	};
}
