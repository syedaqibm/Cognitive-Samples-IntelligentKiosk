import AppKit

final class LineNumberRulerView: NSRulerView {
    private weak var textView: NSTextView?

    var textColor: NSColor = .secondaryLabelColor { didSet { needsDisplay = true } }
    var currentLineTextColor: NSColor = .labelColor { didSet { needsDisplay = true } }
    var backgroundColor: NSColor = .clear { didSet { needsDisplay = true } }

    init(textView: NSTextView) {
        self.textView = textView
        super.init(scrollView: textView.enclosingScrollView, orientation: .verticalRuler)
        clientView = textView
        ruleThickness = 44
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(textDidChange(_:)),
            name: NSText.didChangeNotification,
            object: textView
        )
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func textDidChange(_ notification: Notification) {
        needsDisplay = true
    }

    override func drawHashMarksAndLabels(in rect: NSRect) {
        backgroundColor.setFill()
        bounds.fill()

        guard let textView,
              let layoutManager = textView.layoutManager,
              let container = textView.textContainer else { return }

        let content = textView.string as NSString
        let pointSize = textView.font?.pointSize ?? 12
        let font = NSFont.monospacedDigitSystemFont(ofSize: max(9, pointSize - 2), weight: .regular)
        let relativePoint = convert(NSZeroPoint, from: textView)
        let inset = textView.textContainerInset.height

        let visibleRect = textView.visibleRect
        let glyphRange = layoutManager.glyphRange(forBoundingRect: visibleRect, in: container)
        let charRange = layoutManager.characterRange(forGlyphRange: glyphRange, actualGlyphRange: nil)

        let caretLine = lineNumber(forCharacter: textView.selectedRange().location, in: content)

        // Find the first visible logical line and its number.
        var number = 1
        var index = 0
        while index < content.length {
            let lineRange = content.lineRange(for: NSRange(location: index, length: 0))
            if NSMaxRange(lineRange) > charRange.location { break }
            index = NSMaxRange(lineRange)
            number += 1
        }

        func draw(_ number: Int, atY y: CGFloat, lineHeight: CGFloat) {
            let label = "\(number)" as NSString
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: number == caretLine ? currentLineTextColor : textColor
            ]
            let size = label.size(withAttributes: attributes)
            let point = NSPoint(x: ruleThickness - size.width - 6,
                                y: y + (lineHeight - size.height) / 2.0)
            label.draw(at: point, withAttributes: attributes)
        }

        var charIndex = index
        var widestLabel: CGFloat = 0
        while charIndex < NSMaxRange(charRange) {
            let lineRange = content.lineRange(for: NSRange(location: charIndex, length: 0))
            let glyphIndex = layoutManager.glyphIndexForCharacter(at: lineRange.location)
            let lineRect = layoutManager.lineFragmentRect(forGlyphAt: glyphIndex, effectiveRange: nil)
            let y = lineRect.minY + relativePoint.y + inset
            draw(number, atY: y, lineHeight: lineRect.height)
            widestLabel = max(widestLabel, ("\(number)" as NSString).size(withAttributes: [.font: font]).width)
            charIndex = NSMaxRange(lineRange)
            number += 1
        }

        // The empty line after a trailing newline (and the empty document).
        if NSMaxRange(charRange) >= content.length,
           layoutManager.extraLineFragmentTextContainer != nil {
            let lineRect = layoutManager.extraLineFragmentRect
            let y = lineRect.minY + relativePoint.y + inset
            draw(number, atY: y, lineHeight: max(lineRect.height, pointSize + 4))
        }

        let needed = widestLabel + 14
        if needed > ruleThickness {
            DispatchQueue.main.async { [weak self] in
                self?.ruleThickness = needed
            }
        }
    }

    private func lineNumber(forCharacter location: Int, in content: NSString) -> Int {
        let target = min(location, content.length)
        var line = 1
        var index = 0
        while index < target {
            let range = content.lineRange(for: NSRange(location: index, length: 0))
            let end = NSMaxRange(range)
            if end > target { break }
            index = end
            line += 1
            if range.length == 0 { break }
        }
        return line
    }
}
