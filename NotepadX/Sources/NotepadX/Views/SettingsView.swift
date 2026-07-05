import SwiftUI
import AppKit

struct SettingsView: View {
    @EnvironmentObject var settings: EditorSettings

    private var fontChoices: [String] {
        let candidates = [
            "Menlo", "Monaco", "SF Mono", "Courier", "Courier New", "Andale Mono",
            "PT Mono", "Fira Code", "FiraCode-Regular", "JetBrains Mono", "Source Code Pro",
            "IBM Plex Mono", "Cascadia Code"
        ]
        var available = candidates.filter { NSFont(name: $0, size: 12) != nil }
        if !available.contains(settings.fontName) {
            available.append(settings.fontName)
        }
        return available
    }

    var body: some View {
        Form {
            Section("Appearance") {
                Picker("Theme", selection: $settings.themeName) {
                    ForEach(Theme.all) { theme in
                        Text(theme.name).tag(theme.name)
                    }
                }
                Picker("Font", selection: $settings.fontName) {
                    ForEach(fontChoices, id: \.self) { name in
                        Text(name).tag(name)
                    }
                }
                Stepper("Font Size: \(Int(settings.fontSize)) pt",
                        value: $settings.fontSize, in: 8...48, step: 1)
                Toggle("Show Line Numbers", isOn: $settings.showLineNumbers)
                Toggle("Highlight Current Line", isOn: $settings.highlightCurrentLine)
            }
            Section("Editing") {
                Stepper("Tab Width: \(settings.tabWidth)",
                        value: $settings.tabWidth, in: 1...8)
                Toggle("Insert Spaces for Tab", isOn: $settings.insertSpacesForTab)
                Toggle("Auto Indent", isOn: $settings.autoIndent)
                Toggle("Word Wrap", isOn: $settings.wordWrap)
            }
            Section("Files") {
                Toggle("Trim Trailing Whitespace on Save", isOn: $settings.trimTrailingWhitespaceOnSave)
                Toggle("Restore Session on Launch", isOn: $settings.restoreSession)
            }
        }
        .formStyle(.grouped)
        .frame(width: 440)
        .fixedSize()
    }
}
