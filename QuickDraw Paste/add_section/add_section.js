document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("toggle-checkbox").addEventListener("change", function() {
        const label = document.querySelector(".format");
        if (this.checked) {
            label.textContent = "Single-Line Format"; // If checked, change the label text to "Single Line"
        } 
        else {
            label.textContent = "Multi-Line Format"; // If not checked, change the label text to "Multiline"
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const lockCheckbox = document.getElementById("inpLock");
    const passwordInput = document.getElementById("password");
    const toggleButton = document.querySelector('.toggle-visibility-btn');

    lockCheckbox.addEventListener("change", function () {
        passwordInput.disabled = !this.checked;
        toggleButton.disabled = !this.checked;
        passwordInput.value = "";
        passwordInput.style.backgroundColor = this.checked ? "white" : "#e0e0e0";
    });
});


document.addEventListener("DOMContentLoaded", function() {
    // Get the password input and toggle button
    const passwordInput = document.querySelector('.lock-password-input');
    const toggleButton = document.querySelector('.toggle-visibility-btn');
    const eyeIcon = document.querySelector('.eye-icon');

    // Add event listener to toggle visibility
    toggleButton.addEventListener('click', () => {
        // Toggle the input type between password and text
        if (passwordInput.type === 'password') {
            eyeIcon.src = "../assets/hidden.png";
            passwordInput.type = 'text';
        } 
        else {
            eyeIcon.src = "../assets/eye.png";
            passwordInput.type = 'password';
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const cancelButton = document.querySelector('.cancel-btn');
    cancelButton .addEventListener('click', function () {
        window.close();
    });
});

document.querySelector('.save-btn').addEventListener("click", function () {
    const sectionNameInput = document.getElementById("name-section");
    const lineCheckbox = document.getElementById("toggle-checkbox") // Single Line = True, MultiLine = False
    const lockCheckbox = document.getElementById("inpLock");
    const passwordInput = document.querySelector(".lock-password-input");

    // Get values
    const oneLine = lineCheckbox.checked;
    const isLocked = lockCheckbox.checked;

    if (!sectionNameInput.value.trim() || (isLocked && !passwordInput.value.trim())) {
        this.classList.add("shake");
        setTimeout(() => {
            this.classList.remove("shake");
        }, 300);
        return;
    }

    const format = oneLine ? "single-line" : "multi-line";
    const password = isLocked ? passwordInput.value : null

    const sectionData = {
        sectionName: sectionNameInput.value,
        format: format,
        isLocked: isLocked,
        password: password
    };
    // Send DATA to popup.js
    chrome.runtime.sendMessage({ action: "addSection", data: sectionData }, response => {
        //console.log("Message sent from add_section.js. Response:", response);
        window.close();
    })
    //window.close();
    return;
});