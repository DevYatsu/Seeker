import { createSignal } from "solid-js";

export interface ContextMenuPos {
  x: number;
  y: number;
}

export const useContextMenu = () => {
  const [pos, setPos] = createSignal<ContextMenuPos>({ x: 0, y: 0 });
  const [visible, setVisible] = createSignal(false);

  const open = (e: MouseEvent) => {
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return {
    pos,
    visible,
    open,
    close,
  };
};
