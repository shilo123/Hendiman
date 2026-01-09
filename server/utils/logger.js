const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const serverLogPath = path.join(logsDir, "server.log");
const clientLogPath = path.join(logsDir, "client.log");

// Helper function to format timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Helper function to format log message
function formatLogMessage(level, ...args) {
  const timestamp = getTimestamp();
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
  return `[${timestamp}] [${level}] ${message}\n`;
}

// Write to log file
function writeToFile(filePath, message) {
  try {
    fs.appendFileSync(filePath, message, "utf8");
  } catch (error) {
    // Fallback to console if file write fails
  }
}

// Server logger
const serverLogger = {
  log: (...args) => {
    const message = formatLogMessage("LOG", ...args);
    writeToFile(serverLogPath, message);
  },
  error: (...args) => {
    const message = formatLogMessage("ERROR", ...args);
    writeToFile(serverLogPath, message);
  },
  warn: (...args) => {
    const message = formatLogMessage("WARN", ...args);
    writeToFile(serverLogPath, message);
  },
};

// Client logger (writes to client.log)
const clientLogger = {
  log: (...args) => {
    const message = formatLogMessage("LOG", ...args);
    writeToFile(clientLogPath, message);
  },
  error: (...args) => {
    const message = formatLogMessage("ERROR", ...args);
    writeToFile(clientLogPath, message);
  },
  warn: (...args) => {
    const message = formatLogMessage("WARN", ...args);
    writeToFile(clientLogPath, message);
  },
};

module.exports = {
  serverLogger,
  clientLogger,
  serverLogPath,
  clientLogPath,
};
