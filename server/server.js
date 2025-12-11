const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const bodyParser = require("body-parser");
const net = require("net");

const app = express();

// Function to find available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        // Try next port
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Start server with available port
(async () => {
  const PORT = process.env.PORT || (await findAvailablePort(3003));

  // Save port to file for client
  fs.writeFileSync(
    path.join(__dirname, "..", "src", "Url", "port.json"),
    JSON.stringify({ port: PORT })
  );
  console.log(`Port ${PORT} saved to port.json`);

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // MongoDB connection
  let collection;
  (async () => {
    const url =
      "mongodb+srv://hazshilo:1234@cluster0.0yzklos.mongodb.net/?tlsAllowInvalidCertificates=true";
    const connection = await MongoClient.connect(url);
    const db = connection.db("Hendiman");
    collection = db.collection("Users-Hendiman");
  })();

  // AWS S3 configuration
  const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Multer configuration for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

  // Routes
  app.get("/", (req, res) => {
    res.json({ message: "Hendiman Server API" });
  });

  app.post("/login-user", async (req, res) => {
    const { username, password } = req.body;
    const user = await collection.findOne({ username });
    if (!user) {
      return res.json({ message: "NoUser" });
    } else if (user.password !== password) {
      return res.json({ message: "NoPass" });
    } else {
      return res.json({ message: "Success" });
    }
  });

  // Start server
  app
    .listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Please use a different port.`
        );
        process.exit(1);
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });
})();

module.exports = app;
