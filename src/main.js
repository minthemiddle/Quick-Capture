const { invoke } = window.__TAURI__.tauri;

const saveThoughtBtn = document.querySelector("#save-thought");
const thoughtInputEl = document.querySelector("#thought-input");
const saveMsgEl = document.querySelector("#save-msg");

saveThoughtBtn.addEventListener("click", async () => {
  const thought = thoughtInputEl.value;
  const response = await invoke("save_thought", { thought });
  saveMsgEl.textContent = response;
  thoughtInputEl.value = ""; // Clear the textarea after saving
});
