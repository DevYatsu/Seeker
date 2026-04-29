/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { SettingsProvider } from "./hooks/useSettings";

render(
	() => (
		<SettingsProvider>
			<App />
		</SettingsProvider>
	),
	document.getElementById("root") as HTMLElement,
);
