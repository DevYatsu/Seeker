import EditorPage from "./views/Editor";
import Explorer from "./views/Explorer";
import SettingsPage from "./views/Settings";

import "./assets/App.css";

function App() {
	const params = new URLSearchParams(window.location.search);
	if (params.get("window") === "settings") {
		return <SettingsPage />;
	}
	if (params.get("window") === "editor") {
		return <EditorPage />;
	}

	return <Explorer />;
}

export default App;
