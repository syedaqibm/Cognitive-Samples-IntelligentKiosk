import AppKit
import Combine

/// Owns the AppKit text machinery for one document. Living outside SwiftUI
/// means the undo stack, selection, and scroll position survive tab switches.
final class EditorController: NSObject, ObservableObject, NSTextViewDelegate {
    unowned let document: Document
    let scrollView: NSScrollView
    let textView: EditorTextView
    private let ruler: LineNumberRulerView
    private let highlighter = SyntaxHighlighter()
    private var highlightWorkItem: DispatchWorkItem?
    private var settingsCancellable: AnyCancellable?

    struct FindOptions {
        var caseSensitive = false
        var useRegex = false
        var wholeWord = false
    }

    @Published private(set) var matches: [NSRange] = []
    @Published private(set) var currentMatchIndex = 0
    @Published private(set) var findQuery = ""
    private var matchResults: [NSTextCheckingResult] = []
    private var findRegex: NSRegularExpression?
    private var findOptions = FindOptions()

    init(document: Document, initialText: String) {
        self.document = document

        let scrollView = NSScrollView()
        scrollView.hasVerticalScroller = true
        scrollView.hasHorizontalScroller = true
        scrollView.autohidesScrollers = true
        scrollView.borderType = .noBorder

        let textView = EditorTextView(frame: NSRect(x: 0, y: 0, width: 600, height: 400))
        textView.autoresizingMask = [.width]
        textView.allowsUndo = true
        textView.isRichText = false
        textView.importsGraphics = false
        textView.isAutomaticQuoteSubstitutionEnabled = false
        textView.isAutomaticDashSubstitutionEnabled = false
        textView.isAutomaticSpellingCorrectionEnabled = false
        textView.isAutomaticTextReplacementEnabled = false
        textView.isAutomaticLinkDetectionEnabled = false
        textView.isContinuousSpellCheckingEnabled = false
        textView.isGrammarCheckingEnabled = false
        textView.smartInsertDeleteEnabled = false
        textView.usesFindBar = false
        textView.usesFontPanel = false
        textView.textContainerInset = NSSize(width: 4, height: 6)
        textView.minSize = NSSize(width: 0, height: 0)
        textView.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude,
                                  height: CGFloat.greatestFiniteMagnitude)
        textView.isVerticallyResizable = true
        textView.isHorizontallyResizable = true

        scrollView.documentView = textView

        let ruler = LineNumberRulerView(textView: textView)
        scrollView.verticalRulerView = ruler
        scrollView.hasVerticalRuler = true
        scrollView.rulersVisible = true

        self.scrollView = scrollView
        self.textView = textView
        self.ruler = ruler

        super.init()

        textView.delegate = self
        textView.string = initialText

