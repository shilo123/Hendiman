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
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const URL_CLIENT = process.env.CLIENT_URL || "http://localhost:8080";
//9:48
// Import configurations and services
const {
  connectDatabase,
  getCollection,
  getCollectionJobs,
  getCollectionRatings,
  getCollectionPayments,
  getCollectionChats,
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
  let collectionRatings;
  let collectionPayments;
  let collectionChats;

  try {
    await connectDatabase();
    collection = getCollection();
    collectionJobs = getCollectionJobs();
    collectionRatings = getCollectionRatings();
    collectionPayments = getCollectionPayments();
    collectionChats = getCollectionChats();
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
    } // end register-handyman handler
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
            ) {
              return { handyman: h, lng, lat, originalIndex: index };
            }
          }
          return null;
        })
        .filter((item) => item !== null);

      if (handymenWithCoords.length === 0) {
        return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
      }

      // Mapbox מגביל ל-25 נקודות (1 מקור + 24 יעדים)
      // אם יש יותר, נחלק לכמה בקשות
      const maxDestinations = 24; // 25 כולל המקור
      const batches = [];
      for (let i = 0; i < handymenWithCoords.length; i += maxDestinations) {
        const batch = handymenWithCoords.slice(i, i + maxDestinations);
        if (batch.length > 0) {
          batches.push(batch);
        }
      }

      // תוצאות לכל הנדימנים
      const results = new Map();

      // עבד על כל batch במקביל (במקום ברצף) כדי להאיץ את הטעינה
      const batchPromises = batches.map(async (batch) => {
        // ודא שיש לפחות יעד אחד ב-batch
        if (batch.length === 0) {
          return;
        }

        // בדוק אם יש הנדימנים באותו מקום כמו המשתמש - תן להם 0 דקות בלי לשלוח ל-Mapbox
        const batchToProcess = [];
        batch.forEach((item) => {
          // בדוק אם זה אותו מקום (עם טולרנס קטן)
          const isSameLocation =
            Math.abs(userLng - item.lng) < 0.0001 &&
            Math.abs(userLat - item.lat) < 0.0001;

          if (isSameLocation) {
            results.set(item.originalIndex, 0); // 0 דקות = אותו מקום
          } else {
            batchToProcess.push(item);
          }
        });

        // אם אין הנדימנים לשלוח ל-Mapbox, סיים
        if (batchToProcess.length === 0) {
          return;
        }

        try {
          // בנה את מחרוזת הקואורדינטות: <LNG_USER>,<LAT_USER>;<LNG_H1>,<LAT_H1>;...
          const coordinates = [
            `${userLng},${userLat}`, // מקור (המשתמש)
            ...batchToProcess.map((item) => `${item.lng},${item.lat}`), // יעדים (הנדימנים)
          ].join(";");

          // בנה את ה-destinations parameter (1,2,3... לפי מספר היעדים)
          const destinations = batchToProcess.map((_, i) => i + 1).join(";");

          // ודא שיש לפחות יעד אחד
          if (batchToProcess.length === 0) {
            return;
          }

          // אם יש רק יעד אחד, השתמש ב-Directions API במקום Matrix API
          // כי Matrix API דורש לפחות 2 matrix elements
          if (batchToProcess.length === 1) {
            const item = batchToProcess[0];
            const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${item.lng},${item.lat}?access_token=${process.env.MAPBOX_TOKEN}&geometries=geojson`;

            try {
              const directionsResponse = await axios.get(directionsUrl);
              if (
                directionsResponse.data &&
                directionsResponse.data.routes &&
                directionsResponse.data.routes.length > 0 &&
                directionsResponse.data.routes[0].duration
              ) {
                const durationSeconds =
                  directionsResponse.data.routes[0].duration;
                const travelTimeMinutes = Math.round(durationSeconds / 60);
                results.set(item.originalIndex, travelTimeMinutes);
              } else {
                results.set(item.originalIndex, null);
              }
            } catch (directionsError) {
              results.set(item.originalIndex, null);
            }
            return; // סיים כאן, לא צריך לנסות Matrix API
          }

          // בנה את ה-URL - Mapbox לא צריך URL encoding בקואורדינטות
          const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}?access_token=${process.env.MAPBOX_TOKEN}&sources=0&destinations=${destinations}&annotations=duration,distance`;

          // שלח בקשה ל-Mapbox
          const response = await axios.get(url);

          if (
            response.data &&
            response.data.durations &&
            Array.isArray(response.data.durations) &&
            response.data.durations.length > 0 &&
            Array.isArray(response.data.durations[0])
          ) {
            const durations = response.data.durations[0];

            // Mapbox מחזיר את התוצאות מהמקור (index 0) לכל היעדים
            if (durations.length >= batchToProcess.length + 1) {
              // יש מספיק תוצאות - האינדקס 0 הוא המשתמש, 1+ הם היעדים
              batchToProcess.forEach((item, batchIndex) => {
                const durationSeconds = durations[batchIndex + 1]; // +1 כי האינדקס 0 הוא המשתמש עצמו
                const travelTimeMinutes =
                  durationSeconds !== null &&
                  durationSeconds !== undefined &&
                  !isNaN(durationSeconds) &&
                  durationSeconds >= 0
                    ? Math.round(durationSeconds / 60) // המרה לשניות לדקות
                    : null;
                results.set(item.originalIndex, travelTimeMinutes);
              });
            } else if (durations.length === batchToProcess.length) {
              // אם יש בדיוק batchToProcess.length תוצאות, אז כנראה שהאינדקס 0 לא נכלל
              // נשתמש באינדקסים 0 עד batchToProcess.length-1
              batchToProcess.forEach((item, batchIndex) => {
                const durationSeconds = durations[batchIndex];
                const travelTimeMinutes =
                  durationSeconds !== null &&
                  durationSeconds !== undefined &&
                  !isNaN(durationSeconds) &&
                  durationSeconds >= 0
                    ? Math.round(durationSeconds / 60) // המרה לשניות לדקות
                    : null;
                results.set(item.originalIndex, travelTimeMinutes);
              });
            } else {
              // נסה בכל זאת להשתמש במה שיש
              batchToProcess.forEach((item, batchIndex) => {
                if (batchIndex < durations.length) {
                  const durationSeconds = durations[batchIndex];
                  const travelTimeMinutes =
                    durationSeconds !== null &&
                    durationSeconds !== undefined &&
                    !isNaN(durationSeconds) &&
                    durationSeconds >= 0
                      ? Math.round(durationSeconds / 60)
                      : null;
                  results.set(item.originalIndex, travelTimeMinutes);
                } else {
                  results.set(item.originalIndex, null);
                }
              });
            }
          }
        } catch (batchError) {
          // אם יש שגיאה, נסה לטפל בה
          console.error("❌ Mapbox batch error:", {
            message: batchError.message,
            response: batchError.response?.data,
            status: batchError.response?.status,
          });
          const errorData = batchError.response?.data || {};
          // נסה לשלוח כל הנדימן בנפרד במקביל
          const singlePromises = batchToProcess.map(async (item) => {
            try {
              const singleCoordinates = `${userLng},${userLat};${item.lng},${item.lat}`;
              const singleUrl = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${singleCoordinates}?access_token=${process.env.MAPBOX_TOKEN}&sources=0&destinations=1&annotations=duration,distance`;

              const singleResponse = await axios.get(singleUrl);
              if (
                singleResponse.data &&
                singleResponse.data.durations &&
                Array.isArray(singleResponse.data.durations) &&
                singleResponse.data.durations.length > 0 &&
                Array.isArray(singleResponse.data.durations[0]) &&
                singleResponse.data.durations[0].length > 1
              ) {
                const durationSeconds = singleResponse.data.durations[0][1];
                const travelTimeMinutes =
                  durationSeconds !== null &&
                  durationSeconds !== undefined &&
                  !isNaN(durationSeconds) &&
                  durationSeconds >= 0
                    ? Math.round(durationSeconds / 60)
                    : null;
                results.set(item.originalIndex, travelTimeMinutes);
              } else {
                results.set(item.originalIndex, null);
              }
            } catch (singleError) {
              // אם גם זה נכשל, נשאיר null
              results.set(item.originalIndex, null);
            }
          });

          await Promise.all(singlePromises);
        }
      });

      // המתין לכל ה-batches להסתיים במקביל
      await Promise.all(batchPromises);

      // הוסף את זמן הנסיעה לכל הנדימן
      const finalHandymen = handymen.map((h, index) => ({
        ...h,
        travelTimeMinutes: results.has(index) ? results.get(index) : null,
      }));

      return finalHandymen;
    } catch (error) {
      console.error(
        "Error calculating travel times:",
        error.response?.data || error.message
      );
      // במקרה של שגיאה, החזר את ההנדימנים ללא זמן נסיעה
      return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
    }
  }

  // Helper: calculate distance between two coordinates in KM (Haversine)
  function calculateDistanceKm(lng1, lat1, lng2, lat2) {
    if (
      [lng1, lat1, lng2, lat2].some(
        (v) => v === undefined || v === null || isNaN(parseFloat(v))
      )
    ) {
      return null;
    }
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in KM
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // two decimals
  }

  // Jobs filtering for handyman (status + distance)
  app.get("/jobs/filter", async (req, res) => {
    try {
      if (!collectionJobs) {
        return res.status(500).json({
          success: false,
          message: "שגיאה בחיבור למסד הנתונים",
        });
      }

      const { status, maxKm, lng, lat } = req.query;
      const query = {};
      if (status && status !== "all") {
        query.status = status;
      }

      const userLng = parseFloat(lng);
      const userLat = parseFloat(lat);
      const hasCoords = !isNaN(userLng) && !isNaN(userLat);
      const maxDistanceMeters =
        maxKm && !isNaN(parseFloat(maxKm)) ? parseFloat(maxKm) * 1000 : null;

      console.log("🔍 [JOBS/FILTER] Request received:", {
        status,
        maxKm,
        userCoords: { lng: userLng, lat: userLat },
        hasCoords,
        maxDistanceMeters: maxDistanceMeters
          ? `${maxDistanceMeters / 1000}km`
          : "none",
      });

      let jobs = [];

      if (hasCoords) {
        try {
          const pipeline = [
            {
              $geoNear: {
                near: { type: "Point", coordinates: [userLng, userLat] },
                distanceField: "distanceMeters",
                spherical: true,
                ...(maxDistanceMeters
                  ? { maxDistance: maxDistanceMeters }
                  : {}),
                ...(Object.keys(query).length ? { query } : {}),
              },
            },
          ];

          jobs = await collectionJobs.aggregate(pipeline).toArray();

          jobs = jobs.map((job) => {
            const jobLng =
              job?.location?.coordinates?.[0] || job?.coordinates?.lng || null;
            const jobLat =
              job?.location?.coordinates?.[1] || job?.coordinates?.lat || null;
            const distanceKm =
              typeof job.distanceMeters === "number"
                ? Math.round((job.distanceMeters / 1000) * 100) / 100
                : calculateDistanceKm(userLng, userLat, jobLng, jobLat);

            const isWithinRange = maxDistanceMeters
              ? distanceKm !== null && distanceKm * 1000 <= maxDistanceMeters
              : true;

            console.log(`📍 [JOB] ${job._id || job.id}:`, {
              jobLocation: { lng: jobLng, lat: jobLat },
              distanceKm: distanceKm !== null ? `${distanceKm}km` : "N/A",
              maxKm: maxKm ? `${maxKm}km` : "none",
              isWithinRange: isWithinRange ? "✅ YES" : "❌ NO",
              status: job.status,
            });

            return {
              ...job,
              distanceKm,
            };
          });

          console.log(`📊 [JOBS/FILTER] Total jobs found: ${jobs.length}`);
        } catch (geoError) {
          console.error("GeoNear error on /jobs/filter:", geoError.message);

          jobs = await collectionJobs.find(query).toArray();

          jobs = jobs
            .map((job) => {
              const jobLng =
                job?.location?.coordinates?.[0] ||
                job?.coordinates?.lng ||
                null;
              const jobLat =
                job?.location?.coordinates?.[1] ||
                job?.coordinates?.lat ||
                null;
              const distanceKm = calculateDistanceKm(
                userLng,
                userLat,
                jobLng,
                jobLat
              );

              const isWithinRange = maxDistanceMeters
                ? distanceKm !== null && distanceKm * 1000 <= maxDistanceMeters
                : true;

              console.log(`📍 [JOB] ${job._id || job.id}:`, {
                jobLocation: { lng: jobLng, lat: jobLat },
                distanceKm: distanceKm !== null ? `${distanceKm}km` : "N/A",
                maxKm: maxKm ? `${maxKm}km` : "none",
                isWithinRange: isWithinRange ? "✅ YES" : "❌ NO",
                status: job.status,
              });

              return { ...job, distanceKm };
            })
            .filter((job) => {
              if (!maxDistanceMeters || maxDistanceMeters <= 0) return true;
              if (job.distanceKm === null) return true; // keep if no coords
              const passed = job.distanceKm * 1000 <= maxDistanceMeters;
              if (!passed) {
                console.log(
                  `🚫 [FILTERED OUT] Job ${job._id || job.id}: ${
                    job.distanceKm
                  }km > ${maxKm}km`
                );
              }
              return passed;
            });

          console.log(`📊 [JOBS/FILTER] After filtering: ${jobs.length} jobs`);
        }
      } else {
        jobs = await collectionJobs.find(query).toArray();
        console.log(
          `📊 [JOBS/FILTER] No coordinates provided, returning all jobs: ${jobs.length}`
        );
      }

      console.log(`✅ [JOBS/FILTER] Returning ${jobs.length} jobs`);
      return res.json({ success: true, jobs });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בסינון העבודות",
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
      // קבל קואורדינטות מהקווארי סטרינג (אם נשלחו)
      const { lng, lat } = req.query;

      // נסה ליצור ObjectId - אם זה נכשל, נחזיר שגיאה
      let userId;
      try {
        userId = new ObjectId(id);
      } catch (objectIdError) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
          receivedId: id,
        });
      }

      let User = await collection.findOne({ _id: userId });

      // אם המשתמש לא נמצא, החזר שגיאה
      if (!User) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      let Jobs = collectionJobs ? await collectionJobs.find({}).toArray() : [];
      let handymenCount = await collection.countDocuments({
        isHandyman: true,
      });
      let clientsCount = await collection.countDocuments({
        $or: [{ isHandyman: false }, { isHandyman: { $exists: false } }],
      });
      let totalUsersCount = await collection.countDocuments({});

      // שלוף הנדימנים - אם יש קואורדינטות, שלוף רק הנדימנים עד 10 ק"מ
      let Hendimands = [];
      if (lng && lat) {
        const userLng = parseFloat(lng);
        const userLat = parseFloat(lat);

        if (!isNaN(userLng) && !isNaN(userLat)) {
          // השתמש ב-MongoDB geospatial query למציאת הנדימנים עד 10 ק"מ
          // 10 ק"מ = 10000 מטר
          try {
            Hendimands = await collection
              .find({
                isHandyman: true,
                location: {
                  $near: {
                    $geometry: {
                      type: "Point",
                      coordinates: [userLng, userLat], // [longitude, latitude]
                    },
                    $maxDistance: 10000, // 10 ק"מ במטר
                  },
                },
              })
              .toArray();

            // חשב זמן נסיעה לכל ההנדימנים
            Hendimands = await calculateTravelTimes(
              userLng,
              userLat,
              Hendimands
            );
          } catch (geoError) {
            // אם יש שגיאה ב-geospatial query (כנראה אין index), נשתמש ב-fallback
            // Fallback: שלוף את כל ההנדימנים
            Hendimands = await collection.find({ isHandyman: true }).toArray();

            // חשב זמן נסיעה גם ב-fallback אם יש קואורדינטות
            if (!isNaN(userLng) && !isNaN(userLat)) {
              Hendimands = await calculateTravelTimes(
                userLng,
                userLat,
                Hendimands
              );
            }
          }
        } else {
          // אם הקואורדינטות לא תקינות, שלוף את כל ההנדימנים
          Hendimands = await collection.find({ isHandyman: true }).toArray();
        }
      } else {
        // אם אין קואורדינטות, שלוף את כל ההנדימנים
        Hendimands = await collection.find({ isHandyman: true }).toArray();
      }

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
      console.error("Error in GetDataDeshboard:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching dashboard data",
        error: error.message,
      });
    }
  });
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

      // קבל קואורדינטות מהקווארי סטרינג (אם נשלחו)
      const { lng, lat } = req.query;

      // שלוף הנדימנים - אם יש קואורדינטות, שלוף רק הנדימנים עד 10 ק"מ
      let handymen = [];
      let totalCount = 0;

      if (lng && lat) {
        const userLng = parseFloat(lng);
        const userLat = parseFloat(lat);

        if (!isNaN(userLng) && !isNaN(userLat)) {
          // השתמש ב-MongoDB geospatial query למציאת הנדימנים עד 10 ק"מ
          try {
            // שלוף את כל ההנדימנים עד 10 ק"מ (ללא pagination כדי לספור)
            const allHandymen = await collection
              .find({
                isHandyman: true,
                location: {
                  $near: {
                    $geometry: {
                      type: "Point",
                      coordinates: [userLng, userLat], // [longitude, latitude]
                    },
                    $maxDistance: 10000, // 10 ק"מ במטר
                  },
                },
              })
              .toArray();

            totalCount = allHandymen.length;

            // החל pagination על התוצאות
            handymen = allHandymen.slice(skip, skip + limit);

            // חשב זמן נסיעה לכל הנדימנים בעמוד הנוכחי
            const parsedUserLng = parseFloat(userLng);
            const parsedUserLat = parseFloat(userLat);
            handymen = await calculateTravelTimes(
              parsedUserLng,
              parsedUserLat,
              handymen
            );
          } catch (geoError) {
            // אם יש שגיאה ב-geospatial query, נשתמש ב-fallback
            // Fallback: שלוף את כל ההנדימנים
            totalCount = await collection.countDocuments({
              isHandyman: true,
            });
            handymen = await collection
              .find({ isHandyman: true })
              .skip(skip)
              .limit(limit)
              .toArray();

            // חשב זמן נסיעה גם ב-fallback אם יש קואורדינטות
            if (!isNaN(userLng) && !isNaN(userLat)) {
              const parsedUserLng = parseFloat(userLng);
              const parsedUserLat = parseFloat(userLat);
              handymen = await calculateTravelTimes(
                parsedUserLng,
                parsedUserLat,
                handymen
              );
            }
          }
        } else {
          // אם הקואורדינטות לא תקינות, שלוף את כל ההנדימנים
          totalCount = await collection.countDocuments({
            isHandyman: true,
          });
          handymen = await collection
            .find({ isHandyman: true })
            .skip(skip)
            .limit(limit)
            .toArray();

          // נסה בכל זאת לחשב זמן נסיעה אם הקואורדינטות קיימות (אפילו אם לא תקינות)
          if (lng && lat) {
            const userLng = parseFloat(lng);
            const userLat = parseFloat(lat);
            if (!isNaN(userLng) && !isNaN(userLat)) {
              handymen = await calculateTravelTimes(userLng, userLat, handymen);
            }
          }
        }
      } else {
        // אם אין קואורדינטות, שלוף את כל ההנדימנים
        totalCount = await collection.countDocuments({
          isHandyman: true,
        });
        handymen = await collection
          .find({ isHandyman: true })
          .skip(skip)
          .limit(limit)
          .toArray();
        // אין קואורדינטות, אז לא נחשב זמן נסיעה
      }

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
  app.get("/Gethandyman/:id", async (req, res) => {
    try {
      if (!collection) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      } else {
        let { id } = req.params;
        let Handyman = await collection.findOne({
          _id: new ObjectId(id),
          isHandyman: true,
        });
        if (!Handyman) {
          return res.status(404).json({
            success: false,
            message: "לא נמצא הנדימן",
          });
        }
        return res.json({ success: true, Handyman });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching handyman",
        error: error.message,
      });
    }
  });
  app.get("/getAddress", async (req, res) => {
    try {
      const { lat, lon } = req.query;

      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.MAPBOX_TOKEN}`
      );
      return res.json({
        success: true,
        response: response.data.features
          ? response.data.features.find((item) => item.context)
          : null,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching address",
        error: error.message,
      });
    }
  });

  // ודא אינדקס 2dsphere על jobs.location
  async function ensureJobsGeoIndex() {
    try {
      const col = getCollectionJobs();
      if (col) {
        await col.createIndex({ location: "2dsphere" });
      }
    } catch (err) {
      console.error(
        "Error creating 2dsphere index on jobs.location:",
        err.message
      );
    }
  }
  ensureJobsGeoIndex();

  // Update profile (basic fields + specialties)
  app.post("/user/update-profile", async (req, res) => {
    try {
      const {
        userId,
        username,
        phone,
        email,
        city,
        cityEnglishName,
        specialties,
      } = req.body;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "userId required" });
      }
      const collection = getCollection();
      const _id = new ObjectId(userId);
      const update = {};
      if (username !== undefined) update.username = username;
      if (phone !== undefined) update.phone = phone;
      if (email !== undefined) update.email = email;
      if (city !== undefined) update.city = city;
      if (Array.isArray(specialties)) {
        update.specialties = specialties;
      }

      // אם העיר השתנתה, עדכן גם את הקואורדינטות
      if (city && city.trim() && city.trim() !== "המיקום שלי") {
        let coordinatesFound = false;

        // נסה קודם עם השם בעברית
        try {
          const encoded = encodeURIComponent(city.trim());
          const fwdUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&types=place&limit=5`;
          const fwdRes = await axios.get(fwdUrl);
          const features = fwdRes.data?.features || [];

          // מצא את התוצאה שתואמת לישוב שנבחר
          let matchingFeature = null;
          if (cityEnglishName && cityEnglishName.trim()) {
            const cityEngName = cityEnglishName.trim().toLowerCase();

            matchingFeature = features.find((feature) => {
              const featureEngName = (feature.text || feature.place_name || "")
                .trim()
                .toLowerCase();
              // עדיפות להתאמה מדויקת
              if (featureEngName === cityEngName) {
                return true;
              }
              // אחר כך בדוק התאמה חלקית (אבל רק אם השם לא קצר מדי)
              if (cityEngName.length >= 3) {
                return (
                  featureEngName.includes(cityEngName) ||
                  cityEngName.includes(featureEngName)
                );
              }
              return false;
            });
          }

          // אם יש cityEnglishName אבל לא מצאנו התאמה, לא נשתמש בתוצאה
          // אם אין cityEnglishName, נשתמש בתוצאה הראשונה
          const feature = cityEnglishName ? matchingFeature : features[0];

          if (feature) {
            const [lng, lat] =
              (feature.center &&
                feature.center.length >= 2 &&
                feature.center) ||
              (feature.geometry?.coordinates &&
                feature.geometry.coordinates.length >= 2 &&
                feature.geometry.coordinates) ||
              [];
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
              update.location = {
                type: "Point",
                coordinates: [lng, lat],
              };
              update.coordinates = { lng, lat };
              coordinatesFound = true;
            }
          }
        } catch (fwdErr) {
          console.error("Forward geocoding (Hebrew) failed:", fwdErr?.message);
        }

        // אם לא מצאנו קואורדינטות בעברית, נסה עם השם באנגלית
        if (!coordinatesFound && cityEnglishName && cityEnglishName.trim()) {
          try {
            const encodedEn = encodeURIComponent(cityEnglishName.trim());
            const fwdUrlEn = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedEn}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&types=place&limit=5`;
            const fwdResEn = await axios.get(fwdUrlEn);
            const featuresEn = fwdResEn.data?.features || [];

            // מצא את התוצאה שתואמת לישוב שנבחר
            let matchingFeatureEn = null;
            const cityEngName = cityEnglishName.trim().toLowerCase();

            matchingFeatureEn = featuresEn.find((feature) => {
              const featureEngName = (feature.text || feature.place_name || "")
                .trim()
                .toLowerCase();
              // עדיפות להתאמה מדויקת
              if (featureEngName === cityEngName) {
                return true;
              }
              // אחר כך בדוק התאמה חלקית (אבל רק אם השם לא קצר מדי)
              if (cityEngName.length >= 3) {
                return (
                  featureEngName.includes(cityEngName) ||
                  cityEngName.includes(featureEngName)
                );
              }
              return false;
            });

            // אם יש cityEnglishName אבל לא מצאנו התאמה, לא נשתמש בתוצאה
            const featureEn = matchingFeatureEn || featuresEn[0];

            if (featureEn) {
              const [lng, lat] =
                (featureEn.center &&
                  featureEn.center.length >= 2 &&
                  featureEn.center) ||
                (featureEn.geometry?.coordinates &&
                  featureEn.geometry.coordinates.length >= 2 &&
                  featureEn.geometry.coordinates) ||
                [];
              if (Number.isFinite(lng) && Number.isFinite(lat)) {
                update.location = {
                  type: "Point",
                  coordinates: [lng, lat],
                };
                update.coordinates = { lng, lat };
                coordinatesFound = true;
              }
            }
          } catch (fwdErrEn) {
            console.error(
              "Forward geocoding (English) failed:",
              fwdErrEn?.message
            );
          }
        }
      }

      await collection.updateOne({ _id }, { $set: update });
      const user = await collection.findOne({ _id });
      return res.json({ success: true, user });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Update failed", error: err.message });
    }
  });

  // Accept / skip / status transitions
  app.post("/jobs/accept", async (req, res) => {
    try {
      const { jobId, handymanId } = req.body;
      if (!jobId || !handymanId) {
        return res
          .status(400)
          .json({ success: false, message: "jobId and handymanId required" });
      }
      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();
      const handyman = await usersCol.findOne({
        _id: new ObjectId(handymanId),
      });
      const handymanName = handyman?.username || null;
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            handymanId: new ObjectId(handymanId),
            handymanName,
            status: "assigned",
          },
        }
      );

      // Emit WebSocket event to notify client that job was accepted
      io.to(`job-${jobId}`).emit("job-accepted", {
        jobId: jobId,
        handymanId: handymanId,
        handymanName: handymanName,
        status: "assigned",
      });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error accepting job",
        error: error.message,
      });
    }
  });

  app.post("/jobs/skip", async (req, res) => {
    try {
      const { jobId, handymanId } = req.body;
      if (!jobId || !handymanId) {
        return res
          .status(400)
          .json({ success: false, message: "jobId and handymanId required" });
      }
      const jobsCol = getCollectionJobs();
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $unset: { handymanId: "", handymanName: "" },
          $set: { status: "open" },
        }
      );
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error skipping job",
        error: error.message,
      });
    }
  });

  app.post("/jobs/on-the-way", async (req, res) => {
    try {
      const { jobId, handymanId } = req.body;
      if (!jobId || !handymanId) {
        return res
          .status(400)
          .json({ success: false, message: "jobId and handymanId required" });
      }
      const jobsCol = getCollectionJobs();

      // Find the job first to get the correct handymanId format
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res
          .status(404)
          .json({ success: false, message: "Job not found" });
      }

      // Use the handymanId from the job (as it's stored in DB)
      const query = {
        _id: new ObjectId(jobId),
        handymanId: job.handymanId || handymanId,
      };

      await jobsCol.updateOne(query, { $set: { status: "on_the_way" } });
      // Emit WebSocket event to notify clients
      const io = req.app.get("io");
      if (io) {
        io.to(`job-${jobId}`).emit("job-status-updated", {
          jobId,
          status: "on_the_way",
        });
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error setting on_the_way",
        error: error.message,
      });
    }
  });

  app.post("/jobs/in-progress", async (req, res) => {
    try {
      const { jobId, handymanId } = req.body;
      if (!jobId || !handymanId) {
        return res
          .status(400)
          .json({ success: false, message: "jobId and handymanId required" });
      }
      const jobsCol = getCollectionJobs();

      // Find the job first to get the correct handymanId format
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res
          .status(404)
          .json({ success: false, message: "Job not found" });
      }

      // Use the handymanId from the job (as it's stored in DB)
      const query = {
        _id: new ObjectId(jobId),
        handymanId: job.handymanId || handymanId,
      };

      await jobsCol.updateOne(query, { $set: { status: "in_progress" } });

      // Emit WebSocket event to notify clients
      const io = req.app.get("io");
      if (io) {
        io.to(`job-${jobId}`).emit("job-status-updated", {
          jobId,
          status: "in_progress",
        });
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error setting in_progress",
        error: error.message,
      });
    }
  });

  app.post("/jobs/done", async (req, res) => {
    try {
      const { jobId, handymanId } = req.body;
      if (!jobId || !handymanId) {
        return res
          .status(400)
          .json({ success: false, message: "jobId and handymanId required" });
      }
      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();

      // Find the job first to get the correct handymanId format
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res
          .status(404)
          .json({ success: false, message: "Job not found" });
      }

      // Use the handymanId from the job (as it's stored in DB)
      const query = {
        _id: new ObjectId(jobId),
        handymanId: job.handymanId || handymanId,
      };

      await jobsCol.updateOne(query, { $set: { status: "done" } });
      await usersCol.updateOne(
        { _id: new ObjectId(handymanId) },
        { $inc: { jobDone: 1 } }
      );

      // Emit WebSocket event to notify clients
      const io = req.app.get("io");
      if (io) {
        io.to(`job-${jobId}`).emit("job-status-updated", {
          jobId,
          status: "done",
        });
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error finishing job",
        error: error.message,
      });
    }
  });

  // Get messages for a job
  app.get("/jobs/:jobId/messages", async (req, res) => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "jobId required",
        });
      }

      const chatsCol = getCollectionChats();
      const chat = await chatsCol.findOne({ jobId: new ObjectId(jobId) });

      if (!chat) {
        return res.json({ success: true, messages: [] });
      }

      return res.json({
        success: true,
        messages: chat.content || [],
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching messages",
        error: error.message,
      });
    }
  });

  // Send a message
  app.post("/jobs/:jobId/messages", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { text, imageUrl, senderId, isHandyman } = req.body;

      if (!jobId || !senderId) {
        return res.status(400).json({
          success: false,
          message: "jobId and senderId required",
        });
      }

      if (!text && !imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Either text or imageUrl is required",
        });
      }

      const chatsCol = getCollectionChats();
      const jobsCol = getCollectionJobs();

      // Get job to find customerId and handymanId
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      const customerId = job.clientId?.toString() || job.clientId;
      const handymanId = job.handymanId?.toString() || job.handymanId;

      // Create message object
      const messageObj = {
        createdAt: new Date(),
      };

      if (isHandyman) {
        if (text) messageObj.handyman = text;
        if (imageUrl) messageObj.handymanImage = imageUrl;
      } else {
        if (text) messageObj.customer = text;
        if (imageUrl) messageObj.customerImage = imageUrl;
      }

      // Find or create chat document
      let chat = await chatsCol.findOne({ jobId: new ObjectId(jobId) });

      if (!chat) {
        // Create new chat document
        chat = {
          jobId: new ObjectId(jobId),
          customerID: customerId,
          handymanID: handymanId,
          content: [messageObj],
        };
        await chatsCol.insertOne(chat);
      } else {
        // Add message to existing chat
        const updateResult = await chatsCol.updateOne(
          { jobId: new ObjectId(jobId) },
          { $push: { content: messageObj } }
        );

        // Check if content array has more than 100 messages
        const updatedChat = await chatsCol.findOne({
          jobId: new ObjectId(jobId),
        });
        if (
          updatedChat &&
          updatedChat.content &&
          updatedChat.content.length > 100
        ) {
          // Remove first 50 messages
          const newContent = updatedChat.content.slice(50);
          await chatsCol.updateOne(
            { jobId: new ObjectId(jobId) },
            { $set: { content: newContent } }
          );
        }
      }

      // Emit WebSocket event to notify clients
      const io = req.app.get("io");
      if (io) {
        io.to(`job-${jobId}`).emit("new-message", {
          jobId,
          message: messageObj,
        });
      }

      return res.json({ success: true, message: messageObj });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error sending message",
        error: error.message,
      });
    }
  });

  app.post("/jobs/rate", async (req, res) => {
    try {
      const { jobId, handymanId, customerId, rating, review } = req.body;
      if (!jobId || !handymanId || !rating) {
        return res.status(400).json({
          success: false,
          message: "jobId, handymanId, and rating required",
        });
      }

      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();
      const ratingsCol = getCollectionRatings();

      // Get job to verify it exists and get customerId if not provided
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      const finalCustomerId =
        customerId || job.clientId?.toString() || job.clientId;
      const finalHandymanId = handymanId?.toString() || handymanId;

      // Save rating to collectionRatings
      await ratingsCol.insertOne({
        handymanId: finalHandymanId,
        customerId: finalCustomerId,
        jobId: new ObjectId(jobId),
        rating: parseInt(rating),
        review: review || "",
        createdAt: new Date(),
      });

      // Update job with ratingSubmitted flag
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            ratingSubmitted: true,
          },
        }
      );

      // Emit WebSocket event to handyman that rating was submitted
      io.to(`job-${jobId}`).emit("rating-submitted", {
        jobId: jobId,
        rating: parseInt(rating),
      });

      // Calculate average rating for handyman from all ratings
      const allRatings = await ratingsCol
        .find({ handymanId: finalHandymanId })
        .toArray();

      if (allRatings.length > 0) {
        const totalRating = allRatings.reduce(
          (sum, r) => sum + (r.rating || 0),
          0
        );
        const averageRating = totalRating / allRatings.length;
        const roundedRating = Math.round(averageRating * 10) / 10;

        await usersCol.updateOne(
          { _id: new ObjectId(finalHandymanId) },
          { $set: { rating: roundedRating } }
        );
      } else {
        // If no ratings yet, set the first rating
        await usersCol.updateOne(
          { _id: new ObjectId(finalHandymanId) },
          { $set: { rating: parseInt(rating) } }
        );
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error submitting rating",
        error: error.message,
      });
    }
  });

  // Get ratings for a handyman
  app.get("/ratings/:handymanId", async (req, res) => {
    try {
      const { handymanId } = req.params;
      if (!handymanId) {
        return res.status(400).json({
          success: false,
          message: "handymanId required",
        });
      }

      const ratingsCol = getCollectionRatings();

      // Try multiple search strategies
      let ratings = [];

      // Strategy 1: Direct string match (as stored in DB)
      ratings = await ratingsCol
        .find({ handymanId: handymanId })
        .sort({ createdAt: -1 })
        .toArray();

      // Strategy 2: Try with ObjectId conversion
      if (ratings.length === 0) {
        try {
          const objectIdHandymanId = new ObjectId(handymanId);
          const objectIdString = objectIdHandymanId.toString();
          ratings = await ratingsCol
            .find({ handymanId: objectIdString })
            .sort({ createdAt: -1 })
            .toArray();
        } catch (objectIdError) {
          // ObjectId conversion failed, continue
        }
      }

      // Strategy 3: Try with $or to match both string and ObjectId
      if (ratings.length === 0) {
        try {
          const objectIdHandymanId = new ObjectId(handymanId);
          ratings = await ratingsCol
            .find({
              $or: [
                { handymanId: handymanId },
                { handymanId: objectIdHandymanId.toString() },
                { handymanId: objectIdHandymanId },
              ],
            })
            .sort({ createdAt: -1 })
            .toArray();
        } catch (orError) {
          // $or search failed, continue
        }
      }

      // Populate customer and job information for each rating
      const usersCol = getCollection();
      const jobsCol = getCollectionJobs();
      const ratingsWithCustomers = await Promise.all(
        ratings.map(async (rating) => {
          try {
            const customerId = rating.customerId;
            let customerName = "לקוח";
            let customerImage = null;
            let jobType = null;

            // Get customer information
            if (customerId) {
              // Try to find customer by string ID
              let customer = await usersCol.findOne({
                _id: new ObjectId(customerId),
              });

              // If not found, try with string match
              if (!customer) {
                customer = await usersCol.findOne({
                  _id: customerId,
                });
              }

              if (customer) {
                customerName = customer.username || "לקוח";
                customerImage = customer.imageUrl || null;
              }
            }

            // Get job information
            if (rating.jobId) {
              try {
                const jobId = rating.jobId;
                let job = null;

                // Try with ObjectId
                if (jobId._id || jobId.$oid) {
                  const id = jobId._id || jobId.$oid;
                  job = await jobsCol.findOne({ _id: new ObjectId(id) });
                } else if (typeof jobId === "string") {
                  job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
                } else if (jobId instanceof ObjectId) {
                  job = await jobsCol.findOne({ _id: jobId });
                }

                if (job) {
                  // Get job type from subcategoryInfo or workType
                  if (job.subcategoryInfo && job.subcategoryInfo.name) {
                    jobType = job.subcategoryInfo.name;
                  } else if (job.workType) {
                    jobType = job.workType;
                  }
                }
              } catch (jobErr) {
                // Job not found or error, continue
              }
            }

            return {
              ...rating,
              customerName,
              customerImage,
              jobType,
            };
          } catch (err) {
            return {
              ...rating,
              customerName: "לקוח",
              customerImage: null,
              jobType: null,
            };
          }
        })
      );

      return res.json({ success: true, ratings: ratingsWithCustomers });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching ratings",
        error: error.message,
      });
    }
  });

  app.post("/create-call", async (req, res) => {
    try {
      const call = req.body;
      // קבל את אוסף העבודות
      const jobsCollection = getCollectionJobs();

      if (!jobsCollection) {
        return res.status(500).json({
          success: false,
          message: "שגיאה בחיבור למסד הנתונים",
        });
      }

      // קבל את פרטי המזמין (אם יש userId)
      let clientName = null;
      if (call.userId) {
        try {
          const collection = getCollection();
          const userId = new ObjectId(call.userId);
          const user = await collection.findOne({ _id: userId });
          if (user) {
            clientName = user.username || null;
          }
        } catch (userError) {
          console.error("Error fetching user:", userError);
        }
      }

      // הכנת אובייקט העבודה לשמירה
      // אובייקט אחד שמכיל את כל פרטי התת-קטגוריה
      const subcategoryInfo = {
        name: call.selectedSubcategory?.name || null,
        category: call.selectedSubcategory?.category || null,
        price: call.selectedSubcategory?.price || null,
        typeWork: call.selectedSubcategory?.typeWork || null, // לשעה או קבלנות
      };

      const originalLocationText =
        typeof call.location === "string"
          ? call.location.trim()
          : String(call.location || "");

      const jobData = {
        clientId: call.userId || null,
        clientName: clientName,
        handymanId: null,
        handymanName: null,
        subcategoryInfo: subcategoryInfo, // אובייקט אחד עם כל המידע
        workType: call.workType || "קלה", // קלה/מורכבת/קשה - מחוץ ל-subcategoryInfo
        desc:
          typeof call.desc === "string"
            ? call.desc.trim()
            : String(call.desc || ""),
        // נמנע משמירת "המיקום שלי" כברירת מחדל; נמלא אחרי גיאוקידינג
        locationText: "",
        imageUrl: call.imageUrl || call.imagePreview || "",
        when: call.when || "asap",
        urgent: call.urgent || false,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const usingMyLocation =
        call?.usingMyLocation === true || call?.callLocationMode === "my";
      // אם יש קואורדינטות ו-usingMyLocation הוא true, הוסף אותן
      // אם usingMyLocation הוא false, אל תשתמש בקואורדינטות שנשלחו (יכול להיות שזה קואורדינטות של המשתמש)
      if (
        usingMyLocation &&
        call.coordinates &&
        (call.coordinates.lng !== undefined ||
          call.coordinates.lon !== undefined) &&
        call.coordinates.lat !== undefined
      ) {
        const rawLng =
          call.coordinates.lng !== undefined
            ? call.coordinates.lng
            : call.coordinates.lon;
        const parsedLng = parseFloat(rawLng);
        const parsedLat = parseFloat(call.coordinates.lat);
        if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
          jobData.location = {
            type: "Point",
            coordinates: [parsedLng, parsedLat],
          };
          jobData.coordinates = {
            lng: parsedLng,
            lat: parsedLat,
          };
          console.log(
            "📍 [CREATE-CALL] Coordinates from request (My Location):",
            {
              lng: parsedLng,
              lat: parsedLat,
              usingMyLocation: usingMyLocation,
            }
          );

          // Reverse geocode רק כאשר זו בחירה של "המיקום שלי"
          if (usingMyLocation) {
            try {
              const response = await axios.get(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${parsedLng},${parsedLat}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&types=place&limit=1`
              );
              let features = response.data?.features || [];
              let feature = features[0];
              if (!feature) {
                try {
                  const fallbackRes = await axios.get(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${parsedLng},${parsedLat}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&limit=5`
                  );
                  features = fallbackRes.data?.features || [];
                  feature =
                    features.find(
                      (f) =>
                        (f.id || "").startsWith("place") ||
                        (f.id || "").startsWith("locality") ||
                        (f.id || "").startsWith("region")
                    ) || features[0];
                } catch (fallbackErr) {
                  console.warn(
                    "⚠️ Mapbox fallback failed",
                    fallbackErr?.message || fallbackErr
                  );
                }
              }
              if (!feature) {
                console.warn("⚠️ Mapbox returned no features for coords", {
                  lng: parsedLng,
                  lat: parsedLat,
                });
              }
              const mapboxNameHe =
                feature?.text_he ||
                feature?.place_name_he ||
                feature?.context?.find((c) => c.text_he)?.text_he ||
                "";
              const mapboxName =
                feature?.text ||
                feature?.place_name ||
                feature?.context?.find((c) => c.id?.startsWith("place"))
                  ?.text ||
                feature?.context?.find((c) => c.id?.startsWith("locality"))
                  ?.text ||
                feature?.context?.find((c) => c.id?.startsWith("region"))
                  ?.text ||
                "";
              const contextName =
                feature?.context
                  ?.map((c) => c.text || c.place_name)
                  .find(Boolean) || "";

              const originalClean =
                originalLocationText &&
                originalLocationText.trim() !== "המיקום שלי"
                  ? originalLocationText.trim()
                  : "";

              let englishCandidate =
                mapboxName ||
                feature?.place_name ||
                contextName ||
                originalClean ||
                "";

              let nominatimHe = "";
              let nominatimName = "";
              if (
                (!englishCandidate || !englishCandidate.trim().length) &&
                (!mapboxNameHe || !mapboxNameHe.trim().length)
              ) {
                try {
                  const nomRes = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLng}&accept-language=he&zoom=14`,
                    { headers: { "User-Agent": "hendiman-app" } }
                  );
                  nominatimHe = nomRes.data?.display_name || "";
                  nominatimName =
                    nomRes.data?.address?.city ||
                    nomRes.data?.address?.town ||
                    nomRes.data?.address?.village ||
                    nomRes.data?.address?.suburb ||
                    "";
                  if (nominatimName) {
                    englishCandidate = nominatimName;
                  } else if (nominatimHe && !isHebrew(nominatimHe)) {
                    englishCandidate = nominatimHe;
                  }
                } catch (nomErr) {
                  console.error("Error in Nominatim reverse:", nomErr?.message);
                }
              }

              const finalMapboxHe =
                (mapboxNameHe && mapboxNameHe.trim()) || nominatimHe || "";

              const localHeb = mapEnglishToHebrew(englishCandidate);

              const hebFromMapbox =
                finalMapboxHe &&
                finalMapboxHe.trim().length &&
                isHebrew(finalMapboxHe)
                  ? finalMapboxHe
                  : "";
              const hebFromLocal =
                localHeb && localHeb.trim().length && isHebrew(localHeb)
                  ? localHeb
                  : "";

              let translated =
                hebFromMapbox ||
                hebFromLocal ||
                (localHeb && localHeb.trim().length && localHeb) ||
                englishCandidate;
              try {
                if (translated === englishCandidate && englishCandidate) {
                  const translateRes = await axios.post(
                    "https://libretranslate.com/translate",
                    {
                      q: englishCandidate,
                      source: "en",
                      target: "he",
                      format: "text",
                    },
                    {
                      headers: { "Content-Type": "application/json" },
                    }
                  );
                  translated =
                    translateRes.data?.translatedText ||
                    translateRes.data ||
                    translated;
                }
              } catch (translateErr) {
                console.error(
                  "Error translating locationText:",
                  translateErr?.message
                );
                translated = hebFromLocal || englishCandidate;
              }

              jobData.locationText =
                translated ||
                hebFromLocal ||
                englishCandidate ||
                originalClean ||
                "מיקום" ||
                `${parsedLat}, ${parsedLng}`;

              jobData.locationTextEn =
                englishCandidate ||
                mapboxName ||
                feature?.place_name ||
                contextName ||
                nominatimName ||
                originalClean ||
                `${parsedLat}, ${parsedLng}`;
            } catch (error) {
              console.error("Error fetching name address:", error);
            }
          }
        }
      } else if (
        !usingMyLocation &&
        call.coordinates &&
        Object.keys(call.coordinates).length > 0
      ) {
        console.log(
          "⚠️ [CREATE-CALL] Ignoring coordinates (not using My Location):",
          call.coordinates
        );
      }

      // אם locationText עדיין נראה כמו קואורדינטות, החלף לטקסט המקורי או "מיקום"
      const coordRegex = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/;
      if (
        jobData.locationText &&
        coordRegex.test(jobData.locationText.trim()) &&
        originalLocationText &&
        originalLocationText.trim() &&
        originalLocationText.trim() !== "המיקום שלי"
      ) {
        jobData.locationText = originalLocationText.trim();
      } else if (
        jobData.locationText &&
        coordRegex.test(jobData.locationText.trim()) &&
        (!originalLocationText || originalLocationText.trim() === "המיקום שלי")
      ) {
        jobData.locationText = "מיקום";
      }

      if (
        jobData.locationTextEn &&
        coordRegex.test(String(jobData.locationTextEn).trim())
      ) {
        jobData.locationTextEn =
          originalLocationText && originalLocationText.trim()
            ? originalLocationText.trim()
            : "location";
      }

      // fallback אם לא מולא (למשל ללא קואורדינטות): שמור את הטקסט המקורי אם הוא לא "המיקום שלי"
      if (
        !jobData.locationText ||
        !jobData.locationText.trim().length ||
        jobData.locationText.trim() === "המיקום שלי"
      ) {
        if (
          originalLocationText &&
          originalLocationText.trim().length &&
          originalLocationText.trim() !== "המיקום שלי"
        ) {
          jobData.locationText = originalLocationText;
        } else {
          // fallback אחרון כדי לא להשאיר ריק: קואורדינטות אם קיימות
          if (jobData.coordinates?.lat && jobData.coordinates?.lng) {
            jobData.locationText = "מיקום";
          } else {
            jobData.locationText = jobData.locationText || "מיקום";
          }
        }
      }

      // אם אין קואורדינטות אבל יש מיקום טקסטואלי שהוזן (לא "המיקום שלי"), נסה לחפש במאפבוקס (forward geocoding)
      // או אם יש קואורדינטות אבל הן לא מ-"המיקום שלי", נמחק אותן ונמצא אותן מחדש

      if (
        (!jobData.location ||
          !jobData.coordinates ||
          (!usingMyLocation &&
            call.coordinates &&
            Object.keys(call.coordinates).length > 0)) &&
        originalLocationText &&
        originalLocationText.trim().length &&
        originalLocationText.trim() !== "המיקום שלי"
      ) {
        // אם יש קואורדינטות אבל זה לא "המיקום שלי", נמחק אותן כדי למצוא אותן מחדש
        if (!usingMyLocation && jobData.coordinates) {
          console.log(
            "🧹 [CREATE-CALL] Clearing coordinates (not using My Location):",
            jobData.coordinates
          );
          jobData.location = null;
          jobData.coordinates = null;
        }
        let coordinatesFound = false;
        const selectedCity = call.selectedCity; // הישוב שנבחר מה-JSON

        // נסה קודם עם השם בעברית
        try {
          const encoded = encodeURIComponent(originalLocationText.trim());
          const fwdUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&types=place&limit=5`;
          const fwdRes = await axios.get(fwdUrl);
          const features = fwdRes.data?.features || [];

          // מצא את התוצאה שתואמת לישוב שנבחר
          let matchingFeature = null;
          if (selectedCity) {
            const cityName = (selectedCity.name || selectedCity.שם_ישוב || "")
              .trim()
              .toLowerCase();
            const cityEngName = (
              selectedCity.english_name ||
              selectedCity.שם_ישוב_לועזי ||
              ""
            )
              .trim()
              .toLowerCase();

            // חפש תוצאה שתואמת לשם הישוב
            matchingFeature = features.find((feature) => {
              const featureName = (
                feature.text_he ||
                feature.place_name_he ||
                feature.text ||
                feature.place_name ||
                ""
              )
                .trim()
                .toLowerCase();
              const featureEngName = (feature.text || feature.place_name || "")
                .trim()
                .toLowerCase();

              // בדוק התאמה מדויקת או חלקית
              // עדיפות להתאמה מדויקת
              if (featureName === cityName || featureEngName === cityEngName) {
                return true;
              }
              // אחר כך בדוק התאמה חלקית (אבל רק אם השם לא קצר מדי)
              if (cityName.length >= 3 && cityEngName.length >= 3) {
                return (
                  featureName.includes(cityName) ||
                  cityName.includes(featureName) ||
                  featureEngName.includes(cityEngName) ||
                  cityEngName.includes(featureEngName)
                );
              }
              return false;
            });
          }

          // אם יש selectedCity אבל לא מצאנו התאמה, לא נשתמש בתוצאה
          // אם אין selectedCity, נשתמש בתוצאה הראשונה
          const feature = selectedCity ? matchingFeature : features[0];

          if (feature) {
            const [lng, lat] =
              (feature.center &&
                feature.center.length >= 2 &&
                feature.center) ||
              (feature.geometry?.coordinates &&
                feature.geometry.coordinates.length >= 2 &&
                feature.geometry.coordinates) ||
              [];
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
              jobData.location = {
                type: "Point",
                coordinates: [lng, lat],
              };
              jobData.coordinates = { lng, lat };
              coordinatesFound = true;
              console.log(
                "✅ [CREATE-CALL] Coordinates found via forward geocoding (Hebrew):",
                {
                  location: originalLocationText,
                  coordinates: { lng, lat },
                  matchedFeature: !!matchingFeature,
                }
              );

              // השתמש בשם מה-JSON אם יש, אחרת מהתוצאה
              const hebName = selectedCity
                ? selectedCity.name ||
                  selectedCity.שם_ישוב ||
                  originalLocationText
                : feature.place_name_he ||
                  feature.text_he ||
                  feature.place_name ||
                  feature.text ||
                  originalLocationText;
              const engName = selectedCity
                ? selectedCity.english_name ||
                  selectedCity.שם_ישוב_לועזי ||
                  call.locationEnglishName
                : feature.place_name ||
                  feature.text ||
                  call.locationEnglishName ||
                  originalLocationText;

              if (
                !jobData.locationText ||
                jobData.locationText === "המיקום שלי"
              ) {
                jobData.locationText = hebName;
              }
              if (!jobData.locationTextEn) {
                jobData.locationTextEn = engName;
              }
            }
          }
        } catch (fwdErr) {
          console.error("Forward geocoding (Hebrew) failed:", fwdErr?.message);
        }

        // אם לא מצאנו קואורדינטות בעברית, נסה עם השם באנגלית
        if (
          !coordinatesFound &&
          call.locationEnglishName &&
          call.locationEnglishName.trim()
        ) {
          try {
            const encodedEn = encodeURIComponent(
              call.locationEnglishName.trim()
            );
            const fwdUrlEn = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedEn}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&types=place&limit=5`;
            const fwdResEn = await axios.get(fwdUrlEn);
            const featuresEn = fwdResEn.data?.features || [];

            // מצא את התוצאה שתואמת לישוב שנבחר
            let matchingFeatureEn = null;
            if (selectedCity) {
              const cityEngName = (
                selectedCity.english_name ||
                selectedCity.שם_ישוב_לועזי ||
                ""
              )
                .trim()
                .toLowerCase();

              matchingFeatureEn = featuresEn.find((feature) => {
                const featureEngName = (
                  feature.text ||
                  feature.place_name ||
                  ""
                )
                  .trim()
                  .toLowerCase();
                const featurePlaceName = (feature.place_name || "")
                  .trim()
                  .toLowerCase();

                // עדיפות להתאמה מדויקת
                if (featureEngName === cityEngName) {
                  return true;
                }
                // בדוק אם השם המלא (place_name) מכיל את השם המלא של העיר
                // לדוגמה: "Tirat Karmel" צריך להתאים ל-"Tirat Karmel, Haifa District, Israel"
                if (
                  cityEngName.includes(" ") &&
                  featurePlaceName.includes(cityEngName)
                ) {
                  return true;
                }
                // בדוק התאמה חלקית (אבל רק אם השם לא קצר מדי)
                if (cityEngName.length >= 3) {
                  // אם השם המלא של העיר מכיל מילים מרובות, בדוק שהכל מופיע
                  const cityWords = cityEngName.split(/\s+/);
                  if (cityWords.length > 1) {
                    // אם יש יותר ממילה אחת, בדוק שכל המילים מופיעות
                    const allWordsMatch = cityWords.every(
                      (word) =>
                        featurePlaceName.includes(word) ||
                        featureEngName.includes(word)
                    );
                    if (allWordsMatch) {
                      return true;
                    }
                  }
                  // בדוק התאמה חלקית רגילה - אבל רק אם השם המלא של התוצאה מכיל את השם המלא של העיר
                  // זה מונע התאמה של "Tira" ל-"Tirat Karmel"
                  if (featurePlaceName.includes(cityEngName)) {
                    return true;
                  }
                  // בדוק התאמה חלקית רק אם השם המלא של העיר מכיל את השם המלא של התוצאה
                  // אבל רק אם התוצאה ארוכה מספיק (למנוע התאמה של "Tira" ל-"Tirat Karmel")
                  if (
                    cityEngName.includes(featureEngName) &&
                    featureEngName.length >= cityEngName.length * 0.8
                  ) {
                    return true;
                  }
                  return false;
                }
                return false;
              });
            }

            // אם יש selectedCity אבל לא מצאנו התאמה, נסה להשתמש ב-Nominatim
            // אם אין selectedCity, נשתמש בתוצאה הראשונה
            let featureEn = selectedCity ? matchingFeatureEn : featuresEn[0];

            // אם לא מצאנו התאמה טובה ב-Mapbox, נסה Nominatim
            if (!featureEn && selectedCity && call.locationEnglishName) {
              try {
                const nomQuery = encodeURIComponent(
                  call.locationEnglishName.trim() + ", Israel"
                );
                const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${nomQuery}&countrycodes=il&limit=5`;
                const nomRes = await axios.get(nomUrl, {
                  headers: { "User-Agent": "hendiman-app" },
                });
                const nomResults = nomRes.data || [];

                if (nomResults.length > 0) {
                  // מצא את התוצאה הטובה ביותר
                  const cityEngName = (
                    selectedCity.english_name ||
                    selectedCity.שם_ישוב_לועזי ||
                    ""
                  )
                    .trim()
                    .toLowerCase();

                  const bestMatch =
                    nomResults.find((result) => {
                      const displayName = (
                        result.display_name || ""
                      ).toLowerCase();
                      return displayName.includes(cityEngName);
                    }) || nomResults[0];

                  if (bestMatch && bestMatch.lat && bestMatch.lon) {
                    const lng = parseFloat(bestMatch.lon);
                    const lat = parseFloat(bestMatch.lat);
                    if (Number.isFinite(lng) && Number.isFinite(lat)) {
                      // צור feature דמה מ-Nominatim
                      featureEn = {
                        center: [lng, lat],
                        geometry: { coordinates: [lng, lat] },
                        text: bestMatch.display_name.split(",")[0],
                        place_name: bestMatch.display_name,
                        source: "nominatim",
                      };
                    }
                  }
                }
              } catch (nomErr) {
                console.error("Nominatim geocoding failed:", nomErr?.message);
              }
            }

            if (featureEn) {
              const [lng, lat] =
                (featureEn.center &&
                  featureEn.center.length >= 2 &&
                  featureEn.center) ||
                (featureEn.geometry?.coordinates &&
                  featureEn.geometry.coordinates.length >= 2 &&
                  featureEn.geometry.coordinates) ||
                [];
              if (Number.isFinite(lng) && Number.isFinite(lat)) {
                jobData.location = {
                  type: "Point",
                  coordinates: [lng, lat],
                };
                jobData.coordinates = { lng, lat };
                coordinatesFound = true;
                console.log(
                  "✅ [CREATE-CALL] Coordinates found via forward geocoding (English):",
                  {
                    location: call.locationEnglishName,
                    coordinates: { lng, lat },
                    matchedFeature: !!matchingFeatureEn,
                  }
                );

                // השתמש בשם מה-JSON אם יש, אחרת מהתוצאה
                const hebName = selectedCity
                  ? selectedCity.name ||
                    selectedCity.שם_ישוב ||
                    originalLocationText
                  : featureEn.place_name_he ||
                    featureEn.text_he ||
                    featureEn.place_name ||
                    featureEn.text ||
                    originalLocationText;
                const engName = selectedCity
                  ? selectedCity.english_name ||
                    selectedCity.שם_ישוב_לועזי ||
                    call.locationEnglishName
                  : featureEn.place_name ||
                    featureEn.text ||
                    call.locationEnglishName ||
                    originalLocationText;

                if (
                  !jobData.locationText ||
                  jobData.locationText === "המיקום שלי"
                ) {
                  jobData.locationText = hebName;
                }
                if (!jobData.locationTextEn) {
                  jobData.locationTextEn = engName;
                }
              }
            }
          } catch (fwdErrEn) {
            console.error(
              "Forward geocoding (English) failed:",
              fwdErrEn?.message
            );
          }
        }

        // אם עדיין אין קואורדינטות, לא נשמור את העבודה
        if (!coordinatesFound) {
          console.error(
            "❌ [CREATE-CALL] No coordinates found for location:",
            originalLocationText
          );
          return res.status(400).json({
            success: false,
            message: "לא ניתן למצוא את המיקום. אנא נסה שוב או בחר 'לפי מיקום'",
          });
        }
      }

      // בדיקה סופית: אם אין קואורדינטות בכלל, לא נשמור את העבודה
      if (!jobData.location || !jobData.coordinates) {
        console.error(
          "❌ [CREATE-CALL] No coordinates in jobData before saving:",
          {
            hasLocation: !!jobData.location,
            hasCoordinates: !!jobData.coordinates,
            locationText: jobData.locationText,
          }
        );
        return res.status(400).json({
          success: false,
          message: "לא ניתן למצוא את המיקום. אנא נסה שוב או בחר 'לפי מיקום'",
        });
      }

      // שמור את העבודה במסד הנתונים
      const result = await collectionJobs.insertOne(jobData);

      // הוסף את הקריאה כ-specialty למשתמש (אם יש userId)
      if (call.userId) {
        try {
          const collection = getCollection();
          const userId = new ObjectId(call.userId);

          // מצא את המשתמש
          const user = await collection.findOne({ _id: userId });

          if (user) {
            // צור אובייקט specialty מהקריאה
            // משתמש באובייקט subcategoryInfo שכבר נוצר
            const newSpecialty = {
              name: subcategoryInfo.name,
              category: subcategoryInfo.category,
              price: subcategoryInfo.price,
              typeWork: subcategoryInfo.typeWork || null, // לשעה או קבלנות
            };

            // בדוק אם ה-specialty כבר קיים (לפי name)
            let specialties = user.specialties || [];
            const existingIndex = specialties.findIndex(
              (s) => s.name === newSpecialty.name
            );

            if (existingIndex >= 0) {
              // עדכן את ה-specialty הקיים
              specialties[existingIndex] = newSpecialty;
            } else {
              // הוסף specialty חדש
              specialties.push(newSpecialty);
            }

            // עדכן את המשתמש במסד הנתונים
            await collection.updateOne(
              { _id: userId },
              { $set: { specialties: specialties } }
            );
          }
        } catch (specialtyError) {
          // אם יש שגיאה בהוספת specialty, זה לא צריך לעצור את יצירת הקריאה
          console.error("Error adding specialty to user:", specialtyError);
        }
      }

      return res.json({
        success: true,
        message: "הקריאה נוצרה בהצלחה",
        jobId: result.insertedId,
      });
    } catch (error) {
      console.error("Error creating call:", error);
      return res.status(500).json({
        success: false,
        message: "שגיאה ביצירת הקריאה",
        error: error.message,
      });
    }
  });

  // Delete user endpoint
  app.delete("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "User ID required" });
      }
      const usersCol = getCollection();
      const result = await usersCol.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting user",
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

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const { Server } = require("socket.io");
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Socket.IO connection handler
  io.on("connection", (socket) => {
    // Join room for a specific job
    socket.on("join-job", (jobId) => {
      socket.join(`job-${jobId}`);
    });

    // Leave room for a specific job
    socket.on("leave-job", (jobId) => {
      socket.leave(`job-${jobId}`);
    });
  });

  // Make io available globally for use in routes
  app.set("io", io);

  // Start server
  httpServer
    .listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
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
