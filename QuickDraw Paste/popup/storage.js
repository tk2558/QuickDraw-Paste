function loadSections() { // Load stored sections from Chrome 
    chrome.storage.local.get(["sections"], (result) => {
        if (result.sections) {
            result.sections.forEach((section) => {
                restoreSections(section);
            });
        }
    });
}

function saveSections() { // Save sections to Chrome Storage
    const sections = Array.from(document.querySelectorAll(".section")).map((section) => {
        return {
            id: section.id,
            sectionName: section.querySelector(".section-title").textContent,
            isLocked: section.dataset.isLocked,
            format: section.dataset.format,
            entries: Array.from(section.querySelectorAll(".entry, .entry-long")).map((entry) => ({
                name: entry.querySelector(".entry-name").textContent,
                text: entry.querySelector(".entry-text").value || entry.querySelector(".entry-text").innerText,
            })),
        };
    });
    chrome.storage.local.set({ sections }, () => {
        console.log("Sections saved: ", sections);
    });
}

function restoreSections(sectionData) {
    if (!sectionData) return; //  Catch errors if sectionData is empty

    // Create a new section
    const newSection = document.createElement("div");
    newSection.classList.add("section");
    const buttonClass = sectionData.format === "single-line" ? "add-entry-btn" : "add-entry-btn-long";
  
    const sectionId = sectionData.id; // Generate a unique ID for the section
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
    
    if (sectionData.format === "single-line") {
        const addEntryBtn = newSection.querySelector(".add-entry-btn");
        sectionData.entries.forEach((entry) => // Restore Entries
            restoreEntry(sectionContent, addEntryBtn, entry.name, entry.text, "single-line")
        ); 
        addEntryBtn.addEventListener("click", () => { // Add event listener for Add Entry button (Single Line Version)
            createEntry(sectionContent, addEntryBtn, "single-line");
        });
    } else {
        const addEntryBtnLong = newSection.querySelector(".add-entry-btn-long");
        sectionData.entries.forEach((entry) => // Restore Entries
            restoreEntry(sectionContent, addEntryBtnLong, entry.name, entry.text, "multi-line")
        ); 
        addEntryBtnLong.addEventListener("click", () => { // Add event listener for Add Entry button (Multi Line Version)
            createEntry(sectionContent, addEntryBtnLong, "multi-line");
        });
    }
    if (!sectionData.entries.length) {  newSection.querySelector('.section-content').classList.toggle('hidden'); }
}

function restoreEntry(section, addButton, name, info, format) { 
    const entryDiv = document.createElement("div");
    if (format === "single-line") { entryDiv.classList.add("entry");}
    else { entryDiv.classList.add("entry-long"); }

    if (format === "single-line") {
        entryDiv.innerHTML = `
            <img src="../assets/bullet.png" alt="Icon" class="entry-icon">
            <span class="entry-name">${name}</span>
            <input type="text" value="${info}" class="entry-text" readonly>
            <button class="delete-btn">❌</button>
            <button class="copy-btn">📋</button>
        `;
      } else {
        entryDiv.innerHTML = `
                <img src="../assets/bullet.png" alt="Icon" class="entry-icon">
                <span class="entry-name">${name}</span>
                <textarea class="entry-text" readonly>${info}</textarea>
                <button class="delete-btn">❌</button>
                <button class="edit-btn">✏️</button>
                <button class="copy-btn">📋</button>
        `;
        entryDiv.querySelector(".edit-btn").addEventListener("click", function () { // Add edit functionality
            const entryName = entryDiv.querySelector(".entry-name");
            const entryText = entryDiv.querySelector(".entry-text");
            const isEditing = entryName.contentEditable === "true"; // Check if  in edit mode
      
            if (!isEditing) {
                entryName.contentEditable = "true"; // Enable editing mode
                entryName.style.backgroundColor = "white"; 
                entryName.style.border = "1px solid #ccc";
                entryText.removeAttribute("readonly");
                entryText.focus();
      
                this.textContent = "✔"; // Change edit button to confirm
                this.style.color = "green";
            } else {
                entryName.contentEditable = "false"; // Save and disable editing mode
                entryName.style.backgroundColor = "transparent";
                entryName.style.border = "none";
                entryText.setAttribute("readonly", "true");
                this.textContent = "✏️"; // Revert back to edit icon
            }
        });
    }
    
    section.insertBefore(entryDiv, addButton); // Append to section above the "Add Entry" button
  
    entryDiv.querySelector(".delete-btn").addEventListener("click", function () { // Add delete functionality
      if (confirm(`Delete Entry: ${name}?`)) {
        const bullet = entryDiv.querySelector(".entry-icon");
        bullet.style.transition = "transform 0.5s cubic-bezier(0.6, 0, 1, 1)"; // Acceleration effect
        bullet.style.transform = `translateX(${300}px)`;
  
        setTimeout(() => { // Wait for the animation to finish before removing the entry
            entryDiv.remove();
            saveSections();
        }, 500);
      }
    });
   
    entryDiv.querySelector(".copy-btn").addEventListener("click", function () { // Add copy functionality
      navigator.clipboard.writeText(info);
    });
}


