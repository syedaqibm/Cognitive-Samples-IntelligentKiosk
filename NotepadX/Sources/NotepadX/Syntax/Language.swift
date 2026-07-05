import Foundation

enum TokenType: String, CaseIterable {
    case keyword
    case type
    case string
    case comment
    case number
    case function
    case constant
    case attribute
    case preprocessor
}

enum Language: String, CaseIterable, Codable, Identifiable {
    case plainText
    case c
    case cpp
    case csharp
    case css
    case go
    case html
    case java
    case javascript
    case json
    case kotlin
    case markdown
    case objectiveC
    case php
    case python
    case ruby
    case rust
    case shell
    case sql
    case swift
    case typescript
    case xml
    case yaml

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .plainText: return "Plain Text"
        case .c: return "C"
        case .cpp: return "C++"
        case .csharp: return "C#"
        case .css: return "CSS"
        case .go: return "Go"
        case .html: return "HTML"
        case .java: return "Java"
        case .javascript: return "JavaScript"
        case .json: return "JSON"
        case .kotlin: return "Kotlin"
        case .markdown: return "Markdown"
        case .objectiveC: return "Objective-C"
        case .php: return "PHP"
        case .python: return "Python"
        case .ruby: return "Ruby"
        case .rust: return "Rust"
        case .shell: return "Shell"
        case .sql: return "SQL"
        case .swift: return "Swift"
        case .typescript: return "TypeScript"
        case .xml: return "XML"
        case .yaml: return "YAML"
        }
    }

    var definition: LanguageDefinition {
        LanguageDefinition.definition(for: self)
    }

    static func detect(from url: URL) -> Language {
        let ext = url.pathExtension.lowercased()
        if ext.isEmpty {
            let name = url.lastPathComponent.lowercased()
            if name == "makefile" || name == "dockerfile" || name.hasSuffix("rc") {
                return .shell
            }
            return .plainText
        }
        return extensionMap[ext] ?? .plainText
    }

    private static let extensionMap: [String: Language] = [
        "c": .c, "h": .c,
        "cpp": .cpp, "cc": .cpp, "cxx": .cpp, "hpp": .cpp, "hh": .cpp, "hxx": .cpp,
        "cs": .csharp,
        "css": .css, "scss": .css, "less": .css,
        "go": .go,
        "html": .html, "htm": .html, "xhtml": .html,
        "java": .java,
        "js": .javascript, "jsx": .javascript, "mjs": .javascript, "cjs": .javascript,
        "json": .json, "jsonc": .json,
        "kt": .kotlin, "kts": .kotlin,
        "md": .markdown, "markdown": .markdown,
        "m": .objectiveC, "mm": .objectiveC,
        "php": .php,
        "py": .python, "pyw": .python,
        "rb": .ruby, "rake": .ruby,
        "rs": .rust,
        "sh": .shell, "bash": .shell, "zsh": .shell, "fish": .shell,
        "sql": .sql,
        "swift": .swift,
        "ts": .typescript, "tsx": .typescript,
        "xml": .xml, "plist": .xml, "svg": .xml, "xib": .xml, "storyboard": .xml, "xaml": .xml,
        "yml": .yaml, "yaml": .yaml, "toml": .yaml,
        "txt": .plainText, "log": .plainText
    ]
}

/// Describes how a language is tokenized. Strings and comments are found
/// by a linear scanner; everything else uses regex rules.
struct LanguageDefinition {
    var keywords: [String] = []
    var types: [String] = []
    var constants: [String] = []
    var lineComments: [String] = []
    var blockComments: [(open: String, close: String)] = []
    /// Characters that open/close a string literal, e.g. "\"'`".
    var stringDelimiters: String = "\"'"
    var stringsUseBackslashEscape = true
    var multilineStrings = false
    /// A newline after a line ending in one of these gets an extra indent level.
    var indentTriggers: String = "{[(:"
    var caseInsensitiveKeywords = false
    var highlightNumbers = true
    var highlightFunctionCalls = true
    /// Language-specific regex rules, applied last (they win over keyword coloring).
    var extraPatterns: [(pattern: String, type: TokenType)] = []

    var lineComment: String? { lineComments.first }
}
