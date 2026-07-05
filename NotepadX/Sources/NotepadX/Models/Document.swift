import AppKit
import Combine

enum LineEnding: String, CaseIterable, Identifiable, Codable {
    case lf
    case crlf
    case cr

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .lf: return "LF (Unix / macOS)"
        case .crlf: return "CRLF (Windows)"
        case .cr: return "CR (Classic Mac)"
        }
    }

    var shortName: String {
        switch self {
        case .lf: return "LF"
        case .crlf: return "CRLF"
        case .cr: return "CR"
        }
    }

    var characters: String {
        switch self {
        case .lf: return "\n"
        case .crlf: return "\r\n"
        case .cr: return "\r"
        }
    }

    static func detect(in text: String) -> LineEnding {
        if text.contains("\r\n") { return .crlf }
        if text.contains("\r") { return .cr }
        return .lf
    }
}

enum EncodingOption: String, CaseIterable, Identifiable {
    case utf8
    case utf16
    case latin1

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .utf8: return "UTF-8"
        case .utf16: return "UTF-16"
        case .latin1: return "ISO Latin-1"
        }
    }

    var encoding: String.Encoding {
        switch self {
        case .utf8: return .utf8
        case .utf16: return .utf16
        case .latin1: return .isoLatin1
        }
    }

    static func from(_ encoding: String.Encoding) -> EncodingOption {
        switch encoding {
        case .utf16, .utf16LittleEndian, .utf16BigEndian, .unicode: return .utf16
        case .isoLatin1: return .latin1
        default: return .utf8
        }
    }
}

/// One open tab. The text itself lives in the tab's `EditorController`
/// (an AppKit text view), which is created lazily and kept for the life
/// of the document so undo history, selection, and scroll position
/// survive tab switches.
final class Document: ObservableObject, Identifiable {
    let id = UUID()

    @Published var fileURL: URL?
    @Published var isModified = false
    @Published var language: Language {
        didSet { if language != oldValue { _controller?.languageDidChange() } }
    }
    @Published var encoding: String.Encoding
    @Published var lineEnding: LineEnding

    // Live status-bar state, updated by the editor controller.
    @Published var caretLine = 1
    @Published var caretColumn = 1
    @Published var selectionLength = 0
    @Published var wordCount = 0
    @Published var characterCount = 0

    private let untitledNumber: Int
    private static var untitledCounter = 0

    /// Seed text used until the editor view is created.
    private var initialText: String
    private var _controller: EditorController?

    var controller: EditorController {
        if let existing = _controller { return existing }
        let created = EditorController(document: self, initialText: initialText)
        _controller = created
        initialText = ""
        return created
    }

    var isEditorLoaded: Bool { _controller != nil }

    var text: String { _controller?.textView.string ?? initialText }

    var displayName: String {
        if let fileURL { return fileURL.lastPathComponent }
        return "Untitled \(untitledNumber)"
    }

    init(text: String = "",
         fileURL: URL? = nil,
         language: Language? = nil,
         encoding: String.Encoding = .utf8,
         lineEnding: LineEnding = .lf) {
        self.initialText = text
        self.fileURL = fileURL
        self.encoding = encoding
        self.lineEnding = lineEnding
        if let language {
            self.language = language
        } else if let fileURL {
            self.language = Language.detect(from: fileURL)
        } else {
            self.language = .plainText
        }
        if fileURL == nil {
            Document.untitledCounter += 1
            self.untitledNumber = Document.untitledCounter
        } else {
            self.untitledNumber = 0
        }
        self.characterCount = text.count
    }

    // MARK: - Reading and writing

    enum DocumentError: LocalizedError {
        case unreadable(URL)
        case unwritable(URL)

        var errorDescription: String? {
            switch self {
            case .unreadable(let url):
                return "The file “\(url.lastPathComponent)” could not be decoded as text."
            case .unwritable(let url):
                return "The file “\(url.lastPathComponent)” could not be encoded for writing."
            }
        }
    }

    static func open(url: URL) throws -> Document {
        let data = try Data(contentsOf: url)

        var candidates: [String.Encoding] = [.utf8]
        if data.count >= 2 {
            let hasUTF16BOM = (data[0] == 0xFE && data[1] == 0xFF) || (data[0] == 0xFF && data[1] == 0xFE)
            if hasUTF16BOM { candidates.insert(.utf16, at: 0) }
        }
        candidates.append(.isoLatin1)

        var decoded: String?
        var used: String.Encoding = .utf8
        for candidate in candidates {
            if let text = String(data: data, encoding: candidate) {
                decoded = text
                used = candidate
                break
            }
        }
        guard var content = decoded else { throw DocumentError.unreadable(url) }
        if content.hasPrefix("\u{FEFF}") { content.removeFirst() }

        let lineEnding = LineEnding.detect(in: content)
        if lineEnding != .lf {
            content = content
                .replacingOccurrences(of: "\r\n", with: "\n")
                .replacingOccurrences(of: "\r", with: "\n")
        }
        return Document(text: content, fileURL: url, encoding: used, lineEnding: lineEnding)
    }

    func write(to url: URL) throws {
        var output = text
        if lineEnding != .lf {
            output = output.replacingOccurrences(of: "\n", with: lineEnding.characters)
        }
        var data = output.data(using: encoding)
        if data == nil {
            data = output.data(using: encoding, allowLossyConversion: true)
        }
        if data == nil {
            data = output.data(using: .utf8)
            if data != nil { encoding = .utf8 }
        }
        guard let data else { throw DocumentError.unwritable(url) }
        try data.write(to: url, options: .atomic)
    }
}
