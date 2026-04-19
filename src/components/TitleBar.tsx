import { getCurrentWindow } from "@tauri-apps/api/window";

export default function TitleBar() {
  const handleDoubleClick = async () => {
    await getCurrentWindow().toggleMaximize();
  };

  return (
    <div 
      data-tauri-drag-region 
      class="title-bar"
      onDblClick={handleDoubleClick}
    >
      <div data-tauri-drag-region class="title-bar-content">
        <span data-tauri-drag-region class="app-title-text">Seeker</span>
      </div>
    </div>
  );
}
