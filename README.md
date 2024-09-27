# Quick Capture to Daily Note

A quick capture app (written in Tauri) to add thoughts to your daily note.  
It has a plain multiline textarea where you can add your thought.  
It's meant for Markdown text input.  
You set the path to your daily notes or standalone notes via an input field.  
The save mode can be set to either "Append to Daily Note" or "Save as Standalone Note".

For daily mode:  
This will append the given thought to a daily note.  
If no daily note is present, it will also create the note first.  
If intermediate folders don't exist, it will create the folders.  
It only works with daily notes in the `YYYY-MM-DD.md` format for now.  

For daily note:  
This will create a standalone note with the given thought.  

Every thought is added in the following format: _H2 Timestamp > Text > Newline_ for daily notes. For standalone notes, the format is _H1 Timestamp > Text > Newline_.

**Usage**  
Copy binary to applications and double-click.  
Set the save mode to either "Append to Daily Note" or "Save as Standalone Note".  
Set the path to where your daily notes or standalone notes live.  
Write your thought via `cmd+enter` (Mac)/`ctrl+enter` (Windows).  
Your input is automatically saved as a draft while you type (updates on pause).  
Drafts are restored when you reopen the app.  
Speed up app launching with an app like Alfred or Raycast and hotkeys.

**Formatting Shortcuts**  
The app supports the following formatting shortcuts:
- Bold: `cmd+b` (Mac) / `ctrl+b` (Windows)
- Italic: `cmd+i` (Mac) / `ctrl+i` (Windows)
- Link: `cmd+k` (Mac) / `ctrl+k` (Windows)
- Todo: `cmd+l` (Mac) / `ctrl+l` (Windows)
- Increase Font Size: `cmd++` (Mac) / `ctrl++` (Windows)
- Decrease Font Size: `cmd+-` (Mac) / `ctrl+-` (Windows)

Note: These shortcuts add formatting to the selected text or at the cursor position.
They do not toggle formatting; applying a shortcut multiple times adds multiple formatting marks.

Examples:
- Selecting text and using the bold shortcut will wrap it with `**`: `**selected text**`
- Using the italic shortcut will add `*` around the selection or at the cursor: `*text*`
- The link shortcut will create a Markdown link structure: `[selected text](|)` or `[](|)` if no text is selected.  
- The `|` indicates where the cursor will be placed after hitting the shortcut

**Screenshot and Screencast**  

[Screenshot of Quick Capture](https://raw.githubusercontent.com/minthemiddle/Quick-Capture/refs/heads/master/screenshot.png)

[screencast.webm](https://github.com/user-attachments/assets/2fa6db13-328f-49fd-b4c5-313f7a5a4270)

**Icon**
The app has an icon as well

![App icon quick capture](src-tauri/icons/128x128.png)

**Caveats**  
Only tested on MacOS 12.7 (x64) and 14.3 (Silicon)  
Works only with absolute paths, `~` not supported  
Will not get a WYSIWYG editor ([#18](https://github.com/minthemiddle/Quick-Capture/issues/18))  
Will not get tag autocompletion ([#19](https://github.com/minthemiddle/Quick-Capture/issues/19))  
Will not get a flexible save format (anytime soon) ([#17](https://github.com/minthemiddle/Quick-Capture/issues/17))

**Build**  
To build the app yourself, make sure that _rust_ and _npm_ are installed.  
`cargo install tauri-cli`  
Go to root.  
`npx tailwindcss -i ./src/in.css -o ./src/out.css --minify` (to build CSS)  
`cargo tauri build`  
Find the builds in the `/target` folder.
