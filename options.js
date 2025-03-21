// options.js
let baseUrl = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is logged in
    const authToken = localStorage.getItem('token'); // Or another method of checking login
    console.log(authToken, "checking authToken")
    window.location.href = baseUrl+"/dashboard";
  });
  