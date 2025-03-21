let baseUrl = "http://44.211.167.171/";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request, sender, sendResponse)
    if (request.type === 'log_activity') {

        var currentTime = new Date().getTime();
        var currentDate = new Date();
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            // Send the tab information back to the content script
            const tabInfo = tabs[0] ? tabs[0].url : 'No active tab found';
            
            const logData = {
                action: request.action,
                data: request.data,
                timestamp: new Date().toISOString(),
                currentTime: currentTime,
                currentDate: currentDate,
                site: getBaseDomain(tabInfo),
            };

            // localStorage.setItem(JSON.stringify(logData));
            
            const token = localStorage.getItem('token'); console.log(tabInfo, "_____________token info")
            // if (!token) return null;
    
            // Send the log data to your local server (LAN)
            fetch(`${baseUrl}/log`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(logData),
            })
            .then(response => response.json())
            .then(data => { console.log('Activity logged successfully:', data) 
                // Check local storage logs and send to server again.
                var logs = localStorage.getItem("logs");
                console.log(logs, "__local logs data")
                if(JSON.parse(logs) && JSON.parse(logs).length > 0)
                {
                    JSON.parse(logs).map((log, i) => {
                        fetch(`${baseUrl}/log`, {
                            method: 'POST',
                            headers: {
                            'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(logData),
                        }).then(response => response.json()).then(data => { console.log('success', data)  })
                    })
                    localStorage.removeItem("logs");
                }
            })
            .catch(error => {
                 console.error('Error logging activity:', error)  
                 // when offline network storing on local storage 
                 var logs = localStorage.getItem("logs");
                 logs = JSON.parse(logs);
                 if(!logs) { 
                    logs = [];
                 }
                 logs.push(logData);
                 
                 localStorage.setItem("logs", JSON.stringify(logs))
            });
        });
        
    }
  });

  // Function to capture a screenshot every minute
  function captureScreenshot() {
    // Query the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("Error querying tabs:", chrome.runtime.lastError);
        return;
      }
  
      if (tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }
  
      const tab = tabs[0];
      const tabId = tab.id;
      const windowId = tab.windowId;  // Window ID of the active tab
  
      if (!tabId || !windowId) {
        console.error("Invalid tab or window ID.");
        return;
      }
  
      console.log("Tab ID:", tabId);
      console.log("Window ID:", windowId);
  
      // Re-query to ensure the tab is still valid
      chrome.tabs.get(tabId, (updatedTab) => {
        if (chrome.runtime.lastError) {
          console.error("Error retrieving the tab:", chrome.runtime.lastError);
          return;
        }
  
        if (!updatedTab || updatedTab.windowId !== windowId) {
          console.error("The tab or window is no longer available.");
          return;
        }
  
        // Capture screenshot of the active tab
        chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (imageData) => {
          if (chrome.runtime.lastError) {
            console.error("Error capturing screenshot:", chrome.runtime.lastError);
            return;
          }

          var currentTime = new Date().getTime();
          var currentDate = new Date();
            // Send the tab information back to the content script
            const tabInfo = tabs[0] ? tabs[0].url : 'No active tab found';
            
            const logData = {
                data: imageData,
                timestamp: new Date().toISOString(),
                currentTime: currentTime,
                currentDate: currentDate,
                site: tabInfo,
            };
          
          fetch(`${baseUrl}/screenshots`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
            })
            .then(response => response.json())
            .then(data => console.log('Screenshot logged successfully:', data))
            .catch(error => console.error('Error logging activity:', error));

          console.log("Screenshot captured successfully:", imageData);
  
          // Example: Store or process the captured image data
          storeScreenshot(imageData);
        });
      });
    });
  }
  
  function storeScreenshot(imageData) {
    // Store the screenshot in Chrome's local storage (or send it to a server)
    chrome.storage.local.set({ screenshot: imageData }, () => {
      console.log("Screenshot saved.");
    });
  }

  function resizeImage(imageData, width, height) {
    const img = new Image();
    img.src = imageData;  // Base64 image source
  
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
  
      const resizedImage = canvas.toDataURL('image/png');  // Get the resized base64 string
      return resizedImage
    };
  }

  // Function to extract the base domain (protocol + domain) from a full URL
function getBaseDomain(url) {
    const urlObject = new URL(url);
    return urlObject.origin;  // Returns the full domain with protocol (e.g., https://www.domain.com)
}
  
const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
  
    try {
      const decoded = JSON.parse(atob(token.split('.')[1])); // Decode JWT
      return decoded;
    } catch (error) {
      return null;
    }
  };
  // Capture screenshot every 60 seconds (1 minute)
  setInterval(captureScreenshot, 60000);
  
  // Optionally, trigger the capture immediately when the extension starts
  captureScreenshot();

  chrome.action.onClicked.addListener((tab) => {
    // Send a message to the content script to check if the user is logged in
    // chrome.tabs.sendMessage(tab.id, { action: "checkLoginStatus" }, (response) => {
    //   if (response && response.isLoggedIn) {
    //     // User is logged in, navigate to dashboard
    //     chrome.tabs.update(tab.id, { url: "https://localhost:3000/dashboard" });
    //   } else {
    //     // User is not logged in, navigate to register
    //     chrome.tabs.update(tab.id, { url: "https://localhost:3000/register" });
    //   }
    // });

    // chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    chrome.runtime.openOptionsPage();

  });
  