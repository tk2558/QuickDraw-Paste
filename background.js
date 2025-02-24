chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['sections'], (result) => {
      if (!result.sections) {
        chrome.storage.local.set({ sections: [] });
      }
    });
});

// Listen for the new section data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //console.log("Message received in background.js:", message);
  if (message.action === "addSection") {
      //console.log("Section data stored:", message.data);
      sendResponse({ status: "Received" });

      chrome.runtime.sendMessage({ action: 'forwardData', data: message.data }, response => {
        //console.log("Data Forwarded to pop.js -> Response: ", response);
    });
  }
  if (message.action === "saveCode") {
    const { id, password, entries } = message.data;
    console.log("Saved Code Stored:", message.data);
    sendResponse({ status: "Received Code" });
    chrome.storage.local.set({ [id]: {password, entries}  });
  }
});
  