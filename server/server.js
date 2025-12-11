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
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
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
  // console.log(`Port ${PORT} saved to port.json`);

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Session configuration for Passport
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "hendiman-secret-key",
      resave: false,
      saveUninitialized: false,
    })
  );

  // MongoDB connection
  let collection;
  let db;
  try {
    const url =
      "mongodb+srv://hazshilo:1234@cluster0.0yzklos.mongodb.net/?tlsAllowInvalidCertificates=true";
    const connection = await MongoClient.connect(url);
    db = connection.db("Hendiman");
    collection = db.collection("Users-Hendiman");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }

  // Passport serialization (must be defined before strategies)
  passport.serializeUser((user, done) => {
    // Convert ObjectId to string if needed
    const id = user._id ? user._id.toString() : user.id || user.googleId;
    done(null, id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      if (!collection) {
        return done(new Error("Database not connected"), null);
      }
      let user;
      // Try to find by _id (ObjectId) or by googleId
      try {
        user = await collection.findOne({ _id: new ObjectId(id) });
      } catch (e) {
        // If ObjectId fails, try to find by googleId or other fields
        user = await collection.findOne({
          $or: [{ _id: id }, { googleId: id }, { id: id }],
        });
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID ||
    "884734090066-hk7m0kp8j4393s86f72hog2lbv5piq92.apps.googleusercontent.com";
  const GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET || "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";

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `http://localhost:${PORT}/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            if (!collection) {
              return done(new Error("Database not connected"), null);
            }
            // Check if user exists
            let user = await collection.findOne({ googleId: profile.id });

            if (!user) {
              // Create new user
              user = {
                googleId: profile.id,
                username:
                  profile.displayName ||
                  (profile.emails && profile.emails[0]
                    ? profile.emails[0].value
                    : "user"),
                email:
                  profile.emails && profile.emails[0]
                    ? profile.emails[0].value
                    : "",
                name: profile.displayName || "",
                picture:
                  profile.photos && profile.photos[0]
                    ? profile.photos[0].value
                    : "",
                createdAt: new Date(),
              };
              const result = await collection.insertOne(user);
              user._id = result.insertedId;
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  } else {
    console.warn(
      "Google OAuth credentials not provided. Google login will not work."
    );
  }

  // Initialize Passport (after strategies are defined)
  app.use(passport.initialize());
  app.use(passport.session());

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
    try {
      if (!collection) {
        return res.json({ message: "Database not connected" });
      }
      const { username, password } = req.body;
      const user = await collection.findOne({ username });
      if (!user) {
        return res.json({ message: "NoUser" });
      } else if (user.password !== password) {
        return res.json({ message: "NoPass" });
      } else {
        return res.json({ message: "Success" });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.json({ message: "Error", error: error.message });
    }
  });
  // Google OAuth Routes
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication - redirect to frontend with token or user data
      // You can send the user data as query params or use a token
      const userData = encodeURIComponent(JSON.stringify(req.user));
      res.redirect(
        `http://localhost:8080/login?googleAuth=success&user=${userData}`
      );
    }
  );

  // Logout route
  app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.json({ success: false, message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
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
