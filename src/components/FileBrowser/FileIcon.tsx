import { createMemo } from "solid-js";
import { AppIcon, IconPack } from "../AppIcon";

export const getThemedFileIcon = (pack: IconPack, type: "file" | "folder", ext?: string): { icon: string, color?: string } => {
  const isCode = pack === "vscode";
  const isCat = pack === "catppuccin";
  
  if (type === "folder") {
    if (isCode) return { icon: "vscode-icons:default-folder" };
    if (isCat) return { icon: "catppuccin:folder" };
    return { icon: "mdi:folder", color: "#60a5fa" };
  }
  
  if (!ext) {
    if (isCode) return { icon: "vscode-icons:default-file" };
    if (isCat) return { icon: "catppuccin:file" };
    return { icon: "mdi:file", color: "var(--text-muted)" };
  }
  
  const lowExt = ext.toLowerCase();

  if (isCode) {
    const map: Record<string, string> = {
      // web / modern web
      js: "js", mjs: "js", cjs: "js", jsx: "reactjs", ts: "typescript", tsx: "reactts", html: "html", css: "css", scss: "scss", sass: "sass", less: "less", vue: "vue", svelte: "svelte", astro: "astro", ejs: "ejs", pug: "pug", twig: "twig", 
      json: "json", xml: "xml", graphql: "graphql", gql: "graphql", svg: "svg", yaml: "yaml", yml: "yaml", toml: "toml", 
      env: "dotenv", ini: "ini", cfg: "ini", conf: "ini", properties: "ini",
      // languages
      py: "python", pyc: "python", rs: "rust", go: "go", java: "java", class: "java", jar: "java-class", c: "c", cp: "cpp", cpp: "cpp", h: "cppheader", hpp: "cppheader", cs: "csharp", lua: "lua",
      perl: "perl", r: "r", php: "php", rb: "ruby", swift: "swift", kt: "kotlin", kts: "kotlin", scala: "scala", sql: "sql", sqlite: "sqlite", db: "sqlite", md: "markdown", mdx: "markdown",
      sh: "shell", bash: "shell", zsh: "shell", bat: "bat", cmd: "bat", ps1: "powershell", vbs: "vb",
      // images
      png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", bmp: "image", tiff: "image", ico: "image", psd: "photoshop", ai: "illustrator", eps: "eps", heic: "image", heif: "image", raw: "image", cr2: "image",
      // archives
      zip: "zip", tar: "zip", gz: "zip", "7z": "zip", rar: "zip", pkg: "zip", bz2: "zip", tgz: "zip", iso: "zip", dmg: "zip",
      // docs
      pdf: "pdf2", txt: "text", rtf: "text", doc: "word", docx: "word", xls: "excel", xlsx: "excel", csv: "excel", ppt: "powerpoint", pptx: "powerpoint", pages: "word", numbers: "excel", odp: "powerpoint", ods: "excel", odt: "word", log: "log",
      // media
      mp4: "video", avi: "video", mov: "video", mkv: "video", flv: "video", wmv: "video",
      mp3: "audio", wav: "audio", flac: "audio", ogg: "audio", m4a: "audio", wma: "audio", aiff: "audio",
      // sys / system
      lock: "lock", dll: "binary", exe: "binary", so: "binary", dylib: "binary", bin: "binary", out: "binary",
      ttf: "font", woff: "font", woff2: "font", eot: "font", otf: "font",
      pem: "cert", crt: "cert", key: "cert", cer: "cert"
    };
    return { icon: map[lowExt] ? `vscode-icons:file-type-${map[lowExt]}` : "vscode-icons:default-file" };
  }

  if (isCat) {
    const map: Record<string, string> = {
      js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", html: "html", css: "css", json: "json", vue: "vue", svelte: "svelte", astro: "astro",
      xml: "xml", yaml: "yaml", yml: "yaml", toml: "toml", conf: "yaml",
      py: "python", rs: "rust", go: "go", java: "java", class: "java", c: "c", cpp: "cpp", php: "php", rb: "ruby", swift: "swift", kt: "kotlin", sql: "sql", db: "database", sqlite: "database", md: "markdown", mdx: "markdown",
      sh: "bash", bash: "bash", zsh: "bash", bat: "bash", ps1: "bash",
      png: "image", jpg: "image", jpeg: "image", gif: "image", svg: "svg", webp: "image", tiff: "image", ico: "image", heic: "image", heif: "image", raw: "image", psd: "image", ai: "image",
      zip: "zip", tar: "zip", gz: "zip", "7z": "zip", rar: "zip", iso: "zip", bz2: "zip", dmg: "zip",
      pdf: "pdf", txt: "document", doc: "document", docx: "document", xls: "document", xlsx: "document", csv: "document", ppt: "document", pptx: "document", rtf: "document", pages: "document", numbers: "document", log: "document",
      mp4: "video", avi: "video", mov: "video", mkv: "video", flv: "video", mp3: "audio", wav: "audio", flac: "audio", ogg: "audio", m4a: "audio",
      lock: "lock", dll: "exe", exe: "exe", so: "exe", bin: "exe", out: "exe",
      ttf: "font", woff: "font", woff2: "font", eot: "font", otf: "font", pem: "certificate", crt: "certificate", key: "certificate"
    };
    return { icon: map[lowExt] ? `catppuccin:${map[lowExt]}` : "catppuccin:file" };
  }

  // Material fallback with colors
  const matMap: Record<string, { icon: string, color: string }> = {
    js: { icon: "mdi:language-javascript", color: "#f7df1e" }, mjs: { icon: "mdi:language-javascript", color: "#f7df1e" }, cjs: { icon: "mdi:language-javascript", color: "#f7df1e" }, jsx: { icon: "mdi:react", color: "#61dafb" },
    ts: { icon: "mdi:language-typescript", color: "#3178c6" }, tsx: { icon: "mdi:react", color: "#61dafb" },
    html: { icon: "mdi:language-html5", color: "#e34f26" }, css: { icon: "mdi:language-css3", color: "#264de4" }, scss: { icon: "mdi:sass", color: "#cc6699" }, sass: { icon: "mdi:sass", color: "#cc6699" },
    vue: { icon: "mdi:vuejs", color: "#41b883" }, svelte: { icon: "mdi:puzzle-outline", color: "#ff3e00" },
    json: { icon: "mdi:code-json", color: "#fbc02d" }, xml: { icon: "mdi:xml", color: "#0060ac" }, yaml: { icon: "mdi:format-align-left", color: "#e34f26" }, yml: { icon: "mdi:format-align-left", color: "#e34f26" }, toml: { icon: "mdi:file-cog-outline", color: "#a0a0a0" }, env: { icon: "mdi:cog-outline", color: "#a0a0a0" },
    py: { icon: "mdi:language-python", color: "#3776ab" }, rs: { icon: "mdi:language-rust", color: "#dea584" }, go: { icon: "mdi:language-go", color: "#00add8" }, 
    java: { icon: "mdi:language-java", color: "#b07219" }, jar: { icon: "mdi:language-java", color: "#b07219" }, class: { icon: "mdi:language-java", color: "#b07219" },
    c: { icon: "mdi:language-c", color: "#00599c" }, cpp: { icon: "mdi:language-cpp", color: "#00599c" }, h: { icon: "mdi:language-c", color: "#00599c" }, cs: { icon: "mdi:language-csharp", color: "#239120" },
    php: { icon: "mdi:language-php", color: "#777bb4" }, rb: { icon: "mdi:language-ruby", color: "#cc342d" }, swift: { icon: "mdi:language-swift", color: "#fa7343" }, kt: { icon: "mdi:language-kotlin", color: "#7f52ff" },
    md: { icon: "mdi:language-markdown", color: "#ffffff" }, sql: { icon: "mdi:database-search", color: "#e38c00" }, db: { icon: "mdi:database", color: "#a0a0a0" }, sqlite: { icon: "mdi:database", color: "#a0a0a0" },
    sh: { icon: "mdi:bash", color: "#4eaa25" }, bash: { icon: "mdi:bash", color: "#4eaa25" }, zsh: { icon: "mdi:bash", color: "#4eaa25" }, bat: { icon: "mdi:microsoft-windows", color: "#00a4ef" }, ps1: { icon: "mdi:powershell", color: "#002456" },
    png: { icon: "mdi:image", color: "#4ade80" }, jpg: { icon: "mdi:image", color: "#4ade80" }, jpeg: { icon: "mdi:image", color: "#4ade80" }, gif: { icon: "mdi:image", color: "#4ade80" }, svg: { icon: "mdi:svg", color: "#ffb13b" }, webp: { icon: "mdi:image", color: "#4ade80" }, psd: { icon: "mdi:image-edit-outline", color: "#31a8ff" }, ai: { icon: "mdi:image-edit-outline", color: "#ff7c00" },
    zip: { icon: "mdi:folder-zip", color: "#f87171" }, tar: { icon: "mdi:folder-zip", color: "#f87171" }, rar: { icon: "mdi:folder-zip", color: "#f87171" }, gz: { icon: "mdi:folder-zip", color: "#f87171" }, "7z": { icon: "mdi:folder-zip", color: "#f87171" }, iso: { icon: "mdi:disc", color: "#f87171" },
    pdf: { icon: "mdi:file-pdf-box", color: "#ef4444" }, txt: { icon: "mdi:file-document-outline", color: "var(--text-main)" }, log: { icon: "mdi:text-box-search-outline", color: "var(--text-muted)" },
    doc: { icon: "mdi:file-word", color: "#2b579a" }, docx: { icon: "mdi:file-word", color: "#2b579a" }, xls: { icon: "mdi:file-excel", color: "#217346" }, xlsx: { icon: "mdi:file-excel", color: "#217346" }, csv: { icon: "mdi:file-delimited", color: "#107c41" }, ppt: { icon: "mdi:file-powerpoint", color: "#b7472a" }, pptx: { icon: "mdi:file-powerpoint", color: "#b7472a" },
    mp4: { icon: "mdi:file-video", color: "#a855f7" }, avi: { icon: "mdi:file-video", color: "#a855f7" }, mov: { icon: "mdi:file-video", color: "#a855f7" }, mkv: { icon: "mdi:file-video", color: "#a855f7" },
    mp3: { icon: "mdi:file-music", color: "#ec4899" }, wav: { icon: "mdi:file-music", color: "#ec4899" }, flac: { icon: "mdi:file-music", color: "#ec4899" }, ogg: { icon: "mdi:file-music", color: "#ec4899" },
    ttf: { icon: "mdi:format-font", color: "#a0a0a0" }, woff: { icon: "mdi:format-font", color: "#a0a0a0" }, otf: { icon: "mdi:format-font", color: "#a0a0a0" },
    pem: { icon: "mdi:certificate", color: "#fbc02d" }, crt: { icon: "mdi:certificate", color: "#fbc02d" }, key: { icon: "mdi:key-outline", color: "#fbc02d" },
    lock: { icon: "mdi:lock-outline", color: "#fbc02d" }, exe: { icon: "mdi:application-cog", color: "#00a4ef" }, dll: { icon: "mdi:application-cog", color: "#00a4ef" }, so: { icon: "mdi:application-cog", color: "#00a4ef" }, bin: { icon: "mdi:application-cog", color: "#00a4ef" }
  };
  
  return matMap[lowExt] || { icon: "mdi:file", color: "var(--text-muted)" };
};

export const FileIcon = (props: { type: "file" | "folder", ext?: string, pack: IconPack, size: number }) => {
  const iconData = createMemo(() => getThemedFileIcon(props.pack, props.type, props.ext));
  return (
    <iconify-icon 
      icon={iconData().icon} 
      width={props.size} 
      height={props.size}
      style={{ "flex-shrink": 0, "color": iconData().color || undefined }}
    />
  );
};
