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

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const saveDraftDebounced = debounce(saveDraft, 500);

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
    window.localStorage.removeItem("draftThought"); // Clear the draft from localStorage
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
  if (statusKey !== 'edit') {
    setTimeout(() => {
      const defaultStatus = statusUpdates['edit'];
      statusEl.textContent = defaultStatus.message;
      statusIconEl.className = defaultStatus.iconClass;
    }, 3000);
  }
}


thoughtInputEl.addEventListener('input', saveDraftDebounced);

thoughtInputEl.addEventListener('keydown', handleKeyDown);
thoughtInputEl.addEventListener('keydown', handleBoldShortcut);

function handleKeyDown(event) {
  // Check if the user hit Cmd+Enter (or Ctrl+Enter on Windows)
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault(); // Prevent the default action (inserting a new line)
    // Now call the existing saveThoughtBtn click handler
    saveThoughtBtn.click();
  }
}

function handleBoldShortcut(event) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
    event.preventDefault(); // Prevent the default action
    const start = thoughtInputEl.selectionStart;
    const end = thoughtInputEl.selectionEnd;
    const selectedText = thoughtInputEl.value.substring(start, end);

    if (selectedText) {
      // Wrap the selected text with **
      thoughtInputEl.value = thoughtInputEl.value.substring(0, start) + '**' + selectedText + '**' + thoughtInputEl.value.substring(end);
      thoughtInputEl.selectionStart = start + 2;
      thoughtInputEl.selectionEnd = end + 2;
    } else {
      // Insert ** and place the cursor between them
      thoughtInputEl.value = thoughtInputEl.value.substring(0, start) + '**' + '**' + thoughtInputEl.value.substring(end);
      thoughtInputEl.selectionStart = start + 2;
      thoughtInputEl.selectionEnd = start + 2;
    }
  }
}


window.addEventListener("DOMContentLoaded", () => {
  // Load the path from local storage
  const path = window.localStorage.getItem("path");
  if (path) {
    pathInputEl.value = path;
  }

  // Load the draft thought from local storage
  const draftThought = window.localStorage.getItem("draftThought");
  if (draftThought) {
    thoughtInputEl.value = draftThought;
  }
  
  updateStatus("edit");
});
function saveDraft() {
  const thought = thoughtInputEl.value;
  if (thought.trim() === "") {
    window.localStorage.removeItem("draftThought");
  } else {
    window.localStorage.setItem("draftThought", thought);
  }
}