function createEntry(section, addButton, format) { 
    if (!section) return; //  Catch errors if section is null
  
    const entryDiv = document.createElement("div");
    if (format === "single-line") { entryDiv.classList.add("entry");}
    else { entryDiv.classList.add("entry-long"); }
  
    // Bullet Icon
    const bulletIcon = document.createElement("img");
    bulletIcon.src = "../assets/bullet.png";
    bulletIcon.alt = "Icon";
    bulletIcon.classList.add("entry-icon");
  
    // Name Input
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Name";
    nameInput.classList.add("entry-name-input");
  
    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "❌";
  
    // Confirm Button
    const confirmBtn = document.createElement("button");
    confirmBtn.classList.add("confirm-btn");
    confirmBtn.textContent = "✔";
    confirmBtn.style.color = "green";
  
    if (format === "single-line") {
      const infoInput = document.createElement("input");
      infoInput.type = "text";
      infoInput.placeholder = "Enter Info (e.g., URL)";
      infoInput.classList.add("entry-text-input");
  
      entryDiv.append(bulletIcon, nameInput, infoInput, deleteBtn, confirmBtn);
      confirmBtn.addEventListener("click", function () {
        saveEntry(entryDiv, nameInput.value, infoInput.value, format);
      });
    } else {
        const infoInputArea = document.createElement("textarea");
        infoInputArea.placeholder = "Enter All Info";
        infoInputArea.classList.add("entry-textarea-input");
    
        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-btn");
        editBtn.textContent = "✏️";
    
        entryDiv.append(bulletIcon, nameInput, infoInputArea, deleteBtn, editBtn, confirmBtn);
        confirmBtn.addEventListener("click", function () {
          saveEntry(entryDiv, nameInput.value, infoInputArea.value, format);
        });
    }

    section.insertBefore(entryDiv, addButton); // Append to section above the "Add Entry" button
    deleteBtn.addEventListener("click", function () {
      entryDiv.remove();
    });
}


function saveEntry(entryDiv, name, info, format) { 
    if (!name.trim() || !info.trim()) {
        alert("Name and Info cannot be empty!");
        return;
    }
  
    if (format === "single-line") {
      entryDiv.innerHTML = `
          <img src="../assets/bullet.png" alt="Icon" class="entry-icon">
          <span class="entry-name">${name}</span>
          <input type="text" value="${info}" class="entry-text" readonly>
          <button class="delete-btn">❌</button>
          <button class="copy-btn">📋</button>
      `;
    }
  
    else {
      entryDiv.innerHTML = `
        <img src="../assets/bullet.png" alt="Icon" class="entry-icon">
        <span class="entry-name">${name}</span>
        <textarea class="entry-text" readonly>${info}</textarea>
        <button class="delete-btn">❌</button>
        <button class="edit-btn">✏️</button>
        <button class="copy-btn">📋</button>
      `;
  
      entryDiv.querySelector(".edit-btn").addEventListener("click", function () { // Add edit functionality
        const entryName = entryDiv.querySelector(".entry-name");
        const entryText = entryDiv.querySelector(".entry-text");
        const isEditing = entryName.contentEditable === "true"; // Check if  in edit mode
  
        if (!isEditing) {
            entryName.contentEditable = "true"; // Enable editing mode
            entryName.style.backgroundColor = "white"; 
            entryName.style.border = "1px solid #ccc";
            entryText.removeAttribute("readonly");
            entryText.focus();
  
            this.textContent = "✔"; // Change edit button to confirm
            this.style.color = "green";
        } else {
            entryName.contentEditable = "false"; // Save and disable editing mode
            entryName.style.backgroundColor = "transparent";
            entryName.style.border = "none";
            entryText.setAttribute("readonly", "true");
            this.textContent = "✏️"; // Revert back to edit icon
        }
      });
    }
  
    entryDiv.querySelector(".delete-btn").addEventListener("click", function () { // Add delete functionality
      if (confirm(`Delete Entry: ${name}?`)) {
        const bullet = entryDiv.querySelector(".entry-icon");
        bullet.style.transition = "transform 0.5s cubic-bezier(0.6, 0, 1, 1)"; // Acceleration effect
        bullet.style.transform = `translateX(${300}px)`;
  
        setTimeout(() => { // Wait for the animation to finish before removing the entry
            entryDiv.remove();
            saveSections();
        }, 500);
      }
    });
   
    entryDiv.querySelector(".copy-btn").addEventListener("click", function () { // Add copy functionality
      navigator.clipboard.writeText(info);
    });
    
  
    // ANIMATION
    const revolverImg = entryDiv.closest(".section").querySelector(".header-icon");
    if (revolverImg) {
        revolverImg.classList.add("revolver-spin"); // Trigger the revolver image SPIN MOVE
        revolverImg.addEventListener("animationend", function () { // Remove the class after the animation completes to allow re-triggering in the future
            revolverImg.classList.remove("revolver-spin");
        });
    }
    saveSections();
}

// Export functions for use in popup.js
export { saveSections, loadSections, createEntry, saveEntry };