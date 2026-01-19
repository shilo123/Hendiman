// Base URL for API
// Check if running in Capacitor app (Android/iOS)
import { Capacitor } from "@capacitor/core";

let URL;

// Check if running in Capacitor app
const isCapacitor = Capacitor.isNativePlatform();

if (isCapacitor) {
  // In Capacitor app (Android/iOS), use Heroku server
  URL = "https://handiman-98cc6d1f0a79.herokuapp.com";
} else if (process.env.NODE_ENV === "production") {
  // In production web, use the same origin (server serves client)
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
