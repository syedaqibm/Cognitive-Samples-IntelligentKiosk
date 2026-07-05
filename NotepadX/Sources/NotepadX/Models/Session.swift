import Foundation

struct SessionTab: Codable {
    var path: String?
    var unsavedText: String?
    var language: Language
    var encodingRawValue: UInt
    var lineEnding: LineEnding
    var isModified: Bool
}

struct SessionState: Codable {
    var tabs: [SessionTab]
    var activeIndex: Int?
    var rootFolderPath: String?
    var showSidebar: Bool
}

enum SessionStore {
    static var fileURL: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.homeDirectoryForCurrentUser
        let directory = base.appendingPathComponent("NotepadX", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("session.json")
    }

    static func save(_ state: SessionState) {
        guard let data = try? JSONEncoder().encode(state) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }

    static func load() -> SessionState? {
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        return try? JSONDecoder().decode(SessionState.self, from: data)
    }
}
