import AppKit

/// Two-pass highlighter:
/// 1. a linear scanner finds strings and comments (state-aware, so a "//"
///    inside a string literal is not a comment),
/// 2. regex rules color keywords/types/numbers/functions in the regions
///    the scanner left untouched.
final class SyntaxHighlighter {
    /// Above this size highlighting is skipped and the file renders plain.
    static let maxHighlightLength = 2_000_000

    private static var ruleCache: [Language: [(regex: NSRegularExpression, type: TokenType)]] = [:]

    func highlight(storage: NSTextStorage, language: Language, theme: Theme, font: NSFont) {
        let string = storage.string
        let ns = string as NSString
        let fullRange = NSRange(location: 0, length: ns.length)

        storage.beginEditing()
        defer { storage.endEditing() }

        storage.setAttributes([.font: font, .foregroundColor: theme.foreground], range: fullRange)

        guard language != .plainText, ns.length > 0, ns.length <= Self.maxHighlightLength else { return }

        let definition = language.definition
        let spans = scanStringsAndComments(ns: ns, definition: definition)
        let spanStarts = spans.map { $0.range.location }

        // Spans are sorted and non-overlapping, so the only span that can
        // intersect a range is the one with the greatest start <= range end.
        func overlapsSpan(_ range: NSRange) -> Bool {
            guard !spans.isEmpty else { return false }
            let target = NSMaxRange(range) - 1
            var low = 0, high = spans.count - 1, found = -1
            while low <= high {
                let mid = (low + high) / 2
                if spanStarts[mid] <= target {
                    found = mid
                    low = mid + 1
                } else {
                    high = mid - 1
                }
            }
            guard found >= 0 else { return false }
            return NSIntersectionRange(spans[found].range, range).length > 0
        }

        for (regex, type) in Self.rules(for: language) {
            let color = theme.color(for: type)
            regex.enumerateMatches(in: string, options: [], range: fullRange) { match, _, _ in
                guard let match, match.range.length > 0 else { return }
                if !overlapsSpan(match.range) {
                    storage.addAttribute(.foregroundColor, value: color, range: match.range)
                }
            }
        }

        for span in spans {
            storage.addAttribute(.foregroundColor, value: theme.color(for: span.type), range: span.range)
        }
    }

    // MARK: - Regex rules

    private static func rules(for language: Language) -> [(regex: NSRegularExpression, type: TokenType)] {
        if let cached = ruleCache[language] { return cached }
        let definition = language.definition
        var rules: [(regex: NSRegularExpression, type: TokenType)] = []

        var wordOptions: NSRegularExpression.Options = [.anchorsMatchLines]
        if definition.caseInsensitiveKeywords { wordOptions.insert(.caseInsensitive) }

        func add(_ pattern: String, _ type: TokenType, options: NSRegularExpression.Options = [.anchorsMatchLines]) {
            if let regex = try? NSRegularExpression(pattern: pattern, options: options) {
                rules.append((regex, type))
            }
        }

        func wordGroup(_ words: [String]) -> String {
            "\\b(?:" + words.map { NSRegularExpression.escapedPattern(for: $0) }.joined(separator: "|") + ")\\b"
        }

        // Order matters: later rules overwrite earlier ones where they overlap,
        // so keywords win over the generic function-call rule.
        if definition.highlightFunctionCalls {
            add("\\b[A-Za-z_][A-Za-z0-9_]*(?=\\s*\\()", .function)
        }
        if definition.highlightNumbers {
            add("\\b(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b", .number)
        }
        if !definition.keywords.isEmpty { add(wordGroup(definition.keywords), .keyword, options: wordOptions) }
        if !definition.types.isEmpty { add(wordGroup(definition.types), .type, options: wordOptions) }
        if !definition.constants.isEmpty { add(wordGroup(definition.constants), .constant, options: wordOptions) }
        for extra in definition.extraPatterns { add(extra.pattern, extra.type) }

        ruleCache[language] = rules
        return rules
    }

    // MARK: - String/comment scanner

    private struct Span {
        let range: NSRange
        let type: TokenType
    }

    private func scanStringsAndComments(ns: NSString, definition: LanguageDefinition) -> [Span] {
        var spans: [Span] = []
        let length = ns.length
        let stringDelimiters = Set(definition.stringDelimiters.utf16)
        let hasLineComments = !definition.lineComments.isEmpty
        let hasBlockComments = !definition.blockComments.isEmpty
        if stringDelimiters.isEmpty && !hasLineComments && !hasBlockComments { return spans }

        let newline: unichar = 10 // \n
        let backslash: unichar = 92 // \
        let dollar: unichar = 36 // $
        let openBrace: unichar = 123 // {

        func matches(_ token: String, at index: Int) -> Bool {
            let t = token as NSString
            let tokenLength = t.length
            guard tokenLength > 0, index + tokenLength <= length else { return false }
            for k in 0..<tokenLength where ns.character(at: index + k) != t.character(at: k) {
                return false
            }
            return true
        }

        var i = 0
        while i < length {
            var consumed = false

            if hasLineComments {
                for token in definition.lineComments where matches(token, at: i) {
                    // Don't treat "$#" or "${#name}" (shell) as comments.
                    if token == "#", i > 0 {
                        let previous = ns.character(at: i - 1)
                        if previous == dollar || previous == openBrace { continue }
                    }
                    var j = i
                    while j < length, ns.character(at: j) != newline { j += 1 }
                    spans.append(Span(range: NSRange(location: i, length: j - i), type: .comment))
                    i = j
                    consumed = true
                    break
                }
            }
            if consumed { continue }

            if hasBlockComments {
                for pair in definition.blockComments where matches(pair.open, at: i) {
                    let openLength = (pair.open as NSString).length
                    let closeLength = (pair.close as NSString).length
                    var j = i + openLength
                    var end = length
                    while j < length {
                        if matches(pair.close, at: j) {
                            end = j + closeLength
                            break
                        }
                        j += 1
                    }
                    spans.append(Span(range: NSRange(location: i, length: end - i), type: .comment))
                    i = end
                    consumed = true
                    break
                }
            }
            if consumed { continue }

            let character = ns.character(at: i)
            if stringDelimiters.contains(character) {
                let quote = character
                var j = i + 1
                while j < length {
                    let cj = ns.character(at: j)
                    if definition.stringsUseBackslashEscape && cj == backslash {
                        j += 2
                        continue
                    }
                    if cj == quote {
                        j += 1
                        break
                    }
                    if cj == newline && !definition.multilineStrings { break }
                    j += 1
                }
                let end = min(j, length)
                spans.append(Span(range: NSRange(location: i, length: end - i), type: .string))
                i = end
                continue
            }

            i += 1
        }
        return spans
    }
}
