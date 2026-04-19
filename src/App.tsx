import Explorer from "./views/Explorer";
import SettingsPage from "./views/Settings";

import "iconify-icon";
import "./assets/App.css";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": any;
    }
  }
}

function App() {
  if (window.location.search.includes("window=settings")) {
    return <SettingsPage />;
  }

  return <Explorer />;
}

export default App;
