import SwiftUI
import AppKit

/// Hosts a document's long-lived AppKit editor inside SwiftUI.
struct EditorView: NSViewRepresentable {
    let document: Document

    func makeNSView(context: Context) -> NSScrollView {
        let controller = document.controller
        controller.applySettings()
        DispatchQueue.main.async {
            controller.focus()
        }
        return controller.scrollView
    }

    func updateNSView(_ nsView: NSScrollView, context: Context) {}
}
