const { invoke } = window.__TAURI__.tauri;

const saveThoughtBtn = document.querySelector("#save-thought");
const thoughtInputEl = document.querySelector("#thought-input");
const pathInputEl = document.querySelector("#path-input");
const statusEl = document.querySelector("#status");
const statusIconEl = document.querySelector("#status-icon");

const statusUpdates = {
  success: {
    message: "Added",
    iconClass: "text-green-500"
  },
  error: {
    message: "Failed",
    iconClass: "text-red-500"
  },
  edit: {
    message: "Edit",
    iconClass: "text-slate-200"
  },
  no_path: {
    message: "No path",
    iconClass: "text-red-500"
  }
};

saveThoughtBtn.addEventListener("click", async () => {
  const thought = thoughtInputEl.value;
  const path = pathInputEl.value;

  // Check if the path is empty
  if (!path) {
    updateStatus("no_path");
    return;
  }

  try {
    const response = await invoke("save_thought", { thought, path });
    console.log(response);
    thoughtInputEl.value = ""; // Clear the textarea after saving
    window.localStorage.setItem("path", path); // Save the path to local storage
    updateStatus("success");
  } catch (error) {
    console.error(error);
    updateStatus("error"); // Update status to "Failed" on error
  }
});

function updateStatus(statusKey) {
  const { message, iconClass } = statusUpdates[statusKey];
  statusEl.textContent = message;
  statusIconEl.className = iconClass;

  // Revert to default status after a delay
  setTimeout(() => {
    const defaultStatus = statusUpdates['edit'];
    statusEl.textContent = defaultStatus.message;
    statusIconEl.className = defaultStatus.iconClass;
  }, statusKey === 'edit' ? 0 : 3000); // Immediate revert for 'edit', delay for others
}


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
