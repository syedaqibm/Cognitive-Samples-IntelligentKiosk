import SwiftUI
import AppKit

struct TabBarView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        HStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 1) {
                    ForEach(appState.documents) { document in
                        TabItemView(document: document,
                                    isActive: document.id == appState.activeDocumentID)
                    }
                }
            }
            Spacer(minLength: 0)
            Button {
                appState.newDocument()
            } label: {
                Image(systemName: "plus")
            }
            .buttonStyle(.borderless)
            .padding(.horizontal, 8)
            .help("New Tab (⌘N)")
        }
        .frame(height: 32)
        .background(.bar)
    }
}

private struct TabItemView: View {
    @ObservedObject var document: Document
    let isActive: Bool
    @EnvironmentObject var appState: AppState
    @State private var hovering = false

    var body: some View {
        HStack(spacing: 6) {
            Text(document.displayName)
                .font(.system(size: 12, weight: isActive ? .semibold : .regular))
                .lineLimit(1)
                .truncationMode(.middle)
            closeControl
        }
        .padding(.horizontal, 10)
        .frame(minWidth: 90, maxWidth: 220)
        .frame(height: 32)
        .background(isActive ? Color.accentColor.opacity(0.18) : Color.clear)
        .contentShape(Rectangle())
        .onTapGesture { appState.activate(document) }
        .onHover { hovering = $0 }
        .contextMenu {
            Button("Close") { appState.close(document) }
            Button("Close Others") { appState.closeOthers(keeping: document) }
            Button("Close All") { appState.closeAll() }
            if let url = document.fileURL {
                Divider()
                Button("Reveal in Finder") {
                    NSWorkspace.shared.activateFileViewerSelecting([url])
                }
                Button("Copy Path") {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(url.path, forType: .string)
                }
            }
        }
        .help(document.fileURL?.path ?? document.displayName)
    }

    @ViewBuilder
    private var closeControl: some View {
        Button {
            appState.close(document)
        } label: {
            if hovering {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .bold))
            } else if document.isModified {
                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 7, height: 7)
            } else {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .bold))
                    .opacity(0.25)
            }
        }
        .buttonStyle(.borderless)
        .frame(width: 16, height: 16)
        .help("Close Tab (⌘W)")
    }
}
