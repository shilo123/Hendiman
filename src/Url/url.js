// Base URL for API
// Check if running in Capacitor app (Android/iOS)
import { Capacitor } from "@capacitor/core";

// Function to detect if running inside Capacitor native app
function isRunningInCapacitor() {
  // Method 1: Official Capacitor check
  try {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
  } catch (e) {
    // Capacitor not available
  }
  
  // Method 2: Check user agent for Android/iOS WebView
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    // Android WebView detection
    if (/Android/.test(ua) && /wv/.test(ua)) return true;
    // iOS WebView (not Safari)
    if (/(iPhone|iPod|iPad)/.test(ua) && !/Safari/.test(ua)) return true;
  }
  
  // Method 3: Check for Capacitor-specific URL scheme
  // With androidScheme: "https", app runs on https://localhost
  if (typeof window !== 'undefined' && window.location) {
    const loc = window.location;
    // Capacitor apps run on localhost with https scheme (or capacitor://)
    if (loc.protocol === 'https:' && loc.hostname === 'localhost') {
      return true;
    }
    if (loc.protocol === 'capacitor:' || loc.protocol === 'ionic:') {
      return true;
    }
  }
  
  return false;
}

// Determine the API URL
let URL;

if (isRunningInCapacitor()) {
  // In Capacitor app (Android/iOS), always use Heroku server
  URL = "https://handiman-98cc6d1f0a79.herokuapp.com";
} else if (process.env.NODE_ENV === "production") {
  // In production web, use the same origin (server serves client)
  URL = "";
} else {
  // In development, use localhost
  try {
    const portData = require("./port.json");
    const port = portData.port || 3003;
    URL = `http://localhost:${port}`;
  } catch (e) {
    URL = "http://localhost:3003";
  }
}

// Debug logging (visible in Android debug mode)
console.log("[Handiman URL] API:", URL, "| Native:", isRunningInCapacitor(), "| Location:", typeof window !== 'undefined' ? window.location?.href : 'N/A');

export { URL, isRunningInCapacitor };

// API Endpoints
