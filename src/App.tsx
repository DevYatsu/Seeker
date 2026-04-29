import EditorPage from "./views/Editor";
import Explorer from "./views/Explorer";
import SettingsPage from "./views/Settings";

import QuickLookPage from "./views/QuickLookPage";

import "./assets/App.css";

function App() {
	const params = new URLSearchParams(window.location.search);
	if (params.get("window") === "settings") {
		return <SettingsPage />;
	}
	if (params.get("window") === "editor") {
		return <EditorPage />;
	}
	if (params.get("window") === "quicklook") {
		return <QuickLookPage />;
	}

	return <Explorer />;
}

export default App;
