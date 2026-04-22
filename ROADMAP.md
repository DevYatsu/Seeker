# Seeker — Feature Roadmap

> Prioritized by impact and effort. Grouped into tiers.

---

## 🔴 Tier 1 — High Impact, Should Do Next

### 1. Drag & Drop (Files + Folders)
- Drag files/folders to move them between directories
- Drag from Seeker to other apps (Finder, VS Code, etc.)
- Drop files from external apps into Seeker
- Visual drop indicator (highlight target folder)
- **Rust:** `move_items(sources, target_dir)` command
- **Frontend:** HTML5 Drag API + `onDragStart`/`onDrop` handlers on grid/list items

### 2. Keyboard Navigation
- Arrow keys to move selection through file list/grid
- `Enter` to open, `Space` to quick look, `Backspace` to go up
- `Cmd+A` to select all, `Escape` to deselect
- Tab focus management across sidebar, toolbar, browser
- **Frontend only** — no backend changes needed

### 3. Breadcrumb Navigation (Clickable Path)
- Replace the current single-label breadcrumb with clickable path segments
- Each segment navigates to that directory
- Right-click a segment → "Copy path" / "Open in Terminal"
- **Frontend only** — split `currentAbsolutePath` into clickable parts

### 4. File Preview / Quick Look
- `Space` key or double-click delay → show preview panel
- Image thumbnails (jpg, png, svg, gif, webp)
- Text file preview (first 100 lines) with syntax highlighting
- PDF first-page preview
- Audio/video metadata display
- **Rust:** `read_file_preview(path, max_bytes)` command
- **Frontend:** Slide-in panel or modal overlay

### 5. Tabs / Multi-Directory
- Open multiple directories in tabs (like browser tabs)
- Drag to reorder tabs, middle-click to close
- Each tab has its own navigation history
- Persisted across restarts
- **Frontend:** Tab bar component + per-tab `useHistory` instances

---

## 🟡 Tier 2 — Medium Impact, Nice to Have

### 6. Favorites / Bookmarks
- Pin any folder to sidebar under "Favorites" section
- Drag folders into sidebar to bookmark
- Persist in localStorage or Tauri store
- **Rust:** None (frontend-only with persistence)

### 7. File Size Calculation for Folders
- Show folder sizes (recursive) on demand
- Background calculation to avoid blocking
- Cache results, invalidate on navigation
- **Rust:** `calculate_dir_size(path)` async command with streaming updates

### 8. Batch Rename
- Select multiple files → batch rename with pattern
- Support: prefix/suffix, find & replace, numbering, regex
- Live preview of new names before applying
- **Rust:** reuse `rename_item` in a loop
- **Frontend:** Modal with rename pattern builder

### 9. Image Thumbnails in Grid View
- Generate thumbnails for image files (jpg, png, webp)
- Show actual image preview instead of generic file icon
- Lazy-load thumbnails as they scroll into view
- **Rust:** `generate_thumbnail(path, max_size)` → returns base64 or temp file path

### 10. Column/Detail View (3-pane Miller Columns)
- macOS Finder-style column view alongside list and grid
- Each column shows one directory level
- Selecting a folder opens its contents in the next column
- **Frontend:** New `ColumnView` component

### 11. Hidden Files Toggle
- Toggle button in toolbar to show/hide dotfiles
- Persist preference
- **Rust:** Add `show_hidden` param to `list_directory`
- **Frontend:** Add toggle to toolbar, pass to data hook

---

## 🟢 Tier 3 — Polish & Delight

### 12. File Watcher (Auto-Refresh)
- Watch current directory for filesystem changes
- Auto-refresh file list when files are added/removed/renamed externally
- **Rust:** Use `notify` crate with `tauri::Emitter` to push events
- **Frontend:** Listen for Tauri events, trigger refresh

### 13. Cut/Move Operations
- `Cmd+X` to cut (mark files for move)
- Visual indicator (dimmed/strikethrough) on cut items
- `Cmd+V` to move instead of copy
- **Frontend:** Track `clipboardMode: 'copy' | 'cut'` in `useFileOperations`

### 14. Path Bar (Editable Address Bar)
- Click breadcrumb → transforms into text input
- Type or paste any path to navigate directly
- Autocomplete dropdown with matching directories
- **Rust:** `list_directory` already works with any path
- **Frontend:** Toggle between breadcrumb and input modes

### 15. Status Bar Enhancements
- Show total size of selected files
- Show current path (copyable)
- Show search result count during search
- Show file type breakdown (e.g., "12 files, 3 folders")

### 16. Undo/Redo for File Operations
- Track last N operations (rename, delete, move, create)
- `Cmd+Z` to undo last operation
- Restore from trash on undo-delete
- **Rust:** Operation log with reverse actions
- **Frontend:** Operation stack in `useFileOperations`

### 17. Multi-Window Support
- Open a folder in a new Seeker window
- Context menu → "Open in New Window"
- **Rust:** `tauri::WebviewWindowBuilder` to spawn new window
- **Frontend:** Already handles URL params for routing

### 18. Compress / Extract Archives
- Right-click → "Compress to ZIP"
- Double-click .zip/.tar.gz → extract or browse contents
- **Rust:** Use `zip` and `flate2` crates

---

## 💡 Stretch Goals

| Feature | Description |
|---------|-------------|
| **Dual Pane** | Side-by-side directory view for easy file moving |
| **Spotlight-style Command Palette** | `Cmd+K` to search files, run actions, navigate |
| **Git Status Indicators** | Show modified/untracked/ignored status on files |
| **Custom Themes** | Import/export theme JSON, community theme gallery |
| **Plugins API** | Context menu extensions, custom preview handlers |
| **Cloud Storage** | Mount S3/GCS/Dropbox as virtual directories |
| **Terminal Integration** | Embedded terminal panel at the bottom |
| **Smart Folders** | Auto-grouping by type, date, size |

---

## Recommended Build Order

Start with features that **compound** — each one makes the next easier:

1. **Keyboard Navigation** ← Zero backend, huge usability win
2. **Breadcrumb Navigation** ← Zero backend, makes app feel complete
3. **Hidden Files Toggle** ← Tiny change, frequently requested
4. **Drag & Drop** ← Core file manager expectation
5. **File Watcher** ← Eliminates manual refresh, feels alive
6. **Quick Look / Preview** ← Differentiator from Finder
7. **Tabs** ← Power user feature, major retention driver
