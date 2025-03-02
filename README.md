# Quick Capture

A simple and fast note-taking application to quickly capture thoughts and save them as Markdown files.

## Features

- **Quick Capture:** A plain multiline text area for capturing thoughts
- **Markdown Support:** Input is interpreted as Markdown
- **Daily and Standalone Notes:** Save thoughts to daily notes or as standalone notes
- **Path Configuration:** Set the path for daily notes and standalone notes via input fields
- **Automatic Draft Saving:** Your input is automatically saved as a draft while you type
- **Draft Restoration:** Drafts are restored when you reopen the app
- **Formatting Shortcuts:** Use keyboard shortcuts for common Markdown formatting
- **Font Size Adjustment:** Increase or decrease the font size of the input area
- **Quick Mode Switching:** Toggle between daily and standalone modes with `cmd+,` (Mac) / `ctrl+,` (Windows)

## Installation

1. Download the [latest release](https://github.com/minthemiddle/Quick-Capture/releases) for your platform
2. Move the application to your Applications folder
3. Launch the app

## Usage

1. **Set Save Mode:** Choose between "Append to Daily Note" or "Save as Standalone Note" using the dropdown
2. **Set Paths:** Enter the path to your daily notes folder or the desired location for standalone notes
3. **Capture Thoughts:** Type your thoughts into the text area
4. **Save:** Press `cmd+enter` (Mac) or `ctrl+enter` (Windows) to save your thought

## Save Modes

### Append to Daily Note
- Appends the thought to a daily note file named `YYYY-MM-DD.md`
- Creates the daily note file if it doesn't exist
- Creates intermediate folders if they don't exist
- Adds a date header to the file if it's newly created
- Appends the thought with an H2 timestamp heading

### Save as Standalone Note
- Saves the thought as a standalone note file named `YYMMDDHHMM.md`
- Creates a backlink in the daily note file (if a daily path is provided)
- Uses the first 10 alphanumeric characters of the thought as the link description
- Adds an H1 timestamp heading to the standalone note

## Stash Feature

Quick Capture includes a stash system that lets you temporarily save up to 10 thoughts for later use. This is useful when you want to quickly capture multiple thoughts without saving them to your notes yet.

### Stash Operations

- **Save to Stash:** `cmd + s` (Mac) / `ctrl + s` (Windows)
  - Saves the current thought to the top of your stash
  - Clears the input field after saving
- **Apply Most Recent Stash:** `cmd + shift + s` (Mac) / `ctrl + shift + s` (Windows)
  - Inserts the most recently saved thought into the input field
- **Apply Specific Stash:** `cmd + shift + [1-9]` (Mac) / `ctrl + shift + [1-9]` (Windows)
  - Applies the thought from the corresponding stash position (1-9)

## Keyboard Shortcuts

| Action                  | Mac Shortcut     | Windows Shortcut |
|-------------------------|------------------|------------------|
| Save thought            | `cmd + enter`    | `ctrl + enter`   |
| Toggle mode             | `cmd + ,`        | `ctrl + ,`       |
| Bold text               | `cmd + b`        | `ctrl + b`       |
| Italic text             | `cmd + i`        | `ctrl + i`       |
| Create link             | `cmd + k`        | `ctrl + k`       |
| Create todo item        | `cmd + l`        | `ctrl + l`       |
| Increase font size      | `cmd + +`        | `ctrl + +`       |
| Decrease font size      | `cmd + -`        | `ctrl + -`       |
| Save to stash           | `cmd + s`        | `ctrl + s`       |
| Apply recent stash      | `cmd + shift + s`| `ctrl + shift + s`|
| Apply specific stash    | `cmd + shift + [1-9]` | `ctrl + shift + [1-9]` |
| View stashes            | `cmd + shift + l`     | `ctrl + shift + l`     |

*Note: Formatting shortcuts add formatting to the selected text or at the cursor position. Applying a shortcut multiple times adds multiple formatting marks.*

## Examples

- **Bold:** `**selected text**`
- **Italic:** `*text*`
- **Link:** `[selected text](|)` or `[](|)` if no text is selected
- **Todo:** `- [ ] selected text` or `- [ ] ` if no text is selected
- The `|` indicates where the cursor will be placed after hitting the shortcut

**Stash Example**

1. Type a thought and press `cmd+s` to save it to stash
2. Type another thought and save it
3. Press `cmd+shift+s` to apply the most recent stash
4. Press `cmd+shift+1` to apply the first stash in your list

**Screenshot and Screencast**  

![Screenshot of Quick Capture](screenshot.png)

[screencast.webm](https://github.com/user-attachments/assets/2fa6db13-328f-49fd-b4c5-313f7a5a4270)

**Icon**
The app has an icon as well

![App icon quick capture](src-tauri/icons/128x128.png)

## Limitations

- Only tested on MacOS 14.7.1 (x64) and 14.3 (Silicon)
- Works only with absolute paths; `~` is not supported
- No WYSIWYG editor ([#18](https://github.com/minthemiddle/Quick-Capture/issues/18))
- No tag autocompletion ([#19](https://github.com/minthemiddle/Quick-Capture/issues/19))
- Static save format ([#17](https://github.com/minthemiddle/Quick-Capture/issues/17))

## Building from Source

### Build Steps

```bash
# If no rust installed yet
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# If no node and npm installed yet
# For MacOS
brew install node
# For Ubuntu
sudo apt install nodejs npm
# For Windows
choco install nodejs

# Install Tauri CLI
cargo install tauri-cli

# Build CSS
npx tailwindcss -i ./src/in.css -o ./src/out.css --minify

# Build application
cargo tauri build
```

The builds will be available in the `/target` folder.
