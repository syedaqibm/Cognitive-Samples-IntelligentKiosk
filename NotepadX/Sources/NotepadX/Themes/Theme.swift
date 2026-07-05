import AppKit

struct Theme: Identifiable {
    let name: String
    let isDark: Bool
    let background: NSColor
    let foreground: NSColor
    let currentLine: NSColor
    let selection: NSColor
    let caret: NSColor
    let lineNumber: NSColor
    let gutterBackground: NSColor
    let findHighlight: NSColor
    let tokenColors: [TokenType: NSColor]

    var id: String { name }

    func color(for type: TokenType) -> NSColor {
        tokenColors[type] ?? foreground
    }

    static func named(_ name: String) -> Theme {
        all.first { $0.name == name } ?? defaultDark
    }

    static let all: [Theme] = [
        defaultLight, defaultDark, monokai, dracula, solarizedLight, nord
    ]

    static let defaultLight = Theme(
        name: "Default Light",
        isDark: false,
        background: NSColor(hex: 0xFFFFFF),
        foreground: NSColor(hex: 0x1F2328),
        currentLine: NSColor(hex: 0xF3F6FA),
        selection: NSColor(hex: 0xB3D7FF),
        caret: NSColor(hex: 0x1F2328),
        lineNumber: NSColor(hex: 0x9AA1A9),
        gutterBackground: NSColor(hex: 0xF8F9FA),
        findHighlight: NSColor(hex: 0xFFDF5D, alpha: 0.55),
        tokenColors: [
            .keyword: NSColor(hex: 0xCF222E),
            .type: NSColor(hex: 0x953800),
            .string: NSColor(hex: 0x0A3069),
            .comment: NSColor(hex: 0x6E7781),
            .number: NSColor(hex: 0x0550AE),
            .function: NSColor(hex: 0x8250DF),
            .constant: NSColor(hex: 0x0550AE),
            .attribute: NSColor(hex: 0x116329),
            .preprocessor: NSColor(hex: 0xCF222E)
        ]
    )

    static let defaultDark = Theme(
        name: "Default Dark",
        isDark: true,
        background: NSColor(hex: 0x0D1117),
        foreground: NSColor(hex: 0xE6EDF3),
        currentLine: NSColor(hex: 0x161B22),
        selection: NSColor(hex: 0x264F78),
        caret: NSColor(hex: 0xE6EDF3),
        lineNumber: NSColor(hex: 0x6E7681),
        gutterBackground: NSColor(hex: 0x10151C),
        findHighlight: NSColor(hex: 0x9E6A03, alpha: 0.6),
        tokenColors: [
            .keyword: NSColor(hex: 0xFF7B72),
            .type: NSColor(hex: 0xFFA657),
            .string: NSColor(hex: 0xA5D6FF),
            .comment: NSColor(hex: 0x8B949E),
            .number: NSColor(hex: 0x79C0FF),
            .function: NSColor(hex: 0xD2A8FF),
            .constant: NSColor(hex: 0x79C0FF),
            .attribute: NSColor(hex: 0x7EE787),
            .preprocessor: NSColor(hex: 0xFF7B72)
        ]
    )

    static let monokai = Theme(
        name: "Monokai",
        isDark: true,
        background: NSColor(hex: 0x272822),
        foreground: NSColor(hex: 0xF8F8F2),
        currentLine: NSColor(hex: 0x3E3D32),
        selection: NSColor(hex: 0x49483E),
        caret: NSColor(hex: 0xF8F8F0),
        lineNumber: NSColor(hex: 0x90908A),
        gutterBackground: NSColor(hex: 0x2D2E27),
        findHighlight: NSColor(hex: 0xE6DB74, alpha: 0.35),
        tokenColors: [
            .keyword: NSColor(hex: 0xF92672),
            .type: NSColor(hex: 0x66D9EF),
            .string: NSColor(hex: 0xE6DB74),
            .comment: NSColor(hex: 0x75715E),
            .number: NSColor(hex: 0xAE81FF),
            .function: NSColor(hex: 0xA6E22E),
            .constant: NSColor(hex: 0xAE81FF),
            .attribute: NSColor(hex: 0xA6E22E),
            .preprocessor: NSColor(hex: 0xF92672)
        ]
    )

