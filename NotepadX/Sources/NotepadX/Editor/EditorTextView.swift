import AppKit

final class EditorTextView: NSTextView {
    var currentLineColor: NSColor?
    var highlightCurrentLine = true

    override func drawViewBackground(in rect: NSRect) {
        super.drawViewBackground(in: rect)
        guard highlightCurrentLine,
              let color = currentLineColor,
              let layoutManager,
              let textContainer else { return }
        let selection = selectedRange()
        guard selection.length == 0 else { return }

        let ns = string as NSString
        var lineRect: NSRect
        if ns.length == 0 || (selection.location >= ns.length && ns.character(at: ns.length - 1) == 10) {
            // Caret on the empty line after a trailing newline (or empty doc).
            lineRect = layoutManager.extraLineFragmentRect
        } else {
            let clamped = min(selection.location, ns.length - 1)
            let lineCharRange = ns.lineRange(for: NSRange(location: clamped, length: 0))
            let glyphRange = layoutManager.glyphRange(forCharacterRange: lineCharRange, actualCharacterRange: nil)
            lineRect = layoutManager.boundingRect(forGlyphRange: glyphRange, in: textContainer)
        }

        lineRect.origin.x = 0
        lineRect.origin.y += textContainerInset.height
        lineRect.size.width = bounds.width
        guard lineRect.height > 0 else { return }
        color.setFill()
        lineRect.fill()
    }

    // Dropping files opens them as tabs instead of pasting their paths.
    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let pasteboard = sender.draggingPasteboard
        if let urls = pasteboard.readObjects(forClasses: [NSURL.self],
                                             options: [.urlReadingFileURLsOnly: true]) as? [URL],
           !urls.isEmpty {
            AppState.shared.open(urls: urls)
            return true
        }
        return super.performDragOperation(sender)
    }
}
