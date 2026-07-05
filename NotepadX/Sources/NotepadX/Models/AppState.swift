import AppKit
import Combine

/// Central document manager: open tabs, active tab, open/save/close
/// flows, recent files, and session persistence.
final class AppState: ObservableObject {
    static let shared = AppState()

    @Published var documents: [Document] = []
    @Published var activeDocumentID: UUID?
    @Published var rootFolder: URL?
    @Published var showSidebar = false
    @Published var showFindBar = false
    @Published var findBarShowsReplace = false
    @Published var showGoToLine = false
    @Published private(set) var recentFiles: [String] = []

    private let recentsKey = "recentFiles"
    private let maxRecents = 10

    var activeDocument: Document? {
        documents.first { $0.id == activeDocumentID }
    }

    private init() {
        recentFiles = UserDefaults.standard.stringArray(forKey: recentsKey) ?? []
        restoreSessionIfEnabled()
        ensureAtLeastOneDocument()
    }

    // MARK: - Tabs

    func newDocument() {
        let document = Document()
        documents.append(document)
        activeDocumentID = document.id
    }

    func activate(_ document: Document) {
        activeDocumentID = document.id
    }

    func ensureAtLeastOneDocument() {
        if documents.isEmpty { newDocument() }
    }

    func nextTab() {
        stepTab(by: 1)
    }

    func previousTab() {
        stepTab(by: -1)
    }

    private func stepTab(by delta: Int) {
        guard documents.count > 1,
              let index = documents.firstIndex(where: { $0.id == activeDocumentID }) else { return }
        let next = (index + delta + documents.count) % documents.count
        activeDocumentID = documents[next].id
    }

    // MARK: - Opening