    static let dracula = Theme(
        name: "Dracula",
        isDark: true,
        background: NSColor(hex: 0x282A36),
        foreground: NSColor(hex: 0xF8F8F2),
        currentLine: NSColor(hex: 0x343746),
        selection: NSColor(hex: 0x44475A),
        caret: NSColor(hex: 0xF8F8F2),
        lineNumber: NSColor(hex: 0x6272A4),
        gutterBackground: NSColor(hex: 0x2C2E3B),
        findHighlight: NSColor(hex: 0xFFB86C, alpha: 0.35),
        tokenColors: [
            .keyword: NSColor(hex: 0xFF79C6),
            .type: NSColor(hex: 0x8BE9FD),
            .string: NSColor(hex: 0xF1FA8C),
            .comment: NSColor(hex: 0x6272A4),
            .number: NSColor(hex: 0xBD93F9),
            .function: NSColor(hex: 0x50FA7B),
            .constant: NSColor(hex: 0xBD93F9),
            .attribute: NSColor(hex: 0x50FA7B),
            .preprocessor: NSColor(hex: 0xFF79C6)
        ]
    )

    static let solarizedLight = Theme(
        name: "Solarized Light",
        isDark: false,
        background: NSColor(hex: 0xFDF6E3),
        foreground: NSColor(hex: 0x657B83),
        currentLine: NSColor(hex: 0xEEE8D5),
        selection: NSColor(hex: 0xD3CBB7),
        caret: NSColor(hex: 0x586E75),
        lineNumber: NSColor(hex: 0x93A1A1),
        gutterBackground: NSColor(hex: 0xF7F0DD),
        findHighlight: NSColor(hex: 0xB58900, alpha: 0.35),
        tokenColors: [
            .keyword: NSColor(hex: 0x859900),
            .type: NSColor(hex: 0xB58900),
            .string: NSColor(hex: 0x2AA198),
            .comment: NSColor(hex: 0x93A1A1),
            .number: NSColor(hex: 0xD33682),
            .function: NSColor(hex: 0x268BD2),
            .constant: NSColor(hex: 0x6C71C4),
            .attribute: NSColor(hex: 0x268BD2),
            .preprocessor: NSColor(hex: 0xCB4B16)
        ]
    )

    static let nord = Theme(
        name: "Nord",
        isDark: true,
        background: NSColor(hex: 0x2E3440),
        foreground: NSColor(hex: 0xD8DEE9),
        currentLine: NSColor(hex: 0x3B4252),
        selection: NSColor(hex: 0x434C5E),
        caret: NSColor(hex: 0xD8DEE9),
        lineNumber: NSColor(hex: 0x4C566A),
        gutterBackground: NSColor(hex: 0x323846),
        findHighlight: NSColor(hex: 0xEBCB8B, alpha: 0.35),
        tokenColors: [
            .keyword: NSColor(hex: 0x81A1C1),
            .type: NSColor(hex: 0x8FBCBB),
            .string: NSColor(hex: 0xA3BE8C),
            .comment: NSColor(hex: 0x616E88),
            .number: NSColor(hex: 0xB48EAD),
            .function: NSColor(hex: 0x88C0D0),
            .constant: NSColor(hex: 0xB48EAD),
            .attribute: NSColor(hex: 0x88C0D0),
            .preprocessor: NSColor(hex: 0x81A1C1)
        ]
    )
}

extension NSColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1.0) {
        let red = CGFloat((hex >> 16) & 0xFF) / 255.0
        let green = CGFloat((hex >> 8) & 0xFF) / 255.0
        let blue = CGFloat(hex & 0xFF) / 255.0
        self.init(srgbRed: red, green: green, blue: blue, alpha: alpha)
    }
}
