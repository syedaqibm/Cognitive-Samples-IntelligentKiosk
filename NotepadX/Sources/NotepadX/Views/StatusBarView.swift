import SwiftUI

struct StatusBarView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            if let document = appState.activeDocument {
                StatusBarContent(document: document)
                    .id(document.id)
            } else {
                HStack {
                    Text("Ready")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(.horizontal, 10)
            }
        }
        .frame(height: 27)
        .background(.bar)
    }
}

private struct StatusBarContent: View {
    @ObservedObject var document: Document

    var body: some View {
        HStack(spacing: 14) {
            Text("Ln \(document.caretLine), Col \(document.caretColumn)")
            if document.selectionLength > 0 {
                Text("Sel \(document.selectionLength)")
            }
            Text("\(document.wordCount) words")
            Text("\(document.characterCount) chars")
            Spacer()
            Picker("Language", selection: languageBinding) {
                ForEach(Language.allCases) { language in
                    Text(language.displayName).tag(language)
                }
            }
            .pickerStyle(.menu)
            .labelsHidden()
            .fixedSize()
            .help("Syntax Language")
            Picker("Encoding", selection: encodingBinding) {
                ForEach(EncodingOption.allCases) { option in
                    Text(option.displayName).tag(option)
                }
            }
            .pickerStyle(.menu)
            .labelsHidden()
            .fixedSize()
            .help("File Encoding")
            Picker("Line Endings", selection: lineEndingBinding) {
                ForEach(LineEnding.allCases) { lineEnding in
                    Text(lineEnding.shortName).tag(lineEnding)
                }
            }
            .pickerStyle(.menu)
            .labelsHidden()
            .fixedSize()
            .help("Line Endings")
        }
        .font(.caption)
        .foregroundStyle(.secondary)
        .padding(.horizontal, 10)
    }

    private var languageBinding: Binding<Language> {
        Binding(
            get: { document.language },
            set: { document.language = $0 }
        )
    }

    private var encodingBinding: Binding<EncodingOption> {
        Binding(
            get: { EncodingOption.from(document.encoding) },
            set: { newValue in
                guard EncodingOption.from(document.encoding) != newValue else { return }
                document.encoding = newValue.encoding
                document.isModified = true
            }
        )
    }

    private var lineEndingBinding: Binding<LineEnding> {
        Binding(
            get: { document.lineEnding },
            set: { newValue in
                guard document.lineEnding != newValue else { return }
                document.lineEnding = newValue
                document.isModified = true
            }
        )
    }
}
