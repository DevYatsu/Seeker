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
const TEXT_EXTS = [
	"txt",
	"md",
	"markdown",
	"js",
	"ts",
	"tsx",
	"jsx",
	"html",
	"css",
	"scss",
	"less",
	"json",
	"xml",
	"yaml",
	"yml",
	"toml",
	"ini",
	"conf",
	"sh",
	"bash",
	"zsh",
	"py",
	"rb",
	"pl",
	"php",
	"c",
	"cpp",
	"h",
	"hpp",
	"rs",
	"go",
	"java",
	"kt",
	"swift",
	"sql",
	"log",
	"lock",
	"env",
	"gitignore",
	"gitattributes",
	"gitconfig",
	"dockerfile",
	"makefile",
	"plist",
	"cfg",
	"pub",
	"key",
	"pem",
	"crt",
	"cert",
];

export type FileTypeCategory =
	| "image"
	| "video"
	| "audio"
	| "text"
	| "folder"
	| "binary"
	| "unknown";

/**
 * Categorizes a file based on its extension or type.
 */
export function getFileTypeCategory(file: {
	name: string;
	type: string;
	ext?: string;
}): FileTypeCategory {
	if (file.type === "folder") return "folder";

	const ext = file.ext?.toLowerCase() || "";
	if (IMAGE_EXTS.includes(ext)) return "image";
	if (VIDEO_EXTS.includes(ext)) return "video";
	if (AUDIO_EXTS.includes(ext)) return "audio";
	if (TEXT_EXTS.includes(ext)) return "text";

	// Common binary extensions to avoid garbage text previews
	const BINARY_EXTS = [
		"exe",
		"dll",
		"dylib",
		"so",
		"a",
		"o",
		"obj",
		"bin",
		"dat",
		"db",
		"sqlite",
		"dmg",
		"pkg",
		"iso",
	];
	if (BINARY_EXTS.includes(ext)) return "binary";

	// If no known type, return unknown to trigger content-based detection in preview
	if (
		!ext &&
		![
			"makefile",
			"dockerfile",
			"license",
			"readme",
			".env",
			".gitignore",
			".bashrc",
			".zshrc",
		].includes(name)
	) {
		return "unknown";
	}

	return "text";
}

/**
 * Checks if a file is a hidden file (starts with a dot).
 */
export function isHidden(path: string): boolean {
	const filename = path.split(/[/\\]/).pop() || "";
	return filename.startsWith(".");
}
