import { restoreEntry, createEntry, blackoutEntry } from "./entry.js";

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
        const sectionData = result.sections.find(sec => sec.id === sectionId);
        const sectionFormat = sectionData.format;
        chrome.storage.local.get(sectionId, (lockedResults) => {
            const { password, entries } = lockedResults[sectionId];
            const sectionEntries = entries || []; 
            callback({ format: sectionFormat, entries: sectionEntries });
        });
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
        //console.log(`${sectionId} deleted.`);
    });
}

function unlockSection(section, sectionId, sectionData) {
    const lock = section.querySelector(".locked-section");
    const sectionContent = section.querySelector(".section-content");
    const addEntryBtn = section.querySelector(".add-entry-btn") ?? section.querySelector(".add-entry-btn-long");
    const lockBtn = section.querySelector(".lock-btn")
    lockBtn.textContent = "🔓";

    addEntryBtn.style.visibility = "visible";
    addEntryBtn.style.display = "block"; 
    addEntryBtn.addEventListener("click", () => { // Add event listener for Add Entry button
        createEntry(sectionContent, addEntryBtn, sectionData);
    });
    section.dataset.status = false;

    getDataById(sectionId, (data) => {
        const format = data.format;
        const entryData =  Array.isArray(data.entries) ? data.entries : [];
        lock.remove();
        entryData.forEach((entry) => { // Restore Entries
            restoreEntry(sectionContent, addEntryBtn, entry.name, entry.text, sectionData)
        });
        const container = document.querySelector(".section-container");
        if (container.dataset.blackout == "true") { 
            const getEntries = format === "single-line" ? ".entry" : ".entry-long";
            const allEntry = section.querySelectorAll(`${getEntries}`);
            blackoutEntry(allEntry); 
        }
    });
}

function relockSection(section, sectionData) {
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
                unlockSection(section, section.id, sectionData);
            } else {
                enterBtn.classList.add("shake");
                setTimeout(() => {  enterBtn.classList.remove("shake"); }, 300);    
            }
        });
    });
    section.querySelector(".lock-password-input").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission or unwanted behavior
            enterBtn.click(); // Simulate a click on the "Enter" button
        }
    });
    const addEntryBtn = section.querySelector(".add-entry-btn") ?? section.querySelector(".add-entry-btn-long");
    addEntryBtn.style.visibility = "hidden";
    addEntryBtn.style.display = "none"; 
    section.dataset.status = true; 
}

// Export functions for use in storage.js & popup.js
export { getDataById, getPassword, checkPassword, deletePassword, unlockSection, relockSection };