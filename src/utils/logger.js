import axios from "axios";
import { URL } from "@/Url/url";

// Client logger that sends logs to server
const clientLogger = {
  log: (...args) => {
    // Send to server
    sendLogToServer("log", ...args);
  },
  error: (...args) => {
    // Send to server
    sendLogToServer("error", ...args);
  },
  warn: (...args) => {
    // Send to server
    sendLogToServer("warn", ...args);
  },
};

// Helper function to send log to server
function sendLogToServer(level, ...args) {
  try {
    // Format the message
    const message = args
      .map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");

    // Extract metadata if last argument is an object
    let metadata = {};
    if (
      args.length > 0 &&
      typeof args[args.length - 1] === "object" &&
      args[args.length - 1] !== null &&
      !Array.isArray(args[args.length - 1])
    ) {
      metadata = args[args.length - 1];
    }

    // Send to server (fire and forget - don't wait for response)
    axios
      .post(`${URL}/api/logs/client`, {
        level,
        message,
        ...metadata,
      })
      .catch((error) => {
        // Silently fail - we don't want logging errors to break the app
      });
  } catch (error) {
    // Silently fail - we don't want logging errors to break the app
  }
}

export default clientLogger;
