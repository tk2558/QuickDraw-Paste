async function generateKey() {
    return await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function exportKey(key) {
    const exported = await crypto.subtle.exportKey("raw", key);
    return Array.from(new Uint8Array(exported)); // Convert to array for storage
}

async function encryptPassword(password, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
    const encryptedData = await crypto.subtle.encrypt({
            name: "AES-GCM",
            iv: iv
        },
        key,
        encoder.encode(password)
    );
    return {
        iv: Array.from(iv),  // Convert IV to an array for storage
        encrypted: Array.from(new Uint8Array(encryptedData)) // Convert to array
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const toggleFormat = document.getElementById("toggle-checkbox");
    toggleFormat.addEventListener("change", function() {
        const label = document.querySelector(".format");
        if (toggleFormat.checked) {
            label.textContent = "Single-Line Format"; // If checked, change the label text to "Single Line"
        } 
        else {
            label.textContent = "Multi-Line Format"; // If not checked, change the label text to "Multiline"
        }
    });

    const lockCheckbox = document.getElementById("inpLock");
    const passwordInput = document.getElementById("password");
    const toggleButton = document.querySelector('.toggle-visibility-btn');
    const eyeIcon = document.querySelector('.eye-icon');

    lockCheckbox.addEventListener("change", function () {
        passwordInput.disabled = !this.checked;
        toggleButton.disabled = !this.checked;
        passwordInput.value = "";
        passwordInput.style.backgroundColor = this.checked ? "white" : "#e0e0e0";
    });

    toggleButton.addEventListener('click', () => { // Toggle the input type between password and text
        if (passwordInput.type === 'password') {
            eyeIcon.src = "../assets/hidden.png";
            passwordInput.type = 'text';
        } 
        else {
            eyeIcon.src = "../assets/eye.png";
            passwordInput.type = 'password';
        }
    });

    const cancelButton = document.querySelector('.cancel-btn');
    cancelButton.addEventListener('click', function () {
        window.close();
    });

    const addButton = document.querySelector('.save-btn');
    addButton.addEventListener("click", async () => {
        const sectionNameInput = document.getElementById("name-section");
        const lineCheckbox = document.getElementById("toggle-checkbox") // Single Line = True, MultiLine = False
        const lockCheckbox = document.getElementById("inpLock");
        const passwordInput = document.querySelector(".lock-password-input");
        const oneLine = lineCheckbox.checked;
        const isLocked = lockCheckbox.checked;
    
        if (!sectionNameInput.value.trim() || (isLocked && !passwordInput.value.trim())) {
            addButton .classList.add("shake");
            setTimeout(() => {
                addButton.classList.remove("shake");
            }, 300);
            return;
        }
    
        const format = oneLine ? "single-line" : "multi-line";
        const password = isLocked ? passwordInput.value : null
        const sectionId = `section-${Date.now()}`; // Generate unique ID 
        
        const sectionData = {
            id: sectionId,
            sectionName: sectionNameInput.value,
            format: format,
            isLocked: isLocked,
        };
    
        if (isLocked) {
            const key = await generateKey();
            const exportedKey = await exportKey(key);
            localStorage.setItem(sectionId, JSON.stringify(exportedKey));
    
            const encryption = await encryptPassword(password, key);
            const security = {
                id: sectionId,
                password: encryption,
                entries: [],
            }
            chrome.runtime.sendMessage({ action: "saveCode", data: security }, response => {
                //console.log("Message sent from add_section.js. Response:", response);
            })
        }
        chrome.runtime.sendMessage({ action: "addSection", data: sectionData }, response => { // Send DATA
            //console.log("Message sent from add_section.js. Response:", response);
            window.close();
        })
        return;
    });
});
