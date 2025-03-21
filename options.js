// options.js
let baseUrl = "http://44.211.167.171";

document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is logged in
    const authToken = localStorage.getItem('token'); // Or another method of checking login
    console.log(authToken, "checking authToken")
    window.location.href = baseUrl+"/dashboard";
  });
  