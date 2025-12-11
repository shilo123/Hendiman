// Base URL for API
// Read port from port.json file (updated by server)
import portData from "./port.json";

const port = portData.port || 3003;
export const URL = `http://localhost:${port}`;

// API Endpoints
