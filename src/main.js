const invoke = window.__TAURI__.core.invoke;
const { open } = window.__TAURI__.dialog;

const saveThoughtBtn = document.querySelector("#save-thought");
const thoughtInputEl = document.querySelector("#thought-input");
const dailyPathButtonEl = document.querySelector("#daily-path-button");
const standalonePathButtonEl = document.querySelector("#standalone-path-button");
const dailyPathDisplayEl = document.querySelector("#daily-path-display");
const standalonePathDisplayEl = document.querySelector("#standalone-path-display");
const dailyPathContainerEl = document.querySelector("#daily-path-container");
const standalonePathContainerEl = document.querySelector("#standalone-path-container");
const statusEl = document.querySelector("#status");
const statusIconEl = document.querySelector("#status-icon");

// Store paths in memory instead of inputs
let dailyPath = "";
let standalonePath = "";

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
  },
  empty_content: {
    message: "Empty note",
    iconClass: "text-red-500"
  },
  stash_saved: {
    message: "Stashed",
    iconClass: "text-blue-500"
  },
  stash_applied: {
    message: "Applied",
    iconClass: "text-blue-500"
  },
  stash_view: {
    message: "Viewing Stashes",
    iconClass: "text-blue-500"
  }
};

let isViewingStashes = false;
let previousContent = '';

// Stash management
const MAX_STASHES = 10;
const STASH_KEY = 'stashes';

function getStashes() {
  const stashes = JSON.parse(window.localStorage.getItem(STASH_KEY) || '[]');
  return stashes;
}

function saveStash(content) {
  const stashes = getStashes();
  const newStash = {
    content,
    timestamp: new Date().toISOString()
  };
  
  stashes.unshift(newStash);
  if (stashes.length > MAX_STASHES) {
    stashes.pop();
  }
  
  window.localStorage.setItem(STASH_KEY, JSON.stringify(stashes));
  updateStatus('stash_saved');
}

function applyStash(index) {
  const stashes = getStashes();
  if (index >= 0 && index < stashes.length) {
    thoughtInputEl.value = stashes[index].content;
    updateStatus('stash_applied');
  }
}

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
thoughtInputEl.addEventListener('keydown', handleItalicShortcut);
thoughtInputEl.addEventListener('keydown', handleLinkShortcut);
thoughtInputEl.addEventListener('keydown', handleTodoShortcut);
thoughtInputEl.addEventListener('keydown', handleFontSizeIncrease);
thoughtInputEl.addEventListener('keydown', handleFontSizeDecrease);
thoughtInputEl.addEventListener('keydown', handleToggleModeShortcut);
thoughtInputEl.addEventListener('keydown', handleStashShortcut);


// Ensure a default font size class is set
if (!thoughtInputEl.className.match(/text-\w+/)) {
  thoughtInputEl.className += ' text-base';
}

async function handleKeyDown(event) {
  // Check if the user hit Cmd+Enter (or Ctrl+Enter on Windows)
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault(); // Prevent the default action (inserting a new line)
    const thought = thoughtInputEl.value;
    const mode = document.querySelector("#save-mode").value;
    const path = mode === "daily" ? dailyPath : standalonePath;

    // Check if the content is empty or only whitespace
    if (!thought.trim()) {
      updateStatus("empty_content");
      return;
    }

    // Check if the path is empty
    if (!path) {
      updateStatus("no_path");
      return;
    }

    try {
      // Always pass dailyPath for backlinks when in standalone mode
      const dailyPathForBacklinks = dailyPath;
      const response = await invoke("save_thought", { thought, path, mode, dailyPath: dailyPathForBacklinks });
      console.log(response);
      thoughtInputEl.value = ""; // Clear the textarea after saving
      window.localStorage.setItem("dailyPath", dailyPath); // Save the daily path to local storage
      window.localStorage.setItem("standalonePath", standalonePath); // Save the standalone path to local storage
      window.localStorage.removeItem("draftThought"); // Clear the draft from localStorage
      updateStatus("success");
    } catch (error) {
      console.error(error);
      updateStatus("error"); // Update status to "Failed" on error
    }
  }
}

function togglePathInputs() {
  const mode = document.getElementById("save-mode").value;

  dailyPathContainerEl.classList.toggle("hidden", mode !== "daily");
  standalonePathContainerEl.classList.toggle("hidden", mode !== "standalone");
}

function handleStashShortcut(event) {
  // Cmd+S to save stash
  if ((event.metaKey || event.ctrlKey) && event.key === 's' && !event.shiftKey) {
    event.preventDefault();
    const thought = thoughtInputEl.value.trim();
    if (thought) {
      saveStash(thought);
      thoughtInputEl.value = ""; // Clear the input field
      saveDraft(); // Update the draft state
    }
    return;
  }

  // Cmd+Shift+S to apply stash
  if ((event.metaKey || event.ctrlKey) && event.key === 's' && event.shiftKey) {
    event.preventDefault();
    const stashes = getStashes();
    if (stashes.length > 0) {
      applyStash(0); // Apply most recent stash
    }
    return;
  }

  // Cmd+Shift+Number to apply specific stash
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && /^[1-9]$/.test(event.key)) {
    event.preventDefault();
    const index = parseInt(event.key) - 1;
    applyStash(index);
  }

  // Cmd+Shift+L to toggle stash list view
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'l') {
    event.preventDefault();
    toggleStashListView();
  }
}

