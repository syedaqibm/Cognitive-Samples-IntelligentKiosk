import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var settings: EditorSettings

    var body: some View {
        HSplitView {
            if appState.showSidebar {
                SidebarView()
                    .frame(minWidth: 170, idealWidth: 230, maxWidth: 420)
            }
            mainArea
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .sheet(isPresented: $appState.showGoToLine) {
            GoToLineView()
        }
        .onDrop(of: [UTType.fileURL], isTargeted: nil) { providers in
            handleDrop(providers)
        }
    }

    private var mainArea: some View {
        VStack(spacing: 0) {
            TabBarView()
            Divider()
            if appState.showFindBar, let document = appState.activeDocument {
                FindReplaceBar(document: document)
                    .id(document.id)
                Divider()
            }
            if let document = appState.activeDocument {
                EditorView(document: document)
                    .id(document.id)
            } else {
                WelcomeView()
            }
            Divider()
            StatusBarView()
        }
        .frame(minWidth: 400, maxWidth: .infinity, maxHeight: .infinity)
    }

    private func handleDrop(_ providers: [NSItemProvider]) -> Bool {
        var handled = false
        for provider in providers where provider.canLoadObject(ofClass: URL.self) {
            handled = true
            _ = provider.loadObject(ofClass: URL.self) { url, _ in
                guard let url else { return }
                DispatchQueue.main.async {
                    AppState.shared.open(urls: [url])
                }
            }
        }
        return handled
    }
}

struct WelcomeView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "doc.text")
                .font(.system(size: 52))
                .foregroundStyle(.secondary)
            Text("NotepadX")
                .font(.largeTitle.bold())
            Text("A Notepad++-style editor for macOS")
                .foregroundStyle(.secondary)
            HStack(spacing: 10) {
                Button("New File") { appState.newDocument() }
                Button("Open File…") { appState.openWithPanel() }
                Button("Open Folder…") { appState.openFolderWithPanel() }
            }
            .padding(.top, 6)
            if !appState.recentFiles.isEmpty {
                Divider().frame(maxWidth: 280)
                Text("Recent Files")
                    .font(.headline)
                ForEach(Array(appState.recentFiles.prefix(5)), id: \.self) { path in
                    Button {
                        appState.open(urls: [URL(fileURLWithPath: path)])
                    } label: {
                        Text((path as NSString).lastPathComponent)
                    }
                    .buttonStyle(.link)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct GoToLineView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var lineText = ""
    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Go to Line")
                .font(.headline)
            TextField("Line number", text: $lineText)
                .textFieldStyle(.roundedBorder)
                .frame(width: 220)
                .focused($focused)
                .onSubmit(go)
            HStack {
                Spacer()
                Button("Cancel") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Button("Go", action: go)
                    .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .onAppear { focused = true }
    }

    private func go() {
        if let line = Int(lineText.trimmingCharacters(in: .whitespaces)), line > 0 {
            appState.activeDocument?.controller.goToLine(line)
        }
        dismiss()
    }
}
