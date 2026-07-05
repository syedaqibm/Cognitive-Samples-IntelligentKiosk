import AppKit
import Combine

/// User preferences, persisted to UserDefaults. Editor controllers
/// subscribe to `objectWillChange` and re-apply on every change.
final class EditorSettings: ObservableObject {
    static let shared = EditorSettings()
    static let defaultFontSize: Double = 13

    @Published var fontName: String { didSet { defaults.set(fontName, forKey: Keys.fontName) } }
    @Published var fontSize: Double { didSet { defaults.set(fontSize, forKey: Keys.fontSize) } }
    @Published var themeName: String { didSet { defaults.set(themeName, forKey: Keys.themeName) } }
    @Published var tabWidth: Int { didSet { defaults.set(tabWidth, forKey: Keys.tabWidth) } }
    @Published var insertSpacesForTab: Bool { didSet { defaults.set(insertSpacesForTab, forKey: Keys.insertSpacesForTab) } }
    @Published var wordWrap: Bool { didSet { defaults.set(wordWrap, forKey: Keys.wordWrap) } }
    @Published var showLineNumbers: Bool { didSet { defaults.set(showLineNumbers, forKey: Keys.showLineNumbers) } }
    @Published var highlightCurrentLine: Bool { didSet { defaults.set(highlightCurrentLine, forKey: Keys.highlightCurrentLine) } }
    @Published var autoIndent: Bool { didSet { defaults.set(autoIndent, forKey: Keys.autoIndent) } }
    @Published var trimTrailingWhitespaceOnSave: Bool { didSet { defaults.set(trimTrailingWhitespaceOnSave, forKey: Keys.trimTrailingWhitespaceOnSave) } }
    @Published var restoreSession: Bool { didSet { defaults.set(restoreSession, forKey: Keys.restoreSession) } }

    private let defaults = UserDefaults.standard

    private enum Keys {
        static let fontName = "editor.fontName"
        static let fontSize = "editor.fontSize"
        static let themeName = "editor.themeName"
        static let tabWidth = "editor.tabWidth"
        static let insertSpacesForTab = "editor.insertSpacesForTab"
        static let wordWrap = "editor.wordWrap"
        static let showLineNumbers = "editor.showLineNumbers"
        static let highlightCurrentLine = "editor.highlightCurrentLine"
        static let autoIndent = "editor.autoIndent"
        static let trimTrailingWhitespaceOnSave = "editor.trimTrailingWhitespaceOnSave"
        static let restoreSession = "editor.restoreSession"
    }

    private init() {
        let defaults = UserDefaults.standard
        defaults.register(defaults: [
            Keys.fontName: "Menlo",
            Keys.fontSize: EditorSettings.defaultFontSize,
            Keys.themeName: "Default Dark",
            Keys.tabWidth: 4,
            Keys.insertSpacesForTab: true,
            Keys.wordWrap: false,
            Keys.showLineNumbers: true,
            Keys.highlightCurrentLine: true,
            Keys.autoIndent: true,
            Keys.trimTrailingWhitespaceOnSave: false,
            Keys.restoreSession: true
        ])
        fontName = defaults.string(forKey: Keys.fontName) ?? "Menlo"
        fontSize = defaults.double(forKey: Keys.fontSize)
        themeName = defaults.string(forKey: Keys.themeName) ?? "Default Dark"
        tabWidth = defaults.integer(forKey: Keys.tabWidth)
        insertSpacesForTab = defaults.bool(forKey: Keys.insertSpacesForTab)
        wordWrap = defaults.bool(forKey: Keys.wordWrap)
        showLineNumbers = defaults.bool(forKey: Keys.showLineNumbers)
        highlightCurrentLine = defaults.bool(forKey: Keys.highlightCurrentLine)
        autoIndent = defaults.bool(forKey: Keys.autoIndent)
        trimTrailingWhitespaceOnSave = defaults.bool(forKey: Keys.trimTrailingWhitespaceOnSave)
        restoreSession = defaults.bool(forKey: Keys.restoreSession)
    }

    var font: NSFont {
        NSFont(name: fontName, size: CGFloat(fontSize))
            ?? NSFont.monospacedSystemFont(ofSize: CGFloat(fontSize), weight: .regular)
    }

    var theme: Theme { Theme.named(themeName) }

    var tabString: String {
        insertSpacesForTab ? String(repeating: " ", count: max(1, tabWidth)) : "\t"
    }
}
