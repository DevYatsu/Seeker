export const setCustomDragImage = (
	e: DragEvent,
	fileName: string,
	count: number = 1,
) => {
	if (!e.dataTransfer) return;

	const badge = document.createElement("div");
	const text = count > 1 ? `${count} items` : fileName;
	badge.textContent = text;

	// Styling for the drag badge
	badge.style.position = "absolute";
	badge.style.top = "-1000px";
	badge.style.left = "-1000px";
	badge.style.backgroundColor = "var(--accent)";
	badge.style.color = "#ffffff";
	badge.style.padding = "6px 14px";
	badge.style.borderRadius = "8px";
	badge.style.fontSize = "13px";
	badge.style.fontWeight = "500";
	badge.style.boxShadow =
		"0 8px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)";
	badge.style.pointerEvents = "none";
	badge.style.zIndex = "9999";
	badge.style.fontFamily = "var(--font-sans, system-ui, sans-serif)";
	badge.style.whiteSpace = "nowrap";
	badge.style.maxWidth = "200px";
	badge.style.overflow = "hidden";
	badge.style.textOverflow = "ellipsis";

	document.body.appendChild(badge);
	e.dataTransfer.setDragImage(badge, 15, 15);

	// Clean up immediately after drag starts
	setTimeout(() => {
		if (badge.parentNode) badge.parentNode.removeChild(badge);
	}, 0);
};
