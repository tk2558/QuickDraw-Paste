import { saveSections, loadSections, createEntry, saveEntry } from "./storage.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for the new section data
  if (message.action === 'forwardData') {
    sendResponse({ status: "Forward Success" });
    createSection(message.data);
    console.log("Creation Successful");
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
          event.dataTransfer.setData("text/plain", section.id); // Store dragged section ID
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
});

/*
document.querySelectorAll('.collapse-btn').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.closest('.section');
        section.querySelector('.section-content').classList.toggle('hidden');
    });
});

document.querySelectorAll('.delete-sec-btn').forEach(button => {
  button.addEventListener('click', () => {
      const section = button.closest('.section');
      if (confirm(`Delete this section?`)) {
        section.remove();
        saveSections();
      }
  });
});

document.querySelectorAll('.lock-btn').forEach(button => {
  button.addEventListener('click', () => {
      const section = document.querySelector('.locked-section');
      section.classList.toggle('hidden');
  });
});

document.querySelectorAll('.copy-btn').forEach(button => {
  button.addEventListener('click', () => {
    const entry = button.closest('.entry') ?? button.closest('.entry-long'); // Find the parent .entry div
    const entryText = entry.querySelector('.entry-text'); // Find the input inside it
    
    const text = entryText.value;
    navigator.clipboard.writeText(text); // Copy the value of the input to clipboard
  });
});

document.querySelectorAll('.delete-btn').forEach(button => {
  button.addEventListener('click', () => {
      const entry = button.closest('.entry') ?? button.closest('.entry-long');
      if (confirm(`Delete Entry: ${entry.querySelector(".entry-icon").textContent}`)) {
        const bullet = entry.querySelector(".entry-icon");
        bullet.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 1, 1)"; // Acceleration effect
        bullet.style.transform = `translateX(${300}px)`;
  
        setTimeout(() => { // Wait for the animation to finish before removing the entry
            entry.remove();
            saveSections();
        }, 500); 
      }
  });
});

document.querySelectorAll('.edit-btn').forEach(button => {
  button.addEventListener('click', () => {
      const entry = button.closest('.entry-long');
      const entryName = entry.querySelector(".entry-name");
      const entryText = entry.querySelector(".entry-text");
      const isEditing = entryName.contentEditable === "true"; // Check if  in edit mode

      if (!isEditing) {
          entryName.contentEditable = "true"; // Enable editing mode
          entryName.style.backgroundColor = "white"; 
          entryName.style.border = "1px solid #ccc";
          entryText.removeAttribute("readonly");
          entryText.focus();

          button.textContent = "✔"; // Change edit button to confirm
          button.style.color = "green";
      } else {
          entryName.contentEditable = "false"; // Save and disable editing mode
          entryName.style.backgroundColor = "transparent";
          entryName.style.border = "none";
          entryText.setAttribute("readonly", "true");
          button.textContent = "✏️"; // Revert back to edit icon
      }  
    });
});

document.querySelectorAll('.add-entry-btn').forEach(button => {
  button.addEventListener('click', () => {
      const section = button.closest(".section");
      if (section) {
          const sectionContent = section.querySelector(".section-content");
          const addButton = sectionContent.querySelector(".add-entry-btn");
          if (sectionContent) {
              createEntry(sectionContent, addButton, "single-line");
          } 
          else { console.error("Could not find .section-content inside", section); }
      } 
      else { console.error("Could not find .section for", this); }
  });
});

document.querySelectorAll('.add-entry-btn-long').forEach(button => {
  button.addEventListener('click', () => {
      const section = button.closest(".section");
      if (section) {
          const sectionContent = section.querySelector(".section-content");
          const addButton = sectionContent.querySelector(".add-entry-btn-long");
          if (sectionContent) {
              createEntry(sectionContent, addButton, "multi-line");
          } 
          else { console.error("Could not find .section-content inside", section); }
      } 
      else { console.error("Could not find .section for", this); }
  });
});
*/

document.querySelectorAll('.lock-btn').forEach(button => {
  button.addEventListener('click', () => {
      const section = document.querySelector('.locked-section');
      section.classList.toggle('hidden');
  });
});

function createSection(sectionData) {
  if (!sectionData) return; //  Catch errors if sectionData is empty

  // Create a new section
  const newSection = document.createElement("div");
  newSection.classList.add("section");
  const buttonClass = sectionData.format === "single-line" ? "add-entry-btn" : "add-entry-btn-long";

  const sectionId = `section-${Date.now()}`; // Generate a unique ID for the section
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
      event.dataTransfer.setData("text/plain", sectionId); // Store dragged section ID
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
  });

  // Add event listener for Add Entry button (Single Line Version)
  if (sectionData.format === "single-line") {
    const addEntryBtn = newSection.querySelector(".add-entry-btn");
    addEntryBtn.addEventListener("click", () => {
      createEntry(sectionContent, addEntryBtn, "single-line");
    });
  } else {
    const addEntryBtnLong = newSection.querySelector(".add-entry-btn-long");
    addEntryBtnLong.addEventListener("click", () => { // Add event listener for Add Entry button (Multi Line Version)
      createEntry(sectionContent, addEntryBtnLong, "multi-line");
    });
  }
  saveSections();
}

document.addEventListener('DOMContentLoaded', function () {
  const addSectionButton = document.querySelector('.add-section-btn');
  addSectionButton.addEventListener('click', function () {
    chrome.windows.create({
      url: "../add_section/add_section.html",
      type: "popup",
      width: 450,
      height: 350,
      left: Math.floor((screen.width - 400) / 2),  // Center window horizontally
      top: Math.floor((screen.height - 300) / 2),   // Center window vertically
    });
  });
});