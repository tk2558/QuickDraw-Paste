import { checkPassword, deletePassword, unlockSection, relockSection } from "./security.js";
import { saveSections, restoreEntry, createEntry } from "./entry.js";

function loadSections() { // Load stored sections 
    //localStorage.clear(); // RESET
    //chrome.storage.local.clear(); // RESET
    chrome.storage.local.get(["sections"], (result) => {
        if (result.sections) {
            result.sections.forEach((section) => {
                restoreSections(section);
            });
        }
    });
}

function restoreSections(sectionData) {
    if (!sectionData) return; //  Catch errors if sectionData is empty

    if (sectionData.isLocked == "true") {
        restoreLocked(sectionData);
        return;
    }
    // Create a new section
    const newSection = document.createElement("div");
    newSection.classList.add("section");
    const buttonClass = sectionData.format === "single-line" ? "add-entry-btn" : "add-entry-btn-long";
  
    const sectionId = sectionData.id; 
    newSection.setAttribute("id", sectionId);

    newSection.dataset.isLocked = sectionData.isLocked;
    newSection.dataset.format =sectionData.format;
  
    // Set the inner HTML for the section
    newSection.innerHTML = `
        <div class="section-header">
            <h2>
                <img src="../assets/revolver.png" alt="Icon" class="header-icon">
                <span class="section-title">${sectionData.sectionName}</span>
                <button class="delete-sec-btn">❌</button>
                <button class="collapse-btn">▼</button>
            </h2>
        </div>
        <div class="section-content">
            <button class=${buttonClass}>+ Add</button>
        </div>
    `;
  
    const divider = document.querySelector(".divider");
    const container = document.querySelector(".section-container");
    divider.parentNode.insertBefore(newSection, divider); // Insert the new section before the divider
    container.appendChild(newSection);

    newSection.draggable = true; // Enable dragging
    newSection.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", sectionId);
        newSection.classList.add("dragging");
    });
    newSection.addEventListener("dragend", () => {
        newSection.classList.remove("dragging");
        saveSections();
    });

    const deleteSecBtn = newSection.querySelector(".delete-sec-btn");
    deleteSecBtn.addEventListener("click", () => {
        if (confirm(`Delete ${sectionData.sectionName}?`)) {
            newSection.remove();
            saveSections();
        }
    });

    const collapseBtn = newSection.querySelector(".collapse-btn");
    collapseBtn.addEventListener("click", () => {
        const sectionContent = newSection.querySelector(".section-content");
        sectionContent.classList.toggle("hidden");
        collapseBtn.textContent = sectionContent.classList.contains("hidden") ? "▼" : "▲";
    });
    
    const addEntryBtn = newSection.querySelector(".add-entry-btn") ??  newSection.querySelector(".add-entry-btn-long");
    sectionData.entries.forEach((entry) => { // Restore Entries
        const sectionContent = newSection.querySelector(".section-content");
        restoreEntry(sectionContent, addEntryBtn , entry.name, entry.text, sectionData.format)
    }); 
    addEntryBtn.addEventListener("click", () => { // Add event listener for Add Entry button (Multi Line Version)
        const sectionContent = newSection.querySelector(".section-content");
        createEntry(sectionContent, addEntryBtn, sectionData);
    });
    if (!sectionData.entries.length) {  newSection.querySelector('.section-content').classList.toggle('hidden'); }
}

function restoreLocked(sectionData) {
    if (!sectionData) return; //  Catch errors if sectionData is empty

    // Create a new section
    const newSection = document.createElement("div");
    newSection.classList.add("section");
    const buttonClass = sectionData.format === "single-line" ? "add-entry-btn" : "add-entry-btn-long";

    const sectionId = sectionData.id; 
    newSection.setAttribute("id", sectionId);
  
    newSection.dataset.isLocked = sectionData.isLocked;
    newSection.dataset.status = sectionData.isLocked; // section is currently accessible if input password passed
    newSection.dataset.format = sectionData.format;
  
    // Set the inner HTML for the section
    newSection.innerHTML = `
      <div class="section-header">
          <h2>
            <img src="../assets/revolver.png" alt="Icon" class="header-icon">
            <span class="section-title">${sectionData.sectionName}</span>
            <button class="delete-sec-btn">❌</button>
            <button class="lock-btn">🔒</button>
          </h2>
      </div>
      <div class="locked-section">
          <div class="password-container">
            <input type="password" id="password" class="lock-password-input" placeholder="Enter password">        
            <button class="toggle-visibility-btn">
                <img src="../assets/eye.png" alt="Show password" class="eye-icon">
            </button>
            <button class="enter-btn"> Enter </button>
          </div>
      </div>      
      <div class="section-content">
            <button class=${buttonClass}>+ Add</button>
      </div>
    </div>
    `;
    
    const divider = document.querySelector(".divider");
    const container = document.querySelector(".section-container");
    divider.parentNode.insertBefore(newSection, divider); // Insert the new section before the divider
    container.appendChild(newSection);
  
    newSection.draggable = true; // Enable dragging
    newSection.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", sectionId);
        newSection.classList.add("dragging");
    });
    newSection.addEventListener("dragend", () => {
        newSection.classList.remove("dragging");
        saveSections();
    });
  
    const deleteSecBtn = newSection.querySelector(".delete-sec-btn");
    deleteSecBtn.addEventListener("click", () => {
        if (confirm(`Delete ${sectionData.sectionName}?`)) {
          newSection.remove();
          deletePassword(sectionId);
          localStorage.removeItem(sectionId);
          saveSections();
        }
    });
  
    const lockBtn = newSection.querySelector(".lock-btn");
    lockBtn.addEventListener("click", () => {
        if (newSection.dataset.status == "false") {
            relockSection(newSection, sectionData);
        }
        const lockedContent = newSection.querySelector(".locked-section");
        const sectionContent = newSection.querySelector(".section-content");   
        lockedContent.classList.toggle("hidden");
        sectionContent.classList.toggle("hidden");
    });
  
    const toggleButton = newSection.querySelector('.toggle-visibility-btn');
    toggleButton.addEventListener('click', () => { // Add event listener to toggle visibility for password 
        const eyeIcon = newSection.querySelector('.eye-icon');
        const passwordInput = newSection.querySelector('.lock-password-input');
        if (passwordInput.type === 'password') {
            eyeIcon.src = "../assets/hidden.png";
            passwordInput.type = 'text';
        } 
        else {
            eyeIcon.src = "../assets/eye.png";
            passwordInput.type = 'password';
        }
    });

    const enterBtn = newSection.querySelector(".enter-btn");
    enterBtn.addEventListener("click", () => {
        const passwordInput = newSection.querySelector('.lock-password-input');
        checkPassword(newSection.id, passwordInput.value, (isMatch)=> {
            if (isMatch) {
                unlockSection(newSection, newSection.id, sectionData);
            } else {
                enterBtn.classList.add("shake");
                setTimeout(() => {  enterBtn.classList.remove("shake"); }, 300);    
            }
        });
    });

    const addEntryBtn = newSection.querySelector(".add-entry-btn") ?? newSection.querySelector(".add-entry-btn-long");
    newSection.querySelector('.section-content').classList.toggle('hidden');
    newSection.querySelector('.locked-section').classList.toggle('hidden');
    addEntryBtn.style.visibility = "hidden"; 
    addEntryBtn.style.display = "none"; 
    //saveSections();
}

// Export functions for use in popup.js
export { loadSections };