const { invoke } = window.__TAURI__.tauri;

const saveThoughtBtn = document.querySelector("#save-thought");
const thoughtInputEl = document.querySelector("#thought-input");
const pathInputEl = document.querySelector("#path-input");

saveThoughtBtn.addEventListener("click", async () => {
  const thought = thoughtInputEl.value;
  const path = pathInputEl.value;

  // Check if the path is empty
  if (!path) {
    return;
  }

  const response = await invoke("save_thought", { thought, path });
  console.log(response);
  thoughtInputEl.value = ""; // Clear the textarea after saving

  // Save the path to local storage
  window.localStorage.setItem("path", path);
});


thoughtInputEl.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
  // Check if the user hit Cmd+Enter (or Ctrl+Enter on Windows)
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault(); // Prevent the default action (inserting a new line)
    // Now call the existing saveThoughtBtn click handler
    saveThoughtBtn.click();
  }
}


window.addEventListener("DOMContentLoaded", () => {
  // Load the path from local storage
  const path = window.localStorage.getItem("path");
  if (path) {
    pathInputEl.value = path;
  }
});
