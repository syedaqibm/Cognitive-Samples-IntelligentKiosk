// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "NotepadX",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "NotepadX",
            path: "Sources/NotepadX"
        )
    ]
)
