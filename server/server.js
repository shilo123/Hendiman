const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const bodyParser = require("body-parser");
const net = require("net");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const app = express();
const URL_CLIENT = "http://localhost:8080";

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
  const URL_SERVER = `http://localhost:${PORT}`;

  // Save port to file for client
  fs.writeFileSync(
    path.join(__dirname, "..", "src", "Url", "port.json"),
    JSON.stringify({ port: PORT })
  );

  // Middleware
  app.use(
    cors({
      origin: URL_CLIENT,
      credentials: true, // Allow cookies to be sent
    })
  );
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Session configuration for Passport
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "hendiman-secret-key",
      resave: true,
      saveUninitialized: true,
      name: "hendiman.session", // Custom session name
      cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax", // Allow cookies to be sent in cross-site requests
      },
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
  } catch (error) {
    // MongoDB connection error
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
          callbackURL: `${URL_SERVER}/auth/google/callback`,
          passReqToCallback: true, // Pass request to callback to access session
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            // Don't save to database here - only return user data
            // The user will be registered when they click "Register" button
            // This prevents duplicate registrations with incomplete data
            const user = {
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
            };

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  // Initialize Passport (after strategies are defined)
  app.use(passport.initialize());
  app.use(passport.session());

  // AWS S3 configuration
  const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIASWXFMBWARBBNHUMG",
      secretAccessKey:
        process.env.AWS_SECRET_ACCESS_KEY ||
        "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",
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
      console.log("req.body", req.body);

      const { username, password } = req.body;
      const user = await collection.findOne({ username });
      console.log("user", user);

      if (!user) {
        return res.json({ message: "NoUser" });
      } else if (user.password !== password) {
        return res.json({ message: "NoPass" });
      } else {
        return res.json({ message: "Success" });
      }
    } catch (error) {
      return res.json({ message: "Error", error: error.message });
    }
  });

  // Upload image route
  app.post("/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Generate unique filename
      const fileExtension = req.file.originalname
        ? req.file.originalname.split(".").pop()
        : "jpg";
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${
        fileExtension || "jpg"
      }`;

      // Upload to S3
      const bucketName = process.env.AWS_BUCKET_NAME || "hendiman123";

      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "image/jpeg",
        // ACL removed - make sure bucket has public read policy if needed
      };

      try {
        await s3.send(new PutObjectCommand(uploadParams));
      } catch (s3Error) {
        // Handle AccessDenied specifically
        const isAccessDenied =
          s3Error.name === "AccessDenied" || s3Error.Code === "AccessDenied";
        const statusCode = isAccessDenied ? 403 : 500;

        // Always return error response - never crash
        const headersAlreadySent = res.headersSent;

        if (!headersAlreadySent) {
          try {
            const errorResponse = {
              error: isAccessDenied ? "Access Denied" : "S3 Upload Failed",
              message: isAccessDenied
                ? "No permission to upload to S3. Please check AWS IAM permissions for user 'shilo'."
                : s3Error.message || "Unknown S3 error",
              details: s3Error.message,
              code: s3Error.Code || s3Error.name,
            };

            res.status(statusCode);
            res.json(errorResponse);
            return;
          } catch (responseError) {
            return;
          }
        } else {
          return;
        }
      }

      // Return the image URL (S3 URL)
      const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

      if (!res.headersSent) {
        res.json({ imageUrl });
        return;
      }
    } catch (error) {
      // Always return a response, even if headers were sent
      if (!res.headersSent) {
        try {
          res.status(500).json({
            error: "Failed to upload image",
            details: error.message,
          });
          return;
        } catch (sendError) {
          return;
        }
      }
    }
  });

  // Upload logo route (to hendiman-pic-logo bucket)
  app.post("/upload-logo", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No logo file provided" });
      }

      // Generate unique filename
      const fileExtension = req.file.originalname
        ? req.file.originalname.split(".").pop()
        : "jpg";
      const fileName = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}.${
        fileExtension || "jpg"
      }`;

      // Upload to S3 - use hendiman-pic-logo bucket
      const bucketName = "hendiman-pic-logo";

      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || "image/jpeg",
      };

      try {
        await s3.send(new PutObjectCommand(uploadParams));
      } catch (s3Error) {
        // Handle AccessDenied specifically
        const isAccessDenied =
          s3Error.name === "AccessDenied" || s3Error.Code === "AccessDenied";
        const statusCode = isAccessDenied ? 403 : 500;

        // Always return error response - never crash
        const headersAlreadySent = res.headersSent;

        if (!headersAlreadySent) {
          try {
            const errorResponse = {
              error: isAccessDenied ? "Access Denied" : "S3 Upload Failed",
              message: isAccessDenied
                ? "No permission to upload to S3. Please check AWS IAM permissions for user 'shilo'."
                : s3Error.message || "Unknown S3 error",
              details: s3Error.message,
              code: s3Error.Code || s3Error.name,
            };

            res.status(statusCode);
            res.json(errorResponse);
            return;
          } catch (responseError) {
            return;
          }
        } else {
          return;
        }
      }

      // Return the logo URL (S3 URL)
      const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

      if (!res.headersSent) {
        res.json({ imageUrl });
        return;
      }
    } catch (error) {
      // Always return a response, even if headers were sent
      if (!res.headersSent) {
        try {
          res.status(500).json({
            error: "Failed to upload logo",
            details: error.message,
          });
          return;
        } catch (sendError) {
          return;
        }
      }
    }
  });

  // Google OAuth Routes
  app.get("/auth/google", (req, res, next) => {
    // Get the source (register/login) and tab (client/handyman) from query parameters
    const source = req.query.source || "login";
    const tab = req.query.tab || "client"; // Get tab parameter

    // Save source and tab to session
    req.session.oauthSource = source;
    req.session.oauthTab = tab;

    // Force save session synchronously before redirect
    req.session.save((err) => {
      // Now authenticate with Google, pass source as state parameter
      passport.authenticate("google", {
        scope: ["profile", "email"],
        state: source, // Pass source through OAuth state parameter
      })(req, res, next);
    });
  });

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Get the source from state parameter OR session
      const stateSource = req.query.state;
      const sessionSource = req.session ? req.session.oauthSource : null;
      const source = stateSource || sessionSource || "login";

      // Get the tab from session (for register page)
      const tab = req.session ? req.session.oauthTab : "client";

      // Clear the source and tab from session
      if (req.session) {
        delete req.session.oauthSource;
        delete req.session.oauthTab;
        req.session.save();
      }

      // Successful authentication - redirect to frontend with token or user data
      const userData = encodeURIComponent(JSON.stringify(req.user));
      let redirectUrl;

      if (source === "register") {
        redirectUrl = `${URL_CLIENT}/register?googleAuth=success&user=${userData}&tab=${tab}`;
      } else {
        redirectUrl = `${URL_CLIENT}/login?googleAuth=success&user=${userData}`;
      }

      res.redirect(redirectUrl);
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

  app.post("/register-handyman", async (req, res) => {
    try {
      if (!collection) {
        return res.status(500).json(false);
      }

      let {
        firstName,
        lastName,
        email,
        password,
        phone,
        address,
        howDidYouHear,
        specialties,
        imageUrl,
        logoUrl,
        isHandyman,
      } = req.body;

      // בדיקה אם המשתמש כבר קיים (לפי email או googleId)
      // אם password הוא googleId, נחפש לפי googleId
      let existingUser = null;

      if (password && password.length > 20) {
        // זה כנראה googleId (ארוך יותר מ-20 תווים)
        existingUser = await collection.findOne({
          $or: [
            { email: email },
            { password: password },
            { googleId: password },
          ],
        });
      } else {
        existingUser = await collection.findOne({
          $or: [{ email: email }, { password: password }],
        });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "משתמש כבר קיים במערכת",
        });
      }

      const fullName = `${firstName || ""}  ${lastName || ""}`.trim();

      // Build user object based on type
      const userData = {
        username: fullName,
        email: email || "",
        password: password || "",
        phone: phone || "",
        address: address || "",
        howDidYouHear: howDidYouHear || "",
        imageUrl: imageUrl || "",
        isHandyman: isHandyman === true || isHandyman === "true",
        createdAt: new Date(),
      };

      // אם password הוא googleId (ארוך יותר מ-20 תווים), שמור גם כ-googleId
      if (password && password.length > 20) {
        userData.googleId = password;
      }

      // Add handyman-specific fields only if isHandyman is true
      if (userData.isHandyman) {
        // אם specialties הוא array, המר ל-string מופרד בפסיקים
        if (Array.isArray(specialties)) {
          userData.specialties = specialties.join(", ");
        } else {
          userData.specialties = specialties || "";
        }
        userData.logoUrl = logoUrl || "";
      }

      const result = await collection.insertOne(userData);

      if (result.insertedId) {
        return res.json(true);
      } else {
        return res.status(500).json(false);
      }
    } catch (error) {
      return res.status(500).json(false);
    }
  });

  // Global error handler for unhandled errors
  app.use((err, req, res, next) => {
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        details: err.message,
      });
    }
  });

  // Start server
  app
    .listen(PORT, () => {
      // Server is running on port ${PORT}
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        process.exit(1);
      } else {
        process.exit(1);
      }
    });
})();

module.exports = app;
