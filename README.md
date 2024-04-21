# Quick Capture to Daily Note

A quick capture app (written in Tauri) to add thoughts to your daily note.  
It has a plain HTML multiline textarea where you can add your thought.  
You set the path to your daily notes via an input field.

This will append the given thought to a daily note.  
If no daily note is present, it will also create the note first.
If intermediate folders don't exist, it will create the folders.

It only works with daily notes in the `YYYY-MM-DD.md` format for now.  
Every thought is added in the following format: _H2 Timestamp > Text > Newline_

**Usage**  
Copy binary to applications and double-click.  
Set path to where your daily notes live.  
Write your thought and submit via button click.  
You can also submit via `cmd+enter` (Mac)/`ctrl+enter` (Windows)  
Speed up app launching with with an app like Alfred or Raycast and hotkeys.

**Screenshot**  
![Quick capture to daily note](screenshot.png)

**Icon**
The app has an icon as well

![App icon quick capture](src-tauri/icons/128x128.png)

**Caveats**
Only tested on MacOS 12.7 (x64) and 14.3 (Silicon)
