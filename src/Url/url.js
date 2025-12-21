// Base URL for API
// In production, use the same origin (server serves client)
// In development, read port from port.json file (updated by server)
let URL;
if (process.env.NODE_ENV === "production") {
  // In production, API is on the same origin
  URL = "";
} else {
  // In development, read port from port.json
  try {
    const portData = require("./port.json");
    const port = portData.port || 3003;

    // Check if we're accessing via IP address (mobile) or localhost (desktop)
    // If accessing via IP (e.g., 10.0.0.8:8080), use the same IP for the server
    const hostname = window.location.hostname;
    const isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);

    if (isIPAddress) {
      // Use the same IP address as the current page
      URL = `http://${hostname}:${port}`;
    } else {
      // Use localhost for desktop
      URL = `http://localhost:${port}`;
    }
  } catch (e) {
    // Fallback if port.json doesn't exist
    URL = "https://handiman-98cc6d1f0a79.herokuapp.com";
  }
}

export { URL };

// API Endpoints
