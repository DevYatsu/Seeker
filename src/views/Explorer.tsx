import { createSignal, createMemo } from "solid-js";
import { mockFiles, sidebarLocations } from "../utils/mockData";
import { useSettings } from "../hooks/useSettings";

import Sidebar from "../components/Sidebar";
import Toolbar from "../components/Toolbar";
import FileBrowser from "../components/FileBrowser";
import StatusBar from "../components/StatusBar";
import TitleBar from "../components/TitleBar";

export default function Explorer() {
  const { iconPack } = useSettings();

  const [activeLocation, setActiveLocation] = createSignal("home");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [viewMode, setViewMode] = createSignal<"list" | "grid">("list");
  const [selectedFileIds, setSelectedFileIds] = createSignal<string[]>([]);

  const filteredFiles = createMemo(() => {
    const query = searchQuery().toLowerCase();
    return mockFiles.filter(file => file.name.toLowerCase().includes(query));
  });

  const activeLocationLabel = createMemo(() => {
    return sidebarLocations.find((l) => l.id === activeLocation())?.label || activeLocation();
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

  return (
    <div class="root-view">
      <TitleBar />
      
      <div class="app-container">
        <Sidebar 
          activeLocation={activeLocation()} 
          setActiveLocation={setActiveLocation} 
          iconPack={iconPack()} 
        />

        <main class="main-content">
          <Toolbar 
            activeLocation={activeLocation()}
            activeLocationLabel={activeLocationLabel()}
            viewMode={viewMode()}
            setViewMode={setViewMode}
            searchQuery={searchQuery()}
            setSearchQuery={setSearchQuery}
            iconPack={iconPack()}
          />

          <div class="browser-wrapper">
            <FileBrowser 
              files={filteredFiles()}
              viewMode={viewMode()}
              selectedFileIds={selectedFileIds()}
              onSelect={handleSelection}
              iconPack={iconPack()}
            />
          </div>

          <StatusBar 
            itemCount={filteredFiles().length}
            selectionCount={selectedFileIds().length}
          />
        </main>
      </div>
    </div>
  );
}
