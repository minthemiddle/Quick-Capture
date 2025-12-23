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
const endpointConfigContainerEl = document.querySelector("#endpoint-config-container");
const endpointConfigDisplayEl = document.querySelector("#endpoint-config-display");
const statusEl = document.querySelector("#status");
const statusIconEl = document.querySelector("#status-icon");

// Store paths in memory instead of inputs
let dailyPath = "";
let standalonePath = "";

// Endpoint configuration
let endpointConfig = {
  url: "",
  authType: "none",
  bearerToken: "",
  username: "",
  password: "",
  extraHeaders: ""
};

let isEditingEndpointSettings = false;

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
  },
  endpoint_settings_saved: {
    message: "Settings saved",
    iconClass: "text-green-500"
  },
  endpoint_settings_invalid: {
    message: "Invalid settings",
    iconClass: "text-red-500"
  },
  no_endpoint: {
    message: "No endpoint",
    iconClass: "text-red-500"
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

// Endpoint shortcuts - defined later but hoisted
thoughtInputEl.addEventListener('keydown', handleEndpointPost);
thoughtInputEl.addEventListener('keydown', handleEndpointSettingsShortcut);


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

    // Handle endpoint mode
    if (mode === "endpoint") {
      // Check if endpoint is configured
      if (!endpointConfig.url) {
        updateStatus("no_endpoint");
        return;
      }

      if (!thought.trim()) {
        return;
      }

      try {
        const response = await invoke("post_to_endpoint", {
          content: thought,
          url: endpointConfig.url,
          authType: endpointConfig.authType,
          authToken: endpointConfig.authType === 'bearer' ? endpointConfig.bearerToken : null,
          username: endpointConfig.authType === 'basic' ? endpointConfig.username : null,
          password: endpointConfig.authType === 'basic' ? endpointConfig.password : null,
          extraHeaders: endpointConfig.extraHeaders || null
        });
        console.log(response);
        thoughtInputEl.value = ""; // Clear the textarea after sending
        window.localStorage.removeItem("draftThought"); // Clear the draft from localStorage
        updateStatus("success");
      } catch (error) {
        console.error(error);
        updateStatus("error");
      }
      return;
    }

    // Handle file-based modes (daily and standalone)
    const path = mode === "daily" ? dailyPath : standalonePath;

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
  endpointConfigContainerEl.classList.toggle("hidden", mode !== "endpoint");
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

function toggleEndpointSettingsView() {
  if (isEditingEndpointSettings) {
    // Save settings and return to normal mode
    const content = thoughtInputEl.value;
    const parsed = parseEndpointSettings(content);

    if (parsed.error) {
      updateStatus('endpoint_settings_invalid');
      return;
    }

    // Save the parsed settings
    endpointConfig = parsed.config;
    saveEndpointConfig();
    updateEndpointConfigDisplay();

    // Restore previous content
    thoughtInputEl.value = previousContent;
    thoughtInputEl.readOnly = false;
    thoughtInputEl.classList.remove('bg-gray-100', 'text-gray-500');
    isEditingEndpointSettings = false;
    updateStatus('endpoint_settings_saved');
  } else {
    // Enter settings mode
    previousContent = thoughtInputEl.value;
    const settingsText = formatEndpointSettings();
    thoughtInputEl.value = settingsText;
    thoughtInputEl.readOnly = false; // Keep editable
    thoughtInputEl.classList.add('bg-gray-100', 'text-gray-500');
    isEditingEndpointSettings = true;
    updateStatus('edit');
  }
}

function parseEndpointSettings(content) {
  const lines = content.split('\n');
  const config = {
    url: "",
    authType: "none",
    bearerToken: "",
    username: "",
    password: "",
    extraHeaders: ""
  };

  for (const line of lines) {
    if (line.startsWith('URL:')) {
      config.url = line.substring(4).trim();
    } else if (line.startsWith('Auth Type:')) {
      config.authType = line.substring(10).trim().toLowerCase();
    } else if (line.startsWith('Bearer Token:')) {
      config.bearerToken = line.substring(14).trim();
    } else if (line.startsWith('Username:')) {
      config.username = line.substring(10).trim();
    } else if (line.startsWith('Password:')) {
      config.password = line.substring(10).trim();
    } else if (line.startsWith('Extra Headers:')) {
      config.extraHeaders = line.substring(15).trim();
    }
  }

  // Validate
  if (!config.url) {
    return { error: true, message: "URL is required" };
  }

  // Validate URL format
  try {
    new URL(config.url);
  } catch (e) {
    return { error: true, message: "Invalid URL format" };
  }

  // Validate auth type
  if (!['none', 'bearer', 'basic'].includes(config.authType)) {
    return { error: true, message: "Invalid auth type" };
  }

  if (config.authType === 'bearer' && !config.bearerToken) {
    return { error: true, message: "Bearer token required" };
  }

  if (config.authType === 'basic' && (!config.username || !config.password)) {
    return { error: true, message: "Username and password required" };
  }

  return { error: false, config };
}

function formatEndpointSettings() {
  let text = "--- Endpoint Settings ---\n";
  text += `URL: ${endpointConfig.url}\n`;
  text += `Auth Type: ${endpointConfig.authType}\n`;
  text += `Bearer Token: ${endpointConfig.bearerToken}\n`;
  text += `Username: ${endpointConfig.username}\n`;
  text += `Password: ${endpointConfig.password}\n`;
  text += `Extra Headers: ${endpointConfig.extraHeaders}\n`;
  text += "---\n";
  text += "Press Cmd+Shift+O again to save & return";
  return text;
}

function updateEndpointConfigDisplay() {
  if (!endpointConfig.url) {
    endpointConfigDisplayEl.textContent = "No endpoint configured (Cmd+Shift+O to configure)";
    endpointConfigDisplayEl.title = "No endpoint configured";
    endpointConfigDisplayEl.classList.remove("text-gray-700");
    endpointConfigDisplayEl.classList.add("text-gray-500");
    return;
  }

  // Create display text
  let displayText = truncatePath(endpointConfig.url, 30);

  if (endpointConfig.authType !== 'none') {
    const authIndicator = endpointConfig.authType === 'bearer' ? 'Bearer •••' : 'Basic auth';
    displayText += ` | ${authIndicator}`;
  }

  endpointConfigDisplayEl.textContent = displayText;
  endpointConfigDisplayEl.title = endpointConfig.url;
  endpointConfigDisplayEl.classList.remove("text-gray-500");
  endpointConfigDisplayEl.classList.add("text-gray-700");
}

function saveEndpointConfig() {
  window.localStorage.setItem("endpointUrl", endpointConfig.url);
  window.localStorage.setItem("endpointAuthType", endpointConfig.authType);
  window.localStorage.setItem("endpointBearerToken", endpointConfig.bearerToken);
  window.localStorage.setItem("endpointUsername", endpointConfig.username);
  window.localStorage.setItem("endpointPassword", endpointConfig.password);
  window.localStorage.setItem("endpointExtraHeaders", endpointConfig.extraHeaders);
}

function loadEndpointConfig() {
  endpointConfig.url = window.localStorage.getItem("endpointUrl") || "";
  endpointConfig.authType = window.localStorage.getItem("endpointAuthType") || "none";
  endpointConfig.bearerToken = window.localStorage.getItem("endpointBearerToken") || "";
  endpointConfig.username = window.localStorage.getItem("endpointUsername") || "";
  endpointConfig.password = window.localStorage.getItem("endpointPassword") || "";
  endpointConfig.extraHeaders = window.localStorage.getItem("endpointExtraHeaders") || "";
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

async function handleEndpointPost(event) {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'p') {
    event.preventDefault();

    // Check if endpoint is configured
    if (!endpointConfig.url) {
      updateStatus("no_endpoint");
      return;
    }

    const thought = thoughtInputEl.value;
    if (!thought.trim()) {
      return;
    }

    try {
      const response = await invoke("post_to_endpoint", {
        content: thought,
        url: endpointConfig.url,
        authType: endpointConfig.authType,
        authToken: endpointConfig.authType === 'bearer' ? endpointConfig.bearerToken : null,
        username: endpointConfig.authType === 'basic' ? endpointConfig.username : null,
        password: endpointConfig.authType === 'basic' ? endpointConfig.password : null,
        extraHeaders: endpointConfig.extraHeaders || null
      });
      thoughtInputEl.value = ""; // Clear the textarea after sending
      window.localStorage.removeItem("draftThought"); // Clear the draft from localStorage
      updateStatus("success");
    } catch (error) {
      console.error(error);
      updateStatus("error");
    }
  }
}

function handleEndpointSettingsShortcut(event) {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'o') {
    event.preventDefault();
    toggleEndpointSettingsView();
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

  // Load endpoint config from local storage
  loadEndpointConfig();
  updateEndpointConfigDisplay();

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
