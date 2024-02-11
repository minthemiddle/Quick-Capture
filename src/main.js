const { invoke } = window.__TAURI__.tauri;

const saveThoughtBtn = document.querySelector("#save-thought");
const thoughtInputEl = document.querySelector("#thought-input");
const pathInputEl = document.querySelector("#path-input");
const saveMsgEl = document.querySelector("#save-msg");

saveThoughtBtn.addEventListener("click", async () => {
  const thought = thoughtInputEl.value;
  const path = pathInputEl.value;

  // Check if the path is empty
  if (!path) {
    saveMsgEl.textContent = "Error: Path cannot be empty";
    return;
  }

  const response = await invoke("save_thought", { thought, path });
  saveMsgEl.textContent = response;
  thoughtInputEl.value = ""; // Clear the textarea after saving

  // Save the path to local storage
  window.localStorage.setItem("path", path);
});

window.addEventListener("DOMContentLoaded", () => {
  // Load the path from local storage
  const path = window.localStorage.getItem("path");
  if (path) {
    pathInputEl.value = path;
  }
});
