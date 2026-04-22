import Explorer from "./views/Explorer";
import SettingsPage from "./views/Settings";

import "./assets/App.css";

function App() {
	if (window.location.search.includes("window=settings")) {
		return <SettingsPage />;
	}

	return <Explorer />;
}

export default App;