        scrollView.contentView.postsBoundsChangedNotifications = true
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(scrollBoundsDidChange(_:)),
            name: NSView.boundsDidChangeNotification,
            object: scrollView.contentView
        )

        settingsCancellable = EditorSettings.shared.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.applySettings() }

        applySettings()

        DispatchQueue.main.async { [weak self] in
            self?.updateCaretInfo()
            self?.updateCounts()
        }
    }

    deinit {
        highlightWorkItem?.cancel()
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func scrollBoundsDidChange(_ notification: Notification) {
        ruler.needsDisplay = true
    }

    func focus() {
        textView.window?.makeFirstResponder(textView)
    }

    // MARK: - Settings

    func applySettings() {
        let settings = EditorSettings.shared
        let theme = settings.theme
        let font = settings.font

        textView.font = font
        textView.drawsBackground = true
        textView.backgroundColor = theme.background
        textView.insertionPointColor = theme.caret
        textView.selectedTextAttributes = [.backgroundColor: theme.selection]
        textView.typingAttributes = [.font: font, .foregroundColor: theme.foreground]
        textView.currentLineColor = theme.currentLine
        textView.highlightCurrentLine = settings.highlightCurrentLine

        scrollView.drawsBackground = true
        scrollView.backgroundColor = theme.background
        scrollView.rulersVisible = settings.showLineNumbers

        ruler.textColor = theme.lineNumber
        ruler.currentLineTextColor = theme.foreground
        ruler.backgroundColor = theme.gutterBackground

        applyWordWrap(settings.wordWrap)
        highlightNow()
        ruler.needsDisplay = true
        textView.needsDisplay = true
    }

    private func applyWordWrap(_ wrap: Bool) {
        guard let container = textView.textContainer else { return }
        if wrap {
            textView.isHorizontallyResizable = false
            container.widthTracksTextView = true
            let width = scrollView.contentSize.width
            textView.frame.size.width = width
            container.containerSize = NSSize(width: width, height: CGFloat.greatestFiniteMagnitude)
            textView.autoresizingMask = [.width]
        } else {
            textView.isHorizontallyResizable = true
            container.widthTracksTextView = false
            container.containerSize = NSSize(width: CGFloat.greatestFiniteMagnitude,
                                             height: CGFloat.greatestFiniteMagnitude)
            textView.autoresizingMask = []
        }
    }

    // MARK: - Highlighting

    func languageDidChange() {
        highlightNow()
    }

    func highlightNow() {
        guard let storage = textView.textStorage else { return }
        let settings = EditorSettings.shared
        highlighter.highlight(storage: storage,
                              language: document.language,
                              theme: settings.theme,
                              font: settings.font)
        if !findQuery.isEmpty {
            applyMatchHighlights()
        }
    }

    private func scheduleHighlight() {
        highlightWorkItem?.cancel()
        let workItem = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.highlightNow()
            self.updateCounts()
            if !self.findQuery.isEmpty {
                self.performSearch(resetIndexToCaret: false)
            }
        }
        highlightWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15, execute: workItem)
    }

    // MARK: - Status info

    private func updateCaretInfo() {
        let ns = textView.string as NSString
        let selection = textView.selectedRange()
        let (line, column) = lineAndColumn(for: selection.location, in: ns)
        document.caretLine = line
        document.caretColumn = column
        document.selectionLength = selection.length
    }

    private func updateCounts() {
        let text = textView.string
        document.characterCount = text.count
        document.wordCount = text.split(whereSeparator: { $0.isWhitespace }).count
    }

    private func lineAndColumn(for location: Int, in ns: NSString) -> (Int, Int) {
        let target = min(location, ns.length)
        var line = 1
        var index = 0
        var lineStart = 0
        while index < target {
            let range = ns.lineRange(for: NSRange(location: index, length: 0))
            let end = NSMaxRange(range)
            if end <= target {
                line += 1
                index = end
                lineStart = end
                if range.length == 0 { break }
            } else {
                lineStart = range.location
                break
            }
        }
        return (line, target - lineStart + 1)
    }

    // MARK: - NSTextViewDelegate

    func textDidChange(_ notification: Notification) {
        document.isModified = true
        ruler.needsDisplay = true
        scheduleHighlight()
    }

    func textViewDidChangeSelection(_ notification: Notification) {
        updateCaretInfo()
        if EditorSettings.shared.highlightCurrentLine {
            textView.needsDisplay = true
        }
        ruler.needsDisplay = true
    }

    func textView(_ view: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        if commandSelector == #selector(NSResponder.insertNewline(_:)) {
            return handleNewline()
        }
        if commandSelector == #selector(NSResponder.insertTab(_:)) {
            let settings = EditorSettings.shared
            if settings.insertSpacesForTab {
                insertText(String(repeating: " ", count: max(1, settings.tabWidth)))
                return true
            }
            return false
        }
        // Esc arrives as cancelOperation: or complete: depending on key bindings.
        if commandSelector == #selector(NSResponder.cancelOperation(_:))
            || commandSelector == Selector(("complete:")) {
            if AppState.shared.showFindBar {
                AppState.shared.showFindBar = false
                endFindSession()
                return true
            }
        }
        return false
    }

    private func handleNewline() -> Bool {
        let settings = EditorSettings.shared
        guard settings.autoIndent else { return false }
        let ns = textView.string as NSString
        let selection = textView.selectedRange()
        let lineRange = ns.lineRange(for: NSRange(location: min(selection.location, ns.length), length: 0))
        let line = ns.substring(with: lineRange)
        let indent = String(line.prefix { $0 == " " || $0 == "\t" })
        let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
        var extra = ""
        if let last = trimmed.last, document.language.definition.indentTriggers.contains(last) {
            extra = settings.tabString
        }
        insertText("\n" + indent + extra)
        return true
    }

    // MARK: - Undo-safe editing primitives

    private func insertText(_ string: String) {
        textView.insertText(string, replacementRange: textView.selectedRange())
    }

    @discardableResult
    private func replace(range: NSRange, with string: String, select: Bool = false) -> Bool {
        guard textView.shouldChangeText(in: range, replacementString: string) else { return false }
        textView.textStorage?.replaceCharacters(in: range, with: string)
        textView.didChangeText()
        if select {
            textView.setSelectedRange(NSRange(location: range.location, length: (string as NSString).length))
        }
        return true
    }

    // MARK: - Line operations

    func duplicateLine() {
        let ns = textView.string as NSString
        let lineRange = ns.lineRange(for: textView.selectedRange())
        var insertion = ns.substring(with: lineRange)
        if !insertion.hasSuffix("\n") {
            insertion = "\n" + insertion
        }
        replace(range: NSRange(location: NSMaxRange(lineRange), length: 0), with: insertion)
    }

    func deleteLine() {
        let ns = textView.string as NSString
        var lineRange = ns.lineRange(for: textView.selectedRange())
        if NSMaxRange(lineRange) == ns.length,
           lineRange.location > 0,
           !ns.substring(with: lineRange).hasSuffix("\n") {
            // Deleting the last line also removes the newline before it.
            lineRange = NSRange(location: lineRange.location - 1, length: lineRange.length + 1)
        }
        replace(range: lineRange, with: "")
    }

    func moveLine(up: Bool) {
        let ns = textView.string as NSString
        let selection = textView.selectedRange()
        let lineRange = ns.lineRange(for: selection)
        let caretOffset = selection.location - lineRange.location

        if up {
            guard lineRange.location > 0 else { return }
            let previousRange = ns.lineRange(for: NSRange(location: lineRange.location - 1, length: 0))
            var current = ns.substring(with: lineRange)
            var previous = ns.substring(with: previousRange)
            if !current.hasSuffix("\n") {
                current += "\n"
                if previous.hasSuffix("\n") { previous = String(previous.dropLast()) }
            }
            let combined = NSRange(location: previousRange.location,
                                   length: previousRange.length + lineRange.length)
            replace(range: combined, with: current + previous)
            let newLocation = previousRange.location + caretOffset
            textView.setSelectedRange(NSRange(location: min(newLocation, (textView.string as NSString).length),
                                              length: selection.length))
        } else {
            let end = NSMaxRange(lineRange)
            guard end < ns.length else { return }
            var current = ns.substring(with: lineRange)
            let nextRange = ns.lineRange(for: NSRange(location: end, length: 0))
            var next = ns.substring(with: nextRange)
            if !next.hasSuffix("\n") {
                next += "\n"
                if current.hasSuffix("\n") { current = String(current.dropLast()) }
            }
            let combined = NSRange(location: lineRange.location,
                                   length: lineRange.length + nextRange.length)
            replace(range: combined, with: next + current)
            let newLocation = lineRange.location + (next as NSString).length + caretOffset
            textView.setSelectedRange(NSRange(location: min(newLocation, (textView.string as NSString).length),
                                              length: selection.length))
        }
        textView.scrollRangeToVisible(textView.selectedRange())
    }

    func toggleComment() {
        guard let token = document.language.definition.lineComment else { return }
        let ns = textView.string as NSString
        let lineRange = ns.lineRange(for: textView.selectedRange())
        let block = ns.substring(with: lineRange)
        let hadTrailingNewline = block.hasSuffix("\n")
        var lines = block.components(separatedBy: "\n")
        if hadTrailingNewline { lines.removeLast() }

        let nonEmpty = lines.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        let allCommented = !nonEmpty.isEmpty && nonEmpty.allSatisfy {
            $0.trimmingCharacters(in: .whitespaces).hasPrefix(token)
        }

        let newLines = lines.map { line -> String in
            if line.trimmingCharacters(in: .whitespaces).isEmpty { return line }
            if allCommented {
                var result = line
                if let range = result.range(of: token + " ") ?? result.range(of: token) {
                    result.removeSubrange(range)
                }
                return result
            }
            return token + " " + line
        }

        var replacement = newLines.joined(separator: "\n")
        if hadTrailingNewline { replacement += "\n" }
        replace(range: lineRange, with: replacement, select: true)
    }

    /// Applies a transform to the selection, or the whole document when
    /// nothing is selected.
    func transformSelection(_ transform: (String) -> String) {
        let ns = textView.string as NSString
        var range = textView.selectedRange()
        if range.length == 0 {
            range = NSRange(location: 0, length: ns.length)
        }
        guard range.length > 0 else { return }
        replace(range: range, with: transform(ns.substring(with: range)), select: true)
    }

    func trimTrailingWhitespace() {
        let string = textView.string
        let ns = string as NSString
        guard let regex = try? NSRegularExpression(pattern: "[ \\t]+$", options: [.anchorsMatchLines]) else { return }
        let found = regex.matches(in: string, options: [], range: NSRange(location: 0, length: ns.length))
        guard !found.isEmpty else { return }
        textView.undoManager?.beginUndoGrouping()
        for match in found.reversed() {
            replace(range: match.range, with: "")
        }
        textView.undoManager?.endUndoGrouping()
    }

    func goToLine(_ line: Int) {
        guard line >= 1 else { return }
        let ns = textView.string as NSString
        var index = 0
        var current = 1
        while current < line, index < ns.length {
            index = NSMaxRange(ns.lineRange(for: NSRange(location: index, length: 0)))
            current += 1
        }
        let range = NSRange(location: index, length: 0)
        textView.setSelectedRange(range)
        textView.scrollRangeToVisible(range)
        focus()
    }

    // MARK: - Find & replace

    func setFindQuery(_ query: String, options: FindOptions) {
        let wasEmpty = findQuery.isEmpty
        findQuery = query
        findOptions = options
        performSearch(resetIndexToCaret: true)
        if !matches.isEmpty && !(wasEmpty && query.isEmpty) {
            selectCurrentMatch(showIndicator: false)
        }
    }

    func endFindSession() {
        findQuery = ""
        matches = []
        matchResults = []
        findRegex = nil
        clearMatchHighlights()
        focus()
    }

    func findNext() {
        advanceMatch(by: 1)
    }

    func findPrevious() {
        advanceMatch(by: -1)
    }

    private func advanceMatch(by delta: Int) {
        guard !matches.isEmpty else { return }
        currentMatchIndex = (currentMatchIndex + delta + matches.count) % matches.count
        selectCurrentMatch(showIndicator: true)
    }

    private func selectCurrentMatch(showIndicator: Bool) {
        guard currentMatchIndex < matches.count else { return }
        let range = matches[currentMatchIndex]
        textView.setSelectedRange(range)
        textView.scrollRangeToVisible(range)
        if showIndicator {
            textView.showFindIndicator(for: range)
        }
    }

    func replaceCurrent(with replacement: String) {
        guard currentMatchIndex < matchResults.count else { return }
        let result = matchResults[currentMatchIndex]
        let text: String
        if findOptions.useRegex, let regex = findRegex {
            text = regex.replacementString(for: result, in: textView.string, offset: 0, template: replacement)
        } else {
            text = replacement
        }
        replace(range: result.range, with: text)
        performSearch(resetIndexToCaret: true)
        if !matches.isEmpty {
            selectCurrentMatch(showIndicator: true)
        }
    }

    @discardableResult
    func replaceAll(with replacement: String) -> Int {
        guard !matchResults.isEmpty else { return 0 }
        let original = textView.string
        let results = matchResults
        textView.undoManager?.beginUndoGrouping()
        for result in results.reversed() {
            let text: String
            if findOptions.useRegex, let regex = findRegex {
                text = regex.replacementString(for: result, in: original, offset: 0, template: replacement)
            } else {
                text = replacement
            }
            replace(range: result.range, with: text)
        }
        textView.undoManager?.endUndoGrouping()
        performSearch(resetIndexToCaret: true)
        return results.count
    }

    private func performSearch(resetIndexToCaret: Bool) {
        clearMatchHighlights()
        matchResults = []
        matches = []
        findRegex = nil
        guard !findQuery.isEmpty else {
            currentMatchIndex = 0
            return
        }

        var pattern = findOptions.useRegex
            ? findQuery
            : NSRegularExpression.escapedPattern(for: findQuery)
        if findOptions.wholeWord {
            pattern = "\\b(?:" + pattern + ")\\b"
        }
        var options: NSRegularExpression.Options = [.anchorsMatchLines]
        if !findOptions.caseSensitive { options.insert(.caseInsensitive) }
        guard let regex = try? NSRegularExpression(pattern: pattern, options: options) else {
            currentMatchIndex = 0
            return
        }
        findRegex = regex

        let string = textView.string
        let ns = string as NSString
        let found = regex.matches(in: string, options: [], range: NSRange(location: 0, length: ns.length))
            .filter { $0.range.length > 0 }
        matchResults = found
        matches = found.map { $0.range }
        guard !found.isEmpty else {
            currentMatchIndex = 0
            return
        }

        if resetIndexToCaret {
            let caret = textView.selectedRange().location
            currentMatchIndex = matches.firstIndex { $0.location >= caret } ?? 0
        } else {
            currentMatchIndex = min(currentMatchIndex, matches.count - 1)
        }
        applyMatchHighlights()
    }

    private func applyMatchHighlights() {
        guard let layoutManager = textView.layoutManager else { return }
        let color = EditorSettings.shared.theme.findHighlight
        for range in matches {
            layoutManager.addTemporaryAttribute(.backgroundColor, value: color, forCharacterRange: range)
        }
    }

    private func clearMatchHighlights() {
        guard let layoutManager = textView.layoutManager else { return }
        let full = NSRange(location: 0, length: (textView.string as NSString).length)
        guard full.length > 0 else { return }
        layoutManager.removeTemporaryAttribute(.backgroundColor, forCharacterRange: full)
    }
}
