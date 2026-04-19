import { createSignal, onMount } from "solid-js";
import { mockFiles } from "../utils/mockData";
import { useSettings } from "../hooks/useSettings";

import Sidebar from "../components/Sidebar";
import Toolbar from "../components/Toolbar";
import FileBrowser from "../components/FileBrowser";
import StatusBar from "../components/StatusBar";

export default function Explorer() {
  const { iconPack } = useSettings();

  const [activeLocation, setActiveLocation] = createSignal("home");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [viewMode, setViewMode] = createSignal<"list" | "grid">("list");
  const [selectedFileId, setSelectedFileId] = createSignal<string | null>(null);

  const filteredFiles = () => {
    return mockFiles.filter(file => file.name.toLowerCase().includes(searchQuery().toLowerCase()));
  };

  return (
    <div class="app-container">
      <Sidebar 
        activeLocation={activeLocation()} 
        setActiveLocation={setActiveLocation} 
        iconPack={iconPack()} 
      />

      <main class="main-content">
        <Toolbar 
          activeLocation={activeLocation()}
          viewMode={viewMode()}
          setViewMode={setViewMode}
          searchQuery={searchQuery()}
          setSearchQuery={setSearchQuery}
          iconPack={iconPack()}
        />

        <FileBrowser 
          files={filteredFiles()}
          viewMode={viewMode()}
          selectedFileId={selectedFileId()}
          setSelectedFileId={setSelectedFileId}
          iconPack={iconPack()}
        />

        <StatusBar 
          itemCount={filteredFiles().length}
          hasSelection={selectedFileId() !== null}
        />
      </main>
    </div>
  );
}
