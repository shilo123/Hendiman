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
const { OpenAI } = require("openai");
const app = express();
const URL_CLIENT = "https://handiman-98cc6d1f0a79.herokuapp.com";
//9:48
// Import configurations and services
const {
  connectDatabase,
  getCollection,
  getCollectionJobs,
  getCollectionRatings,
  getCollectionPayments,
  getCollectionChats,
  getCollectionFinancials,
} = require("./config/database");
const setupPassport = require("./config/passport");
const setupAuthRoutes = require("./routes/auth");
const setupUploadRoutes = require("./routes/upload");
const { sendPushNotification } = require("./services/pushNotificationService");
const { deleteImageFromS3 } = require("./services/uploadService");
const { trackAIUsage } = require("./services/aiCostTracking");

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

  // Only write port.json in development
  if (process.env.NODE_ENV !== "production") {
    try {
      fs.writeFileSync(
        path.join(__dirname, "..", "src", "Url", "port.json"),
        JSON.stringify({ port: PORT })
      );
    } catch (e) {
      // Ignore if file can't be written
    }
  }

  // Middleware - CORS configuration
  let allowedOrigins;
  if (process.env.NODE_ENV === "production") {
    // In production, allow requests from the same origin (server serves client)
    // But also allow IP addresses for mobile access
    app.use(
      cors({
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);

          // Allow same origin
          if (origin.includes("handiman-98cc6d1f0a79.herokuapp.com")) {
            return callback(null, true);
          }

          // Allow IP addresses for mobile access
          if (/^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/.test(origin)) {
            return callback(null, true);
          }

          // Allow localhost for development
          if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
            return callback(null, true);
          }

          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
      })
    );
  } else {
    // In development, allow multiple localhost origins
    allowedOrigins = [
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
            // In development, allow any localhost origin or IP address
            if (
              origin.includes("localhost") ||
              origin.includes("127.0.0.1") ||
              /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/.test(origin)
            ) {
              callback(null, true);
            } else {
              callback(new Error("Not allowed by CORS"));
            }
          }
        },
        credentials: true, // Allow cookies to be sent
      })
    );
  }
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

  // Health check endpoint for connection quality testing (after CORS middleware)
  app.head("/health-check", (req, res) => {
    res.status(200).end();
  });

  app.get("/health-check", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.options("/health-check", (req, res) => {
    res.status(200).end();
  });

  // Log all POST requests for debugging
  app.use((req, res, next) => {
    next();
  });

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
  } catch (error) {}
  //

  //
  //
  // Setup Passport
  setupPassport(collection);
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup routes
  setupAuthRoutes(app, URL_CLIENT, collection);
  setupUploadRoutes(app);
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
          // Mapbox batch error occurred, trying individual requests
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
      // במקרה של שגיאה, החזר את ההנדימנים ללא זמן נסיעה
      return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
    }
  }
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
  function handymanMatchesJob(handyman, job) {
    if (!handyman.specialties || !Array.isArray(handyman.specialties)) {
      return false;
    }

    // Handle subcategoryInfo as array
    const firstSubcategory =
      Array.isArray(job.subcategoryInfo) && job.subcategoryInfo.length > 0
        ? job.subcategoryInfo[0]
        : job.subcategoryInfo || {};
    const jobCategory = firstSubcategory.category || job.category || "";
    const jobCategoryLower = jobCategory.trim().toLowerCase();
    const jobSubcategoryName =
      firstSubcategory.subcategory || job.subcategoryName || "";
    const jobSubLower = jobSubcategoryName.trim().toLowerCase();

    // Extract full categories and subcategories from handyman specialties
    const fullCategories = handyman.specialties
      .filter((s) => s && (s.type === "category" || s.isFullCategory === true))
      .map((s) => (s.name || "").trim().toLowerCase())
      .filter((n) => n.length > 0);

    const subCategories = handyman.specialties
      .filter(
        (s) => s && (s.type === "subCategory" || (!s.type && !s.isFullCategory))
      )
      .map((s) => (s.name || "").trim().toLowerCase())
      .filter((n) => n.length > 0);

    // Check if matches full category
    if (fullCategories.length > 0 && jobCategoryLower) {
      if (fullCategories.includes(jobCategoryLower)) {
        return true;
      }
    }

    // Check if matches subcategory
    if (subCategories.length > 0 && jobSubLower) {
      if (
        subCategories.some((spec) => {
          if (jobSubLower === spec) return true;
          if (jobSubLower.includes(spec) || spec.includes(jobSubLower))
            return true;
          const jobWords = jobSubLower.split(/\s+/);
          const specWords = spec.split(/\s+/);
          return jobWords.some((w) => specWords.includes(w));
        })
      ) {
        return true;
      }
    }

    // If no specialties filter, return true (show all jobs)
    if (fullCategories.length === 0 && subCategories.length === 0) {
      return true;
    }

    return false;
  }
  async function notifyRelevantHandymen(jobId, jobData, usersCollection) {
    try {
      // Get job coordinates
      const jobLng =
        jobData.location?.coordinates?.[0] || jobData.coordinates?.lng;
      const jobLat =
        jobData.location?.coordinates?.[1] || jobData.coordinates?.lat;

      if (!jobLng || !jobLat) {
        // No coordinates, can't filter by distance
        return;
      }

      // Find all handymen within 25km (default max distance)
      const maxDistanceMeters = 25000; // 25km
      let relevantHandymen = [];

      try {
        // Use geospatial query to find handymen within range
        relevantHandymen = await usersCollection
          .find({
            isHandyman: true,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [jobLng, jobLat],
                },
                $maxDistance: maxDistanceMeters,
              },
            },
          })
          .toArray();
      } catch (geoError) {
        // Fallback: get all handymen and filter manually
        const allHandymen = await usersCollection
          .find({ isHandyman: true })
          .toArray();

        relevantHandymen = allHandymen.filter((handyman) => {
          const handymanLng =
            handyman.location?.coordinates?.[0] || handyman.coordinates?.lng;
          const handymanLat =
            handyman.location?.coordinates?.[1] || handyman.coordinates?.lat;

          if (!handymanLng || !handymanLat) return false;

          const distanceKm = calculateDistanceKm(
            jobLng,
            jobLat,
            handymanLng,
            handymanLat
          );

          return distanceKm !== null && distanceKm <= 25; // 25km max
        });
      }

      // Filter by specialties
      relevantHandymen = relevantHandymen.filter((handyman) =>
        handymanMatchesJob(handyman, jobData)
      );

      // Send push notifications to all relevant handymen
      const notificationPromises = relevantHandymen
        .filter((handyman) => handyman.fcmToken)
        .map(async (handyman) => {
          try {
            // Handle subcategoryInfo as array
            const firstSubcategory =
              Array.isArray(jobData.subcategoryInfo) &&
              jobData.subcategoryInfo.length > 0
                ? jobData.subcategoryInfo[0]
                : jobData.subcategoryInfo || {};
            const jobSubcategoryName =
              firstSubcategory.subcategory || jobData.subcategoryName || "";
            const jobLocation = jobData.locationText || "מיקום לא צוין";

            await sendPushNotification(
              handyman.fcmToken,
              "עבודה חדשה באזור שלך! 🔧",
              `${jobSubcategoryName} - ${jobLocation}`,
              {
                type: "new_job",
                jobId: jobId.toString(),
                subcategoryName: jobSubcategoryName,
                location: jobLocation,
              }
            );
          } catch (error) {}
        });

      await Promise.all(notificationPromises);
    } catch (error) {}
  }
  async function ensureJobsGeoIndex() {
    try {
      const col = getCollectionJobs();
      if (col) {
        await col.createIndex({ location: "2dsphere" });
      }
    } catch (err) {
      // Index creation failed, continue anyway
    }
  }

  async function ensureUsersGeoIndex() {
    try {
      const col = getCollection();
      if (col) {
        await col.createIndex({ location: "2dsphere" });
      }
    } catch (err) {
      // Index creation failed, continue anyway
    }
  }

  ensureJobsGeoIndex();
  ensureUsersGeoIndex();

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
        // בדוק אם ה-googleId שהתקבל מהקליינט תואם ל-googleId שיש בשרת
        if (user.googleId !== googleId) {
          return res.json({ message: "NoUser" });
        }
        // Return success with the googleId as password for the client to use
        // המר את ה-_id ל-string כדי שיעבוד עם Vue Router
        return res.json({
          message: "Success",
          password: user.googleId,
          user: {
            _id: user._id ? user._id.toString() : user._id,
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
          } catch (error) {}
        }
      }

      // בדוק אם יש MAPBOX_TOKEN
      if (!process.env.MAPBOX_TOKEN) {
        // MAPBOX_TOKEN is not defined in .env file
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
          const response = await axios.get(url, {
            timeout: 10000, // 10 seconds timeout
          });
          if (response.data.features && response.data.features.length > 0) {
            return response.data;
          }
        } catch (error) {
          // אם זה timeout, נחזיר null כדי להמשיך בלי קואורדינטות
          if (
            error.code === "ECONNABORTED" ||
            error.message.includes("timeout")
          ) {
          }
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
        // Address not found in Mapbox, continuing without coordinates
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
      } catch (coordError) {}

      // בדיקה אם השם כבר קיים במערכת
      // ננרמל את השם לפני הבדיקה (הסרת רווחים מיותרים)
      const normalizedFullName = fullName.replace(/\s+/g, " ").trim();

      // נחפש רק עם השם המקורי והשם המנורמל (בלי regex כדי למנוע מציאת שמות דומים)
      const existingUserByName = await collection.findOne({
        $or: [{ username: fullName }, { username: normalizedFullName }],
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
          message:
            "המייל כבר בשימוש. אנא השתמש במייל אחר או התחבר לחשבון הקיים.",
        });
      }

      // בדיקה אם מספר הטלפון כבר קיים במערכת
      if (phone && phone.trim()) {
        const existingUserByPhone = await collection.findOne({
          phone: phone.trim(),
        });

        if (existingUserByPhone) {
          return res.status(400).json({
            success: false,
            message:
              "מספר הטלפון כבר בשימוש. אנא השתמש במספר טלפון אחר או התחבר לחשבון הקיים.",
          });
        }
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
            message: "משתמש Google כבר קיים במערכת. אנא התחבר לחשבון הקיים.",
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
        // ודא ש-specialties הוא מערך של אובייקטים עם name, isFullCategory, type בלבד
        let specialtiesArray = [];

        if (Array.isArray(specialties)) {
          // אם זה כבר מערך, נמיר לאובייקטים עם הפורמט החדש
          specialtiesArray = specialties
            .filter((item) => item !== null && item !== undefined)
            .map((item) => {
              // אם זה אובייקט עם name
              if (typeof item === "object" && item.name) {
                const name = String(item.name).trim();
                const isFullCategory =
                  item.isFullCategory === true || item.type === "category";
                return {
                  name,
                  isFullCategory: isFullCategory,
                  type: isFullCategory ? "category" : "subCategory",
                };
              }
              // אם זה string (תאימות לאחור - נניח שזה קטגוריה שלימה)
              if (typeof item === "string") {
                const name = String(item).trim();
                return {
                  name,
                  isFullCategory: true,
                  type: "category",
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
                    const name = String(item.name).trim();
                    const isFullCategory =
                      item.isFullCategory === true || item.type === "category";
                    return {
                      name,
                      isFullCategory: isFullCategory,
                      type: isFullCategory ? "category" : "subCategory",
                    };
                  }
                  if (typeof item === "string") {
                    return {
                      name: String(item).trim(),
                      isFullCategory: true,
                      type: "category",
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
                  isFullCategory: true,
                  type: "category",
                },
              ].filter((item) => item.name.length > 0);
            }
          } catch (e) {
            // אם JSON.parse נכשל, נמיר למערך עם אובייקט אחד
            specialtiesArray = [
              {
                name: String(specialties).trim(),
                isFullCategory: true,
                type: "category",
              },
            ].filter((item) => item.name.length > 0);
          }
        }

        // ודא שזה מערך של אובייקטים לפני השמירה!
        // רק שדות: name, isFullCategory, type
        userData.specialties = Array.isArray(specialtiesArray)
          ? specialtiesArray
              .filter(
                (item) => item !== null && item.name && item.name.length > 0
              )
              .map((item) => ({
                name: item.name.trim(),
                isFullCategory: item.isFullCategory === true,
                type:
                  item.type ||
                  (item.isFullCategory ? "category" : "subCategory"),
              }))
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
      // תפוס כל שגיאה שלא נתפסה

      // ודא שהתשובה לא נשלחה כבר
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "שגיאה בהרשמה. אנא נסה שוב מאוחר יותר.",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  }); // end register-handyman handler
  app.get("/jobs/filter", async (req, res) => {
    try {
      if (!collectionJobs) {
        return res.status(500).json({
          success: false,
          message: "שגיאה בחיבור למסד הנתונים",
        });
      }

      const {
        status,
        maxKm,
        lng,
        lat,
        handymanId,
        workType,
        minPrice,
        maxPrice,
      } = req.query;
      const query = {};
      if (status && status !== "all") {
        query.status = status;
      } else if ((!status || status === "all") && handymanId) {
        // For handyman, exclude "done" jobs when status is "all" or not specified
        query.status = { $ne: "done" };
      }
      if (workType && workType !== "") {
        query.workType = workType;
      }

      const userLng = parseFloat(lng);
      const userLat = parseFloat(lat);
      const hasCoords = !isNaN(userLng) && !isNaN(userLat);
      const maxDistanceMeters =
        maxKm && !isNaN(parseFloat(maxKm)) ? parseFloat(maxKm) * 1000 : null;

      // Jobs filter request received

      let jobs = [];

      // Get handyman specialties if handymanId is provided
      let handymanSpecialties = null;
      if (handymanId) {
        try {
          const handymanObjectId = new ObjectId(handymanId);
          const handyman = await collection.findOne({ _id: handymanObjectId });
          if (
            handyman &&
            handyman.specialties &&
            Array.isArray(handyman.specialties)
          ) {
            handymanSpecialties = handyman.specialties;
          }
        } catch (error) {
          // Invalid handymanId, continue without filtering
        }
      }

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

            return {
              ...job,
              distanceKm,
            };
          });
        } catch (geoError) {
          // GeoNear error on /jobs/filter

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

              return { ...job, distanceKm };
            })
            .filter((job) => {
              if (!maxDistanceMeters || maxDistanceMeters <= 0) return true;
              if (job.distanceKm === null) return true; // keep if no coords
              const passed = job.distanceKm * 1000 <= maxDistanceMeters;
              return passed;
            });
        }
      } else {
        jobs = await collectionJobs.find(query).toArray();
      }

      // Filter jobs by handyman specialties if handymanId was provided
      if (handymanSpecialties && handymanSpecialties.length > 0) {
        // Helper function to check if job matches handyman specialties
        const jobMatchesSpecialties = (job) => {
          // subcategoryInfo is an array, need to check all items
          const subcategoryInfoArray = Array.isArray(job.subcategoryInfo)
            ? job.subcategoryInfo
            : job.subcategoryInfo
            ? [job.subcategoryInfo]
            : [];

          // If no subcategoryInfo, check old format
          if (subcategoryInfoArray.length === 0) {
            const jobCategory = (job.category || "").trim().toLowerCase();

            // Only check if handyman has full category match (case-insensitive)
            const matches = handymanSpecialties.some((s) => {
              const specialtyName = (s.name || "").trim().toLowerCase();
              const isFullCategory =
                s.type === "category" || s.isFullCategory === true;
              const nameMatches = specialtyName === jobCategory;
              return nameMatches && isFullCategory;
            });
            return matches;
          }

          // Check each subcategoryInfo item - ALL categories must match
          // Only match by full categories (not subcategories)
          const allMatch = subcategoryInfoArray.every((subcatInfo, index) => {
            const jobCategory = (subcatInfo.category || "")
              .trim()
              .toLowerCase();

            // Only check if handyman has full category match (case-insensitive comparison)
            const matches = handymanSpecialties.some((s) => {
              const specialtyName = (s.name || "").trim().toLowerCase();
              const isFullCategory =
                s.type === "category" || s.isFullCategory === true;
              const nameMatches = specialtyName === jobCategory;
              return nameMatches && isFullCategory;
            });
            return matches;
          });
          return allMatch;
        };

        jobs = jobs.filter(jobMatchesSpecialties);
      }

      // If handymanId is provided, filter jobs
      if (handymanId) {
        const handymanIdString = String(handymanId);
        const jobsBeforeHandymanFilter = jobs.length;
        jobs = jobs.filter((job) => {
          // Exclude "done" jobs for handyman (unless specifically requested)
          if (job.status === "done" && (!status || status === "all")) {
            return false;
          }

          // Priority 1: Show jobs where handymanIdSpecial matches this handyman
          if (job.handymanIdSpecial) {
            return String(job.handymanIdSpecial) === handymanIdString;
          }

          // Priority 2: Show open jobs (handymanId is null or doesn't exist)
          // and match handyman specialties (already filtered above)
          if (!job.handymanId) return true;
          if (Array.isArray(job.handymanId) && job.handymanId.length === 0)
            return true;
          return false;
        });
        const jobsAfterHandymanFilter = jobs.length;
      }

      // Filter by price range if provided
      if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
        const minPriceNum = parseFloat(minPrice);
        if (!isNaN(minPriceNum)) {
          jobs = jobs.filter((job) => {
            // Get price from subcategoryInfo array or job.price
            let jobPrice = null;
            if (
              job.subcategoryInfo &&
              Array.isArray(job.subcategoryInfo) &&
              job.subcategoryInfo.length > 0
            ) {
              // Sum all prices from subcategoryInfo array
              jobPrice = job.subcategoryInfo.reduce((sum, subcat) => {
                const price = subcat?.price || 0;
                return (
                  sum +
                  (typeof price === "number" ? price : parseFloat(price) || 0)
                );
              }, 0);
            } else if (job.subcategoryInfo?.price) {
              jobPrice =
                typeof job.subcategoryInfo.price === "number"
                  ? job.subcategoryInfo.price
                  : parseFloat(job.subcategoryInfo.price) || null;
            } else if (job.price) {
              jobPrice =
                typeof job.price === "number"
                  ? job.price
                  : parseFloat(job.price) || null;
            }
            // If no price found, include the job (don't filter it out)
            if (jobPrice === null) return true;
            return jobPrice >= minPriceNum;
          });
        }
      }

      if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
        const maxPriceNum = parseFloat(maxPrice);
        if (!isNaN(maxPriceNum)) {
          jobs = jobs.filter((job) => {
            // Get price from subcategoryInfo array or job.price
            let jobPrice = null;
            if (
              job.subcategoryInfo &&
              Array.isArray(job.subcategoryInfo) &&
              job.subcategoryInfo.length > 0
            ) {
              // Sum all prices from subcategoryInfo array
              jobPrice = job.subcategoryInfo.reduce((sum, subcat) => {
                const price = subcat?.price || 0;
                return (
                  sum +
                  (typeof price === "number" ? price : parseFloat(price) || 0)
                );
              }, 0);
            } else if (job.subcategoryInfo?.price) {
              jobPrice =
                typeof job.subcategoryInfo.price === "number"
                  ? job.subcategoryInfo.price
                  : parseFloat(job.subcategoryInfo.price) || null;
            } else if (job.price) {
              jobPrice =
                typeof job.price === "number"
                  ? job.price
                  : parseFloat(job.price) || null;
            }
            // If no price found, include the job (don't filter it out)
            if (jobPrice === null) return true;
            return jobPrice <= maxPriceNum;
          });
        }
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

      // Optimize: Only fetch necessary fields and limit if possible
      // For handyman, we'll filter by specialties anyway, so we can optimize the query
      // For client, exclude "done" jobs that have been rated (ratingSubmitted = true)
      // We'll filter done jobs later based on clientId
      let Jobs = collectionJobs
        ? await collectionJobs
            .find(
              {},
              {
                projection: {
                  _id: 1,
                  status: 1,
                  category: 1,
                  subcategoryInfo: 1,
                  clientId: 1,
                  clientName: 1,
                  handymanId: 1,
                  handymanName: 1,
                  coordinates: 1,
                  location: 1,
                  locationText: 1,
                  when: 1,
                  whenLabel: 1,
                  imageUrl: 1,
                  desc: 1,
                  workType: 1,
                  urgent: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  ratingSubmitted: 1,
                  // Add other fields that might be needed
                },
              }
            )
            .toArray()
        : [];

      // Filter out "done" jobs with ratingSubmitted for clients
      // Keep "done" jobs without ratingSubmitted so client can rate them
      if (!User.isHandyman) {
        Jobs = Jobs.filter((job) => {
          // If job is done and rating was submitted, exclude it
          if (job.status === "done" && job.ratingSubmitted === true) {
            return false;
          }
          return true;
        });
      }

      // Filter jobs by handyman specialties if user is a handyman
      if (
        User.isHandyman &&
        User.specialties &&
        Array.isArray(User.specialties) &&
        User.specialties.length > 0
      ) {
        const handymanSpecialties = User.specialties;

        // Helper function to check if job matches handyman specialties
        const jobMatchesSpecialties = (job) => {
          // subcategoryInfo is an array, need to check all items
          const subcategoryInfoArray = Array.isArray(job.subcategoryInfo)
            ? job.subcategoryInfo
            : job.subcategoryInfo
            ? [job.subcategoryInfo]
            : [];

          // If no subcategoryInfo, check old format
          if (subcategoryInfoArray.length === 0) {
            const jobCategory = (job.category || "").trim().toLowerCase();

            // Only check if handyman has full category match (case-insensitive)
            const matches = handymanSpecialties.some((s) => {
              const specialtyName = (s.name || "").trim().toLowerCase();
              const isFullCategory =
                s.type === "category" || s.isFullCategory === true;
              const nameMatches = specialtyName === jobCategory;
              return nameMatches && isFullCategory;
            });
            return matches;
          }

          // Check each subcategoryInfo item - ALL categories must match
          // Only match by full categories (not subcategories)
          const allMatch = subcategoryInfoArray.every((subcatInfo, index) => {
            const jobCategory = (subcatInfo.category || "")
              .trim()
              .toLowerCase();

            // Only check if handyman has full category match (case-insensitive comparison)
            const matches = handymanSpecialties.some((s) => {
              const specialtyName = (s.name || "").trim().toLowerCase();
              const isFullCategory =
                s.type === "category" || s.isFullCategory === true;
              const nameMatches = specialtyName === jobCategory;
              return nameMatches && isFullCategory;
            });
            return matches;
          });
          return allMatch;
        };

        Jobs = Jobs.filter(jobMatchesSpecialties);
      }

      // Filter out "done" jobs for clients - they shouldn't see completed jobs in the main dashboard
      // Clients can only see active jobs (assigned, on_the_way, in_progress, or open)
      // Done jobs are only accessible through specific routes (like rating)
      if (!User.isHandyman) {
        Jobs = Jobs.filter((job) => {
          // Exclude all "done" jobs from the main dashboard view
          if (job.status === "done") {
            return false;
          }
          return true;
        });
      }

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

  // Endpoint to get count of registered handymen
  app.get("/handymen-count", async (req, res) => {
    try {
      if (!collection) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      const count = await collection.countDocuments({
        isHandyman: true,
      });

      return res.json({
        success: true,
        count: count,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error counting handymen",
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

  // Get user by ID (handyman or client)
  app.get("/user/:id", async (req, res) => {
    try {
      const collection = getCollection();
      if (!collection) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      const { id } = req.params;
      const user = await collection.findOne({
        _id: new ObjectId(id),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Exclude sensitive data
      const { password, googleId, fcmToken, ...userData } = user;

      return res.json({
        success: true,
        user: userData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching user",
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
  app.get("/location-map-image", async (req, res) => {
    try {
      const { lat, lng, zoom = 15, width = 400, height = 300 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "lat and lng are required",
        });
      }

      if (!process.env.MAPBOX_TOKEN) {
        return res.status(500).json({
          success: false,
          message: "Mapbox token not configured",
        });
      }

      // Use Mapbox Static Images API
      const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff6a00(${lng},${lat})/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${process.env.MAPBOX_TOKEN}`;

      // Redirect to Mapbox image URL
      return res.redirect(mapboxUrl);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error generating map image",
      });
    }
  });

  // Route map image with origin and destination
  app.get("/route-map-image", async (req, res) => {
    try {
      const {
        originLat,
        originLng,
        destLat,
        destLng,
        width = 800,
        height = 600,
      } = req.query;

      if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({
          success: false,
          message: "originLat, originLng, destLat, and destLng are required",
        });
      }

      if (!process.env.MAPBOX_TOKEN) {
        return res.status(500).json({
          success: false,
          message: "Mapbox token not configured",
        });
      }

      // Calculate center point between origin and destination
      const centerLat = (parseFloat(originLat) + parseFloat(destLat)) / 2;
      const centerLng = (parseFloat(originLng) + parseFloat(destLng)) / 2;

      // Calculate zoom level based on distance (simple approximation)
      const latDiff = Math.abs(parseFloat(destLat) - parseFloat(originLat));
      const lngDiff = Math.abs(parseFloat(destLng) - parseFloat(originLng));
      const maxDiff = Math.max(latDiff, lngDiff);
      let zoom = 15;
      if (maxDiff > 0.1) zoom = 11;
      else if (maxDiff > 0.05) zoom = 12;
      else if (maxDiff > 0.02) zoom = 13;
      else if (maxDiff > 0.01) zoom = 14;

      // Use Mapbox Static Images API with two markers and a path overlay
      // Format: path-{strokeWidth}+{strokeColor}-{strokeOpacity}({encodedPath})
      const pathColor = "ff6a00"; // Orange color
      const pathWidth = 4;

      // Create markers: origin (orange) and destination (green)
      const originMarker = `pin-s+${pathColor}(${originLng},${originLat})`;
      const destMarker = `pin-s+22c55e(${destLng},${destLat})`; // Green for destination
      const markers = `${originMarker}|${destMarker}`;

      // Create a path overlay for the route (simplified straight line)
      const pathOverlay = `path-${pathWidth}+${pathColor}-0.8(${originLng},${originLat};${destLng},${destLat})`;

      const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${pathOverlay}/${markers}/${centerLng},${centerLat},${zoom},0/${width}x${height}@2x?access_token=${process.env.MAPBOX_TOKEN}`;

      // Redirect to Mapbox image URL
      return res.redirect(mapboxUrl);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error generating route map image",
      });
    }
  });

  // Get Mapbox token (public token, safe to expose to client)
  app.get("/mapbox-token", (req, res) => {
    if (!process.env.MAPBOX_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "Mapbox token not configured",
      });
    }
    return res.json({
      success: true,
      token: process.env.MAPBOX_TOKEN,
    });
  });

  // Get route data with travel time for interactive map
  app.get("/route-data", async (req, res) => {
    try {
      const { originLat, originLng, destLat, destLng } = req.query;

      if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({
          success: false,
          message: "originLat, originLng, destLat, and destLng are required",
        });
      }

      if (!process.env.MAPBOX_TOKEN) {
        return res.status(500).json({
          success: false,
          message: "Mapbox token not configured",
        });
      }

      try {
        // Use Mapbox Directions API to get route geometry and duration
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${process.env.MAPBOX_TOKEN}&geometries=geojson&steps=false&overview=full`;

        const directionsResponse = await axios.get(directionsUrl);

        if (
          directionsResponse.data &&
          directionsResponse.data.routes &&
          directionsResponse.data.routes.length > 0
        ) {
          const route = directionsResponse.data.routes[0];
          const geometry = route.geometry;
          const durationSeconds = route.duration;
          const distanceMeters = route.distance;

          // Calculate center point for map view
          const centerLat = (parseFloat(originLat) + parseFloat(destLat)) / 2;
          const centerLng = (parseFloat(originLng) + parseFloat(destLng)) / 2;

          return res.json({
            success: true,
            route: {
              geometry,
              duration: Math.round(durationSeconds), // in seconds
              durationMinutes: Math.round(durationSeconds / 60), // in minutes
              distance: Math.round(distanceMeters), // in meters
              distanceKm: (distanceMeters / 1000).toFixed(1), // in km
            },
            origin: {
              lat: parseFloat(originLat),
              lng: parseFloat(originLng),
            },
            destination: {
              lat: parseFloat(destLat),
              lng: parseFloat(destLng),
            },
            center: {
              lat: centerLat,
              lng: centerLng,
            },
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "No route found",
          });
        }
      } catch (mapboxError) {
        return res.status(500).json({
          success: false,
          message: "Error fetching route from Mapbox",
          error: mapboxError.response?.data?.message || mapboxError.message,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error getting route data",
        error: error.message,
      });
    }
  });

  // Process payment (in production, integrate with payment gateway like Stripe, PayPal, etc.)
  app.post("/payments/process", async (req, res) => {
    try {
      const {
        userId,
        jobId,
        amount,
        cardLast4,
        cardHolder,
        expiryMonth,
        expiryYear,
        billingAddress,
        city,
        zipCode,
      } = req.body;

      if (!userId || !amount) {
        return res.status(400).json({
          success: false,
          message: "userId and amount are required",
        });
      }

      // In a real application, you would:
      // 1. Send card details to a payment gateway (Stripe, PayPal, etc.)
      // 2. Never store full card numbers on your server
      // 3. Use tokenization to securely handle payments
      // 4. Handle 3D Secure authentication if required

      // For now, simulate payment processing
      // TODO: Integrate with actual payment gateway
      const paymentId = new ObjectId();
      const paymentRecord = {
        _id: paymentId,
        userId: new ObjectId(userId),
        jobId: jobId ? new ObjectId(jobId) : null,
        amount: parseFloat(amount),
        status: "paid", // In real app, this would come from payment gateway
        cardLast4: cardLast4,
        cardHolder: cardHolder,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        billingAddress: billingAddress || null,
        city: city || null,
        zipCode: zipCode || null,
        transactionId: `TXN-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save payment record (in real app, only after successful payment gateway confirmation)
      const paymentsCol = getCollectionPayments();
      await paymentsCol.insertOne(paymentRecord);

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return res.json({
        success: true,
        message: "התשלום בוצע בהצלחה",
        paymentId: paymentId.toString(),
        transactionId: paymentRecord.transactionId,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בעיבוד התשלום",
      });
    }
  });

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
        // Filter and format specialties - only full categories allowed
        update.specialties = specialties
          .filter(
            (item) =>
              item &&
              item.name &&
              (item.isFullCategory === true || item.type === "category")
          )
          .map((item) => ({
            name: item.name,
            category: "",
            price: null,
            typeWork: null,
            isFullCategory: true,
            type: "category",
          }));

        // Also create fullCategories array for easier querying
        update.fullCategories = update.specialties.map((item) => item.name);
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
          // Forward geocoding (Hebrew) failed
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
          } catch (fwdErrEn) {}
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

      // Get current job to check if handymanId/handymanName are already arrays
      const currentJob = await jobsCol.findOne({ _id: new ObjectId(jobId) });

      // Prepare handymanId and handymanName as arrays
      let handymanIdArray = [];
      let handymanNameArray = [];

      if (currentJob?.handymanId) {
        // If already an array, use it; otherwise convert to array
        if (Array.isArray(currentJob.handymanId)) {
          handymanIdArray = [...currentJob.handymanId];
        } else {
          handymanIdArray = [currentJob.handymanId];
        }
      }

      if (currentJob?.handymanName) {
        // If already an array, use it; otherwise convert to array
        if (Array.isArray(currentJob.handymanName)) {
          handymanNameArray = [...currentJob.handymanName];
        } else {
          handymanNameArray = [currentJob.handymanName];
        }
      }

      // Add new handyman if not already in array
      const handymanObjectId = new ObjectId(handymanId);
      const handymanIdString = handymanObjectId.toString();
      const existingIndex = handymanIdArray.findIndex(
        (id) => id.toString() === handymanIdString
      );

      if (existingIndex === -1) {
        // Add new handyman
        handymanIdArray.push(handymanObjectId);
        handymanNameArray.push(handymanName);
      } else {
        // Update existing handyman name (in case it changed)
        handymanNameArray[existingIndex] = handymanName;
      }

      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            handymanId: handymanIdArray,
            handymanName: handymanNameArray,
            status: "assigned",
          },
        }
      );

      // Get job details to find client
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      const clientId = job?.clientId;

      // Emit WebSocket event to notify client that job was accepted
      io.to(`job-${jobId}`).emit("job-accepted", {
        jobId: jobId,
        handymanId: handymanId,
        handymanName: handymanName,
        status: "assigned",
      });

      // Send Push Notification to client
      if (clientId) {
        try {
          // Handle both ObjectId and string clientId
          const clientObjectId =
            clientId instanceof ObjectId ? clientId : new ObjectId(clientId);
          const client = await usersCol.findOne({
            _id: clientObjectId,
          });

          if (client) {
            if (client.fcmToken) {
              const pushResult = await sendPushNotification(
                client.fcmToken,
                "עבודה שובצה! 🎉",
                `קבלו את העבודה שלך - ${handymanName}`,
                {
                  type: "job_accepted",
                  jobId: jobId.toString(),
                  handymanId: handymanId.toString(),
                  handymanName: handymanName || "",
                }
              );

              // If token is invalid, remove it from database
              if (pushResult.shouldRemove) {
                await usersCol.updateOne(
                  { _id: clientObjectId },
                  { $unset: { fcmToken: "" } }
                );
              }
            }
          }
        } catch (pushError) {
          // Don't fail the request if push notification fails
        }
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error accepting job",
        error: error.message,
      });
    }
  });
  app.post("/save-fcm-token", async (req, res) => {
    try {
      const { userId, fcmToken } = req.body;
      if (!userId || !fcmToken) {
        return res.status(400).json({
          success: false,
          message: "userId and fcmToken required",
        });
      }

      const usersCol = getCollection();
      await usersCol.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { fcmToken: fcmToken } }
      );

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error saving FCM token",
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

      // Get the job to check if this handyman was specially requested
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Check if this handyman is the one who was specially requested
      const handymanIdString = String(handymanId);
      const isSpecialHandyman =
        job.handymanIdSpecial &&
        String(job.handymanIdSpecial) === handymanIdString;

      // Prepare update object
      const updateObj = {
        $unset: { handymanId: "", handymanName: "" },
        $set: { status: "open" },
      };

      // If this is the special handyman, set handymanIdSpecial to null
      if (isSpecialHandyman) {
        updateObj.$set.handymanIdSpecial = null;
      }

      await jobsCol.updateOne({ _id: new ObjectId(jobId) }, updateObj);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error skipping job",
        error: error.message,
      });
    }
  });
  app.post("/jobs/cancel", async (req, res) => {
    try {
      const { jobId, userId } = req.body;
      if (!jobId) {
        return res
          .status(400)
          .json({ success: false, message: "jobId is required" });
      }
      const jobsCol = getCollectionJobs();

      // Get the job to determine who cancelled
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res
          .status(404)
          .json({ success: false, message: "Job not found" });
      }

      // Determine who cancelled: if userId matches handymanId, it's the handyman, otherwise it's the client
      let cancelledBy = "client";
      if (job.handymanId) {
        // Support both array and single value for handymanId
        if (Array.isArray(job.handymanId)) {
          const isHandyman = job.handymanId.some(
            (id) => String(id) === String(userId)
          );
          if (isHandyman) {
            cancelledBy = "handyman";
          }
        } else {
          if (String(job.handymanId) === String(userId)) {
            cancelledBy = "handyman";
          }
        }
      }
      if (job.clientId && String(job.clientId) === String(userId)) {
        cancelledBy = "client";
      }

      // Update handymanId and handymanName to null instead of deleting
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            handymanId: null,
            handymanName: null,
            status: "open",
          },
        }
      );

      // Delete chat from database
      const chatsCol = getCollectionChats();
      let deleteResult = await chatsCol.deleteOne({
        jobId: new ObjectId(jobId),
      });
      if (deleteResult.deletedCount === 0) {
        // Try alternative: jobId might be stored as string in some cases
        deleteResult = await chatsCol.deleteOne({ jobId: jobId });
      }
      if (deleteResult.deletedCount === 0) {
        // Try with jobId as string
        deleteResult = await chatsCol.deleteOne({
          jobId: String(jobId),
        });
      }

      // Emit WebSocket event to notify that job was cancelled
      io.to(`job-${jobId}`).emit("job-cancelled", {
        jobId: jobId,
        status: "open",
        cancelledBy: cancelledBy,
      });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error cancelling job",
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

      // Send Push Notification to client
      const usersCol = getCollection();
      const clientId = job?.clientId;
      if (clientId) {
        try {
          const clientObjectId =
            clientId instanceof ObjectId ? clientId : new ObjectId(clientId);
          const client = await usersCol.findOne({ _id: clientObjectId });

          if (client?.fcmToken) {
            const handymanName =
              Array.isArray(job.handymanName) && job.handymanName.length > 0
                ? job.handymanName[0]
                : "ההנדימן";

            const pushResult = await sendPushNotification(
              client.fcmToken,
              "עדכון סטטוס",
              `${handymanName} בדרך אליך`,
              {
                type: "status_update",
                jobId: jobId.toString(),
                status: "on_the_way",
              }
            );

            if (pushResult.shouldRemove) {
              await usersCol.updateOne(
                { _id: clientObjectId },
                { $unset: { fcmToken: "" } }
              );
            }
          }
        } catch (pushError) {
          // Don't fail the request if push notification fails
        }
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

      // Send Push Notification to client
      const usersCol = getCollection();
      const clientId = job?.clientId;
      if (clientId) {
        try {
          const clientObjectId =
            clientId instanceof ObjectId ? clientId : new ObjectId(clientId);
          const client = await usersCol.findOne({ _id: clientObjectId });

          if (client?.fcmToken) {
            const handymanName =
              Array.isArray(job.handymanName) && job.handymanName.length > 0
                ? job.handymanName[0]
                : "ההנדימן";

            const pushResult = await sendPushNotification(
              client.fcmToken,
              "עדכון סטטוס",
              `${handymanName} הגיע`,
              {
                type: "status_update",
                jobId: jobId.toString(),
                status: "in_progress",
              }
            );

            if (pushResult.shouldRemove) {
              await usersCol.updateOne(
                { _id: clientObjectId },
                { $unset: { fcmToken: "" } }
              );
            }
          }
        } catch (pushError) {
          // Don't fail the request if push notification fails
        }
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

      // Update jobDone for handyman (handle both array and single handymanId)
      if (job.handymanId) {
        const handymanIds = Array.isArray(job.handymanId)
          ? job.handymanId
          : [job.handymanId];
        const handymanIdString = handymanId.toString();

        // Find the handyman in the array that matches
        for (const hId of handymanIds) {
          if (String(hId) === handymanIdString) {
            const handymanObjectId =
              hId instanceof ObjectId ? hId : new ObjectId(hId);
            await usersCol.updateOne(
              { _id: handymanObjectId },
              { $inc: { jobDone: 1 } }
            );
            break;
          }
        }
      } else {
        // Fallback to provided handymanId if job.handymanId is not set
        await usersCol.updateOne(
          { _id: new ObjectId(handymanId) },
          { $inc: { jobDone: 1 } }
        );
      }

      // Emit WebSocket event to notify clients
      const io = req.app.get("io");
      if (io) {
        io.to(`job-${jobId}`).emit("job-status-updated", {
          jobId,
          status: "done",
        });
      }

      // Send Push Notification to client
      const clientId = job?.clientId;
      if (clientId) {
        try {
          const clientObjectId =
            clientId instanceof ObjectId ? clientId : new ObjectId(clientId);
          const client = await usersCol.findOne({ _id: clientObjectId });

          if (client?.fcmToken) {
            const handymanName =
              Array.isArray(job.handymanName) && job.handymanName.length > 0
                ? job.handymanName[0]
                : "ההנדימן";

            const pushResult = await sendPushNotification(
              client.fcmToken,
              "עדכון סטטוס",
              `${handymanName} סיים את העבודה`,
              {
                type: "status_update",
                jobId: jobId.toString(),
                status: "done",
              }
            );

            if (pushResult.shouldRemove) {
              await usersCol.updateOne(
                { _id: clientObjectId },
                { $unset: { fcmToken: "" } }
              );
            }
          }
        } catch (pushError) {
          // Don't fail the request if push notification fails
        }
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
  app.get("/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "jobId required",
        });
      }

      const jobsCol = getCollectionJobs();

      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      return res.json({
        success: true,
        job: job,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching job",
        error: error.message,
      });
    }
  });
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
  app.post("/jobs/:jobId/messages", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { text, imageUrl, location, senderId, isHandyman } = req.body;

      if (!jobId || !senderId) {
        return res.status(400).json({
          success: false,
          message: "jobId and senderId required",
        });
      }

      if (!text && !imageUrl && !location) {
        return res.status(400).json({
          success: false,
          message: "Either text, imageUrl, or location is required",
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

      // Determine if sender is handyman by comparing senderId with handymanId
      // Support both array and single value for handymanId
      let senderIsHandyman = false;
      if (handymanId) {
        if (Array.isArray(handymanId)) {
          senderIsHandyman = handymanId.some(
            (id) => String(id) === String(senderId)
          );
        } else {
          senderIsHandyman = String(handymanId) === String(senderId);
        }
      }

      // If senderId matches clientId, definitely not handyman
      if (String(customerId) === String(senderId)) {
        senderIsHandyman = false;
      }

      // Fallback to isHandyman from request if we can't determine from IDs
      // This handles edge cases where handymanId might not be set yet
      if (!senderIsHandyman && !customerId && isHandyman) {
        senderIsHandyman = true;
      }

      // Create message object
      const messageObj = {
        createdAt: new Date(),
      };

      if (senderIsHandyman) {
        if (text) messageObj.handyman = text;
        if (imageUrl) messageObj.handymanImage = imageUrl;
        if (location) messageObj.handymanLocation = location;
      } else {
        if (text) messageObj.customer = text;
        if (imageUrl) messageObj.customerImage = imageUrl;
        if (location) messageObj.customerLocation = location;
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

        // If handyman sent location, emit real-time location update
        if (senderIsHandyman && location) {
          io.to(`job-${jobId}`).emit("handyman-location-updated", {
            jobId,
            location: {
              lat: location.lat,
              lng: location.lng,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Send Push Notification to recipient - CRITICAL: Send on EVERY message
      const usersCol = getCollection();
      try {
        if (senderIsHandyman) {
          // Handyman sent message, notify client
          if (customerId) {
            const clientObjectId =
              customerId instanceof ObjectId
                ? customerId
                : new ObjectId(customerId);
            const client = await usersCol.findOne({ _id: clientObjectId });

            if (client?.fcmToken) {
              const handymanName =
                Array.isArray(job.handymanName) && job.handymanName.length > 0
                  ? job.handymanName[0]
                  : "ההנדימן";

              const messagePreview = text
                ? text.substring(0, 50) + (text.length > 50 ? "..." : "")
                : imageUrl
                ? "📷 תמונה"
                : location
                ? "📍 מיקום"
                : "הודעה חדשה";

              const pushResult = await sendPushNotification(
                client.fcmToken,
                handymanName,
                messagePreview,
                {
                  type: "new_message",
                  jobId: jobId.toString(),
                  senderId: senderId.toString(),
                }
              );

              if (pushResult.shouldRemove) {
                await usersCol.updateOne(
                  { _id: clientObjectId },
                  { $unset: { fcmToken: "" } }
                );
              }
            }
          }
        } else {
          // Client sent message, notify handyman(s)
          // If handymanId is array, send to all handymen
          if (Array.isArray(handymanId)) {
            // Send to all handymen
            for (const hId of handymanId) {
              const handymanObjectId =
                hId instanceof ObjectId ? hId : new ObjectId(hId);
              const handyman = await usersCol.findOne({
                _id: handymanObjectId,
              });
              if (handyman?.fcmToken) {
                const clientName = job.clientName || "הלקוח";
                const messagePreview = text
                  ? text.substring(0, 50) + (text.length > 50 ? "..." : "")
                  : imageUrl
                  ? "📷 תמונה"
                  : location
                  ? "📍 מיקום"
                  : "הודעה חדשה";

                const pushResult = await sendPushNotification(
                  handyman.fcmToken,
                  clientName,
                  messagePreview,
                  {
                    type: "new_message",
                    jobId: jobId.toString(),
                    senderId: senderId.toString(),
                  }
                );

                if (pushResult.shouldRemove) {
                  await usersCol.updateOne(
                    { _id: handymanObjectId },
                    { $unset: { fcmToken: "" } }
                  );
                }
              }
            }
          } else if (handymanId) {
            // Single handyman
            const handymanObjectId =
              handymanId instanceof ObjectId
                ? handymanId
                : new ObjectId(handymanId);
            const handyman = await usersCol.findOne({
              _id: handymanObjectId,
            });

            if (handyman?.fcmToken) {
              const clientName = job.clientName || "הלקוח";
              const messagePreview = text
                ? text.substring(0, 50) + (text.length > 50 ? "..." : "")
                : imageUrl
                ? "📷 תמונה"
                : location
                ? "📍 מיקום"
                : "הודעה חדשה";

              const pushResult = await sendPushNotification(
                handyman.fcmToken,
                clientName,
                messagePreview,
                {
                  type: "new_message",
                  jobId: jobId.toString(),
                  senderId: senderId.toString(),
                }
              );

              if (pushResult.shouldRemove) {
                await usersCol.updateOne(
                  { _id: handymanObjectId },
                  { $unset: { fcmToken: "" } }
                );
              }
            }
          }
        }
      } catch (pushError) {
        // Don't fail the request if push notification fails
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

      // Get chat messages before deletion to extract image URLs
      const chatsCol = getCollectionChats();
      const chat = await chatsCol.findOne({ jobId: new ObjectId(jobId) });

      // Extract image URLs from chat messages and delete them from S3
      // Chat images use the same bucket as /upload-image endpoint (hendiman123 or AWS_BUCKET_NAME)
      const bucketName = process.env.AWS_BUCKET_NAME || "hendiman123";
      if (chat && chat.content && Array.isArray(chat.content)) {
        const imageUrls = [];
        chat.content.forEach((message) => {
          if (message.handymanImage) {
            imageUrls.push(message.handymanImage);
          }
          if (message.customerImage) {
            imageUrls.push(message.customerImage);
          }
        });

        // Delete all images from S3 (don't fail if deletion fails)
        for (const imageUrl of imageUrls) {
          try {
            if (imageUrl && imageUrl.includes(bucketName)) {
              await deleteImageFromS3(imageUrl, bucketName);
            }
          } catch (deleteError) {
            // Continue deleting other images even if one fails
            // Don't log or throw - just continue
          }
        }
      }

      // Delete chat from database after rating is submitted (job is completed)
      let deleteResult = await chatsCol.deleteOne({
        jobId: new ObjectId(jobId),
      });
      if (deleteResult.deletedCount === 0) {
        // Try alternative: jobId might be stored as string in some cases
        deleteResult = await chatsCol.deleteOne({ jobId: jobId });
      }
      if (deleteResult.deletedCount === 0) {
        // Try with jobId as string
        deleteResult = await chatsCol.deleteOne({
          jobId: String(jobId),
        });
      }

      // Emit WebSocket event to handyman that rating was submitted
      // This will trigger navigation to job summary page
      const io = req.app.get("io");
      if (io) {
        io.to(`job-${jobId}`).emit("rating-submitted", {
          jobId: jobId,
          rating: parseInt(rating),
          review: review || "",
        });
      }

      // Send Push Notification to handyman about rating
      try {
        // finalHandymanId is already a string (from line 3302: handymanId?.toString() || handymanId)
        const handymanObjectId = new ObjectId(finalHandymanId);
        const handyman = await usersCol.findOne({ _id: handymanObjectId });

        if (handyman?.fcmToken) {
          const pushResult = await sendPushNotification(
            handyman.fcmToken,
            "דירוג חדש ⭐",
            "דרגו אותך! לחץ כדי לראות",
            {
              type: "rating_received",
              jobId: jobId.toString(),
              rating: rating.toString(),
            }
          );

          if (pushResult.shouldRemove) {
            await usersCol.updateOne(
              { _id: handymanObjectId },
              { $unset: { fcmToken: "" } }
            );
          }
        }
      } catch (pushError) {
        // Don't fail the request if push notification fails
        console.error(
          "Error sending push notification for rating:",
          pushError.message
        );
      }

      // Update jobDone for handyman when rating is submitted
      try {
        // finalHandymanId is already a string
        const handymanObjectId = new ObjectId(finalHandymanId);
        await usersCol.updateOne(
          { _id: handymanObjectId },
          { $inc: { jobDone: 1 } }
        );
      } catch (jobDoneError) {
        // Don't fail the request if jobDone update fails
        console.error("Error updating jobDone:", jobDoneError.message);
      }

      // Calculate average rating for handyman from all ratings
      try {
        const handymanObjectId = new ObjectId(finalHandymanId);

        // Use $or to find ALL ratings (handymanId might be stored as string or ObjectId in different ratings)
        // Start with $or to ensure we get all ratings regardless of format
        let allRatings = [];
        try {
          allRatings = await ratingsCol
            .find({
              $or: [
                { handymanId: finalHandymanId },
                { handymanId: handymanObjectId.toString() },
                { handymanId: handymanObjectId },
              ],
            })
            .toArray();
        } catch (orError) {
          // If $or fails, try direct string match as fallback
          try {
            allRatings = await ratingsCol
              .find({ handymanId: finalHandymanId })
              .toArray();
          } catch (directError) {
            console.error("Error finding ratings:", directError.message);
          }
        }

        // If still no ratings found after insertOne, wait a bit and retry (eventual consistency)
        if (allRatings.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          try {
            allRatings = await ratingsCol
              .find({
                $or: [
                  { handymanId: finalHandymanId },
                  { handymanId: handymanObjectId.toString() },
                ],
              })
              .toArray();
          } catch (retryError) {
            // Final fallback to direct match
            try {
              allRatings = await ratingsCol
                .find({ handymanId: finalHandymanId })
                .toArray();
            } catch (fallbackError) {
              console.error(
                "Error finding ratings on final retry:",
                fallbackError.message
              );
            }
          }
        }

        if (allRatings.length > 0) {
          const totalRating = allRatings.reduce(
            (sum, r) => sum + (r.rating || 0),
            0
          );
          const averageRating = totalRating / allRatings.length;
          const roundedRating = Math.round(averageRating * 10) / 10;

          await usersCol.updateOne(
            { _id: handymanObjectId },
            { $set: { rating: roundedRating } }
          );
        } else {
          // If no ratings found, set the first rating (current one)
          await usersCol.updateOne(
            { _id: handymanObjectId },
            { $set: { rating: parseInt(rating) } }
          );
        }
      } catch (ratingError) {
        // Don't fail the request if rating calculation fails
        console.error("Error calculating average rating:", ratingError.message);
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
  app.get("/ratings/job/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const ratingsCol = getCollectionRatings();

      const rating = await ratingsCol.findOne({
        jobId: new ObjectId(jobId),
      });

      if (!rating) {
        return res.json({
          success: true,
          rating: null,
        });
      }

      return res.json({
        success: true,
        rating: {
          _id: rating._id,
          handymanId: rating.handymanId,
          customerId: rating.customerId,
          jobId: rating.jobId,
          rating: rating.rating,
          review: rating.review || "",
          createdAt: rating.createdAt,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching rating",
        error: error.message,
      });
    }
  });
  app.get("/ratings/handyman/:handymanId", async (req, res) => {
    try {
      const { handymanId } = req.params;
      const ratingsCol = getCollectionRatings();
      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();

      // Get handyman data to get jobDone
      let jobDone = 0;
      try {
        const handymanObjectId = new ObjectId(handymanId);
        const handyman = await usersCol.findOne({ _id: handymanObjectId });
        if (handyman && handyman.jobDone !== undefined) {
          jobDone = handyman.jobDone || 0;
        }
      } catch (err) {
        // If ObjectId conversion fails, try as string
        const handyman = await usersCol.findOne({ _id: handymanId });
        if (handyman && handyman.jobDone !== undefined) {
          jobDone = handyman.jobDone || 0;
        }
      }

      // Get all ratings for this handyman
      const ratings = await ratingsCol
        .find({ handymanId: handymanId })
        .sort({ createdAt: -1 })
        .toArray();

      // Get jobs for these ratings to calculate earnings
      const jobIds = ratings.map((r) => r.jobId);
      const jobs = await jobsCol.find({ _id: { $in: jobIds } }).toArray();

      // Calculate earnings
      let totalEarnings = 0;
      let monthlyEarnings = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const ratingsWithDetails = await Promise.all(
        ratings.map(async (rating) => {
          const job = jobs.find(
            (j) => j._id.toString() === rating.jobId.toString()
          );
          const price = job?.price || 0;
          const commission = Math.round(price * 0.1);
          const earned = price - commission;

          totalEarnings += earned;
          if (rating.createdAt >= startOfMonth) {
            monthlyEarnings += earned;
          }

          // Get customer name
          let customerName = null;
          if (rating.customerId) {
            try {
              const customer = await usersCol.findOne({
                _id: new ObjectId(rating.customerId),
              });
              customerName = customer?.username || customer?.firstName || null;
            } catch (err) {
              // Ignore error
            }
          }

          // Get job name
          let jobName = null;
          if (job) {
            // Handle subcategoryInfo as array
            const firstSubcategory =
              Array.isArray(job.subcategoryInfo) &&
              job.subcategoryInfo.length > 0
                ? job.subcategoryInfo[0]
                : job.subcategoryInfo || {};
            if (firstSubcategory && firstSubcategory.subcategory) {
              jobName = firstSubcategory.subcategory;
            } else if (job.workType) {
              jobName = job.workType;
            } else if (job.description) {
              jobName =
                job.description.substring(0, 50) +
                (job.description.length > 50 ? "..." : "");
            }
          }

          return {
            _id: rating._id,
            handymanId: rating.handymanId,
            customerId: rating.customerId,
            customerName: customerName,
            jobId: rating.jobId,
            jobName: jobName,
            rating: rating.rating,
            review: rating.review || "",
            createdAt: rating.createdAt,
          };
        })
      );

      return res.json({
        success: true,
        ratings: ratingsWithDetails,
        totalEarnings: totalEarnings,
        monthlyEarnings: monthlyEarnings,
        jobDone: jobDone,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching handyman ratings",
        error: error.message,
      });
    }
  });

  // Get handyman earnings chart data
  app.get("/handyman/:handymanId/earnings/chart", async (req, res) => {
    try {
      const { handymanId } = req.params;
      const { period = "daily" } = req.query; // daily, weekly, monthly

      const ratingsCol = getCollectionRatings();
      const jobsCol = getCollectionJobs();

      // Get all ratings for this handyman
      const ratings = await ratingsCol
        .find({ handymanId: handymanId })
        .sort({ createdAt: -1 })
        .toArray();

      if (ratings.length === 0) {
        return res.json({
          success: true,
          chartData: [],
        });
      }

      // Get jobs for these ratings
      const jobIds = ratings.map((r) => r.jobId);
      const jobs = await jobsCol.find({ _id: { $in: jobIds } }).toArray();

      // Group by date and calculate earnings
      const earningsMap = new Map();

      ratings.forEach((rating) => {
        const job = jobs.find(
          (j) => j._id.toString() === rating.jobId.toString()
        );
        if (!job) return;

        const price = job?.price || 0;
        const commission = Math.round(price * 0.1);
        const earned = price - commission;

        const date = new Date(rating.createdAt);
        let dateKey;

        switch (period) {
          case "weekly":
            const week = getWeekNumber(date);
            dateKey = `${date.getFullYear()}-${String(week).padStart(2, "0")}`;
            break;
          case "monthly":
            dateKey = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;
            break;
          default: // daily
            dateKey = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        }

        if (!earningsMap.has(dateKey)) {
          earningsMap.set(dateKey, {
            date: date,
            dateLabel: dateKey,
            earnings: 0,
          });
        }

        const entry = earningsMap.get(dateKey);
        entry.earnings += earned;
      });

      // Convert to array and sort by date
      const chartData = Array.from(earningsMap.values())
        .map((item) => ({
          date: item.date,
          dateLabel: item.dateLabel,
          earnings: item.earnings,
        }))
        .sort((a, b) => a.date - b.date);

      return res.json({
        success: true,
        chartData: chartData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching handyman earnings chart",
        error: error.message,
      });
    }
  });

  // Helper function to get week number
  function getWeekNumber(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

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
                  // Handle subcategoryInfo as array
                  const firstSubcategory =
                    Array.isArray(job.subcategoryInfo) &&
                    job.subcategoryInfo.length > 0
                      ? job.subcategoryInfo[0]
                      : job.subcategoryInfo || {};
                  if (firstSubcategory && firstSubcategory.subcategory) {
                    jobType = firstSubcategory.subcategory;
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
      return res.status(500).json({
        success: false,
        message: "Error fetching ratings",
        error: error.message,
      });
    }
  });
  // app.post("/create-call", async (req, res) => {
  //   try {
  //
  //     );
  //     const call = req.body;
  //     // קבל את אוסף העבודות
  //     const jobsCollection = getCollectionJobs();

  //     if (!jobsCollection) {
  //       return res.status(500).json({
  //         success: false,
  //         message: "שגיאה בחיבור למסד הנתונים",
  //       });
  //     }

  //     // קבל את פרטי המזמין (אם יש userId)
  //     let clientName = null;
  //     if (call.userId) {
  //       try {
  //         const collection = getCollection();
  //         const userId = new ObjectId(call.userId);
  //         const user = await collection.findOne({ _id: userId });
  //         if (user) {
  //           clientName = user.username || null;
  //         }
  //       } catch (userError) {
  //
  //       }
  //     }

  //     // הכנת אובייקט העבודה לשמירה
  //     // אובייקט אחד שמכיל את כל פרטי התת-קטגוריה
  //     const subcategoryInfo = {
  //       name: call.selectedSubcategory?.name || null,
  //       category: call.selectedSubcategory?.category || null,
  //       price: call.selectedSubcategory?.price || null,
  //       typeWork: call.selectedSubcategory?.typeWork || null, // לשעה או קבלנות
  //     };

  //     const originalLocationText =
  //       typeof call.location === "string"
  //         ? call.location.trim()
  //         : String(call.location || "");

  //     const jobData = {
  //       clientId: call.userId || null,
  //       clientName: clientName,
  //       handymanId: null,
  //       handymanName: null,
  //       subcategoryInfo: subcategoryInfo, // אובייקט אחד עם כל המידע
  //       workType: call.workType || "קלה", // קלה/מורכבת/קשה - מחוץ ל-subcategoryInfo
  //       desc:
  //         typeof call.desc === "string"
  //           ? call.desc.trim()
  //           : String(call.desc || ""),
  //       // נמנע משמירת "המיקום שלי" כברירת מחדל; נמלא אחרי גיאוקידינג
  //       locationText: "",
  //       imageUrl: call.imageUrl || call.imagePreview || "",
  //       when: call.when || "asap",
  //       urgent: call.urgent || false,
  //       status: "open",
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     };
  //     const usingMyLocation =
  //       call?.usingMyLocation === true || call?.callLocationMode === "my";
  //     // אם יש קואורדינטות ו-usingMyLocation הוא true, הוסף אותן
  //     // אם usingMyLocation הוא false, אל תשתמש בקואורדינטות שנשלחו (יכול להיות שזה קואורדינטות של המשתמש)
  //     if (
  //       usingMyLocation &&
  //       call.coordinates &&
  //       (call.coordinates.lng !== undefined ||
  //         call.coordinates.lon !== undefined) &&
  //       call.coordinates.lat !== undefined
  //     ) {
  //       const rawLng =
  //         call.coordinates.lng !== undefined
  //           ? call.coordinates.lng
  //           : call.coordinates.lon;
  //       const parsedLng = parseFloat(rawLng);
  //       const parsedLat = parseFloat(call.coordinates.lat);
  //       if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
  //         jobData.location = {
  //           type: "Point",
  //           coordinates: [parsedLng, parsedLat],
  //         };
  //         jobData.coordinates = {
  //           lng: parsedLng,
  //           lat: parsedLat,
  //         };
  //         // Coordinates from request (My Location)

  //         // Reverse geocode רק כאשר זו בחירה של "המיקום שלי"
  //         if (usingMyLocation) {
  //           try {
  //             const response = await axios.get(
  //               `https://api.mapbox.com/geocoding/v5/mapbox.places/${parsedLng},${parsedLat}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&types=place&limit=1`
  //             );
  //             let features = response.data?.features || [];
  //             let feature = features[0];
  //             if (!feature) {
  //               try {
  //                 const fallbackRes = await axios.get(
  //                   `https://api.mapbox.com/geocoding/v5/mapbox.places/${parsedLng},${parsedLat}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&limit=5`
  //                 );
  //                 features = fallbackRes.data?.features || [];
  //                 feature =
  //                   features.find(
  //                     (f) =>
  //                       (f.id || "").startsWith("place") ||
  //                       (f.id || "").startsWith("locality") ||
  //                       (f.id || "").startsWith("region")
  //                   ) || features[0];
  //               } catch (fallbackErr) {
  //                 // Mapbox fallback failed
  //               }
  //             }
  //             if (!feature) {
  //               // Mapbox returned no features for coords
  //             }
  //             const mapboxNameHe =
  //               feature?.text_he ||
  //               feature?.place_name_he ||
  //               feature?.context?.find((c) => c.text_he)?.text_he ||
  //               "";
  //             const mapboxName =
  //               feature?.text ||
  //               feature?.place_name ||
  //               feature?.context?.find((c) => c.id?.startsWith("place"))
  //                 ?.text ||
  //               feature?.context?.find((c) => c.id?.startsWith("locality"))
  //                 ?.text ||
  //               feature?.context?.find((c) => c.id?.startsWith("region"))
  //                 ?.text ||
  //               "";
  //             const contextName =
  //               feature?.context
  //                 ?.map((c) => c.text || c.place_name)
  //                 .find(Boolean) || "";

  //             const originalClean =
  //               originalLocationText &&
  //               originalLocationText.trim() !== "המיקום שלי"
  //                 ? originalLocationText.trim()
  //                 : "";

  //             let englishCandidate =
  //               mapboxName ||
  //               feature?.place_name ||
  //               contextName ||
  //               originalClean ||
  //               "";

  //             let nominatimHe = "";
  //             let nominatimName = "";
  //             if (
  //               (!englishCandidate || !englishCandidate.trim().length) &&
  //               (!mapboxNameHe || !mapboxNameHe.trim().length)
  //             ) {
  //               try {
  //                 const nomRes = await axios.get(
  //                   `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLng}&accept-language=he&zoom=14`,
  //                   { headers: { "User-Agent": "hendiman-app" } }
  //                 );
  //                 nominatimHe = nomRes.data?.display_name || "";
  //                 nominatimName =
  //                   nomRes.data?.address?.city ||
  //                   nomRes.data?.address?.town ||
  //                   nomRes.data?.address?.village ||
  //                   nomRes.data?.address?.suburb ||
  //                   "";
  //                 if (nominatimName) {
  //                   englishCandidate = nominatimName;
  //                 } else if (nominatimHe && !isHebrew(nominatimHe)) {
  //                   englishCandidate = nominatimHe;
  //                 }
  //               } catch (nomErr) {
  //                 // Error in Nominatim reverse
  //               }
  //             }

  //             const finalMapboxHe =
  //               (mapboxNameHe && mapboxNameHe.trim()) || nominatimHe || "";

  //             const localHeb = mapEnglishToHebrew(englishCandidate);

  //             const hebFromMapbox =
  //               finalMapboxHe &&
  //               finalMapboxHe.trim().length &&
  //               isHebrew(finalMapboxHe)
  //                 ? finalMapboxHe
  //                 : "";
  //             const hebFromLocal =
  //               localHeb && localHeb.trim().length && isHebrew(localHeb)
  //                 ? localHeb
  //                 : "";

  //             let translated =
  //               hebFromMapbox ||
  //               hebFromLocal ||
  //               (localHeb && localHeb.trim().length && localHeb) ||
  //               englishCandidate;
  //             try {
  //               if (translated === englishCandidate && englishCandidate) {
  //                 const translateRes = await axios.post(
  //                   "https://libretranslate.com/translate",
  //                   {
  //                     q: englishCandidate,
  //                     source: "en",
  //                     target: "he",
  //                     format: "text",
  //                   },
  //                   {
  //                     headers: { "Content-Type": "application/json" },
  //                   }
  //                 );
  //                 translated =
  //                   translateRes.data?.translatedText ||
  //                   translateRes.data ||
  //                   translated;
  //               }
  //             } catch (translateErr) {
  //               // Error translating locationText
  //               translated = hebFromLocal || englishCandidate;
  //             }

  //             jobData.locationText =
  //               translated ||
  //               hebFromLocal ||
  //               englishCandidate ||
  //               originalClean ||
  //               "מיקום" ||
  //               `${parsedLat}, ${parsedLng}`;

  //             jobData.locationTextEn =
  //               englishCandidate ||
  //               mapboxName ||
  //               feature?.place_name ||
  //               contextName ||
  //               nominatimName ||
  //               originalClean ||
  //               `${parsedLat}, ${parsedLng}`;
  //           } catch (error) {
  //
  //           }
  //         }
  //       }
  //     } else if (
  //       !usingMyLocation &&
  //       call.coordinates &&
  //       Object.keys(call.coordinates).length > 0
  //     ) {
  //       :",
  //         call.coordinates
  //       );
  //     }

  //     // אם locationText עדיין נראה כמו קואורדינטות, החלף לטקסט המקורי או "מיקום"
  //     const coordRegex = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/;
  //     if (
  //       jobData.locationText &&
  //       coordRegex.test(jobData.locationText.trim()) &&
  //       originalLocationText &&
  //       originalLocationText.trim() &&
  //       originalLocationText.trim() !== "המיקום שלי"
  //     ) {
  //       jobData.locationText = originalLocationText.trim();
  //     } else if (
  //       jobData.locationText &&
  //       coordRegex.test(jobData.locationText.trim()) &&
  //       (!originalLocationText || originalLocationText.trim() === "המיקום שלי")
  //     ) {
  //       jobData.locationText = "מיקום";
  //     }

  //     if (
  //       jobData.locationTextEn &&
  //       coordRegex.test(String(jobData.locationTextEn).trim())
  //     ) {
  //       jobData.locationTextEn =
  //         originalLocationText && originalLocationText.trim()
  //           ? originalLocationText.trim()
  //           : "location";
  //     }

  //     // fallback אם לא מולא (למשל ללא קואורדינטות): שמור את הטקסט המקורי אם הוא לא "המיקום שלי"
  //     if (
  //       !jobData.locationText ||
  //       !jobData.locationText.trim().length ||
  //       jobData.locationText.trim() === "המיקום שלי"
  //     ) {
  //       if (
  //         originalLocationText &&
  //         originalLocationText.trim().length &&
  //         originalLocationText.trim() !== "המיקום שלי"
  //       ) {
  //         jobData.locationText = originalLocationText;
  //       } else {
  //         // fallback אחרון כדי לא להשאיר ריק: קואורדינטות אם קיימות
  //         if (jobData.coordinates?.lat && jobData.coordinates?.lng) {
  //           jobData.locationText = "מיקום";
  //         } else {
  //           jobData.locationText = jobData.locationText || "מיקום";
  //         }
  //       }
  //     }

  //     // אם אין קואורדינטות אבל יש מיקום טקסטואלי שהוזן (לא "המיקום שלי"), נסה לחפש במאפבוקס (forward geocoding)
  //     // או אם יש קואורדינטות אבל הן לא מ-"המיקום שלי", נמחק אותן ונמצא אותן מחדש

  //     if (
  //       (!jobData.location ||
  //         !jobData.coordinates ||
  //         (!usingMyLocation &&
  //           call.coordinates &&
  //           Object.keys(call.coordinates).length > 0)) &&
  //       originalLocationText &&
  //       originalLocationText.trim().length &&
  //       originalLocationText.trim() !== "המיקום שלי"
  //     ) {
  //       // אם יש קואורדינטות אבל זה לא "המיקום שלי", נמחק אותן כדי למצוא אותן מחדש
  //       if (!usingMyLocation && jobData.coordinates) {
  //         // Clearing coordinates (not using My Location)
  //         jobData.location = null;
  //         jobData.coordinates = null;
  //       }
  //       let coordinatesFound = false;
  //       const selectedCity = call.selectedCity; // הישוב שנבחר מה-JSON

  //       // נסה קודם עם השם בעברית
  //       try {
  //         const encoded = encodeURIComponent(originalLocationText.trim());
  //         const fwdUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&language=he&types=place&limit=5`;
  //         const fwdRes = await axios.get(fwdUrl);
  //         const features = fwdRes.data?.features || [];

  //         // מצא את התוצאה שתואמת לישוב שנבחר
  //         let matchingFeature = null;
  //         if (selectedCity) {
  //           const cityName = (selectedCity.name || selectedCity.שם_ישוב || "")
  //             .trim()
  //             .toLowerCase();
  //           const cityEngName = (
  //             selectedCity.english_name ||
  //             selectedCity.שם_ישוב_לועזי ||
  //             ""
  //           )
  //             .trim()
  //             .toLowerCase();

  //           // חפש תוצאה שתואמת לשם הישוב
  //           matchingFeature = features.find((feature) => {
  //             const featureName = (
  //               feature.text_he ||
  //               feature.place_name_he ||
  //               feature.text ||
  //               feature.place_name ||
  //               ""
  //             )
  //               .trim()
  //               .toLowerCase();
  //             const featureEngName = (feature.text || feature.place_name || "")
  //               .trim()
  //               .toLowerCase();

  //             // בדוק התאמה מדויקת או חלקית
  //             // עדיפות להתאמה מדויקת
  //             if (featureName === cityName || featureEngName === cityEngName) {
  //               return true;
  //             }
  //             // אחר כך בדוק התאמה חלקית (אבל רק אם השם לא קצר מדי)
  //             if (cityName.length >= 3 && cityEngName.length >= 3) {
  //               return (
  //                 featureName.includes(cityName) ||
  //                 cityName.includes(featureName) ||
  //                 featureEngName.includes(cityEngName) ||
  //                 cityEngName.includes(featureEngName)
  //               );
  //             }
  //             return false;
  //           });
  //         }

  //         // אם יש selectedCity אבל לא מצאנו התאמה, לא נשתמש בתוצאה
  //         // אם אין selectedCity, נשתמש בתוצאה הראשונה
  //         const feature = selectedCity ? matchingFeature : features[0];

  //         if (feature) {
  //           const [lng, lat] =
  //             (feature.center &&
  //               feature.center.length >= 2 &&
  //               feature.center) ||
  //             (feature.geometry?.coordinates &&
  //               feature.geometry.coordinates.length >= 2 &&
  //               feature.geometry.coordinates) ||
  //             [];
  //           if (Number.isFinite(lng) && Number.isFinite(lat)) {
  //             jobData.location = {
  //               type: "Point",
  //               coordinates: [lng, lat],
  //             };
  //             jobData.coordinates = { lng, lat };
  //             coordinatesFound = true;
  //             // Coordinates found via forward geocoding (Hebrew)

  //             // השתמש בשם מה-JSON אם יש, אחרת מהתוצאה
  //             const hebName = selectedCity
  //               ? selectedCity.name ||
  //                 selectedCity.שם_ישוב ||
  //                 originalLocationText
  //               : feature.place_name_he ||
  //                 feature.text_he ||
  //                 feature.place_name ||
  //                 feature.text ||
  //                 originalLocationText;
  //             const engName = selectedCity
  //               ? selectedCity.english_name ||
  //                 selectedCity.שם_ישוב_לועזי ||
  //                 call.locationEnglishName
  //               : feature.place_name ||
  //                 feature.text ||
  //                 call.locationEnglishName ||
  //                 originalLocationText;

  //             if (
  //               !jobData.locationText ||
  //               jobData.locationText === "המיקום שלי"
  //             ) {
  //               jobData.locationText = hebName;
  //             }
  //             if (!jobData.locationTextEn) {
  //               jobData.locationTextEn = engName;
  //             }
  //           }
  //         }
  //       } catch (fwdErr) {
  //         // Forward geocoding (Hebrew) failed
  //       }

  //       // אם לא מצאנו קואורדינטות בעברית, נסה עם השם באנגלית
  //       if (
  //         !coordinatesFound &&
  //         call.locationEnglishName &&
  //         call.locationEnglishName.trim()
  //       ) {
  //         try {
  //           const encodedEn = encodeURIComponent(
  //             call.locationEnglishName.trim()
  //           );
  //           const fwdUrlEn = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedEn}.json?access_token=${process.env.MAPBOX_TOKEN}&country=il&types=place&limit=5`;
  //           const fwdResEn = await axios.get(fwdUrlEn);
  //           const featuresEn = fwdResEn.data?.features || [];

  //           // מצא את התוצאה שתואמת לישוב שנבחר
  //           let matchingFeatureEn = null;
  //           if (selectedCity) {
  //             const cityEngName = (
  //               selectedCity.english_name ||
  //               selectedCity.שם_ישוב_לועזי ||
  //               ""
  //             )
  //               .trim()
  //               .toLowerCase();

  //             matchingFeatureEn = featuresEn.find((feature) => {
  //               const featureEngName = (
  //                 feature.text ||
  //                 feature.place_name ||
  //                 ""
  //               )
  //                 .trim()
  //                 .toLowerCase();
  //               const featurePlaceName = (feature.place_name || "")
  //                 .trim()
  //                 .toLowerCase();

  //               // עדיפות להתאמה מדויקת
  //               if (featureEngName === cityEngName) {
  //                 return true;
  //               }
  //               // בדוק אם השם המלא (place_name) מכיל את השם המלא של העיר
  //               // לדוגמה: "Tirat Karmel" צריך להתאים ל-"Tirat Karmel, Haifa District, Israel"
  //               if (
  //                 cityEngName.includes(" ") &&
  //                 featurePlaceName.includes(cityEngName)
  //               ) {
  //                 return true;
  //               }
  //               // בדוק התאמה חלקית (אבל רק אם השם לא קצר מדי)
  //               if (cityEngName.length >= 3) {
  //                 // אם השם המלא של העיר מכיל מילים מרובות, בדוק שהכל מופיע
  //                 const cityWords = cityEngName.split(/\s+/);
  //                 if (cityWords.length > 1) {
  //                   // אם יש יותר ממילה אחת, בדוק שכל המילים מופיעות
  //                   const allWordsMatch = cityWords.every(
  //                     (word) =>
  //                       featurePlaceName.includes(word) ||
  //                       featureEngName.includes(word)
  //                   );
  //                   if (allWordsMatch) {
  //                     return true;
  //                   }
  //                 }
  //                 // בדוק התאמה חלקית רגילה - אבל רק אם השם המלא של התוצאה מכיל את השם המלא של העיר
  //                 // זה מונע התאמה של "Tira" ל-"Tirat Karmel"
  //                 if (featurePlaceName.includes(cityEngName)) {
  //                   return true;
  //                 }
  //                 // בדוק התאמה חלקית רק אם השם המלא של העיר מכיל את השם המלא של התוצאה
  //                 // אבל רק אם התוצאה ארוכה מספיק (למנוע התאמה של "Tira" ל-"Tirat Karmel")
  //                 if (
  //                   cityEngName.includes(featureEngName) &&
  //                   featureEngName.length >= cityEngName.length * 0.8
  //                 ) {
  //                   return true;
  //                 }
  //                 return false;
  //               }
  //               return false;
  //             });
  //           }

  //           // אם יש selectedCity אבל לא מצאנו התאמה, נסה להשתמש ב-Nominatim
  //           // אם אין selectedCity, נשתמש בתוצאה הראשונה
  //           let featureEn = selectedCity ? matchingFeatureEn : featuresEn[0];

  //           // אם לא מצאנו התאמה טובה ב-Mapbox, נסה Nominatim
  //           if (!featureEn && selectedCity && call.locationEnglishName) {
  //             try {
  //               const nomQuery = encodeURIComponent(
  //                 call.locationEnglishName.trim() + ", Israel"
  //               );
  //               const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${nomQuery}&countrycodes=il&limit=5`;
  //               const nomRes = await axios.get(nomUrl, {
  //                 headers: { "User-Agent": "hendiman-app" },
  //               });
  //               const nomResults = nomRes.data || [];

  //               if (nomResults.length > 0) {
  //                 // מצא את התוצאה הטובה ביותר
  //                 const cityEngName = (
  //                   selectedCity.english_name ||
  //                   selectedCity.שם_ישוב_לועזי ||
  //                   ""
  //                 )
  //                   .trim()
  //                   .toLowerCase();

  //                 const bestMatch =
  //                   nomResults.find((result) => {
  //                     const displayName = (
  //                       result.display_name || ""
  //                     ).toLowerCase();
  //                     return displayName.includes(cityEngName);
  //                   }) || nomResults[0];

  //                 if (bestMatch && bestMatch.lat && bestMatch.lon) {
  //                   const lng = parseFloat(bestMatch.lon);
  //                   const lat = parseFloat(bestMatch.lat);
  //                   if (Number.isFinite(lng) && Number.isFinite(lat)) {
  //                     // צור feature דמה מ-Nominatim
  //                     featureEn = {
  //                       center: [lng, lat],
  //                       geometry: { coordinates: [lng, lat] },
  //                       text: bestMatch.display_name.split(",")[0],
  //                       place_name: bestMatch.display_name,
  //                       source: "nominatim",
  //                     };
  //                   }
  //                 }
  //               }
  //             } catch (nomErr) {
  //               // Nominatim geocoding failed
  //             }
  //           }

  //           if (featureEn) {
  //             const [lng, lat] =
  //               (featureEn.center &&
  //                 featureEn.center.length >= 2 &&
  //                 featureEn.center) ||
  //               (featureEn.geometry?.coordinates &&
  //                 featureEn.geometry.coordinates.length >= 2 &&
  //                 featureEn.geometry.coordinates) ||
  //               [];
  //             if (Number.isFinite(lng) && Number.isFinite(lat)) {
  //               jobData.location = {
  //                 type: "Point",
  //                 coordinates: [lng, lat],
  //               };
  //               jobData.coordinates = { lng, lat };
  //               coordinatesFound = true;
  //               // Coordinates found via forward geocoding (English)

  //               // השתמש בשם מה-JSON אם יש, אחרת מהתוצאה
  //               const hebName = selectedCity
  //                 ? selectedCity.name ||
  //                   selectedCity.שם_ישוב ||
  //                   originalLocationText
  //                 : featureEn.place_name_he ||
  //                   featureEn.text_he ||
  //                   featureEn.place_name ||
  //                   featureEn.text ||
  //                   originalLocationText;
  //               const engName = selectedCity
  //                 ? selectedCity.english_name ||
  //                   selectedCity.שם_ישוב_לועזי ||
  //                   call.locationEnglishName
  //                 : featureEn.place_name ||
  //                   featureEn.text ||
  //                   call.locationEnglishName ||
  //                   originalLocationText;

  //               if (
  //                 !jobData.locationText ||
  //                 jobData.locationText === "המיקום שלי"
  //               ) {
  //                 jobData.locationText = hebName;
  //               }
  //               if (!jobData.locationTextEn) {
  //                 jobData.locationTextEn = engName;
  //               }
  //             }
  //           }
  //         } catch (fwdErrEn) {
  //           failed:",
  //             fwdErrEn?.message
  //           );
  //         }
  //       }

  //       // אם עדיין אין קואורדינטות, לא נשמור את העבודה
  //       if (!coordinatesFound) {
  //
  //         return res.status(400).json({
  //           success: false,
  //           message: "לא ניתן למצוא את המיקום. אנא נסה שוב או בחר 'לפי מיקום'",
  //         });
  //       }
  //     }

  //     // בדיקה סופית: אם אין קואורדינטות בכלל, לא נשמור את העבודה
  //     if (!jobData.location || !jobData.coordinates) {
  //
  //       return res.status(400).json({
  //         success: false,
  //         message: "לא ניתן למצוא את המיקום. אנא נסה שוב או בחר 'לפי מיקום'",
  //       });
  //     }

  //     // שמור את העבודה במסד הנתונים
  //     const result = await collectionJobs.insertOne(jobData);
  //     const savedJobId = result.insertedId;

  //     // מצא את כל הנדימנים שהעבודה רלוונטית להם ושלח להם Push Notification
  //     try {
  //       await notifyRelevantHandymen(savedJobId, jobData, collection);
  //     } catch (notifyError) {
  //       // Don't fail the request if notification fails
  //
  //     }

  //     // הוסף את הקריאה כ-specialty למשתמש (אם יש userId)
  //     if (call.userId) {
  //       try {
  //         const collection = getCollection();
  //         const userId = new ObjectId(call.userId);

  //         // מצא את המשתמש
  //         const user = await collection.findOne({ _id: userId });

  //         if (user) {
  //           // צור אובייקט specialty מהקריאה
  //           // משתמש באובייקט subcategoryInfo שכבר נוצר
  //           const newSpecialty = {
  //             name: subcategoryInfo.name,
  //             category: subcategoryInfo.category,
  //             price: subcategoryInfo.price,
  //             typeWork: subcategoryInfo.typeWork || null, // לשעה או קבלנות
  //           };

  //           // בדוק אם ה-specialty כבר קיים (לפי name)
  //           let specialties = user.specialties || [];
  //           const existingIndex = specialties.findIndex(
  //             (s) => s.name === newSpecialty.name
  //           );

  //           if (existingIndex >= 0) {
  //             // עדכן את ה-specialty הקיים
  //             specialties[existingIndex] = newSpecialty;
  //           } else {
  //             // הוסף specialty חדש
  //             specialties.push(newSpecialty);
  //           }

  //           // עדכן את המשתמש במסד הנתונים
  //           await collection.updateOne(
  //             { _id: userId },
  //             { $set: { specialties: specialties } }
  //           );
  //         }
  //       } catch (specialtyError) {
  //         // אם יש שגיאה בהוספת specialty, זה לא צריך לעצור את יצירת הקריאה
  //
  //       }
  //     }

  //     return res.json({
  //       success: true,
  //       message: "הקריאה נוצרה בהצלחה",
  //       jobId: result.insertedId,
  //     });
  //   } catch (error) {
  //
  //     return res.status(500).json({
  //       success: false,
  //       message: "שגיאה ביצירת הקריאה",
  //       error: error.message,
  //     });
  //   }
  // });
  // New endpoint for AI category matching (called from step 1)
  app.post("/Get-categor-ofOpenAI", async (req, res) => {
    try {
      const { requests } = req.body;

      if (!requests || !Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({
          success: false,
          message: "יש לספק לפחות בקשה אחת",
        });
      }

      // Filter out empty requests
      const validRequests = requests.filter((r) => r && r.trim().length > 0);

      if (validRequests.length === 0) {
        return res.status(400).json({
          success: false,
          message: "יש לספק לפחות בקשה אחת תקינה",
        });
      }

      // Load categories from JSON file
      let categoriesData;
      try {
        const categoriesPath = path.join(__dirname, "API", "Categorhs.json");
        const categoriesFile = fs.readFileSync(categoriesPath, "utf8");
        categoriesData = JSON.parse(categoriesFile);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "שגיאה בטעינת קטגוריות",
          error: error.message,
        });
      }

      const categories = categoriesData.categories || [];
      const categoryNames = categories.map((cat) => cat.name);

      // Initialize OpenAI client
      const apiKey = process.env.OPENAI_ACCESS_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          message: "שגיאה בהגדרת OpenAI",
        });
      }

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      // Ask OpenAI for matching categories for each request
      const categoryMatches = [];

      for (const request of validRequests) {
        // First check if it's spam
        const spamCheckPrompt = `בדוק אם הטקסט הבא הוא ספאם ברור (ג'יבריש, קללות, בדיקה או שטויות):

בקשה: "${request}"

ענה "true" רק אם:
- הטקסט הוא ג'יבריש (כמו "ידלחכידלחכיד", "asdfgh", "123456" וכו')
- הטקסט מכיל קללות או תוכן פוגעני
- הטקסט הוא בדיקה או שטויות ברורות

ענה "false" אם:
- הטקסט תקין לשונית (גם אם לא קשור לעבודות בית)
- הטקסט מתאר בעיה או עבודה כלשהי
- הטקסט נראה כמו בקשה אמיתית

ענה רק "true" או "false" ללא תווים נוספים.`;

        try {
          // Check for spam first
          const spamCheck = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
              {
                role: "user",
                content: spamCheckPrompt,
              },
            ],
            max_tokens: 10,
            temperature: 0.1,
          });

          // Track AI usage and cost
          if (spamCheck.usage) {
            await trackAIUsage(spamCheck.usage);
          }

          const isSpam =
            spamCheck.choices[0]?.message?.content?.trim().toLowerCase() ===
            "true";

          if (isSpam) {
            categoryMatches.push({
              request: request,
              category: false,
              isSpam: true,
            });
            continue; // Skip category matching for spam
          }

          // If not spam, proceed with category matching
          const prompt = `תבסס על הבקשה הבאה, בחר את הקטגוריה הכי מתאימה מהרשימה הבאה.

בקשה: "${request}"

רשימת קטגוריות:
${categoryNames.map((cat, idx) => `${idx + 1}. ${cat}`).join("\n")}

חשוב מאוד:
- ענה רק בשם הקטגוריה הכי מתאימה מהרשימה לעיל, ללא מספרים או תווים נוספים
- אסור להמציא קטגוריות שלא קיימות ברשימה
- אם אין התאמה טובה, בחר את הכי קרוב מהרשימה
- אם אין התאמה בכלל, בחר את הכי קרוב מהרשימה (אל תמציא)`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 50,
            temperature: 0.3,
          });

          // Track AI usage and cost
          if (completion.usage) {
            await trackAIUsage(completion.usage);
          }

          const matchedCategory =
            completion.choices[0]?.message?.content?.trim() || null;

          // If category found, find matching subcategory
          let matchedSubcategory = null;
          if (matchedCategory) {
            // Find the category in the JSON
            const foundCategory = categories.find(
              (cat) => cat.name === matchedCategory
            );

            if (foundCategory && foundCategory.subcategories) {
              // Extract subcategory names only
              const subcategoryNames = foundCategory.subcategories.map(
                (sub) => sub.name
              );

              if (subcategoryNames.length > 0) {
                // Ask OpenAI for matching subcategory
                const subcategoryPrompt = `תבסס על הבקשה הבאה, בחר את התת-קטגוריה הכי מתאימה מהרשימה הבאה.

בקשה: "${request}"
קטגוריה: "${matchedCategory}"

רשימת תת-קטגוריות:
${subcategoryNames.map((sub, idx) => `${idx + 1}. ${sub}`).join("\n")}

חשוב מאוד:
- ענה רק בשם התת-קטגוריה הכי מתאימה מהרשימה לעיל, ללא מספרים או תווים נוספים
- אסור להמציא תת-קטגוריות שלא קיימות ברשימה
- אם אין התאמה טובה, בחר את הכי קרוב מהרשימה
- אם אין התאמה בכלל, בחר את הכי קרוב מהרשימה (אל תמציא)`;

                try {
                  const subcategoryCompletion =
                    await openai.chat.completions.create({
                      model: "gpt-4.1-nano",
                      messages: [
                        {
                          role: "user",
                          content: subcategoryPrompt,
                        },
                      ],
                      max_tokens: 100,
                      temperature: 0.2,
                    });

                  // Track AI usage and cost
                  if (subcategoryCompletion.usage) {
                    await trackAIUsage(subcategoryCompletion.usage);
                  }

                  matchedSubcategory =
                    subcategoryCompletion.choices[0]?.message?.content?.trim() ||
                    null;
                } catch (error) {}
              }
            }
          }

          categoryMatches.push({
            request: request,
            category: matchedCategory,
            subcategory: matchedSubcategory,
            isSpam: false,
          });
        } catch (error) {
          categoryMatches.push({
            request: request,
            category: null,
            isSpam: false,
            error: error.message,
          });
        }
      }

      // Filter out spam requests
      const validMatches = categoryMatches.filter((match) => !match.isSpam);

      if (validMatches.length === 0) {
        return res.json({
          success: false,
          message: "כל הבקשות זוהו כספאם",
          categoryMatches: categoryMatches,
          subcategories: [],
        });
      }

      // Build subcategoryInfo array from validMatches
      const subcategoryInfoArray = [];
      for (const match of validMatches) {
        if (!match.category) continue;

        // Find the category and subcategory details from JSON
        const foundCategory = categories.find(
          (cat) => cat.name === match.category
        );
        if (!foundCategory) continue;

        let subcategoryDetails = null;
        if (match.subcategory && foundCategory.subcategories) {
          subcategoryDetails = foundCategory.subcategories.find(
            (sub) => sub.name === match.subcategory
          );
        }

        if (subcategoryDetails) {
          subcategoryInfoArray.push({
            category: match.category,
            subcategory: match.subcategory,
            price: subcategoryDetails.price || null,
            workType: subcategoryDetails.workType || null,
          });
        } else {
          // If no subcategory, use full category
          subcategoryInfoArray.push({
            category: match.category,
            subcategory: null,
            price: null,
            workType: null,
          });
        }
      }

      if (subcategoryInfoArray.length === 0) {
        return res.json({
          success: false,
          message: "לא ניתן למצוא התאמה לקטגוריות",
          subcategories: [],
        });
      }

      return res.json({
        success: true,
        subcategories: subcategoryInfoArray,
        categoryMatches: validMatches,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בעיבוד הבקשות",
        error: error.message,
      });
    }
  });

  app.post("/create-call-v2", async (req, res) => {
    try {
      // Get subcategoryInfo array from body (already processed by AI in step 1)
      const { subcategoryInfo, handymanIdSpecial } = req.body;

      if (
        !subcategoryInfo ||
        !Array.isArray(subcategoryInfo) ||
        subcategoryInfo.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "יש לספק לפחות תת-קטגוריה אחת",
        });
      }

      // Use subcategoryInfo array from request (already processed by AI)
      const subcategoryInfoArray = subcategoryInfo;

      // Get coordinates from location
      let userLng = null;
      let userLat = null;
      const {
        usingMyLocation,
        coordinates,
        locationEnglishName,
        selectedCity,
        location,
      } = req.body;

      // Priority 1: If coordinates are sent directly (from map click or my location)
      if (
        coordinates &&
        (coordinates.lng !== undefined || coordinates.lon !== undefined) &&
        coordinates.lat !== undefined
      ) {
        const rawLng =
          coordinates.lng !== undefined ? coordinates.lng : coordinates.lon;
        const parsedLng = parseFloat(rawLng);
        const parsedLat = parseFloat(coordinates.lat);
        if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
          userLng = parsedLng;
          userLat = parsedLat;
        }
      } else if (usingMyLocation && coordinates) {
        // Use coordinates from "My Location"

        const rawLng =
          coordinates.lng !== undefined ? coordinates.lng : coordinates.lon;
        const parsedLng = parseFloat(rawLng);
        const parsedLat = parseFloat(coordinates.lat);
        if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
          userLng = parsedLng;
          userLat = parsedLat;
        }
      } else if (locationEnglishName || selectedCity || location) {
        // Find coordinates via Mapbox Geocoding API

        const addressToSearch = locationEnglishName || selectedCity || location;

        const searchAddress = async (addr) => {
          const cleaned = addr.trim();
          if (!cleaned) return null;
          const encoded = encodeURIComponent(cleaned);
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=il&access_token=${process.env.MAPBOX_TOKEN}`;
          try {
            const response = await axios.get(url, { timeout: 10000 });
            if (response.data.features && response.data.features.length > 0) {
              const feature = response.data.features[0];
              if (
                feature.center &&
                Array.isArray(feature.center) &&
                feature.center.length >= 2
              ) {
                return {
                  lng: feature.center[0],
                  lat: feature.center[1],
                };
              }
            }
          } catch (error) {}
          return null;
        };

        const coords = await searchAddress(addressToSearch);
        if (coords) {
          userLng = coords.lng;
          userLat = coords.lat;
        } else {
        }
      }

      if (!userLng || !userLat) {
        return res.status(400).json({
          success: false,
          message: "לא ניתן למצוא את המיקום. אנא בחר מיקום תקין.",
        });
      }

      // Use coordinates we found earlier (userLng, userLat already set)
      const maxDistanceMeters = 50000; // 50 ק"מ

      // Find all handymen in the area
      let allHandymenInArea = [];
      try {
        allHandymenInArea = await collection
          .find({
            isHandyman: true,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [userLng, userLat],
                },
                $maxDistance: maxDistanceMeters,
              },
            },
          })
          .toArray();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "מצטערים, אין הנדימנים באזורך",
          handymen: [],
        });
      }

      if (allHandymenInArea.length === 0) {
        return res.json({
          success: false,
          message: "מצטערים, אין הנדימנים באזורך",
          handymen: [],
        });
      }

      // Helper function to check if handyman has specialty
      const handymanHasSpecialty = (handyman, category, subcategory) => {
        if (!handyman.specialties || !Array.isArray(handyman.specialties)) {
          return false;
        }

        // Check for full category match
        const hasFullCategory = handyman.specialties.some(
          (s) =>
            s.name === category &&
            (s.type === "category" || s.isFullCategory === true)
        );

        if (hasFullCategory) return true;

        // Check for subcategory match
        if (subcategory) {
          return handyman.specialties.some(
            (s) => s.name === subcategory && s.type === "subCategory"
          );
        }

        return false;
      };

      // Find handymen who match ALL subcategories

      const handymenMatchingAll = allHandymenInArea.filter((handyman) => {
        return subcategoryInfoArray.every((subcatInfo) => {
          return handymanHasSpecialty(
            handyman,
            subcatInfo.category,
            subcatInfo.subcategory
          );
        });
      });

      // Find handymen who match SOME subcategories (for partial matches)

      const handymenMatchingSome = allHandymenInArea.filter((handyman) => {
        const matchingCount = subcategoryInfoArray.filter((subcatInfo) => {
          return handymanHasSpecialty(
            handyman,
            subcatInfo.category,
            subcatInfo.subcategory
          );
        }).length;
        return matchingCount > 0 && matchingCount < subcategoryInfoArray.length;
      });

      // Find handymen who match at least one subcategory (for split option)

      const handymenMatchingAtLeastOne = allHandymenInArea.filter(
        (handyman) => {
          return subcategoryInfoArray.some((subcatInfo) => {
            return handymanHasSpecialty(
              handyman,
              subcatInfo.category,
              subcatInfo.subcategory
            );
          });
        }
      );

      // Format handymen for response
      const formatHandyman = (handyman) => ({
        _id: handyman._id,
        username: handyman.username,
        email: handyman.email,
        phone: handyman.phone,
        imageUrl: handyman.imageUrl,
        rating: handyman.rating || 0,
        jobDone: handyman.jobDone || 0,
        city: handyman.city || handyman.address,
        coordinates: handyman.coordinates,
      });

      // Scenario 1: Handyman(s) match ALL subcategories - create job
      if (handymenMatchingAll.length > 0) {
        // Get client info
        const {
          userId,
          desc,
          workType,
          when,
          urgent,
          imageUrls,
          imageUrl,
          location,
        } = req.body;
        // Support both array (new) and single string (old) for backward compatibility
        const imageUrlArray = imageUrls
          ? Array.isArray(imageUrls)
            ? imageUrls
            : [imageUrls]
          : imageUrl
          ? Array.isArray(imageUrl)
            ? imageUrl
            : [imageUrl]
          : [];
        let clientName = null;
        if (userId) {
          try {
            const clientObjectId = new ObjectId(userId);
            const client = await collection.findOne({ _id: clientObjectId });
            if (client) {
              clientName = client.username || null;
            }
          } catch (error) {
            // Client fetch failed, continue without clientName
          }
        }

        // Create job with subcategoryInfo as array
        const jobData = {
          clientId: userId || null,
          clientName: clientName,
          handymanId: null,
          handymanName: null,
          handymanIdSpecial: handymanIdSpecial || null,
          subcategoryInfo: subcategoryInfoArray, // Array!
          workType: workType || "קלה",
          desc: desc || "",
          locationText: location || "מיקום",
          imageUrl: imageUrlArray, // Array of image URLs
          when: when || "asap",
          urgent: urgent || false,
          status: "open",
          createdAt: new Date(),
          updatedAt: new Date(),
          location: {
            type: "Point",
            coordinates: [userLng, userLat],
          },
          coordinates: {
            lng: userLng,
            lat: userLat,
          },
        };

        const jobsCollection = getCollectionJobs();
        const result = await jobsCollection.insertOne(jobData);
        const savedJobId = result.insertedId;

        // Send push notifications to matching handymen (in background, don't wait)
        // If handymanIdSpecial is provided, send only to that handyman
        (async () => {
          try {
            let handymenToNotify = handymenMatchingAll;

            // If handymanIdSpecial is provided, send only to that specific handyman
            if (handymanIdSpecial) {
              const specialHandyman = handymenMatchingAll.find(
                (h) => String(h._id) === String(handymanIdSpecial)
              );
              if (specialHandyman) {
                handymenToNotify = [specialHandyman];
              } else {
                // If special handyman not in matching list, try to find them in database
                try {
                  const specialHandymanObjectId = new ObjectId(
                    handymanIdSpecial
                  );
                  const specialHandymanFromDB = await collection.findOne({
                    _id: specialHandymanObjectId,
                    isHandyman: true,
                  });
                  if (specialHandymanFromDB && specialHandymanFromDB.fcmToken) {
                    handymenToNotify = [specialHandymanFromDB];
                  } else {
                    handymenToNotify = [];
                  }
                } catch (error) {
                  handymenToNotify = [];
                }
              }
            }

            for (const handyman of handymenToNotify) {
              if (handyman.fcmToken) {
                const subcategoryNames = subcategoryInfoArray
                  .map((s) => s.subcategory || s.category)
                  .join(", ");
                await sendPushNotification(
                  handyman.fcmToken,
                  handymanIdSpecial
                    ? "הזמנה אישית עבורך! 🔧"
                    : "עבודה חדשה באזור שלך! 🔧",
                  `${subcategoryNames} - ${location || "מיקום"}`,
                  {
                    type: "new_job",
                    jobId: savedJobId.toString(),
                  }
                );
              }
            }
          } catch (notifyError) {
            // Push notification failed, continue anyway
          }
        })();

        return res.json({
          success: true,
          message: "הקריאה נוצרה בהצלחה",
          hasHandymen: true,
          handymen: handymenMatchingAll.map(formatHandyman),
          jobId: savedJobId.toString(),
          scenario: "all_match",
        });
      }

      // Scenario 2: No handymen match anything

      if (handymenMatchingAtLeastOne.length === 0) {
        return res.json({
          success: false,
          message: "מצטערים, אין כרגע הנדימנים שמתמחים בתחומים שאתה צריך",
          handymen: [],
          scenario: "no_match",
        });
      }

      // Scenario 3: Some handymen match some subcategories (partial match)

      if (handymenMatchingSome.length > 0) {
        // Find which subcategories have matches
        const matchedSubcategories = subcategoryInfoArray.filter(
          (subcatInfo) => {
            return handymenMatchingAtLeastOne.some((handyman) => {
              return handymanHasSpecialty(
                handyman,
                subcatInfo.category,
                subcatInfo.subcategory
              );
            });
          }
        );

        // Remove duplicates from matchedSubcategories
        const uniqueMatchedSubcategories = [];
        const seenKeys = new Set();
        for (const subcat of matchedSubcategories) {
          const key = `${subcat.category || ""}_${subcat.subcategory || ""}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueMatchedSubcategories.push(subcat);
          }
        }

        return res.json({
          success: false,
          message: "יש הנדימן שמתאים רק לחלק מהתחומים",
          handymen: handymenMatchingSome.map(formatHandyman),
          matchedSubcategories: uniqueMatchedSubcategories.map((s) => ({
            category: s.category,
            subcategory: s.subcategory,
          })),
          allSubcategories: subcategoryInfoArray.map((s) => ({
            category: s.category,
            subcategory: s.subcategory,
          })),
          scenario: "partial_match",
        });
      }

      // Scenario 4: Handymen match at least one but not all - ask to split

      if (handymenMatchingAtLeastOne.length > 0) {
        return res.json({
          success: false,
          message: "אין הנדימן אחד שמתמחה במה שאמרת",
          handymen: handymenMatchingAtLeastOne.map(formatHandyman),
          scenario: "split_needed",
        });
      }

      // Fallback

      return res.json({
        success: false,
        message: "מצטערים, אין הנדימנים באזורך",
        handymen: [],
        scenario: "unknown",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה ביצירת הקריאה",
        error: error.message,
      });
    }
  });

  // Split call endpoint - creates separate jobs for each handyman with their matching subcategories
  app.post("/split-call-v2", async (req, res) => {
    try {
      const {
        userId,
        desc,
        workType,
        when,
        urgent,
        imageUrls,
        location,
        locationEnglishName,
        selectedCity,
        usingMyLocation,
        coordinates,
        handymen,
        matchedSubcategories,
      } = req.body;

      if (!handymen || !Array.isArray(handymen) || handymen.length === 0) {
        return res.status(400).json({
          success: false,
          message: "לא נמצאו הנדימנים",
        });
      }

      if (
        !matchedSubcategories ||
        !Array.isArray(matchedSubcategories) ||
        matchedSubcategories.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "לא נמצאו תחומים מתאימים",
        });
      }

      // Helper function to check if handyman has specialty (same as in create-call-v2)
      const handymanHasSpecialty = (handyman, category, subcategory) => {
        if (!handyman.specialties || !Array.isArray(handyman.specialties)) {
          return false;
        }

        // Check for full category match
        const hasFullCategory = handyman.specialties.some(
          (s) =>
            s.name === category &&
            (s.type === "category" || s.isFullCategory === true)
        );

        if (hasFullCategory) return true;

        // Check for subcategory match
        if (subcategory) {
          return handyman.specialties.some(
            (s) => s.name === subcategory && s.type === "subCategory"
          );
        }

        return false;
      };

      // Get coordinates from location (same logic as create-call-v2)
      let userLng = null;
      let userLat = null;

      if (
        coordinates &&
        (coordinates.lng !== undefined || coordinates.lon !== undefined) &&
        coordinates.lat !== undefined
      ) {
        const rawLng =
          coordinates.lng !== undefined ? coordinates.lng : coordinates.lon;
        const parsedLng = parseFloat(rawLng);
        const parsedLat = parseFloat(coordinates.lat);
        if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
          userLng = parsedLng;
          userLat = parsedLat;
        }
      } else if (locationEnglishName || selectedCity || location) {
        const addressToSearch = locationEnglishName || selectedCity || location;
        const searchAddress = async (addr) => {
          const cleaned = addr.trim();
          if (!cleaned) return null;
          const encoded = encodeURIComponent(cleaned);
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=il&access_token=${process.env.MAPBOX_TOKEN}`;
          try {
            const response = await axios.get(url, { timeout: 10000 });
            if (response.data.features && response.data.features.length > 0) {
              const feature = response.data.features[0];
              if (
                feature.center &&
                Array.isArray(feature.center) &&
                feature.center.length >= 2
              ) {
                return {
                  lng: feature.center[0],
                  lat: feature.center[1],
                };
              }
            }
          } catch (error) {
            // Error geocoding, continue
          }
          return null;
        };

        const coords = await searchAddress(addressToSearch);
        if (coords) {
          userLng = coords.lng;
          userLat = coords.lat;
        } else {
        }
      }

      if (!userLng || !userLat) {
        return res.status(400).json({
          success: false,
          message: "לא ניתן למצוא את המיקום. אנא בחר מיקום תקין.",
        });
      }

      // Get client name

      let clientName = null;
      if (userId) {
        try {
          const clientObjectId = new ObjectId(userId);
          const client = await collection.findOne({ _id: clientObjectId });
          if (client) {
            clientName = client.username || null;
          }
        } catch (error) {
          // Client fetch failed, continue without clientName
        }
      }

      // Support both array (new) and single string (old) for backward compatibility

      const imageUrlArray = imageUrls
        ? Array.isArray(imageUrls)
          ? imageUrls
          : [imageUrls]
        : [];

      // Group subcategories by unique combinations and find handymen for each group

      const jobsCollection = getCollectionJobs();

      const createdJobs = [];

      // First, fetch all handymen and find which subcategories each matches
      const handymenWithMatches = [];
      for (const handymanData of handymen) {
        // Fetch full handyman data from database to get specialties
        let handyman = null;
        try {
          const handymanId =
            handymanData._id?.toString() || handymanData._id || handymanData.id;
          if (handymanId) {
            const handymanObjectId = new ObjectId(handymanId);
            handyman = await collection.findOne({ _id: handymanObjectId });
          }
        } catch (error) {
          continue;
        }

        if (!handyman || !handyman.specialties) {
          continue;
        }

        // Find which subcategories this handyman matches
        const matchingSubcategories = matchedSubcategories.filter(
          (subcatInfo) => {
            return handymanHasSpecialty(
              handyman,
              subcatInfo.category,
              subcatInfo.subcategory
            );
          }
        );

        if (matchingSubcategories.length > 0) {
          handymenWithMatches.push({
            handyman: handyman,
            matchingSubcategories: matchingSubcategories,
          });
        }
      }

      // Group subcategories by unique combinations
      // Use a Map where key is a sorted string of subcategory keys, value is the subcategories array
      const subcategoryGroups = new Map();

      for (const { matchingSubcategories } of handymenWithMatches) {
        // Create a unique key for this group of subcategories
        const sortedKeys = matchingSubcategories
          .map((s) => `${s.category || ""}_${s.subcategory || ""}`)
          .sort()
          .join("|");

        // If this group doesn't exist yet, add it
        if (!subcategoryGroups.has(sortedKeys)) {
          subcategoryGroups.set(sortedKeys, matchingSubcategories);
        }
      }

      // Create one job per unique subcategory group
      for (const [groupKey, subcategoryGroup] of subcategoryGroups) {
        const jobData = {
          clientId: userId || null,
          clientName: clientName,
          handymanId: null,
          handymanName: null,
          handymanIdSpecial: null,
          subcategoryInfo: subcategoryGroup, // Array of matching subcategories
          workType: workType || "קלה",
          desc: desc || "",
          locationText: location || "מיקום",
          imageUrl: imageUrlArray, // Array of image URLs
          when: when || "asap",
          urgent: urgent || false,
          status: "open",
          createdAt: new Date(),
          updatedAt: new Date(),
          location: {
            type: "Point",
            coordinates: [userLng, userLat],
          },
          coordinates: {
            lng: userLng,
            lat: userLat,
          },
        };

        const result = await jobsCollection.insertOne(jobData);

        // Find all handymen that match this subcategory group
        const matchingHandymen = handymenWithMatches
          .filter(({ matchingSubcategories: match }) => {
            const matchKeys = match
              .map((s) => `${s.category || ""}_${s.subcategory || ""}`)
              .sort()
              .join("|");
            return matchKeys === groupKey;
          })
          .map(({ handyman }) => handyman);

        createdJobs.push({
          jobId: result.insertedId.toString(),
          handymen: matchingHandymen.map((h) => h._id.toString()),
          subcategories: subcategoryGroup,
        });

        // Send push notification to all matching handymen (in background, don't wait)
        for (const handyman of matchingHandymen) {
          if (handyman.fcmToken) {
            (async () => {
              try {
                const subcategoryNames = subcategoryGroup
                  .map((s) => s.subcategory || s.category)
                  .join(", ");
                await sendPushNotification(
                  handyman.fcmToken,
                  "עבודה חדשה באזור שלך! 🔧",
                  `${subcategoryNames} - ${location || "מיקום"}`,
                  {
                    type: "new_job",
                    jobId: result.insertedId.toString(),
                  }
                );
              } catch (notifyError) {
                // Push notification failed, continue anyway
              }
            })();
          } else {
          }
        }
      }

      // Update user's Ordered count (+1) - only once, even if multiple jobs were created
      if (userId && createdJobs.length > 0) {
        try {
          const clientObjectId = new ObjectId(userId);
          await collection.updateOne(
            { _id: clientObjectId },
            { $inc: { Ordered: 1 } }
          );
        } catch (error) {
          // Silent fail - Ordered update is not critical
          console.error("Error updating Ordered count:", error.message);
        }
      }

      return res.json({
        success: true,
        message: `נוצרו ${createdJobs.length} עבודות בהצלחה`,
        jobs: createdJobs,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בפיצול הקריאה",
        error: error.message,
      });
    }
  });

  // Get categories endpoint
  app.get("/categories", async (req, res) => {
    try {
      const categoriesPath = path.join(__dirname, "API", "Categorhs.json");
      const categoriesFile = fs.readFileSync(categoriesPath, "utf8");
      const categoriesData = JSON.parse(categoriesFile);
      return res.json({
        success: true,
        categories: categoriesData.categories || [],
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error loading categories",
        error: error.message,
      });
    }
  });

  // Helper function to save categories to file
  function saveCategoriesToFile(categories) {
    const categoriesPath = path.join(__dirname, "API", "Categorhs.json");
    const data = { categories };
    fs.writeFileSync(categoriesPath, JSON.stringify(data, null, 2), "utf8");
  }

  // Helper function to load categories from file
  function loadCategoriesFromFile() {
    const categoriesPath = path.join(__dirname, "API", "Categorhs.json");
    const categoriesFile = fs.readFileSync(categoriesPath, "utf8");
    return JSON.parse(categoriesFile);
  }

  // Add category endpoint
  app.post("/categories", async (req, res) => {
    try {
      const { name, subcategories } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const data = loadCategoriesFromFile();
      const categories = data.categories || [];

      // Check if category already exists
      if (categories.some((cat) => cat.name === name)) {
        return res.status(400).json({
          success: false,
          message: "Category already exists",
        });
      }

      // Add new category
      categories.push({
        name,
        subcategories: subcategories || [],
      });

      saveCategoriesToFile(categories);

      return res.json({
        success: true,
        message: "Category added successfully",
        categories,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error adding category",
        error: error.message,
      });
    }
  });

  // Update category endpoint
  app.put("/categories/:categoryName", async (req, res) => {
    try {
      const { categoryName } = req.params;
      const { name, subcategories } = req.body;

      const data = loadCategoriesFromFile();
      const categories = data.categories || [];

      const categoryIndex = categories.findIndex(
        (cat) => cat.name === categoryName
      );

      if (categoryIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Update category
      if (name) categories[categoryIndex].name = name;
      if (subcategories !== undefined)
        categories[categoryIndex].subcategories = subcategories;

      saveCategoriesToFile(categories);

      return res.json({
        success: true,
        message: "Category updated successfully",
        categories,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating category",
        error: error.message,
      });
    }
  });

  // Delete category endpoint
  app.delete("/categories/:categoryName", async (req, res) => {
    try {
      const { categoryName } = req.params;

      const data = loadCategoriesFromFile();
      let categories = data.categories || [];

      categories = categories.filter((cat) => cat.name !== categoryName);

      saveCategoriesToFile(categories);

      return res.json({
        success: true,
        message: "Category deleted successfully",
        categories,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting category",
        error: error.message,
      });
    }
  });

  // Add subcategory endpoint
  app.post("/categories/:categoryName/subcategories", async (req, res) => {
    try {
      const { categoryName } = req.params;
      const { name, price, workType } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Subcategory name is required",
        });
      }

      const data = loadCategoriesFromFile();
      const categories = data.categories || [];

      const categoryIndex = categories.findIndex(
        (cat) => cat.name === categoryName
      );

      if (categoryIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Check if subcategory already exists
      const category = categories[categoryIndex];
      if (
        category.subcategories &&
        category.subcategories.some((sub) => sub.name === name)
      ) {
        return res.status(400).json({
          success: false,
          message: "Subcategory already exists",
        });
      }

      // Add new subcategory
      if (!category.subcategories) category.subcategories = [];
      category.subcategories.push({
        name,
        price: price || 0,
        workType: workType || "קבלנות",
      });

      saveCategoriesToFile(categories);

      return res.json({
        success: true,
        message: "Subcategory added successfully",
        categories,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error adding subcategory",
        error: error.message,
      });
    }
  });

  // Update subcategory endpoint
  app.put(
    "/categories/:categoryName/subcategories/:subcategoryName",
    async (req, res) => {
      try {
        const { categoryName, subcategoryName } = req.params;
        const { name, price, workType } = req.body;

        const data = loadCategoriesFromFile();
        const categories = data.categories || [];

        const categoryIndex = categories.findIndex(
          (cat) => cat.name === categoryName
        );

        if (categoryIndex === -1) {
          return res.status(404).json({
            success: false,
            message: "Category not found",
          });
        }

        const category = categories[categoryIndex];
        if (!category.subcategories) {
          return res.status(404).json({
            success: false,
            message: "Subcategory not found",
          });
        }

        const subcategoryIndex = category.subcategories.findIndex(
          (sub) => sub.name === subcategoryName
        );

        if (subcategoryIndex === -1) {
          return res.status(404).json({
            success: false,
            message: "Subcategory not found",
          });
        }

        // Update subcategory
        if (name) category.subcategories[subcategoryIndex].name = name;
        if (price !== undefined)
          category.subcategories[subcategoryIndex].price = price;
        if (workType !== undefined)
          category.subcategories[subcategoryIndex].workType = workType;

        saveCategoriesToFile(categories);

        return res.json({
          success: true,
          message: "Subcategory updated successfully",
          categories,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error updating subcategory",
          error: error.message,
        });
      }
    }
  );

  // Delete subcategory endpoint
  app.delete(
    "/categories/:categoryName/subcategories/:subcategoryName",
    async (req, res) => {
      try {
        const { categoryName, subcategoryName } = req.params;

        const data = loadCategoriesFromFile();
        const categories = data.categories || [];

        const categoryIndex = categories.findIndex(
          (cat) => cat.name === categoryName
        );

        if (categoryIndex === -1) {
          return res.status(404).json({
            success: false,
            message: "Category not found",
          });
        }

        const category = categories[categoryIndex];
        if (!category.subcategories) {
          return res.status(404).json({
            success: false,
            message: "Subcategory not found",
          });
        }

        category.subcategories = category.subcategories.filter(
          (sub) => sub.name !== subcategoryName
        );

        saveCategoriesToFile(categories);

        return res.json({
          success: true,
          message: "Subcategory deleted successfully",
          categories,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error deleting subcategory",
          error: error.message,
        });
      }
    }
  );

  // Admin endpoint - Get all users
  app.get("/admin/users", async (req, res) => {
    try {
      const collection = getCollection();
      if (!collection) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      const users = await collection
        .find({})
        .project({
          password: 0, // Exclude password
          googleId: 0, // Exclude sensitive data
        })
        .sort({ createdAt: -1 }) // Sort by newest first
        .toArray();

      return res.json({
        success: true,
        users: users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Update user
  app.put("/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "User ID required" });
      }

      // Remove sensitive fields that shouldn't be updated this way
      delete updateData.password;
      delete updateData._id;
      delete updateData.fcmToken;
      delete updateData.googleId;

      const userId = new ObjectId(id);
      const usersCol = getCollection();

      // Check if user exists
      const user = await usersCol.findOne({ _id: userId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Update user
      await usersCol.updateOne(
        { _id: userId },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        }
      );

      return res.json({
        success: true,
        message: "User updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Send message to user
  app.post("/admin/send-message", async (req, res) => {
    try {
      const { userId, message } = req.body;

      if (!userId || !message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "User ID and message are required",
        });
      }

      const usersCol = getCollection();
      const userObjectId = new ObjectId(userId);

      // Get user to check if they have FCM token
      const user = await usersCol.findOne({ _id: userObjectId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (!user.fcmToken) {
        return res.status(400).json({
          success: false,
          message: "המשתמש לא אישר התראות",
        });
      }

      // Send push notification
      const pushResult = await sendPushNotification(
        user.fcmToken,
        "הודעה מהמנהל",
        message.trim(),
        {
          type: "admin_message",
          userId: userId,
        }
      );

      if (!pushResult.success) {
        return res.status(500).json({
          success: false,
          message: "שגיאה בשליחת ההודעה",
          error: pushResult.error,
        });
      }

      return res.json({
        success: true,
        message: "הודעה נשלחה בהצלחה",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error sending message",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Delete user
  app.delete("/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "User ID required" });
      }

      const userId = new ObjectId(id);
      const usersCol = getCollection();
      const jobsCol = getCollectionJobs();
      const ratingsCol = getCollectionRatings();
      const chatsCol = getCollectionChats();

      // Check if user exists
      const user = await usersCol.findOne({ _id: userId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Get all job IDs associated with this user (as client or handyman)
      const userJobs = await jobsCol
        .find({
          $or: [{ clientId: userId }, { handymanId: userId }],
        })
        .toArray();
      const jobIds = userJobs.map((job) => job._id);

      // Delete user's chats (before deleting jobs)
      if (jobIds.length > 0) {
        await chatsCol.deleteMany({ jobId: { $in: jobIds } });
      }

      // Delete user's jobs (both as client and as handyman)
      await jobsCol.deleteMany({
        $or: [{ clientId: userId }, { handymanId: userId }],
      });

      // Delete user's ratings (both as customer and as handyman)
      await ratingsCol.deleteMany({
        $or: [{ customerId: userId }, { handymanId: userId }],
      });

      // Finally, delete the user
      const result = await usersCol.deleteOne({ _id: userId });
      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      return res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting user",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get financials data
  // Aggregates all financial documents and sums them up
  app.get("/admin/financials", async (req, res) => {
    try {
      const financialsCol = getCollectionFinancials();
      if (!financialsCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      // Aggregate all documents and sum up expenses and revenue
      const aggregated = await financialsCol
        .aggregate([
          {
            $group: {
              _id: null,
              totalAIExpenses: {
                $sum: { $ifNull: ["$expenses.AI expenses", 0] },
              },
              totalDBExpenses: {
                $sum: { $ifNull: ["$expenses.DB expenses", 0] },
              },
              totalAPIExpenses: {
                $sum: { $ifNull: ["$expenses.API expenses", 0] },
              },
              totalMarketingExpenses: {
                $sum: { $ifNull: ["$expenses.Marketing expenses", 0] },
              },
              totalClearingFee: {
                $sum: { $ifNull: ["$expenses.clearing fee", 0] },
              },
              totalFees: {
                $sum: { $ifNull: ["$Revenue.Fees", 0] },
              },
              totalDrawings: {
                $sum: { $ifNull: ["$Revenue.Drawings", 0] },
              },
              totalUrgentCall: {
                $sum: { $ifNull: ["$Revenue.Urgent call", 0] },
              },
            },
          },
        ])
        .toArray();

      const totals = aggregated[0] || {};

      return res.json({
        success: true,
        financials: {
          expenses: {
            "AI expenses": totals.totalAIExpenses || 0,
            "DB expenses": totals.totalDBExpenses || 0,
            "API expenses": totals.totalAPIExpenses || 0,
            "Marketing expenses": totals.totalMarketingExpenses || 0,
            "clearing fee": totals.totalClearingFee || 0,
          },
          Revenue: {
            Fees: totals.totalFees || 0,
            Drawings: totals.totalDrawings || 0,
            "Urgent call": totals.totalUrgentCall || 0,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching financials",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get financials chart data (grouped by date)
  app.get("/admin/financials/chart", async (req, res) => {
    try {
      const financialsCol = getCollectionFinancials();
      if (!financialsCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      const { period = "daily" } = req.query; // daily, weekly, monthly

      // Group documents by date and sum expenses/revenue
      let dateFormat;
      switch (period) {
        case "weekly":
          dateFormat = {
            $dateToString: {
              format: "%Y-%W", // Year-Week
              date: "$createdAt",
            },
          };
          break;
        case "monthly":
          dateFormat = {
            $dateToString: {
              format: "%Y-%m", // Year-Month
              date: "$createdAt",
            },
          };
          break;
        default: // daily
          dateFormat = {
            $dateToString: {
              format: "%Y-%m-%d", // Year-Month-Day
              date: "$createdAt",
            },
          };
      }

      const chartData = await financialsCol
        .aggregate([
          {
            $group: {
              _id: dateFormat,
              date: { $first: "$createdAt" },
              totalExpenses: {
                $sum: {
                  $add: [
                    { $ifNull: ["$expenses.AI expenses", 0] },
                    { $ifNull: ["$expenses.DB expenses", 0] },
                    { $ifNull: ["$expenses.API expenses", 0] },
                    { $ifNull: ["$expenses.Marketing expenses", 0] },
                    { $ifNull: ["$expenses.clearing fee", 0] },
                  ],
                },
              },
              totalRevenue: {
                $sum: {
                  $add: [
                    { $ifNull: ["$Revenue.Fees", 0] },
                    { $ifNull: ["$Revenue.Drawings", 0] },
                    { $ifNull: ["$Revenue.Urgent call", 0] },
                  ],
                },
              },
            },
          },
          {
            $sort: { date: 1 },
          },
          {
            $project: {
              _id: 0,
              date: 1,
              dateLabel: "$_id",
              expenses: "$totalExpenses",
              revenue: "$totalRevenue",
              profit: {
                $subtract: ["$totalRevenue", "$totalExpenses"],
              },
            },
          },
        ])
        .toArray();

      return res.json({
        success: true,
        chartData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching chart data",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Update financials manually
  // Creates a new document for each update with createdAt
  app.post("/admin/financials/update", async (req, res) => {
    try {
      const { field, amount, operation } = req.body;

      if (!field || amount === undefined || !operation) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: field, amount, operation",
        });
      }

      if (!["add", "subtract"].includes(operation)) {
        return res.status(400).json({
          success: false,
          message: "Operation must be 'add' or 'subtract'",
        });
      }

      const financialsCol = getCollectionFinancials();
      if (!financialsCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      // Validate field path (must be expenses.XXX or Revenue.XXX)
      const validFields = [
        "expenses.AI expenses",
        "expenses.DB expenses",
        "expenses.API expenses",
        "expenses.Marketing expenses",
        "expenses.clearing fee",
        "Revenue.Fees",
        "Revenue.Drawings",
        "Revenue.Urgent call",
      ];

      if (!validFields.includes(field)) {
        return res.status(400).json({
          success: false,
          message: "Invalid field path",
        });
      }

      const updateAmount = operation === "add" ? amount : -amount;

      // Create new document for each update
      const newDoc = {
        createdAt: new Date(),
      };

      // Set the field based on whether it's expenses or Revenue
      if (field.startsWith("expenses.")) {
        const expenseField = field.replace("expenses.", "");
        newDoc.expenses = {
          [expenseField]: updateAmount,
        };
      } else if (field.startsWith("Revenue.")) {
        const revenueField = field.replace("Revenue.", "");
        newDoc.Revenue = {
          [revenueField]: updateAmount,
        };
      }

      await financialsCol.insertOne(newDoc);

      return res.json({
        success: true,
        message: "Financials updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating financials",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get system status statistics
  app.get("/admin/status", async (req, res) => {
    try {
      const usersCol = getCollection();
      const paymentsCol = getCollectionPayments();
      const jobsCol = getCollectionJobs();

      if (!usersCol || !paymentsCol || !jobsCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      // Count handymen
      const handymenCount = await usersCol.countDocuments({
        isHandyman: true,
      });

      // Count clients (users who are not handymen)
      const clientsCount = await usersCol.countDocuments({
        $or: [{ isHandyman: false }, { isHandyman: { $exists: false } }],
      });

      // Count total users
      const totalUsersCount = await usersCol.countDocuments({});

      // Get total amount of completed transactions (payments with status "paid")
      const paymentsResult = await paymentsCol
        .aggregate([
          {
            $match: {
              status: "paid",
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
            },
          },
        ])
        .toArray();

      const totalTransactionsAmount =
        paymentsResult.length > 0 ? paymentsResult[0].totalAmount : 0;

      // Count all jobs (transactions)
      const completedTransactionsCount = await jobsCol.countDocuments({});

      // Get howDidYouHear statistics
      const howDidYouHearResult = await usersCol
        .aggregate([
          {
            $match: {
              howDidYouHear: { $exists: true, $ne: null, $ne: "" },
            },
          },
          {
            $group: {
              _id: "$howDidYouHear",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      // Create a map of howDidYouHear counts
      const howDidYouHearStats = {
        אינסטגרם: 0,
        פייסבוק: 0,
        חבר: 0,
        גוגל: 0,
        אחר: 0,
      };

      // Fill in the counts from database results
      howDidYouHearResult.forEach((item) => {
        const key = item._id?.trim();
        if (!key) return;

        // Try to match exact key first
        if (howDidYouHearStats.hasOwnProperty(key)) {
          howDidYouHearStats[key] = item.count;
        } else {
          // If it's not one of the known values, add to "אחר"
          howDidYouHearStats.אחר += item.count;
        }
      });

      return res.json({
        success: true,
        status: {
          handymenCount,
          clientsCount,
          totalUsersCount,
          totalTransactionsAmount,
          completedTransactionsCount,
          howDidYouHearStats,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching status",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get users chart data (grouped by date)
  app.get("/admin/status/users-chart", async (req, res) => {
    try {
      const usersCol = getCollection();

      if (!usersCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      // Get users grouped by creation date
      const usersChartData = await usersCol
        .aggregate([
          {
            $match: {
              createdAt: { $exists: true },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              count: 1,
            },
          },
        ])
        .toArray();

      return res.json({
        success: true,
        chartData: usersChartData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching users chart data",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get transactions chart data (grouped by date)
  app.get("/admin/status/transactions-chart", async (req, res) => {
    try {
      const jobsCol = getCollectionJobs();

      if (!jobsCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      // Get jobs grouped by creation date
      const transactionsChartData = await jobsCol
        .aggregate([
          {
            $match: {
              createdAt: { $exists: true },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              count: 1,
            },
          },
        ])
        .toArray();

      return res.json({
        success: true,
        chartData: transactionsChartData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transactions chart data",
        error: error.message,
      });
    }
  });

  app.delete("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "User ID required" });
      }

      const userId = new ObjectId(id);
      const usersCol = getCollection();
      const jobsCol = getCollectionJobs();
      const ratingsCol = getCollectionRatings();
      const chatsCol = getCollectionChats();

      // Check if user exists
      const user = await usersCol.findOne({ _id: userId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // First find all jobs where user is involved (for deleting chats)
      const userJobs = await jobsCol
        .find({
          $or: [{ clientId: userId }, { handymanId: userId }],
        })
        .toArray();
      const jobIds = userJobs.map((job) => job._id);

      // Delete user's chats (before deleting jobs)
      if (jobIds.length > 0) {
        await chatsCol.deleteMany({ jobId: { $in: jobIds } });
      }

      // Delete user's jobs (both as client and as handyman)
      await jobsCol.deleteMany({
        $or: [{ clientId: userId }, { handymanId: userId }],
      });

      // Delete user's ratings (both as customer and as handyman)
      await ratingsCol.deleteMany({
        $or: [{ customerId: userId }, { handymanId: userId }],
      });

      // Finally, delete the user
      const result = await usersCol.deleteOne({ _id: userId });
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

  // Serve static files from Vue app in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));

    // Serve index.html for all routes (SPA fallback)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

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
      origin:
        process.env.NODE_ENV === "production" ? true : allowedOrigins || [],
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

    // Handle handyman location updates
    socket.on("handyman-location-update", (data) => {
      const { jobId, location } = data;
      if (
        jobId &&
        location &&
        typeof location.lat === "number" &&
        typeof location.lng === "number"
      ) {
        // Emit location update to all clients in the job room (except sender)
        socket.to(`job-${jobId}`).emit("handyman-location-updated", {
          jobId,
          location: {
            lat: location.lat,
            lng: location.lng,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle client request for handyman location
    socket.on("request-handyman-location", async (data) => {
      const { jobId } = data;
      if (jobId) {
        try {
          // Get job to find handyman ID
          const jobsCol = getCollectionJobs();
          const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
          if (job && job.handymanId) {
            // Get handyman ID (handle array)
            let handymanId = job.handymanId;
            if (Array.isArray(handymanId) && handymanId.length > 0) {
              handymanId = handymanId[0];
            }
            const handymanIdStr = String(handymanId);

            // Forward the request to all clients in job room
            // The handyman will identify himself and show the modal
            io.to(`job-${jobId}`).emit("location-request-received", {
              jobId,
              handymanId: handymanIdStr,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error handling location request:", error.message);
        }
      }
    });

    // Handle handyman response to location request
    socket.on("handyman-location-request-response", (data) => {
      const { jobId, approved, location } = data;
      if (jobId && approved && location) {
        // Send location to client if approved
        socket.to(`job-${jobId}`).emit("handyman-location-updated", {
          jobId,
          location: {
            lat: location.lat,
            lng: location.lng,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  // Make io available globally for use in routes
  app.set("io", io);

  // Start server
  httpServer
    .listen(PORT, () => {})
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        process.exit(1);
      } else {
        process.exit(1);
      }
    });
})();

module.exports = app;
