APP_NAME = NotepadX
BUILD_DIR = .build/release
DIST = dist

.PHONY: build run app clean

build:
	swift build -c release

run:
	swift run

app: build
	rm -rf $(DIST)/$(APP_NAME).app
	mkdir -p $(DIST)/$(APP_NAME).app/Contents/MacOS
	mkdir -p $(DIST)/$(APP_NAME).app/Contents/Resources
	cp $(BUILD_DIR)/$(APP_NAME) $(DIST)/$(APP_NAME).app/Contents/MacOS/$(APP_NAME)
	cp Resources/Info.plist $(DIST)/$(APP_NAME).app/Contents/Info.plist
	codesign --force --sign - $(DIST)/$(APP_NAME).app || true
	@echo "Built $(DIST)/$(APP_NAME).app — drag it into /Applications if you like it."

clean:
	rm -rf .build $(DIST)
