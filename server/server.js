require("dotenv").config();
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
const URL_CLIENT = process.env.CLIENT_URL || "http://localhost:8080";

//מרשמלו

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
  let collectionJobs;
  let db;
  try {
    const url =
      "mongodb+srv://hazshilo:1234@cluster0.0yzklos.mongodb.net/?tlsAllowInvalidCertificates=true";
    const connection = await MongoClient.connect(url);
    db = connection.db("Hendiman");
    collection = db.collection("Users-Hendiman");
    collectionJobs = db.collection("Jobs");
  } catch (error) {
    console.error("Error inserting new hendimans:", error);
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
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    const callbackURL = `${URL_SERVER}/auth/google/callback`;

    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: callbackURL,
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
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Multer configuration for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
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
  // Handle incorrect routes like /auth/google/0/login and redirect to correct route
  app.get("/auth/google/:param1/:param2", (req, res) => {
    // Extract source from param2 if it's "login" or "register"
    const param2 = req.params.param2;
    const source =
      param2 === "login" || param2 === "register" ? param2 : "login";
    res.redirect(`/auth/google?source=${source}`);
  });

  app.get("/auth/google", (req, res, next) => {
    // Get the source (register/login) and tab (client/handyman) from query parameters
    const source = req.query.source || "login";
    const tab = req.query.tab || "client"; // Get tab parameter

    // Save source and tab to session
    if (!req.session) {
      return res.redirect(`${URL_CLIENT}/login?error=no_session`);
    }

    req.session.oauthSource = source;
    req.session.oauthTab = tab;

    // Force save session synchronously before redirect
    req.session.save((err) => {
      if (err) {
        return res.redirect(`${URL_CLIENT}/login?error=session_error`);
      }
      // Now authenticate with Google, pass source as state parameter
      passport.authenticate("google", {
        scope: ["profile", "email"],
        state: source, // Pass source through OAuth state parameter
      })(req, res, next);
    });
  });

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${URL_CLIENT}/login?error=auth_failed`,
    }),
    (req, res) => {
      try {
        // Check if user exists
        if (!req.user) {
          return res.redirect(`${URL_CLIENT}/login?error=no_user`);
        }

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
      } catch (error) {
        res.redirect(
          `${URL_CLIENT}/login?error=callback_error&message=${encodeURIComponent(
            error.message
          )}`
        );
      }
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

  // Routes
  app.get("/", (req, res) => {
    res.json({ message: "Hendiman Server API" });
  });

  app.post("/login-user", async (req, res) => {
    try {
      if (!collection) {
        return res.json({ message: "Database not connected" });
      }

      const { username, password, ifGoogleUser } = req.body;

      // Find user by username
      const user = await collection.findOne({ username });

      if (!user) {
        return res.json({ message: "NoUser" });
      }

      // If Google user, the "password" field actually contains the email
      if (ifGoogleUser) {
        // Check if the provided value matches the user's email
        if (!password || user.email !== password) {
          return res.json({ message: "NoEmail" });
        }
        // For Google users, verify they have a googleId (registered via Google)
        // The server automatically uses googleId as the password
        if (!user.googleId) {
          return res.json({ message: "NoUser" });
        }
        // Return success with the googleId as password for the client to use
        return res.json({
          message: "Success",
          password: user.googleId,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
          },
        });
      } else {
        // Regular user, check password
        if (user.password !== password) {
          return res.json({ message: "NoPass" });
        }
        return res.json({
          message: "Success",
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
          },
        });
      }
    } catch (error) {
      return res.json({ message: "Error", error: error.message });
    }
  });

  // Upload image route

  app.post("/register-handyman", async (req, res) => {
    try {
      if (!collection) {
        return res
          .status(500)
          .json({ message: "Database not connected", success: false });
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

      const fullName = `${firstName || ""} ${lastName || ""}`.trim();

      // בדיקה אם השם כבר קיים במערכת
      const existingUserByName = await collection.findOne({
        username: fullName,
      });

      if (existingUserByName) {
        return res.status(400).json({
          success: false,
          message: "השם כבר קיים במערכת",
        });
      }

      // בדיקה אם המייל כבר קיים במערכת
      const existingUserByEmail = await collection.findOne({
        email: email,
      });

      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: "המייל כבר קיים במערכת",
        });
      }

      // בדיקה אם משתמש Google כבר קיים (לפי googleId)
      if (password && password.length > 20) {
        // זה כנראה googleId (ארוך יותר מ-20 תווים)
        const existingUserByGoogleId = await collection.findOne({
          googleId: password,
        });

        if (existingUserByGoogleId) {
          return res.status(400).json({
            success: false,
            message: "משתמש Google כבר קיים במערכת",
          });
        }
      }
      // לא בודקים אם סיסמה רגילה כבר קיימת - כל אחד יכול להשתמש באותה סיסמה

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
        // ודא ש-specialties הוא מערך של אובייקטים עם name, price, typeWork
        let specialtiesArray = [];

        if (Array.isArray(specialties)) {
          // אם זה כבר מערך, נמיר לאובייקטים
          specialtiesArray = specialties
            .filter((item) => item !== null && item !== undefined)
            .map((item) => {
              // אם זה אובייקט עם name, price, typeWork (הפורמט החדש)
              if (typeof item === "object" && item.name) {
                return {
                  name: String(item.name).trim(),
                  price: item.price || null,
                  typeWork: item.typeWork || null,
                };
              }
              // אם זה אובייקט ישן עם subcategory, workType
              if (typeof item === "object" && item.subcategory) {
                return {
                  name: String(item.subcategory).trim(),
                  price: item.price || null,
                  typeWork: item.workType || item.typeWork || null,
                };
              }
              // אם זה string (תאימות לאחור)
              if (typeof item === "string") {
                return {
                  name: String(item).trim(),
                  price: null,
                  typeWork: null,
                };
              }
              return null;
            })
            .filter(
              (item) => item !== null && item.name && item.name.length > 0
            );
        } else if (specialties && typeof specialties === "string") {
          // אם זה string, ננסה לפרסר אותו
          try {
            // ננסה לפרסר כ-JSON אם זה JSON string
            const parsed = JSON.parse(specialties);
            if (Array.isArray(parsed)) {
              specialtiesArray = parsed
                .map((item) => {
                  if (typeof item === "object" && item.name) {
                    return {
                      name: String(item.name).trim(),
                      price: item.price || null,
                      typeWork: item.typeWork || null,
                    };
                  }
                  if (typeof item === "string") {
                    return {
                      name: String(item).trim(),
                      price: null,
                      typeWork: null,
                    };
                  }
                  return null;
                })
                .filter((item) => item !== null && item.name);
            } else {
              // אם זה לא JSON array, נמיר למערך עם אובייקט אחד
              specialtiesArray = [
                {
                  name: String(specialties).trim(),
                  price: null,
                  typeWork: null,
                },
              ].filter((item) => item.name.length > 0);
            }
          } catch (e) {
            // אם JSON.parse נכשל, נמיר למערך עם אובייקט אחד
            specialtiesArray = [
              {
                name: String(specialties).trim(),
                price: null,
                typeWork: null,
              },
            ].filter((item) => item.name.length > 0);
          }
        }

        // ודא שזה מערך של אובייקטים לפני השמירה!
        userData.specialties = Array.isArray(specialtiesArray)
          ? specialtiesArray
          : [];

        userData.logoUrl = logoUrl || "";
      }

      const result = await collection.insertOne(userData);

      if (result.insertedId) {
        try {
          const savedUser = await collection.findOne({
            _id: result.insertedId,
          });
          return res.json({ success: true, user: savedUser });
        } catch (findError) {
          // Return success anyway with the insertedId
          return res.json({
            success: true,
            user: {
              _id: result.insertedId,
              username: userData.username,
              email: userData.email,
            },
          });
        }
      } else {
        return res
          .status(500)
          .json({ message: "Failed to register", success: false });
      }
    } catch (error) {
      return res.status(500).json({
        message: error.message || "Error registering user",
        success: false,
        error: error.message,
      });
    }
  });

  app.get("/GetDataDeshboard/:id", async (req, res) => {
    try {
      if (!collection) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      let { id } = req.params;
      let User = await collection.findOne({ _id: new ObjectId(id) });
      let Hendimands = await collection.find({ isHandyman: true }).toArray();
      let Jobs = collectionJobs ? await collectionJobs.find({}).toArray() : [];
      let handymenCount = await collection.countDocuments({
        isHandyman: true,
      });
      let clientsCount = await collection.countDocuments({
        $or: [{ isHandyman: false }, { isHandyman: { $exists: false } }],
      });
      let totalUsersCount = await collection.countDocuments({});

      // console.log({
      //   User,
      //   Jobs,
      //   Hendimands,
      //   stats: {
      //     handymen: handymenCount,
      //     clients: clientsCount,
      //     total: totalUsersCount,
      //   },
      // });

      return res.json({
        success: true,
        User,
        Jobs,
        Hendimands,
        stats: {
          handymen: handymenCount,
          clients: clientsCount,
          total: totalUsersCount,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching dashboard data",
        error: error.message,
      });
    }
  });

  // Get handymen with pagination
  app.get("/handymen", async (req, res) => {
    try {
      if (!collection) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page - 1) * limit;

      // Get total count
      const totalCount = await collection.countDocuments({
        isHandyman: true,
      });

      // Get handymen with pagination
      const handymen = await collection
        .find({ isHandyman: true })
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.json({
        success: true,
        handymen,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching handymen",
        error: error.message,
      });
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
      console.log(`Server is running on port ${PORT}`);
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
