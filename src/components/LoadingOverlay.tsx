import { Show } from "solid-js";

export default function LoadingOverlay(props: { active?: boolean }) {
	return (
		<Show when={props.active}>
			<div class="loading-overlay animate-in">
				<div class="spinner">
					<div class="spinner-inner"></div>
				</div>
			</div>
		</Show>
	);
}
