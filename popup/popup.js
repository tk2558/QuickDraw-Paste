import { loadSections } from "./storage.js";
import { checkPassword, deletePassword, unlockSection, relockSection } from "./security.js";
import { saveSections, createEntry, updateLockedSection } from "./entry.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for the new section data
  if (message.action === 'forwardData') {
    sendResponse({ status: "Forward Success" });
    createSection(message.data);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".section-container");
  container.addEventListener("dragover", (event) => {
      event.preventDefault(); // Allow dropping
      const afterElement = getDragAfterElement(container, event.clientY);
      const dragging = document.querySelector(".dragging");

      if (afterElement == null) {
          container.appendChild(dragging);
      } else {
          container.insertBefore(dragging, afterElement);
      }
  });

  loadSections();

  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => {
      section.draggable = true; // Enable dragging
      section.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("text/plain", section.id);
          section.classList.add("dragging");
      });

      section.addEventListener("dragend", () => {
          section.classList.remove("dragging");
          saveSections();
      });
  });

  function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll(".section:not(.dragging)")];

      return draggableElements.reduce((closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  const tumbleweed = document.querySelector(".project-icon");
  tumbleweed.addEventListener("click", () => {
      tumbleweed.classList.add("rolling");
      setTimeout(() => {
          tumbleweed.classList.remove("rolling"); // Remove class after animation completes to allow re-triggering
      }, 3000); // Same duration as animation
  });
});

function createSection(sectionData) {
  if (!sectionData) return; //  Catch errors if sectionData is empty
  if (sectionData.isLocked) { 
    lockedSection(sectionData); 
    return; 
  }
  
  const newSection = document.createElement("div"); // Create a new section
  newSection.classList.add("section");
  const buttonClass = sectionData.format === "single-line" ? "add-entry-btn" : "add-entry-btn-long";

  const sectionId = `section-${Date.now()}`; // Generate a unique ID for the section
  newSection.setAttribute("id", sectionId);

  newSection.dataset.isLocked = sectionData.isLocked;
  newSection.dataset.format = sectionData.format;

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

  const sectionContent = newSection.querySelector(".section-content");
  const collapseBtn = newSection.querySelector(".collapse-btn");
  collapseBtn.addEventListener("click", () => {
      sectionContent.classList.toggle("hidden");
      collapseBtn.textContent = sectionContent.classList.contains("hidden") ? "▼" : "▲";
  });

  const addEntryBtn = newSection.querySelector(".add-entry-btn") ?? newSection.querySelector(".add-entry-btn-long");
  addEntryBtn.addEventListener("click", () => { // Add event listener for Add Entry button (Multi Line Version)
      createEntry(sectionContent, addEntryBtn, sectionData);
  });
  saveSections();
}

function lockedSection(sectionData) {
  if (!sectionData) return; //  Catch errors if sectionData is empty
  
  const newSection = document.createElement("div"); // Create a new section
  newSection.classList.add("section");
  const buttonClass = sectionData.format === "single-line" ? "add-entry-btn" : "add-entry-btn-long";

  const sectionId = sectionData.id; 
  newSection.setAttribute("id", sectionId);

  newSection.dataset.isLocked = sectionData.isLocked; // if section has password
  newSection.dataset.status = sectionData.isLocked; // if section is currently accessible (if input password passed)
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
      event.dataTransfer.setData("text/plain", newSection.id); // Store dragged section ID
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

  // Get the password input and toggle button
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
  addEntryBtn.style.visibility = "hidden";
  addEntryBtn.style.display = "none"; 
  saveSections();
}

document.addEventListener('DOMContentLoaded', function () {
  const addSectionButton = document.querySelector('.add-section-btn');

  addSectionButton.addEventListener('click', function () {
    chrome.storage.local.get(['popupWindowId'], function (data) {
      if (data.popupWindowId) {  // If a window is already open, bring it to focus
        chrome.windows.update(data.popupWindowId, { focused: true }, function (window) {
          if (chrome.runtime.lastError || !window) { // If the stored window doesn't exist anymore, reset storage and create a new one
            openPopup();
          }
        });
      } else { openPopup(); }
    });
  });

  function openPopup() {
    chrome.windows.create({
      url: "../add_section/add_section.html",
      type: "popup",
      width: 450,
      height: 350,
      left: Math.floor((screen.width - 400) / 2),
      top: Math.floor((screen.height - 300) / 2),
    }, function (window) {
      chrome.storage.local.set({ popupWindowId: window.id });
    });
  }

  // Listen for window close event to clear storage
  chrome.windows.onRemoved.addListener(function (windowId) {
    chrome.storage.local.get(['popupWindowId'], function (data) {
      if (data.popupWindowId === windowId) {
        chrome.storage.local.remove('popupWindowId');
      }
    });
  });
});