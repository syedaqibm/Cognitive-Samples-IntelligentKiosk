# NotepadX

A fast, native, **Notepad++-style text editor for macOS**, written in Swift with a SwiftUI shell and an AppKit (`NSTextView`) editing core. No Electron, no web views — it launches instantly and feels like a Mac app because it is one.

## Features

### Editing
- **Tabbed editing** — modified-dot indicators, close-on-hover, context menu (Close Others / Close All / Reveal in Finder / Copy Path), ⇧⌘] / ⇧⌘[ to cycle tabs
- **Syntax highlighting for 20+ languages** — Swift, Python, JavaScript, TypeScript, C, C++, C#, Objective-C, Java, Kotlin, Go, Rust, Ruby, PHP, Shell, SQL, HTML, CSS, JSON, XML, YAML, Markdown
- **Line numbers** with the current line emphasized, plus current-line background highlight
- **Find & Replace bar** — plain text or **regular expressions** (with `$1` capture-group templates), case-sensitive and whole-word modes, live match counter ("3 of 12"), highlight-all, replace one / replace all with full undo
- **Power tools** — duplicate line (⌘D), delete line (⇧⌘K), move line up/down (⌥⌘↑/↓), toggle comment (⌘/), auto-indent (with extra indent after `{`, `:`, …), case conversion, trim trailing whitespace (manual or on save), go to line (⌘L)
- **Word wrap** toggle, tabs-vs-spaces with configurable tab width, zoom (⌘= / ⌘- / ⌘0)

### Workspace
- **Folder sidebar** — open a folder and browse its file tree; click any file to open it
- **Session restore** — reopen your tabs on launch **including unsaved buffers**, Notepad++ style: quit any time, your scratch notes survive without ever hitting Save
- **Recent files** in the File menu and on the welcome screen
- **Drag & drop** files (or folders) onto the window to open them

### Files done right
- **Encoding detection & conversion** — UTF-8, UTF-16 (BOM-aware), ISO Latin-1; switch from the status bar or Format menu
- **Line-ending detection & conversion** — LF / CRLF / CR, shown and switchable in the status bar
- **Status bar** — line:column, selection length, word & character counts, language / encoding / EOL pickers

### Looks
- **6 built-in themes** — Default Light, Default Dark, Monokai, Dracula, Solarized Light, Nord
- Configurable monospaced font and size (Preferences, ⌘,)

## Requirements

- macOS 13 Ventura or later
- To build: Xcode 15+ (or the Swift 5.9+ toolchain)

## Build & run

```bash
cd NotepadX

# Quick run from the terminal
swift run

# Or build a proper .app bundle
make app
open dist/NotepadX.app
```

Or open the folder in Xcode (`File → Open… → NotepadX/Package.swift`), select the **NotepadX** scheme, and hit Run.

> Note: this project was authored in a Linux environment where Swift/AppKit cannot be compiled, so expect the possibility of small compile fixes on first build.

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| New tab | ⌘N |
| Open file / folder | ⌘O / ⇧⌘O |
| Save / Save As / Save All | ⌘S / ⇧⌘S / ⌥⌘S |
| Close tab | ⌘W |
| Next / previous tab | ⇧⌘] / ⇧⌘[ |
| Find / Find & Replace | ⌘F / ⌥⌘F |
| Find next / previous | ⌘G / ⇧⌘G |
| Go to line | ⌘L |
| Duplicate line | ⌘D |
| Delete line | ⇧⌘K |
| Move line up / down | ⌥⌘↑ / ⌥⌘↓ |
| Toggle comment | ⌘/ |
| Toggle sidebar | ⇧⌘E |
| Toggle word wrap | ⌥⌘W |
| Toggle line numbers | ⇧⌘L |
| Zoom in / out / reset | ⌘= / ⌘- / ⌘0 |
| Preferences | ⌘, |

## Architecture

```
Sources/NotepadX/
├── NotepadXApp.swift        SwiftUI app entry (WindowGroup + Settings scenes)
├── AppDelegate.swift        activation, file-open events, session save on quit
├── Commands.swift           the entire menu bar
├── Models/
│   ├── AppState.swift       document manager: tabs, open/save/close, recents, session
│   ├── Document.swift       per-tab model: URL, language, encoding, line endings
│   ├── EditorSettings.swift preferences persisted to UserDefaults
│   └── Session.swift        session state → Application Support/NotepadX/session.json
├── Editor/
│   ├── EditorController.swift  per-tab AppKit engine: text view, find/replace,
│   │                           line ops, auto-indent, highlight scheduling
│   ├── EditorTextView.swift    NSTextView subclass (current-line highlight, drag & drop)
│   ├── EditorView.swift        NSViewRepresentable bridge
│   └── LineNumberRulerView.swift
├── Syntax/
│   ├── Language.swift            language registry + detection by extension
│   ├── LanguageDefinitions.swift keyword/comment/string tables per language
│   └── SyntaxHighlighter.swift   scanner + regex two-pass highlighter
├── Themes/Theme.swift       built-in color themes
└── Views/                   tab bar, find bar, status bar, sidebar, settings, welcome
```

Design notes:

- **Each tab owns a long-lived `EditorController`** wrapping its `NSTextView`, so undo history, selection, and scroll position survive tab switches — SwiftUI only swaps which controller's view is hosted.
- **Highlighting is a two-pass engine**: a linear scanner finds strings/comments with real state (so `//` inside a string is not a comment), then regex rules color keywords/types/numbers/functions outside those spans. Passes are debounced 150 ms after typing and skipped for files over 2 MB.
- **All programmatic edits** (replace-all, line moves, comment toggles, trim) go through `shouldChangeText → replaceCharacters → didChangeText`, so everything is undoable with ⌘Z.
- Text is normalized to LF in memory; the chosen line ending is applied on save.
