import { Show } from "solid-js";

export default function LoadingOverlay(props: { active?: boolean }) {
	return (
		<Show when={props.active}>
			<div class="loading-overlay animate-fade-in">
				<div class="minimal-loader">
					<div class="loader-line"></div>
				</div>
			</div>
		</Show>
	);
}