    func open(urls: [URL]) {
        for url in urls {
            var isDirectory: ObjCBool = false
            guard FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) else { continue }
            if isDirectory.boolValue {
                rootFolder = url
                showSidebar = true
                continue
            }
            if let existing = documents.first(where: { $0.fileURL == url }) {
                activeDocumentID = existing.id
                continue
            }
            do {
                let document = try Document.open(url: url)
                replaceEmptyUntitledIfNeeded()
                documents.append(document)
                activeDocumentID = document.id
                addRecent(url)
            } catch {
                presentError(error, message: "Could not open “\(url.lastPathComponent)”.")
            }
        }
    }

    func openWithPanel() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = true
        if panel.runModal() == .OK {
            open(urls: panel.urls)
        }
    }

    func openFolderWithPanel() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        if panel.runModal() == .OK, let url = panel.url {
            rootFolder = url
            showSidebar = true
        }
    }

    /// Opening a file into a fresh window shouldn't leave a stray empty
    /// untitled tab behind.
    private func replaceEmptyUntitledIfNeeded() {
        if documents.count == 1,
           let only = documents.first,
           only.fileURL == nil,
           !only.isModified,
           only.text.isEmpty {
            documents.removeAll()
        }
    }

    // MARK: - Closing

    @discardableResult
    func close(_ document: Document) -> Bool {
        if document.isModified {
            switch runUnsavedChangesAlert(for: document) {
            case .save:
                guard save(document) else { return false }
            case .discard:
                break
            case .cancel:
                return false
            }
        }
        remove(document)
        return true
    }

    func closeActive() {
        if let document = activeDocument { close(document) }
    }

    func closeOthers(keeping document: Document) {
        for other in Array(documents) where other.id != document.id {
            if !close(other) { break }
        }
    }

    func closeAll() {
        for document in Array(documents) {
            if !close(document) { break }
        }
    }

    private func remove(_ document: Document) {
        guard let index = documents.firstIndex(where: { $0.id == document.id }) else { return }
        documents.remove(at: index)
        if activeDocumentID == document.id {
            if documents.isEmpty {
                activeDocumentID = nil
            } else {
                activeDocumentID = documents[min(index, documents.count - 1)].id
            }
        }
    }

    private enum UnsavedChoice { case save, discard, cancel }

    private func runUnsavedChangesAlert(for document: Document) -> UnsavedChoice {
        let alert = NSAlert()
        alert.messageText = "Do you want to save the changes made to “\(document.displayName)”?"
        alert.informativeText = "Your changes will be lost if you don't save them."
        alert.addButton(withTitle: "Save")
        alert.addButton(withTitle: "Don't Save")
        alert.addButton(withTitle: "Cancel")
        switch alert.runModal() {
        case .alertFirstButtonReturn: return .save
        case .alertSecondButtonReturn: return .discard
        default: return .cancel
        }
    }

    // MARK: - Saving

    @discardableResult
    func save(_ document: Document) -> Bool {
        if EditorSettings.shared.trimTrailingWhitespaceOnSave, document.isEditorLoaded {
            document.controller.trimTrailingWhitespace()
        }
        guard let url = document.fileURL else { return saveAs(document) }
        return write(document, to: url)
    }

    @discardableResult
    func saveAs(_ document: Document) -> Bool {
        let panel = NSSavePanel()
        panel.canCreateDirectories = true
        panel.nameFieldStringValue = document.fileURL?.lastPathComponent ?? "\(document.displayName).txt"
        guard panel.runModal() == .OK, let url = panel.url else { return false }
        let succeeded = write(document, to: url)
        if succeeded {
            document.fileURL = url
            let detected = Language.detect(from: url)
            if document.language == .plainText, detected != .plainText {
                document.language = detected
            }
        }
        return succeeded
    }

    func saveActive() {
        if let document = activeDocument { save(document) }
    }

    func saveActiveAs() {
        if let document = activeDocument { saveAs(document) }
    }

    func saveAll() {
        for document in documents where document.isModified {
            if !save(document) { break }
        }
    }

    private func write(_ document: Document, to url: URL) -> Bool {
        do {
            try document.write(to: url)
            document.isModified = false
            addRecent(url)
            return true
        } catch {
            presentError(error, message: "Could not save “\(url.lastPathComponent)”.")
            return false
        }
    }

    func presentError(_ error: Error, message: String) {
        let alert = NSAlert()
        alert.alertStyle = .warning
        alert.messageText = message
        alert.informativeText = error.localizedDescription
        alert.runModal()
    }

    // MARK: - Recent files

    func addRecent(_ url: URL) {
        var list = recentFiles.filter { $0 != url.path }
        list.insert(url.path, at: 0)
        if list.count > maxRecents {
            list = Array(list.prefix(maxRecents))
        }
        recentFiles = list
        UserDefaults.standard.set(list, forKey: recentsKey)
    }

    func clearRecents() {
        recentFiles = []
        UserDefaults.standard.removeObject(forKey: recentsKey)
    }

    // MARK: - Session

    func saveSession() {
        guard EditorSettings.shared.restoreSession else {
            SessionStore.save(SessionState(tabs: [], activeIndex: nil, rootFolderPath: nil, showSidebar: false))
            return
        }
        let tabs = documents.map { document in
            SessionTab(
                path: document.fileURL?.path,
                unsavedText: (document.isModified || document.fileURL == nil) ? document.text : nil,
                language: document.language,
                encodingRawValue: document.encoding.rawValue,
                lineEnding: document.lineEnding,
                isModified: document.isModified
            )
        }
        let activeIndex = documents.firstIndex { $0.id == activeDocumentID }
        SessionStore.save(SessionState(
            tabs: tabs,
            activeIndex: activeIndex,
            rootFolderPath: rootFolder?.path,
            showSidebar: showSidebar
        ))
    }

    private func restoreSessionIfEnabled() {
        guard EditorSettings.shared.restoreSession, let state = SessionStore.load() else { return }
        for tab in state.tabs {
            if let text = tab.unsavedText {
                let document = Document(
                    text: text,
                    fileURL: tab.path.map { URL(fileURLWithPath: $0) },
                    language: tab.language,
                    encoding: String.Encoding(rawValue: tab.encodingRawValue),
                    lineEnding: tab.lineEnding
                )
                document.isModified = tab.isModified
                documents.append(document)
            } else if let path = tab.path, FileManager.default.fileExists(atPath: path),
                      let document = try? Document.open(url: URL(fileURLWithPath: path)) {
                document.language = tab.language
                documents.append(document)
            }
        }
        if let root = state.rootFolderPath, FileManager.default.fileExists(atPath: root) {
            rootFolder = URL(fileURLWithPath: root)
            showSidebar = state.showSidebar
        }
        if let index = state.activeIndex, documents.indices.contains(index) {
            activeDocumentID = documents[index].id
        } else {
            activeDocumentID = documents.last?.id
        }
    }
}