function toggleStashListView() {
  if (isViewingStashes) {
    // Restore previous content
    thoughtInputEl.value = previousContent;
    thoughtInputEl.readOnly = false;
    thoughtInputEl.classList.remove('bg-gray-100', 'text-gray-500');
    isViewingStashes = false;
    updateStatus('edit');
  } else {
    // Save current content and show stashes
    previousContent = thoughtInputEl.value;
    const stashes = getStashes();
    if (stashes.length > 0) {
      const stashList = stashes.map((stash, index) => {
        const date = new Date(stash.timestamp).toLocaleString();
        return `${index + 1}. [${date}]\n${stash.content}\n`;
      }).join('\n');
      
      thoughtInputEl.value = `--- Stashes (Read-Only) ---\n\n${stashList}`;
      thoughtInputEl.readOnly = true;
      thoughtInputEl.classList.add('bg-gray-100', 'text-gray-500');
      isViewingStashes = true;
      updateStatus('stash_view');
    }
  }
}

function handleToggleModeShortcut(event) {
  // Check if the user hit Cmd+M (or Ctrl+M on Windows)
  if ((event.metaKey || event.ctrlKey) && event.key === ',') {
    event.preventDefault(); // Prevent the default action
    const saveModeEl = document.querySelector("#save-mode");
    const currentMode = saveModeEl.value;
    const newMode = currentMode === "daily" ? "standalone" : "daily";
    saveModeEl.value = newMode;
    togglePathInputs(); // Toggle the path input fields based on the new mode
  }
}

function wrapSelectedText(textarea, prefix, suffix) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  if (selectedText) {
    textarea.value = textarea.value.substring(0, start) + prefix + selectedText + suffix + textarea.value.substring(end);
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = end + prefix.length;
  } else {
    textarea.value = textarea.value.substring(0, start) + prefix + suffix + textarea.value.substring(end);
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = start + prefix.length;
  }
}

function handleBoldShortcut(event) {
  // Check if the user hit Cmd+B (or Ctrl+B on Windows), but not Shift+Cmd+B
  if ((event.metaKey || event.ctrlKey) && event.key === 'b' && !event.shiftKey) {
    event.preventDefault(); // Prevent the default action
    wrapSelectedText(thoughtInputEl, '**', '**'); // Wrap the selected text with **
  }
}

function handleItalicShortcut(event) {
  // Check if the user hit Cmd+I (or Ctrl+I on Windows), but not Shift+Cmd+I
  if ((event.metaKey || event.ctrlKey) && event.key === 'i' && !event.shiftKey) {
    event.preventDefault(); // Prevent the default action
    wrapSelectedText(thoughtInputEl, '*', '*'); // Wrap the selected text with *
  }
}

function handleLinkShortcut(event) {
  // Check if the user hit Cmd+K (or Ctrl+K on Windows), but not Shift+Cmd+K
  if ((event.metaKey || event.ctrlKey) && event.key === 'k' && !event.shiftKey) {
    event.preventDefault(); // Prevent the default action
    const start = thoughtInputEl.selectionStart;
    const end = thoughtInputEl.selectionEnd;
    const selectedText = thoughtInputEl.value.substring(start, end);

    if (selectedText) {
      // Wrap the selected text with [Link]()
      thoughtInputEl.value = thoughtInputEl.value.substring(0, start) + '[' + selectedText + ']()' + thoughtInputEl.value.substring(end);
      thoughtInputEl.selectionStart = start + selectedText.length + 3;
      thoughtInputEl.selectionEnd = start + selectedText.length + 3;
    } else {
      // Insert []() and place the cursor between the parentheses
      thoughtInputEl.value = thoughtInputEl.value.substring(0, start) + '[]()' + thoughtInputEl.value.substring(end);
      thoughtInputEl.selectionStart = start + 3;
      thoughtInputEl.selectionEnd = start + 3;
    }
  }
}

function handleTodoShortcut(event) {
  // Check if the user hit Cmd+L (or Ctrl+L on Windows), but not Shift+Cmd+L
  if ((event.metaKey || event.ctrlKey) && event.key === 'l' && !event.shiftKey) {
    event.preventDefault(); // Prevent the default action
    const start = thoughtInputEl.selectionStart;
    const end = thoughtInputEl.selectionEnd;
    const selectedText = thoughtInputEl.value.substring(start, end);

    if (selectedText) {
      // Wrap the selected text with - [ ]
      thoughtInputEl.value = thoughtInputEl.value.substring(0, start) + '- [ ] ' + selectedText + thoughtInputEl.value.substring(end);
      thoughtInputEl.selectionStart = start + 6;
      thoughtInputEl.selectionEnd = start + 6 + selectedText.length;
    } else {
      // Insert - [ ] and place the cursor between the brackets
      thoughtInputEl.value = thoughtInputEl.value.substring(0, start) + '- [ ] ' + thoughtInputEl.value.substring(end);
      thoughtInputEl.selectionStart = start + 6;
      thoughtInputEl.selectionEnd = start + 6;
    }
  }
}

const fontSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

function getCurrentFontSizeIndex() {
  const currentClass = thoughtInputEl.className;
  for (let i = 0; i < fontSizes.length; i++) {
    if (currentClass.includes(fontSizes[i])) {
      return i;
    }
  }
  return -1;
}

function handleFontSizeIncrease(event) {
  if ((event.metaKey || event.ctrlKey) && event.key === '+') {
    event.preventDefault(); // Prevent the default action
    const currentIndex = getCurrentFontSizeIndex();
    if (currentIndex < fontSizes.length - 1) {
      const newIndex = currentIndex + 1;
      thoughtInputEl.classList.remove(fontSizes[currentIndex]);
      thoughtInputEl.classList.add(fontSizes[newIndex]);
      saveFontSize(fontSizes[newIndex]);
    }
  }
}

function handleFontSizeDecrease(event) {
  if ((event.metaKey || event.ctrlKey) && event.key === '-') {
    event.preventDefault(); // Prevent the default action
    const currentIndex = getCurrentFontSizeIndex();
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      thoughtInputEl.classList.remove(fontSizes[currentIndex]);
      thoughtInputEl.classList.add(fontSizes[newIndex]);
      saveFontSize(fontSizes[newIndex]);
    }
  }
}


// Helper function to truncate long paths elegantly
function truncatePath(path, maxLength = 50) {
  if (!path || path.length <= maxLength) return path;

  const parts = path.split('/');
  if (parts.length < 3) return path;

  const start = parts[0]; // Usually empty or "/" on Unix
  const end = parts.slice(-2).join('/'); // Last two parts (folder and parent)

  return `${start}/.../${end}`;
}

// Dialog event handlers
async function handleDailyPathSelect() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Daily Notes Folder"
    });

    if (selected) {
      dailyPath = selected;
      const displayPath = truncatePath(selected);
      dailyPathDisplayEl.textContent = displayPath;
      dailyPathDisplayEl.title = selected; // Full path on hover
      dailyPathDisplayEl.classList.remove("text-gray-400");
      dailyPathDisplayEl.classList.add("text-gray-700");
    }
  } catch (error) {
    console.error("Failed to select directory:", error);
  }
}

async function handleStandalonePathSelect() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Standalone Notes Folder"
    });

    if (selected) {
      standalonePath = selected;
      const displayPath = truncatePath(selected);
      standalonePathDisplayEl.textContent = displayPath;
      standalonePathDisplayEl.title = selected; // Full path on hover
      standalonePathDisplayEl.classList.remove("text-gray-400");
      standalonePathDisplayEl.classList.add("text-gray-700");
    }
  } catch (error) {
    console.error("Failed to select directory:", error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // Add event listeners for dialog buttons
  if (dailyPathButtonEl) {
    dailyPathButtonEl.addEventListener("click", handleDailyPathSelect);
  }

  if (standalonePathButtonEl) {
    standalonePathButtonEl.addEventListener("click", handleStandalonePathSelect);
  }

  // Load the daily path from local storage
  const savedDailyPath = window.localStorage.getItem("dailyPath");
  if (savedDailyPath) {
    dailyPath = savedDailyPath;
    const displayPath = truncatePath(savedDailyPath);
    dailyPathDisplayEl.textContent = displayPath;
    dailyPathDisplayEl.title = savedDailyPath; // Full path on hover
    dailyPathDisplayEl.classList.remove("text-gray-400");
    dailyPathDisplayEl.classList.add("text-gray-700");
  }

  // Load the standalone path from local storage
  const savedStandalonePath = window.localStorage.getItem("standalonePath");
  if (savedStandalonePath) {
    standalonePath = savedStandalonePath;
    const displayPath = truncatePath(savedStandalonePath);
    standalonePathDisplayEl.textContent = displayPath;
    standalonePathDisplayEl.title = savedStandalonePath; // Full path on hover
    standalonePathDisplayEl.classList.remove("text-gray-400");
    standalonePathDisplayEl.classList.add("text-gray-700");
  }

  // Load the draft thought from local storage
  const draftThought = window.localStorage.getItem("draftThought");
  if (draftThought) {
    thoughtInputEl.value = draftThought;
  }

  // Load the saved font size from local storage
  const savedFontSize = window.localStorage.getItem("fontSize");
  if (savedFontSize) {
    thoughtInputEl.className = thoughtInputEl.className.replace(/text-\w+/, savedFontSize);
  }

  updateStatus("edit");

  // Initialize the path inputs visibility
  togglePathInputs();

  // Add event listener for save mode change
  document.querySelector("#save-mode").addEventListener("change", togglePathInputs);
});
function saveDraft() {
  const thought = thoughtInputEl.value;
  if (thought.trim() === "") {
    window.localStorage.removeItem("draftThought");
  } else {
    window.localStorage.setItem("draftThought", thought);
  }
}
function saveFontSize(fontSize) {
  window.localStorage.setItem("fontSize", fontSize);
}
