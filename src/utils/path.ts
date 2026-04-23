/**
 * Utility for handling file paths and extensions.
 */

/**
 * Extracts the file extension from a path or filename.
 *
 * Logic:
 * - Returns the part after the last dot.
 * - If it's a dotfile (starts with a dot and has no other dots), returns empty string.
 * - If there are no dots, returns empty string.
 * - If it ends with a dot, returns empty string.
 *
 * @param path The full path or filename
 * @returns The extension (without the dot) or an empty string
 */
export function getFileExtension(path: string): string {
	if (!path) return "";

	// Get the filename if it's a full path
	const filename = path.split(/[/\\]/).pop() || "";

	// Check for dots
	const lastDotIndex = filename.lastIndexOf(".");

	// If no dot, or it's a dotfile with no further extension, or it ends with a dot
	if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) {
		return "";
	}

	return filename.slice(lastDotIndex + 1).toLowerCase();
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov", "mkv"];
const AUDIO_EXTS = ["mp3", "wav", "flac", "aac", "m4a"];

export type FileTypeCategory =
	| "image"
	| "video"
	| "audio"
	| "text"
	| "folder"
	| "unknown";

/**
 * Categorizes a file based on its extension or type.
 */
export function getFileTypeCategory(file: {
	type: string;
	ext?: string;
}): FileTypeCategory {
	if (file.type === "folder") return "folder";

	const ext = file.ext?.toLowerCase() || "";
	if (IMAGE_EXTS.includes(ext)) return "image";
	if (VIDEO_EXTS.includes(ext)) return "video";
	if (AUDIO_EXTS.includes(ext)) return "audio";

	return "text"; // Default fallback for now
}

/**
 * Checks if a file is a hidden file (starts with a dot).
 */
export function isHidden(path: string): boolean {
	const filename = path.split(/[/\\]/).pop() || "";
	return filename.startsWith(".");
}
