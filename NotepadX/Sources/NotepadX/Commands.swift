import SwiftUI

struct AppCommands: Commands {
    @ObservedObject var appState = AppState.shared
    @ObservedObject var settings = EditorSettings.shared

    var body: some Commands {
        CommandGroup(replacing: .newItem) {
            Button("New Tab") { appState.newDocument() }
                .keyboardShortcut("n", modifiers: .command)
            Button("Open…") { appState.openWithPanel() }
                .keyboardShortcut("o", modifiers: .command)
            Button("Open Folder…") { appState.openFolderWithPanel() }
                .keyboardShortcut("o", modifiers: [.command, .shift])
            Menu("Open Recent") {
                ForEach(appState.recentFiles, id: \.self) { path in
                    Button((path as NSString).lastPathComponent) {
                        appState.open(urls: [URL(fileURLWithPath: path)])
                    }
                }
                if !appState.recentFiles.isEmpty {
                    Divider()
                    Button("Clear Menu") { appState.clearRecents() }
                }
            }
        }

        CommandGroup(replacing: .saveItem) {
            Button("Save") { appState.saveActive() }
                .keyboardShortcut("s", modifiers: .command)
                .disabled(appState.activeDocument == nil)
            Button("Save As…") { appState.saveActiveAs() }
                .keyboardShortcut("s", modifiers: [.command, .shift])
                .disabled(appState.activeDocument == nil)
            Button("Save All") { appState.saveAll() }
                .keyboardShortcut("s", modifiers: [.command, .option])
            Divider()
            Button("Close Tab") { appState.closeActive() }
                .keyboardShortcut("w", modifiers: .command)
                .disabled(appState.activeDocument == nil)
        }

        CommandGroup(after: .pasteboard) {
            Divider()
            Button("Duplicate Line") { appState.activeDocument?.controller.duplicateLine() }
                .keyboardShortcut("d", modifiers: .command)
            Button("Delete Line") { appState.activeDocument?.controller.deleteLine() }
                .keyboardShortcut("k", modifiers: [.command, .shift])
            Button("Move Line Up") { appState.activeDocument?.controller.moveLine(up: true) }
                .keyboardShortcut(.upArrow, modifiers: [.command, .option])
            Button("Move Line Down") { appState.activeDocument?.controller.moveLine(up: false) }
                .keyboardShortcut(.downArrow, modifiers: [.command, .option])
            Button("Toggle Comment") { appState.activeDocument?.controller.toggleComment() }
                .keyboardShortcut("/", modifiers: .command)
            Divider()
            Menu("Convert Case") {
                Button("UPPERCASE") {
                    appState.activeDocument?.controller.transformSelection { $0.uppercased() }
                }
                Button("lowercase") {
                    appState.activeDocument?.controller.transformSelection { $0.lowercased() }
                }
                Button("Title Case") {
                    appState.activeDocument?.controller.transformSelection { $0.capitalized }
                }
            }
            Button("Trim Trailing Whitespace") { appState.activeDocument?.controller.trimTrailingWhitespace() }
        }

        CommandMenu("Find") {
            Button("Find…") {
                appState.findBarShowsReplace = false
                appState.showFindBar = true
            }
            .keyboardShortcut("f", modifiers: .command)
            Button("Find and Replace…") {
                appState.findBarShowsReplace = true
                appState.showFindBar = true
            }
            .keyboardShortcut("f", modifiers: [.command, .option])
            Button("Find Next") { appState.activeDocument?.controller.findNext() }
                .keyboardShortcut("g", modifiers: .command)
            Button("Find Previous") { appState.activeDocument?.controller.findPrevious() }
                .keyboardShortcut("g", modifiers: [.command, .shift])
            Divider()
            Button("Go to Line…") { appState.showGoToLine = true }
                .keyboardShortcut("l", modifiers: .command)
        }

        CommandGroup(before: .toolbar) {
            Toggle("Show Sidebar", isOn: $appState.showSidebar)
                .keyboardShortcut("e", modifiers: [.command, .shift])
            Toggle("Word Wrap", isOn: $settings.wordWrap)
                .keyboardShortcut("w", modifiers: [.command, .option])
            Toggle("Line Numbers", isOn: $settings.showLineNumbers)
                .keyboardShortcut("l", modifiers: [.command, .shift])
            Toggle("Highlight Current Line", isOn: $settings.highlightCurrentLine)
            Picker("Theme", selection: $settings.themeName) {
                ForEach(Theme.all) { theme in
                    Text(theme.name).tag(theme.name)
                }
            }
            Divider()
            Button("Zoom In") { settings.fontSize = min(48, settings.fontSize + 1) }
                .keyboardShortcut("=", modifiers: .command)
            Button("Zoom Out") { settings.fontSize = max(8, settings.fontSize - 1) }
                .keyboardShortcut("-", modifiers: .command)
            Button("Reset Zoom") { settings.fontSize = EditorSettings.defaultFontSize }
                .keyboardShortcut("0", modifiers: .command)
            Divider()
            Button("Next Tab") { appState.nextTab() }
                .keyboardShortcut("]", modifiers: [.command, .shift])
            Button("Previous Tab") { appState.previousTab() }
                .keyboardShortcut("[", modifiers: [.command, .shift])
        }

        CommandMenu("Format") {
            Picker("Language", selection: languageBinding) {
                ForEach(Language.allCases) { language in
                    Text(language.displayName).tag(language)
                }
            }
            .disabled(appState.activeDocument == nil)
            Picker("Line Endings", selection: lineEndingBinding) {
                ForEach(LineEnding.allCases) { lineEnding in
                    Text(lineEnding.displayName).tag(lineEnding)
                }
            }
            .disabled(appState.activeDocument == nil)
            Picker("Encoding", selection: encodingBinding) {
                ForEach(EncodingOption.allCases) { option in
                    Text(option.displayName).tag(option)
                }
            }
            .disabled(appState.activeDocument == nil)
        }
    }

    private var languageBinding: Binding<Language> {
        Binding(
            get: { appState.activeDocument?.language ?? .plainText },
            set: { appState.activeDocument?.language = $0 }
        )
    }

    private var lineEndingBinding: Binding<LineEnding> {
        Binding(
            get: { appState.activeDocument?.lineEnding ?? .lf },
            set: { newValue in
                guard let document = appState.activeDocument, document.lineEnding != newValue else { return }
                document.lineEnding = newValue
                document.isModified = true
            }
        )
    }

    private var encodingBinding: Binding<EncodingOption> {
        Binding(
            get: { appState.activeDocument.map { EncodingOption.from($0.encoding) } ?? .utf8 },
            set: { newValue in
                guard let document = appState.activeDocument,
                      EncodingOption.from(document.encoding) != newValue else { return }
                document.encoding = newValue.encoding
                document.isModified = true
            }
        )
    }
}
