// Base URL for API
// In production, use the same origin (server serves client)
// In development, read port from port.json file (updated by server)
let URL;
if (process.env.NODE_ENV === "production") {
  // In production, API is on the same origin
  URL = "";
} else {
  const hostname = window.location.hostname;
  const isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);

  // If accessing via IP address (mobile), use remote server (Heroku)
  // because local server might not be accessible from mobile device
  if (isIPAddress) {
    URL = "https://handiman-98cc6d1f0a79.herokuapp.com";
  } else if (hostname === "localhost" || hostname === "127.0.0.1") {
    // In development on desktop (localhost), try to read port from port.json
    // Use async approach to avoid require issues
    try {
      // Try to use require (works in webpack/bundled environment)
      const portData = require("./port.json");
      const port = portData.port || 3003;
      URL = `http://localhost:${port}`;
    } catch (e) {
      // Fallback if port.json doesn't exist - use remote server (Heroku)
      URL = "https://handiman-98cc6d1f0a79.herokuapp.com";
    }
  } else {
    // For any other hostname, use remote server
    URL = "https://handiman-98cc6d1f0a79.herokuapp.com";
  }
}

// Log the URL for debugging (only in development)
if (process.env.NODE_ENV !== "production") {
  console.log("API URL configured:", URL);
  console.log("Hostname:", window.location.hostname);
}

export { URL };

// API Endpoints
