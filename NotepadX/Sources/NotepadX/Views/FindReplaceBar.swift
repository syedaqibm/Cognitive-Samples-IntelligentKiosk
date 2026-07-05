import SwiftUI

struct FindReplaceBar: View {
    @ObservedObject var document: Document
    @EnvironmentObject var appState: AppState

    @State private var query = ""
    @State private var replacement = ""
    @State private var caseSensitive = false
    @State private var useRegex = false
    @State private var wholeWord = false
    @FocusState private var searchFocused: Bool

    private var controller: EditorController { document.controller }

    var body: some View {
        VStack(spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
                TextField("Find", text: $query)
                    .textFieldStyle(.roundedBorder)
                    .frame(minWidth: 140, maxWidth: 300)
                    .focused($searchFocused)
                    .onSubmit { controller.findNext() }
                MatchCountView(controller: controller)
                Toggle("Aa", isOn: $caseSensitive)
                    .toggleStyle(.button)
                    .help("Case Sensitive")
                Toggle(".*", isOn: $useRegex)
                    .toggleStyle(.button)
                    .help("Regular Expression")
                Toggle("|w|", isOn: $wholeWord)
                    .toggleStyle(.button)
                    .help("Whole Word")
                Button {
                    controller.findPrevious()
                } label: {
                    Image(systemName: "chevron.up")
                }
                .help("Find Previous (⇧⌘G)")
                Button {
                    controller.findNext()
                } label: {
                    Image(systemName: "chevron.down")
                }
                .help("Find Next (⌘G)")
                Spacer()
                Button {
                    appState.showFindBar = false
                    controller.endFindSession()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.borderless)
                .keyboardShortcut(.cancelAction)
                .help("Close (Esc)")
            }
            if appState.findBarShowsReplace {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.2.squarepath")
                        .foregroundStyle(.secondary)
                    TextField(useRegex ? "Replace ($1 for groups)" : "Replace", text: $replacement)
                        .textFieldStyle(.roundedBorder)
                        .frame(minWidth: 140, maxWidth: 300)
                        .onSubmit { controller.replaceCurrent(with: replacement) }
                    Button("Replace") { controller.replaceCurrent(with: replacement) }
                    Button("Replace All") { controller.replaceAll(with: replacement) }
                    Spacer()
                }
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.bar)
        .onAppear {
            searchFocused = true
            runSearch()
        }
        .onDisappear {
            controller.endFindSession()
        }
        .onChange(of: query) { _ in runSearch() }
        .onChange(of: caseSensitive) { _ in runSearch() }
        .onChange(of: useRegex) { _ in runSearch() }
        .onChange(of: wholeWord) { _ in runSearch() }
    }

    private func runSearch() {
        controller.setFindQuery(query, options: .init(
            caseSensitive: caseSensitive,
            useRegex: useRegex,
            wholeWord: wholeWord
        ))
    }
}

private struct MatchCountView: View {
    @ObservedObject var controller: EditorController

    var body: some View {
        Group {
            if controller.findQuery.isEmpty {
                Text("")
            } else if controller.matches.isEmpty {
                Text("No matches")
            } else {
                Text("\(controller.currentMatchIndex + 1) of \(controller.matches.count)")
            }
        }
        .font(.caption)
        .foregroundStyle(.secondary)
        .frame(minWidth: 70, alignment: .leading)
    }
}
