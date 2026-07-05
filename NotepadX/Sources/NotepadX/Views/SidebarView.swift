import SwiftUI

struct FileNode: Identifiable {
    let url: URL
    let isDirectory: Bool

    var id: URL { url }
    var name: String { url.lastPathComponent }

    var children: [FileNode]? {
        isDirectory ? FileNode.nodes(in: url) : nil
    }

    static func nodes(in directory: URL) -> [FileNode] {
        let fileManager = FileManager.default
        guard let contents = try? fileManager.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        ) else { return [] }
        return contents
            .map { url -> FileNode in
                let isDirectory = (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
                return FileNode(url: url, isDirectory: isDirectory)
            }
            .sorted { a, b in
                if a.isDirectory != b.isDirectory { return a.isDirectory }
                return a.name.localizedCaseInsensitiveCompare(b.name) == .orderedAscending
            }
    }
}

struct SidebarView: View {
    @EnvironmentObject var appState: AppState
    @State private var refreshID = UUID()

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                Image(systemName: "folder")
                    .foregroundStyle(.secondary)
                Text(appState.rootFolder?.lastPathComponent ?? "Explorer")
                    .font(.headline)
                    .lineLimit(1)
                Spacer()
                Button {
                    refreshID = UUID()
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .buttonStyle(.borderless)
                .help("Refresh")
                Button {
                    appState.openFolderWithPanel()
                } label: {
                    Image(systemName: "folder.badge.plus")
                }
                .buttonStyle(.borderless)
                .help("Open Folder")
            }
            .padding(8)
            Divider()
            if let root = appState.rootFolder {
                List(FileNode.nodes(in: root), children: \.children) { node in
                    HStack(spacing: 6) {
                        Image(systemName: node.isDirectory ? "folder" : "doc.text")
                            .foregroundStyle(node.isDirectory ? Color.accentColor : Color.secondary)
                        Text(node.name)
                            .lineLimit(1)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        if !node.isDirectory {
                            appState.open(urls: [node.url])
                        }
                    }
                    .help(node.url.path)
                }
                .listStyle(.sidebar)
                .id(refreshID)
            } else {
                VStack(spacing: 10) {
                    Text("No folder open")
                        .foregroundStyle(.secondary)
                    Button("Open Folder…") { appState.openFolderWithPanel() }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
}
