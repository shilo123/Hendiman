// Base URL for API
// In production, use the same origin (server serves client)
// In development, use localhost
let URL;
if (process.env.NODE_ENV === "production") {
  // In production, API is on the same origin
  URL = "";
} else {
  // In development, use localhost
  // Try to read port from port.json file (updated by server)
  try {
    const portData = require("./port.json");
    const port = portData.port || 3003;
    URL = `http://localhost:${port}`;
  } catch (e) {
    // Fallback if port.json doesn't exist - use default port
    URL = "http://localhost:3003";
  }
}

// Log the URL for debugging (only in development)
// if (process.env.NODE_ENV !== "production") {
// }

export { URL };

// API Endpoints
