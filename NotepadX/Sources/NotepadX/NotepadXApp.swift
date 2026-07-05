import SwiftUI

@main
struct NotepadXApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState.shared
    @StateObject private var settings = EditorSettings.shared

    var body: some Scene {
        WindowGroup("NotepadX") {
            ContentView()
                .environmentObject(appState)
                .environmentObject(settings)
                .frame(minWidth: 700, minHeight: 400)
        }
        .commands {
            AppCommands()
        }

        Settings {
            SettingsView()
                .environmentObject(settings)
        }
    }
}
