# Quick Capture Daily Note

This app will do the following:

A quick capture for adding thoughts to my daily note.  
I open the app via an Alfred workflow with a hotkey.  
It has a plain HTML multiline textarea that I can add my thought.

Caveats:

It has a hard-coded location for the daily note (`src-tauri/src/main.rs` > `let file_name`).  
This means that you need to customize and build the app yourself to make it work.
