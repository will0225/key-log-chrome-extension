document.addEventListener('submit', function(event) {
  const formData = new FormData(event.target);
  let data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  // Send form data to the background script or server
  // chrome.runtime.sendMessage({
  //   type: 'log_activity',
  //   action: 'form_submission',
  //   data: data
  // });
});

document.addEventListener('click', function(event) {
  // Log clicks on specific elements
  const element = event.target;
  // if (element.tagName === 'BUTTON' || element.tagName === 'A') {
  //   chrome.runtime.sendMessage({
  //     type: 'log_activity',
  //     action: 'click',
  //     element: element.outerHTML
  //   });
  // }
});

function getCurrentTabUrl(callback) {  
  var queryInfo = {
    active: true, 
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0]; 
    var url = tab.url;
    callback(url);
  });
}

// document.addEventListener('keydown', (event) => {
//   // Capture the keystroke and send it to the background script or server
//   // console.log(event.key);  // Example of logging keystroke
  
//   chrome.runtime.sendMessage({
//     type: 'log_activity',
//     action: 'form_submission',
//     data: event.key
//   },function(response) {
//     console.log('Background response:', response);
//   });

// });


// Function to capture key presses
function captureKeystrokes(event) {
  const key = event.key; // The key that was pressed

  // For demonstration, log the key. In a real case, you can send this to your background script or server.
  console.log(`Key pressed: ${key}`);
  
  // You can send the captured keystroke data to the background script or store it
  chrome.runtime.sendMessage({
      type: 'logKeystroke',
      key: key
  });
}

// Function to detect when user finishes typing and leaves the input field
function onBlur(event) {
  const inputValue = event.target.value;
  console.log(`User left the field, final value: ${inputValue}`);
  if(!inputValue){ return }
  // Send the final value of the input/textarea when the user leaves
  chrome.runtime.sendMessage({
    type: 'log_activity',
    action: 'form_submission',
    data: inputValue
  },function(response) {
    console.log('Background response:', response);
  });
}

// Apply the event listeners to input and textarea fields
function addEventListeners() {
  const inputs = document.querySelectorAll('input, textarea');
  
  inputs.forEach(inputElement => {
      // Listen for keydown to capture each key press
      // inputElement.addEventListener('keydown', captureKeystrokes);

      // // Listen for input changes (useful for real-time typing detection)
      // inputElement.addEventListener('input', captureKeystrokes);

      // Detect when the user leaves the input field (blur event)
      inputElement.addEventListener('blur', onBlur);
  });
}

// Initialize the listeners when the document is ready
addEventListeners();


// Check if the user is logged in by checking a value in localStorage
function checkLoginStatus() {
  // Example: Check if an auth_token exists in localStorage
  const authToken = localStorage.getItem('token');
  return authToken !== null;
}

// Send a message to the background script with the login status
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkLoginStatus") {
    const isLoggedIn = checkLoginStatus();
    sendResponse({ isLoggedIn });
  }
});


// Function to generate a short and unique device ID
function generateDeviceId() {
  // Collecting some device-related information
  const userAgent = navigator.userAgent;   // User-Agent string (Browser & OS)
  const platform = navigator.platform;     // Platform (e.g., Win32, MacIntel)
  const language = navigator.language;     // Language preference of the browser
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0; // Touch device detection

  // Create a unique string of device info
  const deviceInfo = userAgent + platform + language + (touch ? 'touch' : 'no-touch');

  // Generate a hash from the device info
  return sha256(deviceInfo).then(hash => {
    // Shorten the hash (you can adjust the length as needed)
    const shortenedHash = hash.substring(0, 10); // Use only the first 10 characters

    // Optionally encode the hash in Base62 for a short alphanumeric ID
    const base62Id = toBase62(shortenedHash);
    return base62Id;
  });
}

// SHA-256 hashing function
function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256', buffer).then(hash => {
    let hexArray = Array.from(new Uint8Array(hash));
    return hexArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  });
}

// Base62 encoding function to shorten the hash to letters and numbers
function toBase62(str) {
  const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let decimalValue = parseInt(str, 16);  // Convert hex string to a decimal number

  while (decimalValue > 0) {
    result = base62Chars[decimalValue % 62] + result;
    decimalValue = Math.floor(decimalValue / 62);
  }

  return result;
}

// Generate and log the short unique device ID
generateDeviceId().then(deviceId => {
  console.log('Short Unique Device ID:', deviceId);
  // You can store this device ID in chrome.storage or localStorage for persistence
  chrome.storage.local.set({ deviceId: deviceId });
});

// chrome.runtime.onInstalled.addListener(() => {
//   // Request public IP from ipify API
//  // Generate and log the short unique device ID
//   generateDeviceId().then(deviceId => {
//     console.log('Short Unique Device ID:', deviceId);
//     // You can store this device ID in chrome.storage or localStorage for persistence
//     chrome.storage.local.set({ deviceId: deviceId });
//   });
// });