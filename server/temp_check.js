const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const axios = require("axios");
const bodyParser = require("body-parser");
const net = require("net");
const passport = require("passport");
const israelAddresses = require("../src/APIS/AdressFromIsrael.json");
const session = require("express-session");
const app = express();
const URL_CLIENT = process.env.CLIENT_URL || "http://localhost:8081";

// Import configurations and services
const {
  connectDatabase,
  getCollection,
  getCollectionJobs,
} = require("./config/database");
const setupPassport = require("./config/passport");
const setupAuthRoutes = require("./routes/auth");
const setupUploadRoutes = require("./routes/upload");

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

  // Middleware - CORS configuration
  // Allow multiple localhost origins for development
  const allowedOrigins = [
    URL_CLIENT,
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173", // Vite default port
    "http://localhost:3000",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          // In development, allow any localhost origin
          if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        }
      },
      credentials: true, // Allow cookies to be sent
    })
  );
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Helpers for location translation
  const normalizeStr = (str) =>
    str
      ? str
          .toString()
          .trim()
          .toLowerCase()
          .replace(/['"`´’״”“]/g, "")
          .replace(/[^a-z0-9]/g, "")
      : "";

  const isHebrew = (str) => /[\u0590-\u05FF]/.test(str || "");

  // Build map of normalized english_name -> Hebrew name
  const cityNameMap = (() => {
    const map = new Map();
    israelAddresses.forEach((city) => {
      if (
        typeof city.english_name !== "string" ||
        typeof city.name !== "string"
      )
        return;
      const norm = normalizeStr(city.english_name);
      if (norm) map.set(norm, city.name);
    });
    return map;
  })();

  const manualMap = {
    maabarot: "מעברות",
    "ma'barot": "מעברות",
    maabaroth: "מעברות",
    "ma'agalim": "מעגלים",
    maagalim: "מעגלים",
    maaglim: "מעגלים",
  };

  // Levenshtein distance (capped) for fuzzy match
  function levenshtein(a, b, maxDist = 2) {
    if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
    const prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      let prevDiag = prev[0];
      prev[0] = i;
      let rowMin = prev[0];
      for (let j = 1; j <= b.length; j++) {
        const temp = prev[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
        prevDiag = temp;
        rowMin = Math.min(rowMin, prev[j]);
      }
      if (rowMin > maxDist) return maxDist + 1;
    }
    return prev[b.length];
  }

  function mapEnglishToHebrew(candidate) {
    if (!candidate) return "";
    if (isHebrew(candidate)) return candidate;

    // candidates: full, before comma, before " israel"
    const beforeComma = candidate.split(",")[0];
    const beforeIsrael = candidate
      .toLowerCase()
      .split(" israel")[0]
      .split(" ישראל")[0];
    const words = candidate.split(/\s+/).filter(Boolean);
    const firstWord = words[0] || "";
    const firstTwo = words.slice(0, 2).join(" ");

    const candidates = [
      candidate,
      beforeComma,
      beforeIsrael,
      firstTwo,
      firstWord,
    ].filter(Boolean);

    for (const cand of candidates) {
      const norm = normalizeStr(cand);
      if (!norm) continue;
      const direct = cityNameMap.get(norm);
      if (direct) return direct;

      // fuzzy match (Levenshtein) up to distance 2
      let bestHeb = "";
      let bestDist = 3;
      for (const [key, val] of cityNameMap.entries()) {
        const dist = levenshtein(norm, key, 2);
        if (dist < bestDist) {
          bestDist = dist;
          bestHeb = val;
          if (bestDist === 0) break;
        }
      }
      if (bestDist <= 2) return bestHeb;

      if (manualMap[norm]) return manualMap[norm];

      for (const [key, val] of cityNameMap.entries()) {
        if (key.includes(norm) || norm.includes(key)) {
          return val;
        }
      }
    }
    return "";
  }

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
  try {
    await connectDatabase();
    collection = getCollection();
    collectionJobs = getCollectionJobs();
    } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
  //

  //
  //
  // Setup Passport
  setupPassport(collection);
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup routes
  setupAuthRoutes(app, URL_CLIENT);
  setupUploadRoutes(app);

  // Routes
  app.post("/login-user", async (req, res) => {
    try {
      if (!collection) {
        return res.json({ message: "Database not connected" });
      }

      const { username, password, ifGoogleUser, googleId } = req.body;

      let user;

      // If Google user, search ONLY by googleId (most reliable identifier)
      if (ifGoogleUser) {
        if (!googleId) {
          return res.json({ message: "NoUser" });
        }
        user = await collection.findOne({ googleId: googleId });
      } else {
        // Regular user, find by username
        user = await collection.findOne({ username });
      }

      if (!user) {
        return res.json({ message: "NoUser" });
      }

      // If Google user, verify they have a googleId (registered via Google)
      if (ifGoogleUser) {
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
            isHandyman: user.isHandyman,
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
            isHandyman: user.isHandyman,
          },
        });
      }
    } catch (error) {
      return res.json({ message: "Error", error: error.message });
    }
  });
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
        addressEnglish,
        howDidYouHear,
        specialties,
        imageUrl,
        logoUrl,
        isHandyman,
        googleId, // בדוק אם יש googleId נפרד
      } = req.body;

      const fullName = `${firstName || ""} ${lastName || ""}`.trim();

      // אם אין addressEnglish, נסה למצוא אותו מהמאגר
      let finalAddressEnglish = addressEnglish;
      if (!finalAddressEnglish && address) {
        if (usingMyLocation) {
          try {
          const citiesPath = path.join(
            __dirname,
            "..",
            "src",
            "APIS",
            "AdressFromIsrael.json"
          );
          const citiesData = JSON.parse(fs.readFileSync(citiesPath, "utf8"));
          const cities = Array.isArray(citiesData) ? citiesData : [];

          const searchValue = address.trim();
          const foundCity = cities.find((city) => {
            // דלג על שורת הכותרת
            if (city.name === "שם_ישוב" || city.שם_ישוב === "שם_ישוב") {
              return false;
            }

            const cityName = (city.name || city.שם_ישוב || "").trim();
            if (!cityName) return false;

            const normalizedCityName = cityName.replace(/\s+/g, " ");
            const normalizedSearch = searchValue.replace(/\s+/g, " ");

            return (
              normalizedCityName === normalizedSearch ||
              normalizedCityName.toLowerCase() ===
                normalizedSearch.toLowerCase() ||
              normalizedCityName.replace(/['"()]/g, "").trim() ===
                normalizedSearch.replace(/['"()]/g, "").trim()
            );
          });

          if (foundCity && foundCity.english_name) {
            finalAddressEnglish = foundCity.english_name;
          }
        } catch (error) {
          console.error("Error loading cities data:", error.message);
        }
      }

      // בדוק אם יש MAPBOX_TOKEN
      if (!process.env.MAPBOX_TOKEN) {
        console.error("⚠️ MAPBOX_TOKEN is not defined in .env file");
        return res.status(500).json({
          success: false,
          message:
            "Mapbox token is not configured. Please add MAPBOX_TOKEN to your .env file.",
        });
      }

      // פונקציה לניקוי כתובת (הסרת רווחים מיותרים ותווים מיוחדים)
      const cleanAddress = (addr) => {
        if (!addr) return "";
        return addr
          .trim()
          .replace(/\s+/g, " ") // החלף רווחים מרובים ברווח אחד
          .replace(/['"]/g, "") // הסר גרשיים
          .trim();
      };

      // פונקציה לחיפוש כתובת ב-Mapbox
      const searchAddress = async (addr, label = "") => {
        const cleaned = cleanAddress(addr);
        if (!cleaned) {
          return null;
        }

        // Encode את הכתובת ל-URL (מטפל ברווחים ותווים מיוחדים)
        const encoded = encodeURIComponent(cleaned);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=il&access_token=${process.env.MAPBOX_TOKEN}`;

        try {
          const response = await axios.get(url);
          if (response.data.features && response.data.features.length > 0) {
            return response.data;
          }
        } catch (error) {
          console.error(
            `Error searching for "${cleaned}"${label ? ` (${label})` : ""}:`,
            error.message
          );
        }
        return null;
      };

      // נסה קודם עם הכתובת באנגלית (חובה!)
      let Coordinates = null;
      let usedAddress = "";

      // תמיד נסה קודם עם האנגלית אם יש
      if (finalAddressEnglish && finalAddressEnglish.trim()) {
        Coordinates = await searchAddress(finalAddressEnglish, "English");
        if (Coordinates) {
          usedAddress = finalAddressEnglish;
        }
      }

      // רק אם לא מצאנו עם האנגלית, נסה עם העברית
      if (!Coordinates && address && address.trim()) {
        Coordinates = await searchAddress(address, "Hebrew");
        if (Coordinates) {
          usedAddress = address;
        }
      }

      // אם עדיין לא מצאנו, נמשיך בלי קואורדינטות (לא נחזיר שגיאה)
      if (
        !Coordinates ||
        !Coordinates.features ||
        Coordinates.features.length === 0
      ) {
        console.error(
          "⚠️ Address not found in Mapbox, continuing without coordinates:",
          {
            addressEnglish: finalAddressEnglish,
            address: address,
          }
        );
        // נמשיך בלי קואורדינטות - לא נחזיר שגיאה
      }

      // חלץ את הקואורדינטות מהתוצאה
      let extractedCoordinates = null;
      try {
        if (
          Coordinates &&
          Coordinates.features &&
          Coordinates.features.length > 0
        ) {
          const feature = Coordinates.features[0];
          // נסה קודם center, ואז geometry.coordinates
          if (
            feature.center &&
            Array.isArray(feature.center) &&
            feature.center.length >= 2
          ) {
            extractedCoordinates = {
              lng: feature.center[0], // longitude
              lat: feature.center[1], // latitude
            };
          } else if (
            feature.geometry &&
            feature.geometry.coordinates &&
            Array.isArray(feature.geometry.coordinates) &&
            feature.geometry.coordinates.length >= 2
          ) {
            extractedCoordinates = {
              lng: feature.geometry.coordinates[0], // longitude
              lat: feature.geometry.coordinates[1], // latitude
            };
          }
        }
      } catch (coordError) {
        console.error("Error extracting coordinates:", coordError.message);
        // נמשיך גם בלי קואורדינטות
      }

      // בדיקה אם השם כבר קיים במערכת
      // ננרמל את השם לפני הבדיקה (הסרת רווחים מיותרים)
      const normalizedFullName = fullName.replace(/\s+/g, " ").trim();

      // נחפש רק עם השם המקורי והשם המנורמל (בלי regex כדי למנוע מציאת שמות דומים)
      const existingUserByName = await collection.findOne({
        $or: [{ username: fullName }, { username: normalizedFullName }],
      });

      if (existingUserByName) {
        console.error("❌ Username already exists:", fullName);
        console.error("   Existing user:", {
          _id: existingUserByName._id,
          username: existingUserByName.username,
          email: existingUserByName.email,
        });
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
        console.error("❌ Email already exists:", email);
        return res.status(400).json({
          success: false,
          message: "המייל כבר קיים במערכת",
        });
      }

      // בדיקה אם משתמש Google כבר קיים (לפי googleId)
      // נבדוק רק אם יש googleId נפרד, לא לפי אורך הסיסמה
      if (googleId) {
        const existingUserByGoogleId = await collection.findOne({
          googleId: googleId,
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
        addressEnglish: finalAddressEnglish || addressEnglish || "",
        howDidYouHear: howDidYouHear || "",
        imageUrl: imageUrl || "",
        isHandyman: isHandyman === true || isHandyman === "true",
        createdAt: new Date(),
      };

      // הוסף קואורדינטות רק אם הן קיימות
      // שמור בפורמט MongoDB GeoJSON: { type: "Point", coordinates: [lng, lat] }
      if (
        extractedCoordinates &&
        extractedCoordinates.lng &&
        extractedCoordinates.lat
      ) {
        userData.Coordinates = extractedCoordinates; // שמור גם את הפורמט הישן לתאימות
        userData.location = {
          type: "Point",
          coordinates: [extractedCoordinates.lng, extractedCoordinates.lat], // [longitude, latitude]
        };
      }

      // אם יש googleId נפרד, שמור אותו
      if (googleId) {
        userData.googleId = googleId;
      }

      // Add handyman-specific fields only if isHandyman is true
      if (userData.isHandyman) {
        // ודא ש-specialties הוא מערך של אובייקטים עם name, price, typeWork
        let specialtiesArray = [];

        // הפרד בין קטגוריות שלימות לתת-קטגוריות
        let fullCategoriesArray = [];

        if (Array.isArray(specialties)) {
          // אם זה כבר מערך, נמיר לאובייקטים
          specialtiesArray = specialties
            .filter((item) => item !== null && item !== undefined)
            .map((item) => {
              // אם זה קטגוריה שלימה (isFullCategory: true) או type: category
              if (
                typeof item === "object" &&
                item.name &&
                (item.isFullCategory || item.type === "category")
              ) {
                const name = String(item.name).trim();
                fullCategoriesArray.push(name);
                return {
                  name,
                  isFullCategory: true,
                  type: "category",
                  price: item.price || null,
                  typeWork: item.typeWork || null,
                };
              }

              // אם זה אובייקט עם name, price, typeWork (הפורמט החדש)
              if (typeof item === "object" && item.name) {
                return {
                  name: String(item.name).trim(),
                  price: item.price || null,
                  typeWork: item.typeWork || null,
                  isFullCategory: false,
                  type: item.type || "subCategory",
                };
              }
              // אם זה אובייקט ישן עם subcategory, workType
              if (typeof item === "object" && item.subcategory) {
                return {
                  name: String(item.subcategory).trim(),
                  price: item.price || null,
                  typeWork: item.workType || item.typeWork || null,
                  isFullCategory: false,
                  type: "subCategory",
                };
              }
              // אם זה string (תאימות לאחור)
              if (typeof item === "string") {
                const name = String(item).trim();
                return {
                  name,
                  price: null,
                  typeWork: null,
                  isFullCategory: false,
                  type: "subCategory",
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
                    const isFull =
                      item.isFullCategory || item.type === "category";
                    const typeVal = isFull
                      ? "category"
                      : item.type || "subCategory";
                    if (isFull) {
                      fullCategoriesArray.push(String(item.name).trim());
                    }
                    return {
                      name: String(item.name).trim(),
                      price: item.price || null,
                      typeWork: item.typeWork || null,
                      isFullCategory: isFull,
                      type: typeVal,
                    };
                  }
                  if (typeof item === "string") {
                    return {
                      name: String(item).trim(),
                      price: null,
                      typeWork: null,
                      isFullCategory: false,
                      type: "subCategory",
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
                  isFullCategory: false,
                  type: "subCategory",
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
                isFullCategory: false,
                type: "subCategory",
              },
            ].filter((item) => item.name.length > 0);
          }
        }

        // ודא שזה מערך של אובייקטים לפני השמירה!
        userData.specialties = Array.isArray(specialtiesArray)
          ? specialtiesArray.filter((item) => item !== null) // הסר null items
          : [];

        // שמור קטגוריות שלימות תחת פרופרטי חדש
        userData.fullCategories = Array.isArray(fullCategoriesArray)
          ? fullCategoriesArray.filter((cat) => cat && cat.trim().length > 0)
          : [];

        userData.logoUrl = logoUrl || "";

        // הוסף שדות דירוג ומספר עבודות עם ערך התחלתי של 0
        userData.rating = 0;
        userData.jobsDone = 0;
      }

      const result = await collection.insertOne(userData);

      if (result.insertedId) {
        try {
          const savedUser = await collection.findOne({
            _id: result.insertedId,
          });
          return res.json({ success: true, user: savedUser });
        } catch (findError) {
          console.error(
            "⚠️ Error retrieving saved user, but registration succeeded:",
            findError.message
          );
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
        console.error("❌ Failed to save user - no insertedId returned");
        return res
          .status(500)
          .json({ message: "Failed to register", success: false });
      }
    } catch (error) {
      console.error("❌ Error in register-handyman:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error details:", {
        message: error.message,
        name: error.name,
        code: error.code,
      });
      return res.status(500).json({
        message: error.message || "Error registering user",
        success: false,
        error: error.message,
      });
    }
  });
  async function calculateTravelTimes(userLng, userLat, handymen) {
    try {
      if (!process.env.MAPBOX_TOKEN) {
        return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
      }

      // בדוק שהקואורדינטות של המשתמש תקינות
      if (
        !userLng ||
        !userLat ||
        isNaN(userLng) ||
        isNaN(userLat) ||
        userLng < -180 ||
        userLng > 180 ||
        userLat < -90 ||
        userLat > 90
      ) {
        return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
      }

      // סנן רק הנדימנים שיש להם קואורדינטות תקינות
      const handymenWithCoords = handymen
        .map((h, index) => {
          if (
            h.location &&
            h.location.coordinates &&
            Array.isArray(h.location.coordinates) &&
            h.location.coordinates.length === 2
          ) {
            const lng = parseFloat(h.location.coordinates[0]);
            const lat = parseFloat(h.location.coordinates[1]);

            // בדוק שהקואורדינטות תקינות
            if (
              !isNaN(lng) &&
              !isNaN(lat) &&
              lng >= -180 &&
              lng <= 180 &&
              lat >= -90 &&
              lat <= 90
