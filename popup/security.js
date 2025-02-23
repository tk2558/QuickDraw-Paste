import { restoreEntry, createEntry } from "./entry.js";

async function importKey(keyArray) {
    return await crypto.subtle.importKey(
        "raw",
        new Uint8Array(keyArray),
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

async function decryptPassword(encryptedObj, sectionId) {
    const decoder = new TextDecoder();
    const iv = new Uint8Array(encryptedObj.iv);
    const encryptedData = new Uint8Array(encryptedObj.encrypted);
    
    const storedKey = JSON.parse(localStorage.getItem(sectionId));
    const key = await importKey(storedKey);
    const decryptedData = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: iv
        },
        key,
        encryptedData
    );
    return decoder.decode(decryptedData);
}

function getDataById(sectionId, callback) {
    chrome.storage.local.get(["sections"], (result) => {
        if (result.sections) {
            const sectionData = result.sections.find(sec => sec.id === sectionId);
            callback(sectionData); 
        }
    });
}

function getPassword(sectionId, callback) {
    chrome.storage.local.get(sectionId, (result) => {
        const { password } = result[sectionId];
        decryptPassword(password, sectionId).then((decryptedPassword) => {
            callback(decryptedPassword);
        })
    });
}

function checkPassword(sectionId, enteredPassword, callback) {
    getPassword(sectionId, (storedPassword) => {
        callback(enteredPassword === storedPassword);
    });
}

function deletePassword(sectionId) {
    chrome.storage.local.remove(sectionId, () => { // Remove the associated password
        //console.log(`Password for section ID ${sectionId} deleted.`);
    });
}

function unlockSection(section, sectionId) {
    const lock = section.querySelector(".locked-section");
    const sectionContent = section.querySelector(".section-content");
    const addEntryBtn = section.querySelector(".add-entry-btn") ?? section.querySelector(".add-entry-btn-long");
    const lockBtn = section.querySelector(".lock-btn")
    lockBtn.textContent = "🔓";

    addEntryBtn.style.visibility = "visible";    
    addEntryBtn.addEventListener("click", () => { // Add event listener for Add Entry button
        createEntry(sectionContent, addEntryBtn , section.dataset.format);
    });
    section.dataset.status = false;  // unlocked status

    getDataById(sectionId, (data) => {
        const format = data.format;
        const entryData = data.entries;

        lock.remove();
        entryData.forEach((entry) => // Restore Entries
            restoreEntry(sectionContent, addEntryBtn, entry.name, entry.text, format)
        );
    });
}

function relockSection(section) {
    const lockDiv = document.createElement("div"); // Recreate Lock Section
    const buttonClass = section.dataset.format === "single-line" ? "add-entry-btn" : "add-entry-btn-long";
    const sectionContent = section.querySelector(".section-content");
    const lockBtn = section.querySelector(".lock-btn")
    lockBtn.textContent = "🔒";
    sectionContent.remove();

    lockDiv.innerHTML = `
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

    const sectionHeader = section.querySelector('.section-header');
    sectionHeader.insertAdjacentElement('afterend', lockDiv); // Append to section above the "Add Entry" 

    const toggleButton = section.querySelector('.toggle-visibility-btn');
    toggleButton.addEventListener('click', () => { // Add event listener to toggle visibility between password and text
        const passwordInput = section.querySelector('.lock-password-input');
        const eyeIcon = section.querySelector('.eye-icon');
        if (passwordInput.type === 'password') {
            eyeIcon.src = "../assets/hidden.png";
            passwordInput.type = 'text';
        } 
        else {
            eyeIcon.src = "../assets/eye.png";
            passwordInput.type = 'password';
        }
    });

    const enterBtn = section.querySelector(".enter-btn");
    enterBtn.addEventListener("click", () => {
        const passwordInput = section.querySelector('.lock-password-input');
        checkPassword(section.id, passwordInput.value, (isMatch)=> {
            if (isMatch) {
                unlockSection(section, section.id);
            } else {
                enterBtn.classList.add("shake");
                setTimeout(() => {  enterBtn.classList.remove("shake"); }, 300);    
            }
        });
    });

    const addEntryBtn = section.querySelector(".add-entry-btn") ?? section.querySelector(".add-entry-btn-long");
    addEntryBtn.style.visibility = "hidden";
    section.dataset.status = true;  // unlocked status
}

// Export functions for use in storage.js & popup.js
export { getDataById, getPassword, checkPassword, deletePassword, unlockSection, relockSection };