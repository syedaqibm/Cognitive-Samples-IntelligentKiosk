# NotepadX Cross — Claude Code build prompt

This document is a **complete, paste-ready prompt** for Claude Code (in VS Code or the CLI).
It generates **NotepadX Cross**: a Notepad++-class text editor that ships from **one codebase**
to **macOS, Windows, iOS, and Android**, built with **Tauri 2 + React + TypeScript + CodeMirror 6**.

**How to use it**

1. Create a new **empty folder** on your machine (e.g. `notepadx-cross/`) and open it in VS Code.
2. Make sure prerequisites are installed (see the "Platform prerequisites" section inside the prompt —
   Node 20+, Rust, and Xcode / Android Studio only for the mobile targets you want).
3. Start Claude Code and paste **everything between the BEGIN PROMPT / END PROMPT markers** as your first message.
4. Let it work phase by phase; each phase ends with a runnable checkpoint (`npm run tauri dev`).

---

## BEGIN PROMPT

You are building **NotepadX Cross**, a fast, polished, Notepad++-class text editor that ships from a
single codebase to macOS 12+, Windows 10+, iOS 15+, and Android 8+. Work in the current empty folder.

## Goal & quality bar

- A serious editor, not a demo: it must handle a 10 MB log file smoothly (open in under ~1 s, no typing lag).
- Desktop-grade keyboard UX on Mac/Windows; touch-friendly layout on mobile.
- Native feel: system fonts, correct platform modifier keys (⌘ on macOS, Ctrl elsewhere), dark/light aware.
- Never lose work: session restore preserves **unsaved buffers** across app restarts (Notepad++'s signature behavior).

## Tech stack (use exactly this)

- **Tauri 2** (`@tauri-apps/cli` v2, `@tauri-apps/api` v2) — desktop AND mobile shells from one project.
- **React 18 + TypeScript 5 (strict) + Vite 5**.
- **CodeMirror 6** for the editor: `codemirror`, `@codemirror/state`, `@codemirror/view`,
  `@codemirror/language`, `@codemirror/commands`, `@codemirror/search`,
  plus language packages: `@codemirror/lang-javascript`, `-python`, `-html`, `-css`, `-json`,
  `-markdown`, `-xml`, `-sql`, `-yaml`, `-cpp`, `-java`, `-php`, `-rust`, and `@codemirror/language-data`
  for the long tail (Go, Ruby, Shell, Swift, Kotlin, C#, TOML… loaded lazily).
- **Zustand** for app state.
- Tauri plugins: `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-store`
  (with their Rust counterparts `tauri-plugin-fs`, `tauri-plugin-dialog`, `tauri-plugin-store`).
- **No UI component framework** (no MUI/Chakra). Hand-rolled CSS in `src/styles.css` with CSS variables per theme.
- Keep custom Rust to a minimum — plugins cover files/dialogs; add Rust commands only if something is
  impossible from JS (you likely need none).

## Feature specification

### Editing core
- **Tabs**: multiple open documents; tab bar with filename, modified-dot, close button (x on hover),
  context menu (Close, Close Others, Close All, Copy Path), overflow scrolling; Ctrl/⌘+W closes,
  Ctrl/⌘+Shift+]/[ cycles; new tabs named "Untitled 1, 2, …".
- **Syntax highlighting** for 20+ languages via CodeMirror language packages + `language-data`,
  auto-detected from file extension, manually switchable from the status bar.
- **Line numbers**, active-line highlight, bracket matching, code folding (CodeMirror `foldGutter`).
- **Find & Replace bar** (not a modal): plain / **regex** (with `$1` capture groups in replacements),
  case-sensitive and whole-word toggles, live match counter ("3 of 12"), highlight-all,
  Enter = next, Shift+Enter = previous, Replace / Replace All (single undo step), Esc closes.
- **Power tools**: duplicate line (Ctrl/⌘+D), delete line (Ctrl/⌘+Shift+K), move line up/down (Alt+↑/↓),
  toggle line comment (Ctrl/⌘+/), auto-indent on Enter, multiple cursors (CodeMirror default),
  UPPERCASE/lowercase/Title Case selection, trim trailing whitespace (manual command + on-save setting),
  go to line (Ctrl/⌘+G) with a small dialog.
- **View**: word-wrap toggle, zoom in/out/reset (Ctrl/⌘+= / - / 0) adjusting editor font size,
  show/hide line numbers.

### Files & workspace
- **Open/Save/Save As** through `@tauri-apps/plugin-dialog` + `plugin-fs`; **Save All**; dirty-check
  confirm dialog on close (Save / Don't Save / Cancel).
- **Encoding**: detect UTF-8 (default), UTF-16 LE/BE (by BOM), fall back to Latin-1 when UTF-8 decoding
  fails. Show in status bar; user can switch, marking the doc dirty. Files are read as bytes
  (`readFile` → `Uint8Array`) and decoded with `TextDecoder`; on save, encode UTF-8 with `TextEncoder`
  and hand-encode UTF-16/Latin-1 into a `Uint8Array` (TextEncoder only does UTF-8 — write helpers in
  `src/platform/encoding.ts`).
- **Line endings**: detect LF / CRLF / CR on open, normalize to LF in memory, re-apply the chosen EOL
  on save; show + switch in the status bar.
- **Folder sidebar**: open a folder, lazy directory tree (`readDir` per expand), click file to open;
  desktop: resizable left panel; mobile: slide-in drawer.
- **Session restore**: on quit/background, persist all tabs — path, language, encoding, EOL, caret,
  and the **full text of unsaved/untitled buffers** — via `plugin-store` (`session.json`). Restore on launch.
- **Recent files** (last 10) in the welcome screen and File menu.
- **Drag & drop** files onto the window to open (Tauri `onDragDropEvent` on desktop).

### Look & settings
- **6 themes**: Default Light, Default Dark, Monokai (`#272822` bg), Dracula (`#282A36`),
  Solarized Light (`#FDF6E3`), Nord (`#2E3440`). Each theme is a CodeMirror `EditorView.theme` +
  `HighlightStyle` pair AND a set of CSS variables for the surrounding chrome, so the whole app reskins.
- **Status bar**: Ln/Col, selection length, word + character count, language / encoding / EOL pickers.
- **Settings dialog**: theme, font family (monospace list) & size, tab width, spaces-vs-tabs, word wrap,
  line numbers, auto-indent, trim-on-save, restore-session. Persist via `plugin-store` (`settings.json`).

### Mobile adaptations (iOS/Android)
- Detect mobile via `platform()` from `@tauri-apps/plugin-os` (add it) or a `navigator.maxTouchPoints`
  fallback — centralize in `src/platform/platform.ts`.
- Layout: tab bar becomes horizontally scrollable chips; sidebar becomes a drawer behind a hamburger
  button; add a **bottom toolbar** (undo, redo, tab-indent, find, save) sized for touch (44 px targets).
- Respect the on-screen keyboard: use `visualViewport` resize to keep the caret visible.
- File access differences: mobile has no arbitrary paths — rely on the dialog plugin's native document
  picker; hide the folder sidebar on mobile if `readDir` of a picked directory isn't permitted.

## File tree (create exactly this)

```
notepadx-cross/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx                  # React root
│   ├── App.tsx                   # layout: Sidebar | (TabBar / FindReplaceBar / EditorPane / StatusBar)
│   ├── styles.css                # CSS variables per theme + all chrome styling
│   ├── components/
│   │   ├── TabBar.tsx
│   │   ├── EditorPane.tsx        # hosts the CodeMirror view of the active document
│   │   ├── FindReplaceBar.tsx
│   │   ├── StatusBar.tsx
│   │   ├── Sidebar.tsx           # folder tree (desktop panel / mobile drawer)
│   │   ├── SettingsDialog.tsx
│   │   ├── GoToLineDialog.tsx
│   │   ├── WelcomeScreen.tsx     # shown when no tabs: New / Open / recent files
│   │   └── MobileToolbar.tsx
│   ├── editor/
│   │   ├── createEditor.ts       # builds EditorState: extensions, compartments, keymap
│   │   ├── themes.ts             # 6 themes (EditorView.theme + HighlightStyle + CSS var maps)
│   │   ├── languages.ts          # extension→language map, lazy loaders, manual override
│   │   ├── commands.ts           # duplicate/delete/move line, toggle comment, case ops, trim
│   │   └── searchController.ts   # regex/plain search, match counting, replace one/all
│   ├── state/
│   │   ├── documentsStore.ts     # zustand: tabs, active id, dirty flags, open/save/close flows
│   │   ├── settingsStore.ts      # zustand + plugin-store persistence
│   │   └── sessionStore.ts       # save/restore session incl. unsaved text
│   ├── platform/
│   │   ├── platform.ts           # isMobile / isMac / modifier-key helper
│   │   ├── fs.ts                 # read/write bytes via plugin-fs
│   │   ├── dialogs.ts            # open/save/confirm via plugin-dialog
│   │   └── encoding.ts           # decode (BOM sniff) + encode UTF-8/UTF-16LE/BE/Latin-1
│   └── utils/
│       ├── eol.ts                # detect/normalize/apply LF-CRLF-CR
│       └── detectLanguage.ts     # filename → language id
└── src-tauri/
    ├── Cargo.toml
    ├── build.rs
    ├── tauri.conf.json           # app id com.notepadx.cross, window 1100x720 min 700x400
    ├── capabilities/default.json # fs, dialog, store permissions (scope: dialog-granted paths)
    ├── icons/                    # tauri icon output
    └── src/
        ├── main.rs               # desktop entry → notepadx_cross_lib::run()
        └── lib.rs                # tauri::Builder with fs/dialog/store plugins; #[cfg_attr(mobile, tauri::mobile_entry_point)]
```

## Key implementation notes

- **One CodeMirror `EditorState` per document**, kept alive in `documentsStore` so undo history,
  selection, and scroll survive tab switches; `EditorPane` owns a single `EditorView` and swaps states
  with `view.setState(...)` on tab change.
- Use **`Compartment`s** for theme, language, word wrap (`EditorView.lineWrapping`), tab size, and
  keymap so settings apply live via `view.dispatch({ effects: compartment.reconfigure(...) })`.
- Dirty tracking: compare doc against last-saved text via an `updateListener` setting a `dirty` flag
  (cheap: track a "savedVersion" counter, not string compares on every keystroke).
- Shortcuts: register a single `keymap.of([...])` in `createEditor.ts` for editor-scoped commands and a
  `window` keydown handler for app-scoped ones (save, tab cycling); use `Mod-` prefixes so ⌘/Ctrl are correct.
- Session autosave: debounce 2 s after any change + on `blur` and Tauri close-requested event.
- Large-file guard: above ~10 MB, load with syntax highlighting disabled and disable match-all highlighting.
- Never block the UI thread on file IO — all plugin calls are already async; show a subtle busy state.

## Build order — work in phases, checkpoint after each

1. **Scaffold**: `npm create tauri-app@latest` equivalent by hand — package.json, Vite, TS strict,
   Tauri init with the three plugins registered (JS + Rust sides + capabilities). Checkpoint:
   `npm run tauri dev` opens an empty window.
2. **Editor core**: CodeMirror in `EditorPane` with one hardcoded doc, themes.ts (all 6), languages.ts,
   line numbers, wrap toggle. Checkpoint: typing + theme switch works.
3. **Tabs & files**: documentsStore, TabBar, WelcomeScreen, open/save/save-as/close with dirty confirm,
   encoding + EOL pipeline, drag & drop, recent files. Checkpoint: full file round-trip incl. CRLF file.
4. **Find/replace & power tools**: FindReplaceBar + searchController, commands.ts line ops, GoToLineDialog.
   Checkpoint: regex replace-all with `$1` works and is one undo step.
5. **Workspace & persistence**: Sidebar folder tree, SettingsDialog + settingsStore, sessionStore with
   unsaved-buffer restore. Checkpoint: quit with unsaved untitled tab → relaunch → text is back.
6. **Mobile**: platform.ts, MobileToolbar, drawer sidebar, viewport handling; `npm run tauri android init`
   / `ios init` and fix anything mobile-specific. Checkpoint: runs in Android emulator / iOS simulator.
7. **Polish**: status bar counts, zoom, keyboard-shortcut audit on both modifier schemes, README with
   per-platform build docs, app icons (`npm run tauri icon` on a placeholder SVG).

After each phase: run `npm run build` (type-check) and fix all TypeScript errors before moving on.

## Platform prerequisites (document these in the README you generate)

- All: Node 20+, Rust stable (`rustup`), `npm i`.
- Windows: Microsoft C++ Build Tools + WebView2 (preinstalled on Win 11).
- macOS: Xcode Command Line Tools.
- iOS: full Xcode + `rustup target add aarch64-apple-ios aarch64-apple-ios-sim`; `npm run tauri ios init && npm run tauri ios dev`.
- Android: Android Studio + NDK + `rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android`; `npm run tauri android init && npm run tauri android dev`.
- Dev commands: `npm run tauri dev` (desktop), `npm run tauri build` (installers: .dmg/.msi),
  `npm run tauri ios dev`, `npm run tauri android dev`.

## Conventions & constraints

- TypeScript `strict: true`; no `any` except at plugin boundaries with a comment.
- Small files (< ~300 lines each); components purely presentational, logic in stores/editor modules.
- Test the pieces that are pure logic (encoding, eol, detectLanguage) with Vitest; skip UI tests.
- Accessibility: all icon buttons get `aria-label` + `title` tooltips showing their shortcut.
- Do not add dependencies beyond those listed without stating why in one sentence.

Start with Phase 1 now. As you finish each phase, state the checkpoint result and continue.

## END PROMPT
