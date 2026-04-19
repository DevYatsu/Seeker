import { createSignal, createMemo, onMount, createEffect } from "solid-js";
import { type FileItem } from "../utils/mockData";
import { useSettings } from "../hooks/useSettings";
import { useHistory } from "../hooks/useHistory";
import { useSelection } from "../hooks/useSelection";
import { useContextMenu } from "../hooks/useContextMenu";
import { 
  getUserLocations, 
  searchFiles, 
  listDirectory, 
  openItem,
  moveToTrash,
  deletePermanently,
  renameItem,
  createDirectory,
  createFile,
  copyItems,
  duplicateItems,
  openInTerminal,
  type NavigationLocation 
} from "../services/apiService";

import Sidebar from "../components/Sidebar";
import Toolbar from "../components/Toolbar";
import FileBrowser from "../components/FileBrowser";
import StatusBar from "../components/StatusBar";
import TitleBar from "../components/TitleBar";
import ContextMenu, { ContextMenuItem } from "../components/ContextMenu";
import { FileIcon } from "../components/FileBrowser/FileIcon";
import { formatSize, formatDate } from "../utils/formatters";

export type SortBy = "name" | "size" | "date";
export type SortOrder = "asc" | "desc";

export default function Explorer() {
  const { iconPack } = useSettings();
  const history = useHistory("home");
  
  const [locations, setLocations] = createSignal<NavigationLocation[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = createSignal("");
  const [viewMode, setViewMode] = createSignal<"list" | "grid">("list");
  const [searchResults, setSearchResults] = createSignal<FileItem[]>([]);
  const [currentFiles, setCurrentFiles] = createSignal<FileItem[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [refreshTrigger, setRefreshTrigger] = createSignal(0);
  
  const [sortBy, setSortBy] = createSignal<SortBy>("name");
  const [sortOrder, setSortOrder] = createSignal<SortOrder>("asc");
  const [separateFolders, setSeparateFolders] = createSignal(false);
  
  const [promptConfig, setPromptConfig] = createSignal<{ title: string; defaultValue?: string; onSubmit: (val: string) => void } | null>(null);
  const [infoModal, setInfoModal] = createSignal<{ file: FileItem } | null>(null);

  const currentAbsolutePath = createMemo(() => {
    const loc = locations().find(l => l.id === history.currentPath);
    return loc ? loc.path : history.currentPath;
  });

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  // Debounce search input
  createEffect(() => {
    const query = searchQuery();
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(query);
    }, 200);
    return () => clearTimeout(timeout);
  });

  createEffect(async () => {
    const root = currentAbsolutePath();
    refreshTrigger(); // Track refresh
    if (root) {
      try {
        const results = await listDirectory(root);
        setCurrentFiles(results.map(r => ({
          id: r.path,
          name: r.name,
          type: r.is_dir ? "folder" : "file",
          size: r.size,
          updatedAt: new Date(r.updated_at * 1000).toISOString(),
          ext: r.name.includes('.') ? r.name.split('.').pop() : undefined
        })));
      } catch (err) {
        console.error("Failed to list directory:", err);
      }
    }
  });

  createEffect(async () => {
    const query = debouncedSearchQuery();
    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const root = currentAbsolutePath();
        const results = await searchFiles(root, query);
        setSearchResults(results.map(r => ({
          id: r.path,
          name: r.name,
          type: r.is_dir ? "folder" : "file",
          size: r.size,
          updatedAt: new Date(r.updated_at * 1000).toISOString(),
          ext: r.name.includes('.') ? r.name.split('.').pop() : undefined
        })));
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  });

  const displayedFiles = createMemo(() => {
    let files = searchQuery().length >= 2 ? searchResults() : currentFiles();
    
    return [...files].sort((a, b) => {
      // Folders at the top only if separated
      if (separateFolders() && a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      
      let comparison = 0;
      switch (sortBy()) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "date":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder() === "asc" ? comparison : -comparison;
    });
  });

  const selection = useSelection(displayedFiles);
  const contextMenu = useContextMenu();
  const [clipboard, setClipboard] = createSignal<string[]>([]);

  // Clear selection when path changes
  createEffect(() => {
    history.currentPath; // Track path
    selection.setSelectedIds([]);
  });

  // Global Keyboard Shortcuts
  createEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input (like search box)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'c') {
        if (selection.selectedIds().length > 0) {
          setClipboard(selection.selectedIds());
          console.log("Copied to clipboard", selection.selectedIds());
        }
      }

      if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
        const currentRoot = currentAbsolutePath();
        if (clipboard().length > 0 && currentRoot) {
          await copyItems(clipboard(), currentRoot);
          setClipboard([]); // Standard File explorer logic often keeps clipboard, but matching existing context logic
          refresh();
        }
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if (selection.selectedIds().length > 0) {
          if (isTrash()) {
             await deletePermanently(selection.selectedIds());
          } else {
             await moveToTrash(selection.selectedIds());
          }
          refresh();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  onMount(async () => {
    try {
      const locs = await getUserLocations();
      setLocations(locs);
    } catch (err) {
      console.error("Failed to fetch user locations:", err);
    }
  });

  const activeLocationLabel = createMemo(() => {
    const path = currentAbsolutePath();
    // Try to find a matching system location to create a nice relative path
    const bestLoc = locations()
      .filter(l => path.startsWith(l.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
    
    if (bestLoc) {
      if (path === bestLoc.path) return bestLoc.label;
      const relative = path.slice(bestLoc.path.length).replace(/^[\\\/]/, "");
      if (!relative) return bestLoc.label;
      
      const parts = relative.split(/[\\\/]/).filter(Boolean);
      if (parts.length > 2) {
        const intermediate = parts.slice(0, -1).map(p => p.charAt(0).toUpperCase());
        return `${bestLoc.label} / ${intermediate.join(" / ")} / ${parts[parts.length - 1]}`;
      }
      
      const full = `${bestLoc.label} / ${parts.join(" / ")}`;
      if (full.length > 35) {
        const intermediate = parts.slice(0, -1).map(p => p.charAt(0).toUpperCase());
        return `${bestLoc.label} / ${intermediate.join(" / ")} / ${parts[parts.length - 1]}`;
      }
      return full;
    }
    
    return path.length > 35 ? `...${path.slice(-32)}` : path;
  });

  const isTrash = createMemo(() => {
    const loc = locations().find(l => l.id === "trash");
    return loc ? history.currentPath === loc.id || history.currentPath === loc.path : false;
  });

  const handleOpen = (id: string) => {
    const file = displayedFiles().find(f => f.id === id);
    if (file?.type === "folder") {
      history.push(id);
    } else {
      openItem(id);
    }
  };

  const handleContextMenu = (e: MouseEvent, id: string | null) => {
    contextMenu.open(e);
    if (id && !selection.selectedIds().includes(id)) {
      selection.handleSelection(id, false, false);
    }
  };

  const menuItems = createMemo<ContextMenuItem[]>(() => {
    const count = selection.selectedIds().length;
    const hasClipboard = clipboard().length > 0;
    const inTrash = isTrash();
    const root = currentAbsolutePath();

    if (count === 0) {
      if (inTrash) {
        return [
          { 
            label: "Empty Trash", 
            icon: "Trash", 
            action: async () => {
              const items = await listDirectory(root);
              await deletePermanently(items.map(i => i.path));
              refresh();
            }, 
            danger: true 
          },
        ];
      }
      return [
        { 
          label: "New Folder", 
          icon: "FolderPlus", 
          action: () => {
            setPromptConfig({
              title: "New Folder Name",
              onSubmit: async (name) => {
                await createDirectory(root, name);
                refresh();
              }
            });
          } 
        },
        { 
          label: "New File", 
          icon: "FilePlus", 
          action: () => {
            setPromptConfig({
              title: "New File Name",
              onSubmit: async (name) => {
                await createFile(root, name);
                refresh();
              }
            });
          } 
        },
        { 
          label: hasClipboard ? `Paste ${clipboard().length} Items` : "Paste", 
          icon: "Clipboard", 
          action: async () => {
            await copyItems(clipboard(), root);
            setClipboard([]);
            refresh();
          }, 
          disabled: !hasClipboard,
          separator: true 
        },
        { 
          label: "Open in Terminal", 
          icon: "Terminal", 
          action: () => openInTerminal(root), 
          separator: true 
        },
      ];
    }

    const firstId = selection.selectedIds()[0];

    if (inTrash) {
      return [
        { 
          label: count > 1 ? `Put Back ${count} Items` : "Put Back", 
          icon: "Undo", 
          action: async () => {
            // Put back logic: on macOS, you'd usually use AppleScript. 
            // For now, let's just move them to Home or similar if we can't find source.
            // As a fallback, we'll just log it or suggest Delete Permanently.
            console.log("Put back not natively implemented yet");
          } 
        },
        { 
          label: "Delete Permanently", 
          icon: "Trash", 
          action: async () => {
            await deletePermanently(selection.selectedIds());
            refresh();
          }, 
          danger: true, 
          separator: true 
        },
        { 
          label: "Get Info", 
          icon: "Info", 
          action: () => {
            const item = displayedFiles().find(f => f.id === firstId);
            if (item) {
              setInfoModal({ file: item });
            }
          } 
        },
      ];
    }

    return [
      { 
        label: count > 1 ? `Open ${count} Items` : "Open", 
        icon: "ExternalLink", 
        action: () => {
          selection.selectedIds().forEach(id => handleOpen(id));
        } 
      },
      { label: "Open in Terminal", icon: "Terminal", action: () => openInTerminal(firstId) },
      { 
        label: "Copy", 
        icon: "Copy", 
        action: () => setClipboard(selection.selectedIds()), 
        separator: true 
      },
      { 
        label: "Duplicate", 
        icon: "CopyPlus", 
        action: async () => {
          await duplicateItems(selection.selectedIds());
          refresh();
        } 
      },
      { 
        label: "Rename", 
        icon: "Pencil", 
        action: () => {
          const item = displayedFiles().find(f => f.id === firstId);
          setPromptConfig({
            title: "Rename Item",
            defaultValue: item?.name,
            onSubmit: async (newName) => {
              await renameItem(firstId, newName);
              refresh();
            }
          });
        }, 
        separator: true 
      },
      { label: "Compress", icon: "Package", action: () => {} },
      { 
        label: "Move to Trash", 
        icon: "Trash", 
        action: async () => {
          await moveToTrash(selection.selectedIds());
          refresh();
        }, 
        danger: true, 
        separator: true 
      },
      { 
        label: "Get Info", 
        icon: "Info", 
        action: () => {
          const item = displayedFiles().find(f => f.id === firstId);
          if (item) {
            setInfoModal({ file: item });
          }
        }, 
        separator: true 
      },
    ];
  });

  return (
    <div class="root-view">
      <TitleBar />
      
      <div class="app-container">
        <Sidebar 
          activeLocation={history.currentPath} 
          setActiveLocation={history.push}
          locations={locations()}
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
            sortBy={sortBy()}
            setSortBy={setSortBy}
            sortOrder={sortOrder()}
            setSortOrder={setSortOrder}
            separateFolders={separateFolders()}
            setSeparateFolders={setSeparateFolders}
          />

          <div class="browser-wrapper">
            <FileBrowser 
              files={displayedFiles()}
              viewMode={viewMode()}
              selectedFileIds={selection.selectedIds()}
              onSelect={selection.handleSelection}
              onOpen={handleOpen}
              onContextMenu={handleContextMenu}
              iconPack={iconPack()}
            />
          </div>

          <StatusBar 
            itemCount={displayedFiles().length}
            selectionCount={selection.selectedIds().length}
          />
        </main>
      </div>

      {infoModal() && (
        <div class="modal-overlay" onClick={() => setInfoModal(null)}>
          <div class="modal-content info-modal" onClick={e => e.stopPropagation()}>
            <div class="info-header">
              <FileIcon type={infoModal()!.file.type} ext={infoModal()!.file.ext} pack={iconPack()} size={56} />
              <h3 class="info-title">{infoModal()!.file.name}</h3>
            </div>
            <div class="info-body">
              <div class="info-row">
                <span class="info-label">Kind</span>
                <span class="info-value">{infoModal()!.file.type === "folder" ? "Folder" : (infoModal()!.file.ext?.toUpperCase() || "DOC") + " Document"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Size</span>
                <span class="info-value">{infoModal()!.file.type === "folder" ? "--" : formatSize(infoModal()!.file.size)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Where</span>
                <span class="info-value path-value" title={infoModal()!.file.id}>{infoModal()!.file.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Modified</span>
                <span class="info-value">{formatDate(infoModal()!.file.updatedAt)}</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="ok-btn" onClick={() => setInfoModal(null)}>Close Info</button>
            </div>
          </div>
        </div>
      )}

      {promptConfig() && (
        <div class="modal-overlay" onClick={() => setPromptConfig(null)}>
          <div class="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{promptConfig()!.title}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = new FormData(e.currentTarget).get('promptInput') as string;
              if (input && input.trim()) {
                promptConfig()!.onSubmit(input.trim());
              }
              setPromptConfig(null);
            }}>
              <input 
                name="promptInput" 
                type="text" 
                autofocus 
                value={promptConfig()!.defaultValue || ""} 
                class="modal-input" 
              />
              <div class="modal-actions">
                <button type="button" class="cancel-btn" onClick={() => setPromptConfig(null)}>Cancel</button>
                <button type="submit" class="ok-btn">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ContextMenu 
        x={contextMenu.pos().x}
        y={contextMenu.pos().y}
        visible={contextMenu.visible()}
        onClose={contextMenu.close}
        items={menuItems()}
        iconPack={iconPack()}
      />
    </div>
  );
}
