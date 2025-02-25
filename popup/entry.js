function saveSections() { // Save sections to Chrome Storage
    const sections = Array.from(document.querySelectorAll(".section")).map((section) => {
        return {
            id: section.id,
            sectionName: section.querySelector(".section-title").textContent,
            isLocked: section.dataset.isLocked,
            format: section.dataset.format,
            entries: getSectionEntries(section),
        };
    });
    chrome.storage.local.set({ sections }, () => {
        //console.log("Sections saved: ", sections);
    });
}

function updateLockedSection(sectionId, entryName, entryText, locked) {
  if (!locked || locked == "false") { return; }
  chrome.storage.local.get(sectionId, (result) => {
      const { password, entries } = result[sectionId];
      entries.push({
          name: entryName.trim(),
          text: entryText,
      });
      chrome.storage.local.set({ [sectionId]: {password, entries}});
  });
}

function updateLockedEntry(sectionId, locked, allEntry) {
  //console.log(`${sectionId}, ${allEntry}`) 
  if (!locked || locked == "false") { return; }
  let entries = [];
  chrome.storage.local.get(sectionId, (result) => {
    const { password, oldentries } = result[sectionId];
    allEntry.forEach((entry) => {
      const entryName = entry.querySelector(".entry-name");
      const entryText = entry.querySelector(".entry-text");
      console.log(`${entryName.textContent} : ${entryText.value}`)

      entries.push({
        name: entryName.textContent.trim(),
        text: entryText.value || entryText.innerText,
      });
    });

    chrome.storage.local.set({ [sectionId]: {password, entries}});
  });
}

function revealAllEntry(containers) {
  const allSections = containers.querySelectorAll(".section");
  allSections.forEach((section) => { 
    if (section.dataset.isLocked == "true") {
      const sectionContent = section.querySelector(".section-content");
      const allEntry = sectionContent.querySelectorAll(".entry") ?? sectionContent.querySelectorAll(".entry-long");
      allEntry.forEach((entry) => {
        const entryText = entry.querySelector(".entry-text");
        entryText.style.backgroundColor = "white";
      });
    }
  });
}

function unrevealAllEntry(containers) {
  const allSections = containers.querySelectorAll(".section");
  allSections.forEach((section) => { 
    if (section.dataset.isLocked == "true") {
      const sectionContent = section.querySelector(".section-content");
      const allEntry = sectionContent.querySelectorAll(".entry") ?? sectionContent.querySelectorAll(".entry-long");
      allEntry.forEach((entry) => {
        const entryText = entry.querySelector(".entry-text");
        entryText.style.backgroundColor = "black";
        entryText.addEventListener("click", function () {
          entryText.style.backgroundColor = "white";
        });
      });
    }
  });
}

function blackoutEntry(allEntry) {
  allEntry.forEach((entry) => {
    const entryText = entry.querySelector(".entry-text");
    entryText.style.backgroundColor = "black";
    entryText.addEventListener("click", function () {
      entryText.style.backgroundColor = "white";
    });
  });
}

function getSectionEntries(section) {
  let entries = [];
  entries = Array.from(section.querySelectorAll(".entry, .entry-long")).map((entry) => {
    const nameElement = entry.querySelector(".entry-name");
    const textElement = entry.querySelector(".entry-text");
    if (!nameElement || !textElement) return null;
    if (!nameElement.textContent.trim() || !textElement.value.trim()) return null;
    return {
        name: nameElement.textContent.trim(),
        text: textElement.value || textElement.innerText,
    };
  }).filter(entry => entry !== null); // Remove null entries
  return entries;
}

function restoreEntry(sectionContent, addButton, name, info, sectionData) { 
    const entryDiv = document.createElement("div");
    const format = sectionData.format;
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
                saveSections();
                const allEntry = sectionContent.querySelectorAll(".entry-long");
                updateLockedEntry(sectionData.id, sectionData.isLocked, allEntry);
            }
        });
    }
    sectionContent.insertBefore(entryDiv, addButton); // Append to section above the "Add Entry" button
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


function createEntry(sectionContent, addButton, sectionData) { 
    if (!sectionContent) return; //  Catch errors if section is null
    
    const entryDiv = document.createElement("div");
    if (sectionData.format === "single-line") { entryDiv.classList.add("entry");}
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
  
    if (sectionData.format === "single-line") {
      const infoInput = document.createElement("input");
      infoInput.type = "text";
      infoInput.placeholder = "Enter Info (e.g., URL)";
      infoInput.classList.add("entry-text-input");
  
      entryDiv.append(bulletIcon, nameInput, infoInput, deleteBtn, confirmBtn);
      confirmBtn.addEventListener("click", function () {
        saveEntry(entryDiv, nameInput.value, infoInput.value, sectionData.format, sectionContent);
        updateLockedSection(sectionData.id, nameInput.value, infoInput.value, sectionData.isLocked)
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
          saveEntry(entryDiv, nameInput.value, infoInputArea.value, sectionData.format, sectionContent);
          updateLockedSection(sectionData.id, nameInput.value, infoInputArea.value, sectionData.isLocked)
        });
    }

    sectionContent.insertBefore(entryDiv, addButton); // Append to section above the "Add Entry" button
    deleteBtn.addEventListener("click", function () {
      entryDiv.remove();
    });
}


function saveEntry(entryDiv, name, info, format, sectionContent) { 
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
        const isEditing = entryName.contentEditable === "true"; // Check if in edit mode
  
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
            saveSections();
            const allEntry = sectionContent.querySelectorAll(".entry-long");
            updateLockedEntry(sectionData.id, sectionData.isLocked, allEntry);
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

export { updateLockedSection, saveSections, restoreEntry, createEntry, saveEntry, blackoutEntry, revealAllEntry, unrevealAllEntry };