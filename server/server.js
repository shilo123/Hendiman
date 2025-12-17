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
              // אם זה קטגוריה שלימה (isFullCategory: true)
              if (
                typeof item === "object" &&
                item.name &&
                item.isFullCategory
              ) {
                fullCategoriesArray.push(String(item.name).trim());
                return null; // לא נכלול במיוחדים
              }

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

          jobs = jobs.map((job) => ({
            ...job,
            distanceKm:
              typeof job.distanceMeters === "number"
                ? Math.round((job.distanceMeters / 1000) * 100) / 100
                : calculateDistanceKm(
                    userLng,
                    userLat,
                    job?.location?.coordinates?.[0] ||
                      job?.coordinates?.lng ||
                      null,
                    job?.location?.coordinates?.[1] ||
                      job?.coordinates?.lat ||
                      null
                  ),
          }));
        } catch (geoError) {
          console.error("GeoNear error on /jobs/filter:", geoError.message);

          jobs = await collectionJobs.find(query).toArray();

          jobs = jobs
            .map((job) => {
              const distanceKm = calculateDistanceKm(
                userLng,
                userLat,
                job?.location?.coordinates?.[0] ||
                  job?.coordinates?.lng ||
                  null,
                job?.location?.coordinates?.[1] || job?.coordinates?.lat || null
              );
              return { ...job, distanceKm };
            })
            .filter((job) => {
              if (!maxDistanceMeters || maxDistanceMeters <= 0) return true;
              if (job.distanceKm === null) return true; // keep if no coords
              return job.distanceKm * 1000 <= maxDistanceMeters;
            });
        }
      } else {
        jobs = await collectionJobs.find(query).toArray();
      }

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

  // Update profile (basic fields + specialties)
  app.post("/user/update-profile", async (req, res) => {
    try {
      const { userId, username, phone, email, city, address, specialties } =
        req.body;
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
      if (address !== undefined) update.address = address;
      if (Array.isArray(specialties)) {
        update.specialties = specialties;
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

  // Placeholder endpoints for accept/skip job
  app.post("/jobs/accept", async (req, res) => {
    return res.json({ success: true, received: req.body });
  });
  app.post("/jobs/skip", async (req, res) => {
    return res.json({ success: true, received: req.body });
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
      // אם יש קואורדינטות, הוסף אותן
      if (
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
        }
        try {
          console.log("📍 create-call coords:", {
            lng: parsedLng,
            lat: parsedLat,
            originalLocationText,
          });
          const response = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${parsedLng},${parsedLat}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&types=place&limit=1`
          );
          let features = response.data?.features || [];
          let feature = features[0];
          // אם אין תוצאה, נסה בלי types ועם limit גדול יותר
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
            feature?.context?.find((c) => c.id?.startsWith("place"))?.text ||
            feature?.context?.find((c) => c.id?.startsWith("locality"))?.text ||
            feature?.context?.find((c) => c.id?.startsWith("region"))?.text ||
            "";
          const contextName =
            feature?.context
              ?.map((c) => c.text || c.place_name)
              .find(Boolean) || "";

          const originalClean =
            originalLocationText && originalLocationText.trim() !== "המיקום שלי"
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
              console.log("🧭 Nominatim result:", {
                nominatimHe,
                nominatimName,
              });
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

          console.log("🪪 create-call location candidate:", {
            mapboxName,
            mapboxNameHe: finalMapboxHe,
            contextName,
            originalClean,
            englishCandidate,
            localHeb,
            nominatimHe,
            nominatimName,
            featureExists: Boolean(feature),
          });

          // אם יש שם בעברית ממאפבוקס או מהמיפוי המקומי, נעדיף אותו
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
              console.log(
                "Translated locationText:",
                translated,
                "from:",
                englishCandidate
              );
            }
          } catch (translateErr) {
            console.error(
              "Error translating locationText:",
              translateErr?.message
            );
            // נפילה בתרגום — נעדיף עברית מהמיפוי המקומי אם יש, אחרת את האנגלית
            translated = hebFromLocal || englishCandidate;
          }

          // סדר עדיפות: תרגום/עברית -> מקור באנגלית/מקורי -> קואורדינטות
          jobData.locationText =
            translated ||
            hebFromLocal ||
            englishCandidate ||
            originalClean ||
            "מיקום" ||
            `${parsedLat}, ${parsedLng}`;

          // שמור גם את האנגלית המקורית לשימוש עתידי
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

        // החלפה כפויה בשם אמיתי; אם אין שם, השתמש בקואורדינטות כ-fallback
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
