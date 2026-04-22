import { getCurrentWindow } from "@tauri-apps/api/window";

export default function TitleBar(props: { title?: string }) {
	const handleDoubleClick = async () => {
		await getCurrentWindow().toggleMaximize();
	};

	return (
		<div
			data-tauri-drag-region
			class="title-bar"
			onDblClick={handleDoubleClick}
			role="none"
		>
			<div data-tauri-drag-region class="title-bar-content">
				<span data-tauri-drag-region class="app-title-text">
					{props.title || "Seeker"}
				</span>
			</div>
		</div>
	);
}
