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
    URL = `http://localhost:${port}`;
  } catch (e) {
    // Fallback if port.json doesn't exist
    URL = "http://localhost:3003";
  }
}

export { URL };

// API Endpoints
