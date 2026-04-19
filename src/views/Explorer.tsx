import { createSignal, createMemo } from "solid-js";
import { mockFiles, sidebarLocations } from "../utils/mockData";
import { useSettings } from "../hooks/useSettings";
import { useHistory } from "../hooks/useHistory";

import Sidebar from "../components/Sidebar";
import Toolbar from "../components/Toolbar";
import FileBrowser from "../components/FileBrowser";
import StatusBar from "../components/StatusBar";
import TitleBar from "../components/TitleBar";

import ContextMenu, { ContextMenuItem } from "../components/ContextMenu";

export default function Explorer() {
  const { iconPack } = useSettings();

  const history = useHistory("home");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [viewMode, setViewMode] = createSignal<"list" | "grid">("list");
  const [selectedFileIds, setSelectedFileIds] = createSignal<string[]>([]);
  
  // Context Menu State
  const [menuPos, setMenuPos] = createSignal({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = createSignal(false);
  const [clipboard, setClipboard] = createSignal<string[]>([]);

  const filteredFiles = createMemo(() => {
    const query = searchQuery().toLowerCase();
    return mockFiles.filter(file => file.name.toLowerCase().includes(query));
  });

  const activeLocationLabel = createMemo(() => {
    return sidebarLocations.find((l) => l.id === history.currentPath)?.label || history.currentPath;
  });

  const handleSelection = (id: string | null, multi: boolean = false, range: boolean = false) => {
    if (id === null) {
      setSelectedFileIds([]);
      return;
    }

    const current = selectedFileIds();
    
    if (range && current.length > 0) {
      const allFiles = filteredFiles();
      const lastIndex = allFiles.findIndex(f => f.id === current[current.length - 1]);
      const currentIndex = allFiles.findIndex(f => f.id === id);
      
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      
      const rangeIds = allFiles.slice(start, end + 1).map(f => f.id);
      setSelectedFileIds([...new Set([...current, ...rangeIds])]);
    } else if (multi) {
      if (current.includes(id)) {
        setSelectedFileIds(current.filter(i => i !== id));
      } else {
        setSelectedFileIds([...current, id]);
      }
    } else {
      setSelectedFileIds([id]);
    }
  };

  const handleContextMenu = (e: MouseEvent, id: string | null) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    
    // If we right click an item that isn't selected, select it
    if (id && !selectedFileIds().includes(id)) {
      handleSelection(id);
    }
    
    setShowMenu(true);
  };

  const handleCopy = () => {
    const selected = selectedFileIds();
    if (selected.length > 0) {
      setClipboard(selected);
      console.log("Copied to clipboard:", selected);
    }
  };

  const menuItems = createMemo<ContextMenuItem[]>(() => {
    const count = selectedFileIds().length;
    const hasClipboard = clipboard().length > 0;

    if (count === 0) {
      return [
        { label: "New Folder", icon: "FolderPlus", action: () => console.log("New Folder") },
        { label: "New File", icon: "FilePlus", action: () => console.log("New File") },
        { 
          label: hasClipboard ? `Paste ${clipboard().length} Items` : "Paste", 
          icon: "Clipboard", 
          action: () => console.log("Paste"), 
          disabled: !hasClipboard,
          separator: true 
        },
        { label: "Open in Terminal", icon: "Terminal", action: () => console.log("Terminal"), separator: true },
      ];
    }

    return [
      { label: count > 1 ? `Open ${count} Items` : "Open", icon: "ExternalLink", action: () => console.log("Open") },
      { label: "Open in Terminal", icon: "Terminal", action: () => console.log("Terminal") },
      { label: "Copy", icon: "Copy", action: handleCopy, separator: true },
      { label: "Duplicate", icon: "CopyPlus", action: () => console.log("Duplicate") },
      { label: "Rename", icon: "Pencil", action: () => console.log("Rename"), separator: true },
      { label: "Compress", icon: "Package", action: () => console.log("Compress") },
      { label: "Move to Trash", icon: "Trash", action: () => console.log("Trash"), danger: true, separator: true },
      { label: "Get Info", icon: "Info", action: () => console.log("Info"), separator: true },
    ];
  });

  return (
    <div class="root-view" onContextMenu={(e) => handleContextMenu(e, null)}>
      <TitleBar />
      
      <div class="app-container">
        <Sidebar 
          activeLocation={history.currentPath} 
          setActiveLocation={history.push} 
          iconPack={iconPack()} 
        />

        <main class="main-content">
          <Toolbar 
            activeLocation={history.currentPath}
            activeLocationLabel={activeLocationLabel()}
            viewMode={viewMode()}
            setViewMode={setViewMode}
            searchQuery={searchQuery()}
            setSearchQuery={setSearchQuery}
            iconPack={iconPack()}
            canGoBack={history.canGoBack}
            canGoForward={history.canGoForward}
            onBack={history.goBack}
            onForward={history.goForward}
          />

          <div class="browser-wrapper">
            <FileBrowser 
              files={filteredFiles()}
              viewMode={viewMode()}
              selectedFileIds={selectedFileIds()}
              onSelect={handleSelection}
              onOpen={history.push}
              onContextMenu={handleContextMenu}
              iconPack={iconPack()}
            />
          </div>

          <StatusBar 
            itemCount={filteredFiles().length}
            selectionCount={selectedFileIds().length}
          />
        </main>
      </div>

      <ContextMenu 
        x={menuPos().x}
        y={menuPos().y}
        visible={showMenu()}
        onClose={() => setShowMenu(false)}
        items={menuItems()}
        iconPack={iconPack()}
      />
    </div>
  );
}
