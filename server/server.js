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
//כן זה הזה שעשיתי
// Import configurations and services
const {
  connectDatabase,
  getCollection,
  getCollectionJobs,
  getCollectionRatings,
  getCollectionPayments,
  getCollectionChats,
  getCollectionFinancials,
  getCollectionInquiries,
} = require("./config/database");
const setupPassport = require("./config/passport");
const setupAuthRoutes = require("./routes/auth");
const setupUploadRoutes = require("./routes/upload");
const { sendPushNotification } = require("./services/pushNotificationService");
const { deleteImageFromS3 } = require("./services/uploadService");
const { trackAIUsage } = require("./services/aiCostTracking");
const {
  createPaymentIntent,
  capturePaymentIntent,
  getPaymentIntent,
  getOrCreateConnectedAccount,
  createOnboardingLink,
  createEscrowPaymentIntent,
  captureEscrow,
  cancelEscrow,
  refundPayment,
  getPlatformFeePercent,
  updatePlatformFeePercent,
} = require("./services/stripeService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Helper function to read dry-data.json and get MAAM percentage
function getMaamPercent() {
  try {
    const dryDataPath = path.join(__dirname, "API", "dry-data.json");
    const dryData = JSON.parse(fs.readFileSync(dryDataPath, "utf8"));
    return dryData.maam || 18; // Default to 18% if not found
  } catch (error) {
    return 18; // Default to 18%
  }
}

// Helper function to read dry-data.json and get Monthly-subscriptions
function getMonthlySubscription() {
  try {
    const dryDataPath = path.join(__dirname, "API", "dry-data.json");
    const dryData = JSON.parse(fs.readFileSync(dryDataPath, "utf8"));
    return dryData["Monthly-subscriptions"] || 49.9; // Default to 49.9 if not found
  } catch (error) {
    return 49.9; // Default to 49.9
  }
}

// Helper function to update Monthly-subscriptions in dry-data.json
function updateMonthlySubscription(amount) {
  try {
    const dryDataPath = path.join(__dirname, "API", "dry-data.json");
    const dryData = JSON.parse(fs.readFileSync(dryDataPath, "utf8"));
    dryData["Monthly-subscriptions"] = parseFloat(amount);
    fs.writeFileSync(dryDataPath, JSON.stringify(dryData, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error updating Monthly-subscriptions:", error);
    return false;
  }
}

// Helper function to calculate VAT amounts
function calculateVAT(amount, vatPercent) {
  const amountWithoutVAT = amount / (1 + vatPercent / 100);
  const vatAmount = amount - amountWithoutVAT;
  return {
    amountWithoutVAT: Math.round(amountWithoutVAT * 100) / 100,
    amountWithVAT: Math.round(amount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
  };
}

// Helper function for Google Maps Geocoding (address to coordinates)
async function geocodeAddress(address) {
  if (!address || !address.trim()) {
    return null;
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("❌ [Geocoding] GOOGLE_MAPS_API_KEY not configured");
    return null;
  }

  try {
    const encoded = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${process.env.GOOGLE_MAPS_API_KEY}&region=il&language=he`;

    const response = await axios.get(url, { timeout: 10000 });

    if (
      response.data &&
      response.data.status === "OK" &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      const geocodeResult = {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        address_components: result.address_components,
      };

      return geocodeResult;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      "❌ [Geocoding] Error in Google Maps geocoding:",
      error.message
    );
    return null;
  }
}

// Helper function for Google Maps Reverse Geocoding (coordinates to address)
async function reverseGeocodeCoordinates(lat, lng) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error("❌ [Reverse Geocoding] GOOGLE_MAPS_API_KEY not configured");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=he&region=il`;

    const response = await axios.get(url, { timeout: 10000 });

    if (
      response.data &&
      response.data.status === "OK" &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      const result = {
        formatted_address: response.data.results[0].formatted_address,
        address_components: response.data.results[0].address_components,
        results: response.data.results,
      };

      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      "❌ [Reverse Geocoding] Error in Google Maps reverse geocoding:",
      error.message
    );
    return null;
  }
}

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

  // Stripe Webhook endpoint - MUST be before bodyParser to receive raw body
  app.post(
    "/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("Stripe webhook secret not configured");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      const paymentsCol = getCollectionPayments();
      const financialsCol = getCollectionFinancials();
      const usersCol = getCollection();

      try {
        // Handle subscription payment succeeded
        if (event.type === "invoice.payment_succeeded") {
          const invoice = event.data.object;

          // Check if this is a subscription invoice
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription
            );

            // Get customer
            const customer = await stripe.customers.retrieve(invoice.customer);

            // Find user by customer ID
            const user = await usersCol.findOne({
              stripeCustomerId: invoice.customer,
            });

            if (user) {
              const amount = invoice.amount_paid / 100; // Convert from agorot to ILS
              const amountInAgorot = invoice.amount_paid;

              // Calculate Stripe fee: 2.9% + 0.3$ (convert $0.3 to ILS, assuming ~3.5 ILS per $)
              const stripeFeePercent = 2.9;
              const stripeFixedFeeUSD = 0.3;
              const usdToIlsRate = 3.5; // Approximate rate, adjust if needed
              const stripeFixedFeeILS = stripeFixedFeeUSD * usdToIlsRate;
              const stripeFee =
                (amount * stripeFeePercent) / 100 + stripeFixedFeeILS;

              // Save payment record
              await paymentsCol.insertOne({
                type: "subscription",
                amount: amount,
                amountAgorot: amountInAgorot,
                userId: user._id,
                customerId: invoice.customer,
                subscriptionId: invoice.subscription,
                invoiceId: invoice.id,
                status: "succeeded",
                createdAt: new Date(),
              });

              // Save to financials
              const vatPercent = getMaamPercent();
              const vatAmount = (amount * vatPercent) / 100;

              await financialsCol.insertOne({
                Revenue: {
                  Drawings: amount,
                },
                expenses: {
                  "clearing fee": stripeFee,
                },
                createdAt: new Date(),
              });

              // Update user subscription status
              await usersCol.updateOne(
                { _id: user._id },
                {
                  $set: {
                    hasActiveSubscription: true,
                    lastSubscriptionPayment: new Date(),
                  },
                }
              );
            }
          }
        }

        // Handle subscription payment failed
        if (event.type === "invoice.payment_failed") {
          const invoice = event.data.object;

          if (invoice.subscription) {
            // Find user by customer ID
            const user = await usersCol.findOne({
              stripeCustomerId: invoice.customer,
            });

            if (user) {
              // Update user subscription status to false
              await usersCol.updateOne(
                { _id: user._id },
                {
                  $set: {
                    hasActiveSubscription: false,
                  },
                }
              );
            }
          }
        }

        // Handle subscription cancelled
        if (event.type === "customer.subscription.deleted") {
          const subscription = event.data.object;

          // Find user by customer ID
          const user = await usersCol.findOne({
            stripeCustomerId: subscription.customer,
          });

          if (user) {
            // Update user subscription status to false
            await usersCol.updateOne(
              { _id: user._id },
              {
                $set: {
                  hasActiveSubscription: false,
                },
              }
            );
          }
        }

        return res.json({ received: true });
      } catch (error) {
        console.error("Error processing webhook:", error);
        return res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );

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
  let collectionInquiries;

  try {
    await connectDatabase();
    collection = getCollection();
    collectionJobs = getCollectionJobs();
    collectionRatings = getCollectionRatings();
    collectionPayments = getCollectionPayments();
    collectionChats = getCollectionChats();
    collectionInquiries = getCollectionInquiries();
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

      // Find all handymen within 30km (default max distance)
      const maxDistanceMeters = 30000; // 30km
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

          return distanceKm !== null && distanceKm <= 30; // 30km max
        });
      }

      // Filter by specialties
      relevantHandymen = relevantHandymen.filter((handyman) =>
        handymanMatchesJob(handyman, jobData)
      );

      // Filter out blocked handymen (if job has handiman-Blocked array)
      if (
        jobData["handiman-Blocked"] &&
        Array.isArray(jobData["handiman-Blocked"])
      ) {
        const blockedIds = jobData["handiman-Blocked"].map((id) => String(id));
        relevantHandymen = relevantHandymen.filter((handyman) => {
          const handymanIdStr = String(handyman._id);
          return !blockedIds.includes(handymanIdStr);
        });
      }

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
        // Regular user, find by username or email
        user = await collection.findOne({
          $or: [{ username: username }, { email: username }],
        });
      }

      if (!user) {
        return res.json({ message: "NoUser" });
      }

      // Check if user is blocked
      if (user.IsBlocked === true || user.isBlocked === true) {
        return res.json({ message: "Blocked" });
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

      // בדוק אם יש GOOGLE_MAPS_API_KEY
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        // GOOGLE_MAPS_API_KEY is not defined in .env file
        return res.status(500).json({
          success: false,
          message:
            "Google Maps API key is not configured. Please add GOOGLE_MAPS_API_KEY to your .env file.",
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

      // פונקציה לחיפוש כתובת ב-Google Maps Geocoding API
      const searchAddress = async (addr, label = "") => {
        const cleaned = cleanAddress(addr);
        if (!cleaned) {
          return null;
        }

        try {
          const geocodeResult = await geocodeAddress(cleaned);
          if (geocodeResult) {
            // Convert Google Maps format to Mapbox-like format for compatibility
            return {
              features: [
                {
                  center: [geocodeResult.lng, geocodeResult.lat],
                  geometry: {
                    coordinates: [geocodeResult.lng, geocodeResult.lat],
                  },
                  properties: {
                    formatted_address: geocodeResult.formatted_address,
                  },
                },
              ],
            };
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
        // בדיקה אם המשתמש חסום
        if (
          existingUserByEmail.IsBlocked === true ||
          existingUserByEmail.isBlocked === true
        ) {
          return res.status(403).json({
            success: false,
            message: "Blocked",
          });
        }
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
          // בדיקה אם המשתמש חסום
          if (
            existingUserByPhone.IsBlocked === true ||
            existingUserByPhone.isBlocked === true
          ) {
            return res.status(403).json({
              success: false,
              message: "Blocked",
            });
          }
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
          // בדיקה אם המשתמש חסום
          if (
            existingUserByGoogleId.IsBlocked === true ||
            existingUserByGoogleId.isBlocked === true
          ) {
            return res.status(403).json({
              success: false,
              message: "Blocked",
            });
          }
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

        // בדוק אם זה אחד מ-100 הנדימנים הראשונים
        const handymenCount = await collection.countDocuments({
          isHandyman: true,
        });
        if (handymenCount < 100) {
          userData.handimanFree = true;
        }
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
      // Always exclude deleted/cancelled jobs
      query.isDeleted = { $ne: true };
      query.status = { $ne: "cancelled" };

      if (status && status !== "all" && status !== "cancelled") {
        query.status = status;
      } else if ((!status || status === "all") && handymanId) {
        // For handyman, exclude "done" jobs when status is "all" or not specified
        query.status = { $nin: ["done", "cancelled"] };
      }

      if (workType && workType !== "") {
        query.workType = workType;
      }

      // Store handymanIdSpecial filter separately (will be applied after $geoNear)
      // $or doesn't work well with $geoNear, so we'll filter after the geo query
      let handymanIdSpecialFilter = null;
      if (handymanId) {
        try {
          const handymanObjectId = new ObjectId(handymanId);
          const handymanIdString = String(handymanId);
          // Store filter to apply after $geoNear
          handymanIdSpecialFilter = {
            $or: [
              { handymanIdSpecial: handymanObjectId },
              { handymanIdSpecial: handymanIdString },
              { handymanIdSpecial: { $exists: false } },
              { handymanIdSpecial: null },
            ],
          };
        } catch (error) {
          // Invalid handymanId, exclude all personal requests
          handymanIdSpecialFilter = {
            handymanIdSpecial: { $exists: false },
          };
        }
      } else {
        // If no handymanId, exclude all personal requests (handymanIdSpecial)
        handymanIdSpecialFilter = {
          $or: [
            { handymanIdSpecial: { $exists: false } },
            { handymanIdSpecial: null },
          ],
        };
      }

      const userLng = parseFloat(lng);
      const userLat = parseFloat(lat);
      const hasCoords = !isNaN(userLng) && !isNaN(userLat);
      const maxDistanceMeters =
        maxKm && !isNaN(parseFloat(maxKm)) ? parseFloat(maxKm) * 1000 : null;

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
          // Remove $or from query for $geoNear (it doesn't work well with $geoNear)
          const geoQuery = { ...query };
          delete geoQuery.$or;

          const pipeline = [
            {
              $geoNear: {
                near: { type: "Point", coordinates: [userLng, userLat] },
                distanceField: "distanceMeters",
                spherical: true,
                ...(maxDistanceMeters
                  ? { maxDistance: maxDistanceMeters }
                  : {}),
                ...(Object.keys(geoQuery).length ? { query: geoQuery } : {}),
              },
            },
          ];

          // Add $match stage after $geoNear to filter handymanIdSpecial
          if (handymanIdSpecialFilter) {
            pipeline.push({ $match: handymanIdSpecialFilter });
          }

          // First, get jobs after $geoNear but BEFORE $match to see all jobs from MongoDB
          const pipelineBeforeMatch = [
            {
              $geoNear: {
                near: { type: "Point", coordinates: [userLng, userLat] },
                distanceField: "distanceMeters",
                spherical: true,
                ...(maxDistanceMeters
                  ? { maxDistance: maxDistanceMeters }
                  : {}),
                ...(Object.keys(geoQuery).length ? { query: geoQuery } : {}),
              },
            },
          ];
          const jobsBeforeMatch = await collectionJobs
            .aggregate(pipelineBeforeMatch)
            .toArray();

          // Now get jobs after $match
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
        // Remove $or from query for find (we'll filter manually)
        const findQuery = { ...query };
        delete findQuery.$or;

        jobs = await collectionJobs.find(findQuery).toArray();

        // Apply handymanIdSpecial filter manually
        if (handymanIdSpecialFilter) {
          const filterCondition = handymanIdSpecialFilter.$or
            ? handymanIdSpecialFilter.$or
            : [handymanIdSpecialFilter];
          jobs = jobs.filter((job) => {
            if (handymanIdSpecialFilter.$or) {
              // Check if job matches any of the $or conditions
              return filterCondition.some((condition) => {
                if (condition.handymanIdSpecial?.$exists === false) {
                  return !job.handymanIdSpecial;
                }
                if (condition.handymanIdSpecial === null) {
                  return job.handymanIdSpecial === null;
                }
                // Check if handymanIdSpecial matches (as ObjectId or string)
                const jobSpecialStr = job.handymanIdSpecial
                  ? String(job.handymanIdSpecial)
                  : null;
                const conditionSpecialStr = condition.handymanIdSpecial
                  ? String(condition.handymanIdSpecial)
                  : null;
                return jobSpecialStr === conditionSpecialStr;
              });
            } else {
              // Single condition
              if (
                handymanIdSpecialFilter.handymanIdSpecial?.$exists === false
              ) {
                return !job.handymanIdSpecial;
              }
              return true;
            }
          });
        }
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

        // Count jobs with handymanIdSpecial before filtering
        const jobsWithSpecialBefore = jobs.filter(
          (j) => j.handymanIdSpecial
        ).length;

        jobs = jobs.filter((job) => {
          // Exclude "done" jobs for handyman (unless specifically requested)
          if (job.status === "done" && (!status || status === "all")) {
            return false;
          }

          // CRITICAL: If job has handymanIdSpecial, it should ONLY be shown to that specific handyman
          // This is a personal request and should NOT be shown to other handymen
          if (job.handymanIdSpecial) {
            // Convert both to string for comparison (handymanIdSpecial can be ObjectId or string)
            // Handle ObjectId by converting to string using toString() or String()
            let jobHandymanIdSpecialStr;
            if (job.handymanIdSpecial instanceof ObjectId) {
              jobHandymanIdSpecialStr = job.handymanIdSpecial.toString();
            } else if (job.handymanIdSpecial.toString) {
              jobHandymanIdSpecialStr = job.handymanIdSpecial.toString();
            } else {
              jobHandymanIdSpecialStr = String(job.handymanIdSpecial);
            }

            const currentHandymanIdStr = String(handymanId);

            // Also try comparing as ObjectId if possible
            let isMatch = jobHandymanIdSpecialStr === currentHandymanIdStr;

            // If string comparison fails, try ObjectId comparison
            if (!isMatch) {
              try {
                const jobSpecialObjectId =
                  job.handymanIdSpecial instanceof ObjectId
                    ? job.handymanIdSpecial
                    : new ObjectId(job.handymanIdSpecial);
                const currentHandymanObjectId = new ObjectId(handymanId);
                isMatch = jobSpecialObjectId.equals(currentHandymanObjectId);
              } catch (e) {
                // If ObjectId conversion fails, stick with string comparison
                isMatch = false;
              }
            }

            if (!isMatch) {
              // This is NOT the special handyman, hide the job completely
              return false;
            }
            // This IS the special handyman, show the job
            return true;
          }

          // Check if this handyman is blocked in this job
          if (
            job["handiman-Blocked"] &&
            Array.isArray(job["handiman-Blocked"])
          ) {
            const blockedIds = job["handiman-Blocked"].map((id) => String(id));
            if (blockedIds.includes(handymanIdString)) {
              // This handyman is blocked, don't show the job
              return false;
            }
          }

          // Priority 2: Show open jobs (handymanId is null or doesn't exist)
          // These are regular jobs that should be shown to all handymen
          // and match handyman specialties (already filtered above)
          if (!job.handymanId) return true;
          if (Array.isArray(job.handymanId) && job.handymanId.length === 0)
            return true;
          return false;
        });
        const jobsAfterHandymanFilter = jobs.length;
        const jobsWithSpecialAfter = jobs.filter(
          (j) => j.handymanIdSpecial
        ).length;
      } else {
        // If no handymanId is provided, we should still filter out jobs with handymanIdSpecial
        // because they are personal requests and should only be shown to the specific handyman
        const jobsWithSpecialBefore = jobs.filter(
          (j) => j.handymanIdSpecial
        ).length;
        jobs = jobs.filter((job) => {
          // Don't show personal requests (handymanIdSpecial) if no handymanId is provided
          const hasSpecial = !!job.handymanIdSpecial;
          return !hasSpecial;
        });
        const jobsWithSpecialAfter = jobs.filter(
          (j) => j.handymanIdSpecial
        ).length;
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

      // Sort jobs: 1. Urgent first, 2. Special (handymanIdSpecial) second, 3. By creation time (newest first)
      jobs.sort((a, b) => {
        // Priority 1: Urgent jobs first
        const aUrgent = a.urgent === true || a.isUrgent === true;
        const bUrgent = b.urgent === true || b.isUrgent === true;
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;

        // Priority 2: Special jobs (handymanIdSpecial) second
        const aSpecial = !!a.handymanIdSpecial;
        const bSpecial = !!b.handymanIdSpecial;
        if (aSpecial && !bSpecial) return -1;
        if (!aSpecial && bSpecial) return 1;

        // Priority 3: By creation time (newest first)
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime; // Newest first
      });

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
      // Always exclude deleted/cancelled jobs
      let Jobs = collectionJobs
        ? await collectionJobs
            .find(
              {
                isDeleted: { $ne: true },
                status: { $ne: "cancelled" },
              },
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
                  handymanIdSpecial: 1,
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
                  clientApproved: 1, // Add clientApproved field
                  handymanReceivedPayment: 1, // Add handymanReceivedPayment field
                  paymentIntentId: 1, // Add paymentIntentId field
                  paymentStatus: 1, // Add paymentStatus field
                  "handiman-Blocked": 1, // Add handiman-Blocked field for filtering
                  // Add other fields that might be needed
                },
              }
            )
            .toArray()
        : [];

      // Filter out "done" jobs with ratingSubmitted for clients
      // BUT: Keep "done" jobs that need client approval (clientApproved: false or null/undefined) even if ratingSubmitted is true
      // Keep "done" jobs without ratingSubmitted so client can rate them
      if (!User.isHandyman) {
        Jobs = Jobs.filter((job) => {
          // Priority 1: Keep "done" jobs that need client approval (even if ratingSubmitted is true)
          if (
            job.status === "done" &&
            (job.clientApproved === false || job.clientApproved == null)
          ) {
            return true;
          }
          // Priority 2: If job is done and rating was submitted, exclude it (only if clientApproved is true)
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

      // CRITICAL: Filter handymanIdSpecial for handymen
      // If user is a handyman, only show jobs where:
      // 1. handymanIdSpecial matches the current handyman, OR
      // 2. handymanIdSpecial doesn't exist (regular jobs)
      if (User.isHandyman && User._id) {
        const handymanIdString = String(User._id);
        const handymanObjectId =
          User._id instanceof ObjectId ? User._id : new ObjectId(User._id);

        Jobs = Jobs.filter((job) => {
          // Check if this handyman is blocked in this job
          if (
            job["handiman-Blocked"] &&
            Array.isArray(job["handiman-Blocked"])
          ) {
            const blockedIds = job["handiman-Blocked"].map((id) => String(id));
            if (blockedIds.includes(handymanIdString)) {
              // This handyman is blocked, don't show the job
              return false;
            }
          }

          // If job has handymanIdSpecial, it should ONLY be shown to that specific handyman
          if (job.handymanIdSpecial) {
            // Convert both to string for comparison
            let jobHandymanIdSpecialStr;
            if (job.handymanIdSpecial instanceof ObjectId) {
              jobHandymanIdSpecialStr = job.handymanIdSpecial.toString();
            } else if (job.handymanIdSpecial.toString) {
              jobHandymanIdSpecialStr = job.handymanIdSpecial.toString();
            } else {
              jobHandymanIdSpecialStr = String(job.handymanIdSpecial);
            }

            // Check if it matches
            let isMatch = jobHandymanIdSpecialStr === handymanIdString;

            // If string comparison fails, try ObjectId comparison
            if (!isMatch) {
              try {
                const jobSpecialObjectId =
                  job.handymanIdSpecial instanceof ObjectId
                    ? job.handymanIdSpecial
                    : new ObjectId(job.handymanIdSpecial);
                isMatch = jobSpecialObjectId.equals(handymanObjectId);
              } catch (e) {
                isMatch = false;
              }
            }

            // Only show if it matches
            return isMatch;
          }

          // If no handymanIdSpecial, it's a regular job - show it
          return true;
        });
      }

      // Filter out "done" jobs for clients - they shouldn't see completed jobs in the main dashboard
      // BUT: Keep "done" jobs that need client approval (clientApproved: false or null/undefined)
      // Clients can only see active jobs (assigned, on_the_way, in_progress, or open)
      // Done jobs are only accessible through specific routes (like rating) OR if they need approval
      if (!User.isHandyman) {
        Jobs = Jobs.filter((job) => {
          // Keep "done" jobs that need client approval (check for false, null, or undefined)
          if (
            job.status === "done" &&
            (job.clientApproved === false || job.clientApproved == null)
          ) {
            return true;
          }
          // Exclude other "done" jobs from the main dashboard view
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

      // Mark blocked handymen if user has handiman-Blocked array
      if (
        User &&
        !User.isHandyman &&
        User["handiman-Blocked"] &&
        Array.isArray(User["handiman-Blocked"])
      ) {
        const blockedIds = User["handiman-Blocked"].map((id) => String(id));
        Hendimands = Hendimands.map((handyman) => ({
          ...handyman,
          isBlocked: blockedIds.includes(String(handyman._id)),
        }));
      } else {
        Hendimands = Hendimands.map((handyman) => ({
          ...handyman,
          isBlocked: false,
        }));
      }

      // Sort jobs: 1. Urgent first, 2. Special (handymanIdSpecial) second, 3. By creation time (newest first)
      Jobs.sort((a, b) => {
        // Priority 1: Urgent jobs first
        const aUrgent = a.urgent === true || a.isUrgent === true;
        const bUrgent = b.urgent === true || b.isUrgent === true;
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;

        // Priority 2: Special jobs (handymanIdSpecial) second
        const aSpecial = !!a.handymanIdSpecial;
        const bSpecial = !!b.handymanIdSpecial;
        if (aSpecial && !bSpecial) return -1;
        if (!aSpecial && bSpecial) return 1;

        // Priority 3: By creation time (newest first)
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime; // Newest first
      });

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
                    $maxDistance: 20000, // 10 ק"מ במטר
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

      // Mark blocked handymen if userId is provided and user has handiman-Blocked array
      const { userId } = req.query;
      if (userId) {
        try {
          const user = await collection.findOne({ _id: new ObjectId(userId) });
          if (
            user &&
            !user.isHandyman &&
            user["handiman-Blocked"] &&
            Array.isArray(user["handiman-Blocked"])
          ) {
            const blockedIds = user["handiman-Blocked"].map((id) => String(id));
            handymen = handymen.map((handyman) => ({
              ...handyman,
              isBlocked: blockedIds.includes(String(handyman._id)),
            }));
          } else {
            handymen = handymen.map((handyman) => ({
              ...handyman,
              isBlocked: false,
            }));
          }
        } catch (userError) {
          // If user fetch fails, just mark all as not blocked
          handymen = handymen.map((handyman) => ({
            ...handyman,
            isBlocked: false,
          }));
        }
      } else {
        handymen = handymen.map((handyman) => ({
          ...handyman,
          isBlocked: false,
        }));
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

      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          message: "נדרש לספק lat ו-lon",
        });
      }

      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);

      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        return res.status(400).json({
          success: false,
          message: "קואורדינטות לא תקינות",
        });
      }

      const reverseGeocodeResult = await reverseGeocodeCoordinates(
        parsedLat,
        parsedLon
      );

      if (
        reverseGeocodeResult &&
        reverseGeocodeResult.results &&
        reverseGeocodeResult.results.length > 0
      ) {
        // Convert Google Maps format to Mapbox-like format for compatibility
        const result = reverseGeocodeResult.results[0];
        return res.json({
          success: true,
          response: {
            formatted_address: result.formatted_address,
            address_components: result.address_components,
          },
        });
      }

      return res.json({
        success: true,
        response: null,
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

  // DEPRECATED: Use /api/payments/create-intent instead
  // This endpoint is kept for backward compatibility but should not be used for new payments
  // The new flow uses Stripe Connect with Escrow:
  // 1. Call /api/payments/create-intent to get clientSecret
  // 2. Client confirms payment with Stripe (no card details sent to server)
  // 3. After confirmation, payment is in requires_capture state (Escrow)
  // 4. Call /api/payments/capture when job is completed
  app.post("/payments/process", async (req, res) => {
    try {
      const { userId, jobId } = req.body;

      if (!userId || !jobId) {
        return res.status(400).json({
          success: false,
          message:
            "userId and jobId are required. Please use /api/payments/create-intent for new payments.",
        });
      }

      // Redirect to new payment flow
      return res.status(400).json({
        success: false,
        message:
          "This endpoint is deprecated. Please use /api/payments/create-intent for Stripe Connect payments.",
        deprecated: true,
        newEndpoint: "/api/payments/create-intent",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בעיבוד התשלום",
      });
    }
  });

  // Stripe Connect: Create onboarding link for handyman
  // GET /api/stripe/publishable-key
  // Returns Stripe publishable key for client-side use
  app.get("/api/stripe/publishable-key", (req, res) => {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return res.status(500).json({
        success: false,
        message: "Stripe publishable key not configured",
      });
    }
    return res.json({
      success: true,
      publishableKey: publishableKey,
    });
  });

  app.post("/api/handyman/stripe/onboarding-link", async (req, res) => {
    try {
      const { handymanId } = req.body;

      if (!handymanId) {
        return res.status(400).json({
          success: false,
          message: "handymanId required",
        });
      }

      let userId;
      try {
        userId = new ObjectId(handymanId);
      } catch (objectIdError) {
        return res.status(400).json({
          success: false,
          message: "Invalid handymanId format",
          receivedId: handymanId,
        });
      }

      const usersCol = getCollection();
      const handyman = await usersCol.findOne({
        _id: userId,
      });

      if (!handyman) {
        return res.status(404).json({
          success: false,
          message: "Handyman not found",
          receivedId: handymanId,
        });
      }

      // Get or create Stripe Connect account
      const accountId = await getOrCreateConnectedAccount(handyman, usersCol);

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message:
            "Stripe Connect לא מופעל בחשבון שלך. אנא הפעל את Stripe Connect ב-Stripe Dashboard: https://dashboard.stripe.com/settings/connect",
        });
      }

      // Create onboarding link
      // NOTE: In TEST MODE, you can use localhost URLs for testing
      // In PRODUCTION, use your actual domain
      // You can override with STRIPE_ONBOARDING_RETURN_URL and STRIPE_ONBOARDING_REFRESH_URL in .env
      // Add handymanId to returnUrl so StripeSuccess page knows which user to redirect to
      const baseReturnUrl =
        process.env.STRIPE_ONBOARDING_RETURN_URL ||
        `${URL_CLIENT}/stripe/success`;
      const returnUrl = `${baseReturnUrl}?userId=${handymanId}`;
      const refreshUrl =
        process.env.STRIPE_ONBOARDING_REFRESH_URL ||
        `${URL_CLIENT}/stripe/refresh`;

      const onboardingUrl = await createOnboardingLink(
        accountId,
        returnUrl,
        refreshUrl
      );

      return res.json({
        success: true,
        url: onboardingUrl,
        accountId: accountId,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה ביצירת קישור הרשמה",
        error: error.message,
      });
    }
  });

  // Get handyman onboarding status
  app.get("/api/handyman/:handymanId/stripe/status", async (req, res) => {
    try {
      const { handymanId } = req.params;
      if (!handymanId) {
        return res.status(400).json({
          success: false,
          message: "handymanId required",
        });
      }

      const usersCol = getCollection();
      const handyman = await usersCol.findOne({
        _id: new ObjectId(handymanId),
      });

      if (!handyman) {
        return res.status(404).json({
          success: false,
          message: "Handyman not found",
        });
      }

      if (!handyman.stripeAccountId) {
        return res.json({
          success: true,
          hasAccount: false,
          needsOnboarding: true,
          chargesEnabled: false,
          payoutsEnabled: false,
        });
      }

      try {
        const account = await stripe.accounts.retrieve(
          handyman.stripeAccountId
        );

        // For Israel (IL) accounts, we use transfers capability (not card_payments)
        // So we only check payouts_enabled, not charges_enabled
        // Also check if transfers capability is enabled
        const transfersEnabled = account.capabilities?.transfers === "active";
        // If account has transfers enabled OR payouts enabled, onboarding is complete
        // For IL accounts, we might only have transfers without payouts initially
        const needsOnboarding = !transfersEnabled && !account.payouts_enabled;

        return res.json({
          success: true,
          hasAccount: true,
          needsOnboarding: needsOnboarding,
          chargesEnabled: account.charges_enabled || false,
          payoutsEnabled: account.payouts_enabled || false,
          transfersEnabled: transfersEnabled,
          accountId: handyman.stripeAccountId,
        });
      } catch (stripeError) {
        return res.json({
          success: true,
          hasAccount: true,
          needsOnboarding: true,
          chargesEnabled: false,
          payoutsEnabled: false,
          transfersEnabled: false,
          error: "Could not verify account status",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בבדיקת סטטוס חשבון",
        error: error.message,
      });
    }
  });

  // Get job status for client approval check
  app.get("/api/jobs/:jobId/approval-status", async (req, res) => {
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
        status: job.status,
        clientApproved: job.clientApproved || false,
        paymentStatus: job.paymentStatus || "pending",
        requiresClientApproval: job.status === "done" && !job.clientApproved,
        canApprove:
          job.status === "done" && !job.clientApproved && job.paymentIntentId,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בבדיקת סטטוס אישור",
        error: error.message,
      });
    }
  });

  // Get or create payment method for user
  app.get("/api/users/:userId/payment-method", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId required",
        });
      }

      const usersCol = getCollection();
      if (!usersCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      const user = await usersCol.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user has stripeCustomerId - if yes, try to find payment methods from Stripe
      let customerId = user.stripeCustomerId;

      // Verify that the customer still exists in Stripe
      if (customerId) {
        try {
          const existingCustomer = await stripe.customers.retrieve(customerId);
          if (existingCustomer && existingCustomer.deleted) {
            // Customer was deleted, remove from DB
            customerId = null;
            await usersCol.updateOne(
              { _id: new ObjectId(userId) },
              { $unset: { stripeCustomerId: "" } }
            );
          }
        } catch (customerError) {
          // Customer doesn't exist or error retrieving, remove from DB
          customerId = null;
          await usersCol.updateOne(
            { _id: new ObjectId(userId) },
            { $unset: { stripeCustomerId: "" } }
          );
        }
      }

      // First, try to use paymentMethodId from DB if exists
      if (user.paymentMethodId) {
        // Return payment method from DB immediately with default card details
        // Card details will be fetched in background if needed (non-blocking)
        const cardDetails = {
          brand: "card",
          last4: "****",
          expMonth: null,
          expYear: null,
        };

        // Return immediately without waiting for Stripe API
        res.json({
          success: true,
          hasPaymentMethod: true,
          paymentMethodId: user.paymentMethodId,
          stripeCustomerId: customerId || user.stripeCustomerId || null,
          card: cardDetails,
        });

        // Fetch card details from Stripe in background (non-blocking, don't wait)
        // This improves response time while still getting card details if possible
        stripe.paymentMethods
          .retrieve(user.paymentMethodId)
          .then((paymentMethod) => {
            if (paymentMethod && paymentMethod.card) {
              // Optionally update user with card details for future use
              // But don't block the response
            }
          })
          .catch((err) => {
            // Ignore errors - not critical
          });

        return; // Exit early after sending response

        // Payment method might be deleted in Stripe, try to find alternative (only if we have customerId and no paymentMethod yet)
        if (customerId && !paymentMethod) {
          try {
            const customerPaymentMethods = await stripe.paymentMethods.list({
              customer: customerId,
              type: "card",
            });

            if (
              customerPaymentMethods.data &&
              customerPaymentMethods.data.length > 0
            ) {
              // Use the first available payment method
              const alternativePaymentMethod = customerPaymentMethods.data[0];
              // Update DB with the alternative payment method
              await usersCol.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { paymentMethodId: alternativePaymentMethod.id } }
              );
              return res.json({
                success: true,
                hasPaymentMethod: true,
                paymentMethodId: alternativePaymentMethod.id,
                stripeCustomerId: customerId,
                card: {
                  brand: alternativePaymentMethod.card?.brand,
                  last4: alternativePaymentMethod.card?.last4,
                  expMonth: alternativePaymentMethod.card?.exp_month,
                  expYear: alternativePaymentMethod.card?.exp_year,
                },
              });
            }
          } catch (listError) {
            // Error listing payment methods, continue
          }
        }
      }

      // If no paymentMethodId in DB but we have customerId, try to find payment methods from customer
      if (customerId && !user.paymentMethodId) {
        try {
          const customerPaymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
          });

          if (
            customerPaymentMethods.data &&
            customerPaymentMethods.data.length > 0
          ) {
            // Use the first available payment method
            const alternativePaymentMethod = customerPaymentMethods.data[0];
            // Update DB with the alternative payment method
            await usersCol.updateOne(
              { _id: new ObjectId(userId) },
              { $set: { paymentMethodId: alternativePaymentMethod.id } }
            );
            return res.json({
              success: true,
              hasPaymentMethod: true,
              paymentMethodId: alternativePaymentMethod.id,
              stripeCustomerId: customerId,
              card: {
                brand: alternativePaymentMethod.card?.brand,
                last4: alternativePaymentMethod.card?.last4,
                expMonth: alternativePaymentMethod.card?.exp_month,
                expYear: alternativePaymentMethod.card?.exp_year,
              },
            });
          }
        } catch (listError) {
          // Error listing payment methods, continue
        }
      }

      return res.json({
        success: true,
        hasPaymentMethod: false,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בבדיקת אמצעי תשלום",
        error: error.message,
      });
    }
  });

  // Create or update payment method for user
  app.post("/api/users/:userId/payment-method", async (req, res) => {
    try {
      const { userId } = req.params;
      const { paymentMethodId } = req.body;

      if (!userId || !paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: "userId and paymentMethodId required",
        });
      }

      const usersCol = getCollection();

      // Verify user exists
      const user = await usersCol.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify payment method exists in Stripe
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );

        // Get or create Stripe Customer for the user
        let customerId = user.stripeCustomerId;

        if (!customerId) {
          // Create new customer
          const customer = await stripe.customers.create({
            email: user?.email || undefined,
            metadata: {
              userId: userId.toString(),
            },
          });
          customerId = customer.id;
        }

        // Attach payment method to customer if not already attached
        if (!paymentMethod.customer || paymentMethod.customer !== customerId) {
          try {
            await stripe.paymentMethods.attach(paymentMethodId, {
              customer: customerId,
            });
          } catch (attachError) {
            // If the payment method was previously used without customer attachment,
            // we can't reuse it. Return an error asking the user to add a new payment method.
            if (
              attachError.message &&
              attachError.message.includes(
                "previously used without being attached"
              )
            ) {
              return res.status(400).json({
                success: false,
                message:
                  "אמצעי התשלום הזה כבר שימש בעבר ולא ניתן לשימוש חוזר. אנא הוסף כרטיס אשראי חדש.",
                requiresNewPaymentMethod: true,
                error: attachError.message,
              });
            } else {
              // Other attach errors, re-throw
              throw attachError;
            }
          }
        }

        // Save payment method ID and customer ID to user
        await usersCol.updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              paymentMethodId: paymentMethodId,
              stripeCustomerId: customerId,
            },
          }
        );

        return res.json({
          success: true,
          message: "אמצעי תשלום נשמר בהצלחה",
          paymentMethodId: paymentMethodId,
          stripeCustomerId: customerId,
          card: {
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
            expMonth: paymentMethod.card?.exp_month,
            expYear: paymentMethod.card?.exp_year,
          },
        });
      } catch (stripeError) {
        return res.status(400).json({
          success: false,
          message: "שגיאה באימות אמצעי תשלום",
          error: stripeError.message,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בשמירת אמצעי תשלום",
        error: error.message,
      });
    }
  });

  // Block handyman endpoint - add handyman ID to user's handiman-Blocked array
  app.post("/api/users/block-handyman", async (req, res) => {
    try {
      const { userId, handymanId } = req.body;

      if (!userId || !handymanId) {
        return res.status(400).json({
          success: false,
          message: "userId and handymanId are required",
        });
      }

      const usersCol = getCollection();

      // Verify user exists and is not a handyman
      const user = await usersCol.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isHandyman) {
        return res.status(400).json({
          success: false,
          message: "Handymen cannot block other handymen",
        });
      }

      // Verify handyman exists
      const handyman = await usersCol.findOne({
        _id: new ObjectId(handymanId),
      });
      if (!handyman) {
        return res.status(404).json({
          success: false,
          message: "Handyman not found",
        });
      }

      // Add handyman ID to handiman-Blocked array (using $addToSet to avoid duplicates)
      await usersCol.updateOne(
        { _id: new ObjectId(userId) },
        {
          $addToSet: { "handiman-Blocked": new ObjectId(handymanId) },
        }
      );

      // Update all open jobs created by this client to add the blocked handyman
      const jobsCol = getCollectionJobs();
      try {
        const clientObjectId = new ObjectId(userId);
        await jobsCol.updateMany(
          {
            clientId: clientObjectId,
            status: "open",
          },
          {
            $addToSet: { "handiman-Blocked": new ObjectId(handymanId) },
          }
        );
      } catch (jobsError) {
        // Continue even if updating jobs fails (log but don't fail the request)
      }

      return res.json({
        success: true,
        message: "Handyman blocked successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error blocking handyman",
        error: error.message,
      });
    }
  });

  // Unblock handyman endpoint - remove handyman ID from user's handiman-Blocked array
  app.post("/api/users/unblock-handyman", async (req, res) => {
    try {
      const { userId, handymanId } = req.body;

      if (!userId || !handymanId) {
        return res.status(400).json({
          success: false,
          message: "userId and handymanId are required",
        });
      }

      const usersCol = getCollection();

      // Verify user exists and is not a handyman
      const user = await usersCol.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isHandyman) {
        return res.status(400).json({
          success: false,
          message: "Handymen cannot unblock other handymen",
        });
      }

      // Verify handyman exists
      const handyman = await usersCol.findOne({
        _id: new ObjectId(handymanId),
      });
      if (!handyman) {
        return res.status(404).json({
          success: false,
          message: "Handyman not found",
        });
      }

      // Remove handyman ID from handiman-Blocked array
      await usersCol.updateOne(
        { _id: new ObjectId(userId) },
        {
          $pull: { "handiman-Blocked": new ObjectId(handymanId) },
        }
      );

      // Update all open jobs created by this client to remove the blocked handyman
      const jobsCol = getCollectionJobs();
      try {
        const clientObjectId = new ObjectId(userId);
        await jobsCol.updateMany(
          {
            clientId: clientObjectId,
            status: "open",
          },
          {
            $pull: { "handiman-Blocked": new ObjectId(handymanId) },
          }
        );
      } catch (jobsError) {
        // Continue even if updating jobs fails
      }

      return res.json({
        success: true,
        message: "Handyman unblocked successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error unblocking handyman",
        error: error.message,
      });
    }
  });

  // Get clientSecret for existing Payment Intent (for client to confirm payment)
  app.get("/api/payments/:jobId/client-secret", async (req, res) => {
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

      if (!job.paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "No payment intent found for this job",
        });
      }

      // Get payment intent from Stripe to retrieve clientSecret
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          job.paymentIntentId
        );

        return res.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: job.paymentIntentId,
          status: paymentIntent.status,
        });
      } catch (stripeError) {
        return res.status(500).json({
          success: false,
          message: "Error retrieving payment intent",
          error: stripeError.message,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בקבלת client secret",
        error: error.message,
      });
    }
  });

  // Stripe Connect: Create Escrow Payment Intent
  app.post("/api/payments/create-intent", async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "jobId required",
        });
      }

      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();
      const paymentsCol = getCollectionPayments();

      // Get job details

      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Get handyman (support both single handyman and array)
      // Also check for handymanIdSpecial (for personal requests)
      let handymanId =
        Array.isArray(job.handymanId) && job.handymanId.length > 0
          ? job.handymanId[0]
          : job.handymanId;

      // If no handymanId, check for handymanIdSpecial (personal request)
      // handymanIdSpecial can be string, ObjectId, or null
      if (!handymanId && job.handymanIdSpecial) {
        // Convert to string for comparison and logging
        const handymanIdSpecialStr = String(job.handymanIdSpecial);
        if (
          handymanIdSpecialStr &&
          handymanIdSpecialStr !== "null" &&
          handymanIdSpecialStr !== "undefined"
        ) {
          handymanId = job.handymanIdSpecial;
        }
      }

      if (!handymanId) {
        return res.status(400).json({
          success: false,
          message:
            "Job has no assigned handyman. Please wait for a handyman to accept the job first, or if this is a personal request, ensure handymanIdSpecial is set.",
        });
      }

      // Convert handymanId to ObjectId if it's a string
      const handymanObjectId =
        handymanId instanceof ObjectId ? handymanId : new ObjectId(handymanId);

      const handyman = await usersCol.findOne({
        _id: handymanObjectId,
      });

      if (!handyman) {
        return res.status(404).json({
          success: false,
          message: "Handyman not found",
        });
      }

      // Get or create Stripe Connect account for handyman

      const handymanAccountId = await getOrCreateConnectedAccount(
        handyman,
        usersCol
      );

      if (!handymanAccountId) {
        return res.status(400).json({
          success: false,
          message:
            "Stripe Connect is not enabled. Please enable it in your Stripe Dashboard: https://stripe.com/docs/connect",
        });
      }

      // Check if handyman has completed onboarding (charges_enabled and payouts_enabled)
      // NOTE: In TEST MODE (with sk_test keys), this check is more lenient for testing
      // In PRODUCTION (with sk_live keys), this will block payment creation until onboarding is complete
      const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test");

      try {
        const account = await stripe.accounts.retrieve(handymanAccountId);
        if (!account.charges_enabled || !account.payouts_enabled) {
          if (!isTestMode) {
            // PRODUCTION: Block payment creation until onboarding is complete
            return res.status(400).json({
              success: false,
              message:
                "Handyman must complete Stripe onboarding before accepting payments",
              needsOnboarding: true,
              onboardingUrl: null, // Client should call onboarding-link endpoint
            });
          }
        }
      } catch (stripeError) {
        // In test mode, continue anyway - in production fail
        if (!isTestMode) {
          return res.status(500).json({
            success: false,
            message: "Failed to verify handyman payment account",
            error: stripeError.message,
          });
        }
      }

      // Calculate amounts from subcategoryInfo or job.price

      let totalPrice = 0;

      // Calculate price from subcategoryInfo array (preferred method)
      if (
        job.subcategoryInfo &&
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 0
      ) {
        totalPrice = job.subcategoryInfo.reduce((sum, subcat) => {
          const price = subcat?.price || 0;
          return (
            sum + (typeof price === "number" ? price : parseFloat(price) || 0)
          );
        }, 0);
      } else if (
        job.subcategoryInfo &&
        typeof job.subcategoryInfo === "object" &&
        job.subcategoryInfo.price
      ) {
        // Handle single subcategoryInfo object
        totalPrice =
          typeof job.subcategoryInfo.price === "number"
            ? job.subcategoryInfo.price
            : parseFloat(job.subcategoryInfo.price) || 0;
      } else if (job.price) {
        // Fallback to job.price
        totalPrice =
          typeof job.price === "number"
            ? job.price
            : parseFloat(job.price) || 0;
      }

      // Add urgent fee if applicable
      if (job.urgent) {
        totalPrice += 10;
      }

      const amountAgorot = Math.round(totalPrice * 100);
      const platformFeeAgorot = Math.round(
        (amountAgorot * getPlatformFeePercent()) / 100
      );

      if (amountAgorot <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid job price - no price found in subcategoryInfo or job.price",
        });
      }

      // Create Escrow Payment Intent

      const paymentIntentParams = {
        amountAgorot,
        currency: "ils",
        handymanAccountId,
        platformFeeAgorot,
        metadata: {
          jobId: jobId,
          clientId: job.clientId?.toString() || "",
          handymanId: handymanId.toString(),
        },
      };

      const { clientSecret, paymentIntentId, status } =
        await createEscrowPaymentIntent(paymentIntentParams);

      // Calculate VAT (MAAM)
      const maamPercent = getMaamPercent();
      const amountILS = amountAgorot / 100;
      const vatCalculation = calculateVAT(amountILS, maamPercent);

      // Save payment record
      const paymentRecord = {
        _id: new ObjectId(),
        jobId: new ObjectId(jobId),
        clientId: new ObjectId(job.clientId),
        handymanId: new ObjectId(handymanId),
        paymentIntentId: paymentIntentId,
        amount: amountILS, // Total amount with VAT
        originalPrice: amountILS, // Initial price (will be updated if price changes)
        priceChangePercent: 0, // No change initially
        amountWithoutVAT: vatCalculation.amountWithoutVAT,
        amountWithVAT: vatCalculation.amountWithVAT,
        vatAmount: vatCalculation.vatAmount,
        vatPercent: maamPercent,
        platformFee: platformFeeAgorot / 100,
        currency: "ils",
        status: status, // Usually "requires_payment_method" or "requires_confirmation"
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await paymentsCol.insertOne(paymentRecord);

      // Update job with payment intent ID

      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            paymentIntentId: paymentIntentId,
            paymentStatus: "pending",
          },
        }
      );

      // Note: managers_financials record will be created when payment is actually transferred
      // (in /payment/transfer or /jobs/done endpoints) with paymentID reference

      return res.json({
        success: true,
        clientSecret: clientSecret,
        paymentIntentId: paymentIntentId,
        status: status,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה ביצירת כוונת תשלום",
        error: error.message,
      });
    }
  });

  // Update payment status after client confirms payment with Stripe.js
  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentIntentId, jobId } = req.body;
      if (!paymentIntentId || !jobId) {
        return res.status(400).json({
          success: false,
          message: "paymentIntentId and jobId required",
        });
      }

      const jobsCol = getCollectionJobs();
      const paymentsCol = getCollectionPayments();

      // Get payment intent from Stripe to verify status
      let paymentIntent;
      try {
        paymentIntent = await getPaymentIntent(paymentIntentId);
      } catch (stripeError) {
        return res.status(500).json({
          success: false,
          message: "Failed to verify payment status",
          error: stripeError.message,
        });
      }

      // Verify payment intent belongs to this job
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job || job.paymentIntentId !== paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Payment intent does not match job",
        });
      }

      // Get user to save paymentMethodId
      const clientId = job.clientId?.toString() || job.clientId;
      const usersCol = getCollection();

      // Update payment record with current status
      const updateData = {
        status: paymentIntent.status,
        updatedAt: new Date(),
      };

      // If payment is confirmed (requires_capture or succeeded), update job status
      if (
        paymentIntent.status === "requires_capture" ||
        paymentIntent.status === "succeeded"
      ) {
        updateData.paymentConfirmed = true;
        updateData.confirmedAt = new Date();

        // Update job payment status
        await jobsCol.updateOne(
          { _id: new ObjectId(jobId) },
          {
            $set: {
              paymentStatus:
                paymentIntent.status === "succeeded" ? "paid" : "pending",
            },
          }
        );

        // Save paymentMethodId to user if payment intent has payment method
        // Do this in background to not block the response
        if (paymentIntent.payment_method && clientId) {
          // Run in background (don't await) to improve response time
          (async () => {
            try {
              const clientObjectId = new ObjectId(clientId);

              // Get or create Stripe Customer for the user
              const client = await usersCol.findOne({ _id: clientObjectId });
              if (client) {
                let customerId = client.stripeCustomerId;

                if (!customerId) {
                  // Create new customer
                  const customer = await stripe.customers.create({
                    email: client?.email || undefined,
                    metadata: {
                      userId: clientId,
                    },
                  });
                  customerId = customer.id;

                  // Save customer ID to user
                  await usersCol.updateOne(
                    { _id: clientObjectId },
                    { $set: { stripeCustomerId: customerId } }
                  );
                }

                // Attach payment method to customer if not already attached
                const paymentMethod = paymentIntent.payment_method;
                const paymentMethodId =
                  typeof paymentMethod === "string"
                    ? paymentMethod
                    : paymentMethod?.id;

                if (paymentMethodId) {
                  try {
                    // Try to attach payment method (might already be attached)
                    await stripe.paymentMethods.attach(paymentMethodId, {
                      customer: customerId,
                    });
                  } catch (attachError) {
                    // Payment method might already be attached, continue
                  }

                  // Save paymentMethodId to user (always do this, even if attach failed)
                  await usersCol.updateOne(
                    { _id: clientObjectId },
                    { $set: { paymentMethodId: paymentMethodId } }
                  );
                }
              }
            } catch (userError) {
              // Log error but don't fail the request
              console.error(
                "Error saving paymentMethodId to user (background):",
                userError
              );
            }
          })(); // Execute immediately without awaiting
        }
      }

      await paymentsCol.updateOne(
        { paymentIntentId: paymentIntentId },
        { $set: updateData }
      );

      return res.json({
        success: true,
        paymentIntentId: paymentIntentId,
        status: paymentIntent.status,
        message:
          paymentIntent.status === "requires_capture"
            ? "Payment confirmed and ready for capture"
            : paymentIntent.status === "succeeded"
            ? "Payment already completed"
            : "Payment status updated",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה באישור התשלום",
        error: error.message,
      });
    }
  });

  // Confirm payment with saved payment method (for PersonalRequestCall)
  app.post("/api/payments/confirm-with-saved-method", async (req, res) => {
    try {
      const { paymentIntentId, paymentMethodId, userId, jobId } = req.body;

      if (!paymentIntentId || !paymentMethodId || !userId || !jobId) {
        return res.status(400).json({
          success: false,
          message:
            "paymentIntentId, paymentMethodId, userId, and jobId required",
        });
      }

      const usersCol = getCollection();
      const jobsCol = getCollectionJobs();

      // Get user to find stripeCustomerId
      const user = await usersCol.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get or create Stripe Customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: userId.toString(),
          },
        });
        customerId = customer.id;

        // Save customer ID to user
        await usersCol.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { stripeCustomerId: customerId } }
        );
      }

      // Verify payment method exists and attach to customer if needed
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );

        // Attach payment method to customer if not already attached
        if (!paymentMethod.customer || paymentMethod.customer !== customerId) {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
          });
        }
      } catch (pmError) {
        return res.status(400).json({
          success: false,
          message: "שגיאה באימות אמצעי התשלום",
          error: pmError.message,
        });
      }

      // Update Payment Intent with customer and payment method
      await stripe.paymentIntents.update(paymentIntentId, {
        customer: customerId,
        payment_method: paymentMethodId,
      });

      // Confirm Payment Intent
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId
      );

      // Update payment record
      const paymentsCol = getCollectionPayments();
      await paymentsCol.updateOne(
        { paymentIntentId: paymentIntentId },
        {
          $set: {
            status: confirmedPaymentIntent.status,
            updatedAt: new Date(),
          },
        }
      );

      // Update job payment status
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            paymentStatus:
              confirmedPaymentIntent.status === "succeeded"
                ? "paid"
                : confirmedPaymentIntent.status === "requires_capture"
                ? "pending"
                : "pending",
          },
        }
      );

      // Save paymentMethodId to user in background (already attached to customer above)
      // Don't await to improve response time
      usersCol
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { paymentMethodId: paymentMethodId } }
        )
        .catch((err) => {
          // Error saving paymentMethodId (background)
        });

      return res.json({
        success: true,
        paymentIntentId: paymentIntentId,
        status: confirmedPaymentIntent.status,
        message: "תשלום אושר בהצלחה",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה באישור התשלום",
        error: error.message,
      });
    }
  });

  // Stripe Webhook endpoint for payment status updates
  // This endpoint receives events from Stripe when payment status changes
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test");

      if (!webhookSecret) {
        // webhookSecret not configured
      }

      let event;

      try {
        if (webhookSecret) {
          // Verify webhook signature (required in production, optional in test)
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          // In test mode without webhook secret, parse the event directly
          // This allows testing with Stripe CLI: stripe listen --forward-to localhost:PORT/api/stripe/webhook
          event = JSON.parse(req.body.toString());
        }
      } catch (err) {
        // In test mode, still try to parse the event
        if (isTestMode) {
          try {
            event = JSON.parse(req.body.toString());
          } catch (parseErr) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
          }
        } else {
          // In production, fail if signature verification fails
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      }

      const jobsCol = getCollectionJobs();
      const paymentsCol = getCollectionPayments();

      // Handle the event
      try {
        switch (event.type) {
          case "payment_intent.succeeded":
            {
              const paymentIntent = event.data.object;
              const usersCol = getCollection();

              // Find job by paymentIntentId
              const job = await jobsCol.findOne({
                paymentIntentId: paymentIntent.id,
              });

              if (job) {
                // Update payment record
                await paymentsCol.updateOne(
                  { paymentIntentId: paymentIntent.id },
                  {
                    $set: {
                      status: "succeeded",
                      updatedAt: new Date(),
                    },
                  }
                );

                // Update job if not already paid
                if (job.paymentStatus !== "paid") {
                  await jobsCol.updateOne(
                    { _id: job._id },
                    {
                      $set: {
                        paymentStatus: "paid",
                      },
                    }
                  );
                }

                // Save paymentMethodId to user if payment intent has payment method
                if (paymentIntent.payment_method && job.clientId) {
                  try {
                    const clientId = job.clientId?.toString() || job.clientId;
                    const clientObjectId = new ObjectId(clientId);

                    // Get or create Stripe Customer for the user
                    const client = await usersCol.findOne({
                      _id: clientObjectId,
                    });
                    if (client) {
                      let customerId = client.stripeCustomerId;

                      if (!customerId) {
                        // Create new customer
                        const customer = await stripe.customers.create({
                          email: client?.email || undefined,
                          metadata: {
                            userId: clientId,
                          },
                        });
                        customerId = customer.id;

                        // Save customer ID to user
                        await usersCol.updateOne(
                          { _id: clientObjectId },
                          { $set: { stripeCustomerId: customerId } }
                        );
                      }

                      // Attach payment method to customer if not already attached
                      const paymentMethodId =
                        typeof paymentIntent.payment_method === "string"
                          ? paymentIntent.payment_method
                          : paymentIntent.payment_method?.id;

                      if (paymentMethodId) {
                        try {
                          await stripe.paymentMethods.attach(paymentMethodId, {
                            customer: customerId,
                          });
                        } catch (attachError) {
                          // Payment method might already be attached, continue
                        }

                        // Save paymentMethodId to user
                        await usersCol.updateOne(
                          { _id: clientObjectId },
                          { $set: { paymentMethodId: paymentMethodId } }
                        );
                      }
                    }
                  } catch (userError) {
                    // Log error but don't fail the webhook
                  }
                }
              }
            }
            break;

          case "payment_intent.payment_failed":
            {
              const paymentIntent = event.data.object;

              // Update payment record
              await paymentsCol.updateOne(
                { paymentIntentId: paymentIntent.id },
                {
                  $set: {
                    status: "failed",
                    updatedAt: new Date(),
                  },
                }
              );
            }
            break;

          case "payment_intent.canceled":
            {
              const paymentIntent = event.data.object;

              // Update payment record
              await paymentsCol.updateOne(
                { paymentIntentId: paymentIntent.id },
                {
                  $set: {
                    status: "canceled",
                    updatedAt: new Date(),
                  },
                }
              );
            }
            break;

          case "payment_intent.amount_capturable_updated":
            {
              const paymentIntent = event.data.object;
              const usersCol = getCollection();

              // If payment is now requires_capture, update our records
              if (paymentIntent.status === "requires_capture") {
                await paymentsCol.updateOne(
                  { paymentIntentId: paymentIntent.id },
                  {
                    $set: {
                      status: "requires_capture",
                      paymentConfirmed: true,
                      updatedAt: new Date(),
                    },
                  }
                );

                // Find job to get clientId
                const job = await jobsCol.findOne({
                  paymentIntentId: paymentIntent.id,
                });

                // Save paymentMethodId to user if payment intent has payment method
                if (paymentIntent.payment_method && job?.clientId) {
                  try {
                    const clientId = job.clientId?.toString() || job.clientId;
                    const clientObjectId = new ObjectId(clientId);

                    // Get or create Stripe Customer for the user
                    const client = await usersCol.findOne({
                      _id: clientObjectId,
                    });
                    if (client) {
                      let customerId = client.stripeCustomerId;

                      if (!customerId) {
                        // Create new customer
                        const customer = await stripe.customers.create({
                          email: client?.email || undefined,
                          metadata: {
                            userId: clientId,
                          },
                        });
                        customerId = customer.id;

                        // Save customer ID to user
                        await usersCol.updateOne(
                          { _id: clientObjectId },
                          { $set: { stripeCustomerId: customerId } }
                        );
                      }

                      // Attach payment method to customer if not already attached
                      const paymentMethodId =
                        typeof paymentIntent.payment_method === "string"
                          ? paymentIntent.payment_method
                          : paymentIntent.payment_method?.id;

                      if (paymentMethodId) {
                        try {
                          await stripe.paymentMethods.attach(paymentMethodId, {
                            customer: customerId,
                          });
                        } catch (attachError) {
                          // Payment method might already be attached, continue
                        }

                        // Save paymentMethodId to user
                        await usersCol.updateOne(
                          { _id: clientObjectId },
                          { $set: { paymentMethodId: paymentMethodId } }
                        );
                      }
                    }
                  } catch (userError) {
                    // Log error but don't fail the webhook
                  }
                }
              }
            }
            break;

          case "account.updated":
            {
              const account = event.data.object;

              // Update handyman's onboarding status if account was updated
              const usersCol = getCollection();
              await usersCol.updateOne(
                { stripeAccountId: account.id },
                {
                  $set: {
                    stripeAccountChargesEnabled:
                      account.charges_enabled || false,
                    stripeAccountPayoutsEnabled:
                      account.payouts_enabled || false,
                  },
                }
              );
            }
            break;

          default:
        }

        // Return a response to acknowledge receipt of the event
        res.json({ received: true });
      } catch (webhookError) {
        // Still return 200 to Stripe to prevent retries
        res.json({ received: true, error: webhookError.message });
      }
    }
  );

  // Get payment status for a job
  app.get("/api/payments/:jobId/status", async (req, res) => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "jobId required",
        });
      }

      const jobsCol = getCollectionJobs();
      const paymentsCol = getCollectionPayments();

      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      if (!job.paymentIntentId) {
        return res.json({
          success: true,
          hasPayment: false,
          paymentStatus: null,
          jobStatus: job.status,
        });
      }

      // Get payment record
      const payment = await paymentsCol.findOne({
        paymentIntentId: job.paymentIntentId,
      });

      // Get current status from Stripe
      let stripeStatus = null;
      try {
        const paymentIntent = await getPaymentIntent(job.paymentIntentId);
        stripeStatus = paymentIntent.status;
      } catch (stripeError) {}

      return res.json({
        success: true,
        hasPayment: true,
        paymentIntentId: job.paymentIntentId,
        paymentStatus: payment?.status || stripeStatus || "unknown",
        stripeStatus: stripeStatus,
        jobStatus: job.status,
        clientApproved: job.clientApproved || false,
        paymentConfirmed:
          stripeStatus === "requires_capture" ||
          stripeStatus === "succeeded" ||
          payment?.paymentConfirmed === true,
        canCapture:
          stripeStatus === "requires_capture" &&
          job.status === "done" &&
          job.clientApproved === true,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בבדיקת סטטוס תשלום",
        error: error.message,
      });
    }
  });

  // Stripe Connect: Capture Escrow payment
  app.post("/api/payments/capture", async (req, res) => {
    try {
      const { jobId, paymentIntentId } = req.body;
      if (!jobId || !paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "jobId and paymentIntentId required",
        });
      }

      const jobsCol = getCollectionJobs();
      const paymentsCol = getCollectionPayments();

      // Get job and verify ownership/status
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Verify job status allows capture (must be clientApproved)
      // Note: This endpoint is typically called from /api/jobs/approve
      // Direct calls should have clientApproved flag set to true
      if (job.clientApproved !== true) {
        return res.status(400).json({
          success: false,
          message:
            "Job must be approved by client before capturing payment. Use /api/jobs/approve endpoint.",
          currentStatus: job.status,
          clientApproved: job.clientApproved,
        });
      }

      // Capture the payment
      const capturedPayment = await captureEscrow(paymentIntentId);

      // Update payment record
      await paymentsCol.updateOne(
        { paymentIntentId: paymentIntentId },
        {
          $set: {
            status: "captured",
            updatedAt: new Date(),
          },
        }
      );

      // Update job payment status
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            paymentStatus: "paid",
          },
        }
      );

      return res.json({
        success: true,
        status: capturedPayment.status,
        message: "התשלום שוחרר בהצלחה",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בשחרור התשלום",
        error: error.message,
      });
    }
  });

  // Stripe Connect: Cancel Escrow payment
  app.post("/api/payments/cancel", async (req, res) => {
    try {
      const { jobId, paymentIntentId } = req.body;
      if (!jobId || !paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "jobId and paymentIntentId required",
        });
      }

      const jobsCol = getCollectionJobs();
      const paymentsCol = getCollectionPayments();

      // Get job
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Cancel the payment intent
      const cancelledPayment = await cancelEscrow(paymentIntentId);

      // Update payment record
      await paymentsCol.updateOne(
        { paymentIntentId: paymentIntentId },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
          },
        }
      );

      // Update job payment status
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            paymentStatus: "cancelled",
          },
        }
      );

      return res.json({
        success: true,
        status: cancelledPayment.status,
        message: "התשלום בוטל בהצלחה",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בביטול התשלום",
        error: error.message,
      });
    }
  });

  // ==================== SUBSCRIPTION ENDPOINTS ====================

  // Get subscription amount from dry-data.json
  app.get("/api/subscription/amount", (req, res) => {
    try {
      const amount = getMonthlySubscription();
      return res.json({
        success: true,
        amount: amount,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בקריאת סכום המנוי",
        error: error.message,
      });
    }
  });

  // Create subscription setup intent
  app.post("/api/subscription/create", async (req, res) => {
    try {
      const { registrationData } = req.body;

      if (!registrationData) {
        return res.status(400).json({
          success: false,
          message: "registrationData required",
        });
      }

      // Clean registration data - remove file objects, keep only URLs
      const cleanedRegistrationData = { ...registrationData };
      // Remove file objects (image, logo) - we only need URLs
      delete cleanedRegistrationData.image;
      delete cleanedRegistrationData.logo;
      delete cleanedRegistrationData.imagePreview;
      delete cleanedRegistrationData.logoPreview;
      // Keep only imageUrl and logoUrl (strings, not files)
      if (!cleanedRegistrationData.imageUrl) {
        delete cleanedRegistrationData.imageUrl;
      }
      if (!cleanedRegistrationData.logoUrl) {
        delete cleanedRegistrationData.logoUrl;
      }

      // Save registration data to DB temporarily (since Stripe metadata is limited to 500 chars)
      const usersCol = getCollection();
      const tempRegistrationDoc = {
        registrationData: cleanedRegistrationData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expires in 30 minutes
        type: "pending_subscription",
      };

      const tempDoc = await usersCol.insertOne(tempRegistrationDoc);
      const tempRegistrationId = tempDoc.insertedId.toString();

      // Create Setup Intent for subscription (not Payment Intent)
      // Setup Intent is used to collect payment method for future charges
      // Note: Setup Intent does NOT accept amount or currency parameters
      // We only store the temp registration ID in metadata (not the full data)
      const setupIntent = await stripe.setupIntents.create({
        payment_method_types: ["card"],
        metadata: {
          type: "handyman_subscription",
          tempRegistrationId: tempRegistrationId, // Only store ID, not full data
        },
      });

      return res.json({
        success: true,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      });
    } catch (error) {
      console.error("Error creating subscription setup intent:", error);
      return res.status(500).json({
        success: false,
        message: "שגיאה ביצירת מנוי",
        error: error.message,
      });
    }
  });

  // Complete subscription registration after payment method is confirmed
  app.post("/api/subscription/complete", async (req, res) => {
    try {
      const { setupIntentId, paymentMethodId } = req.body;

      if (!setupIntentId || !paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: "setupIntentId and paymentMethodId required",
        });
      }

      const usersCol = getCollection();
      const paymentsCol = getCollectionPayments();
      const financialsCol = getCollectionFinancials();

      // Retrieve setup intent to get registration data
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

      if (setupIntent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          message: "Setup intent not succeeded",
        });
      }

      // Get registration data ID from metadata and retrieve from DB
      let registrationData = null;
      try {
        const tempRegistrationId = setupIntent.metadata?.tempRegistrationId;
        if (tempRegistrationId) {
          const tempDoc = await usersCol.findOne({
            _id: new ObjectId(tempRegistrationId),
            type: "pending_subscription",
          });

          if (tempDoc && tempDoc.registrationData) {
            // Check if expired
            if (tempDoc.expiresAt && new Date(tempDoc.expiresAt) < new Date()) {
              await usersCol.deleteOne({
                _id: new ObjectId(tempRegistrationId),
              });
              return res.status(400).json({
                success: false,
                message: "Registration data expired. Please start over.",
              });
            }

            registrationData = tempDoc.registrationData;

            // Delete the temp document after retrieving
            await usersCol.deleteOne({ _id: new ObjectId(tempRegistrationId) });
          }
        }
      } catch (dbError) {
        console.error("Error retrieving registration data from DB:", dbError);
      }

      if (!registrationData) {
        return res.status(400).json({
          success: false,
          message: "Registration data not found",
        });
      }

      // Get subscription amount
      const subscriptionAmount = getMonthlySubscription();
      const amountInAgorot = Math.round(subscriptionAmount * 100);

      // Create Stripe Customer
      const customer = await stripe.customers.create({
        email: registrationData.email || undefined,
        metadata: {
          userId: "pending", // Will be updated after user creation
          type: "handyman_subscription",
        },
      });

      // Attach payment method to customer and set as default
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method for the customer
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create Subscription
      // First, create a Product and Price, then use the Price ID
      const product = await stripe.products.create({
        name: "מנוי חודשי הנדימן",
        description: "מנוי חודשי לפלטפורמת הנדימן",
      });

      const price = await stripe.prices.create({
        product: product.id,
        currency: "ils",
        recurring: {
          interval: "month",
        },
        unit_amount: amountInAgorot,
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: price.id,
          },
        ],
        metadata: {
          type: "handyman_subscription",
        },
      });

      // Now register the user with the subscription info
      // Reuse the registration logic from /register-handyman
      const {
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
        googleId,
      } = registrationData;

      const fullName = `${firstName || ""} ${lastName || ""}`.trim();

      // Check if user already exists
      const existingUser = await usersCol.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "משתמש עם מייל זה כבר קיים",
        });
      }

      // Extract coordinates from address (similar to register-handyman)
      let extractedCoordinates = null;
      if (addressEnglish || address) {
        try {
          const searchAddress = async (addr) => {
            if (!addr || !addr.trim()) return null;
            try {
              const geocodeResult = await geocodeAddress(addr.trim());
              if (geocodeResult) {
                // Convert Google Maps format to Mapbox-like format for compatibility
                return {
                  features: [
                    {
                      center: [geocodeResult.lng, geocodeResult.lat],
                      geometry: {
                        coordinates: [geocodeResult.lng, geocodeResult.lat],
                      },
                    },
                  ],
                };
              }
            } catch (error) {
              // Silent fail
            }
            return null;
          };

          let Coordinates = null;
          if (addressEnglish && addressEnglish.trim()) {
            Coordinates = await searchAddress(addressEnglish);
          }
          if (!Coordinates && address && address.trim()) {
            Coordinates = await searchAddress(address);
          }

          if (
            Coordinates &&
            Coordinates.features &&
            Coordinates.features.length > 0
          ) {
            const feature = Coordinates.features[0];
            if (
              feature.center &&
              Array.isArray(feature.center) &&
              feature.center.length >= 2
            ) {
              extractedCoordinates = {
                lng: feature.center[0],
                lat: feature.center[1],
              };
            } else if (
              feature.geometry &&
              feature.geometry.coordinates &&
              Array.isArray(feature.geometry.coordinates) &&
              feature.geometry.coordinates.length >= 2
            ) {
              extractedCoordinates = {
                lng: feature.geometry.coordinates[0],
                lat: feature.geometry.coordinates[1],
              };
            }
          }
        } catch (coordError) {
          // Silent fail - continue without coordinates
        }
      }

      // Build user object
      const userData = {
        username: fullName,
        email: email || "",
        password: password || "",
        phone: phone || "",
        address: address || "",
        addressEnglish: addressEnglish || "",
        howDidYouHear: howDidYouHear || "",
        imageUrl: imageUrl || "",
        isHandyman: isHandyman === true || isHandyman === "true",
        createdAt: new Date(),
        hasActiveSubscription: true,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        paymentMethodId: paymentMethodId,
      };

      if (googleId) {
        userData.googleId = googleId;
      }

      // Add coordinates if available
      if (
        extractedCoordinates &&
        extractedCoordinates.lng &&
        extractedCoordinates.lat
      ) {
        userData.Coordinates = extractedCoordinates;
        userData.location = {
          type: "Point",
          coordinates: [extractedCoordinates.lng, extractedCoordinates.lat],
        };
      }

      if (userData.isHandyman) {
        // Format specialties
        let specialtiesArray = [];
        if (Array.isArray(specialties)) {
          specialtiesArray = specialties
            .filter((item) => item !== null && item !== undefined)
            .map((item) => {
              if (typeof item === "object" && item.name) {
                return {
                  name: String(item.name).trim(),
                  isFullCategory:
                    item.isFullCategory === true || item.type === "category",
                  type: item.isFullCategory ? "category" : "subCategory",
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
        }
        userData.specialties = specialtiesArray;
        userData.logoUrl = logoUrl || "";
        userData.rating = 0;
        userData.jobsDone = 0;

        // Check if this is one of the first 100 handymen
        const handymenCount = await usersCol.countDocuments({
          isHandyman: true,
        });
        if (handymenCount < 100) {
          userData.handimanFree = true;
        }
      }

      // Insert user
      const result = await usersCol.insertOne(userData);

      if (!result.insertedId) {
        return res.status(500).json({
          success: false,
          message: "Failed to register user",
        });
      }

      // Update Stripe customer metadata with actual userId
      await stripe.customers.update(customer.id, {
        metadata: {
          userId: result.insertedId.toString(),
          type: "handyman_subscription",
        },
      });

      // Save payment record
      await paymentsCol.insertOne({
        type: "subscription",
        amount: subscriptionAmount,
        amountAgorot: amountInAgorot,
        userId: result.insertedId,
        customerId: customer.id,
        subscriptionId: subscription.id,
        paymentMethodId: paymentMethodId,
        status: "active",
        createdAt: new Date(),
      });

      // Save to financials
      const vatPercent = getMaamPercent();
      const vatAmount = (subscriptionAmount * vatPercent) / 100;
      const amountWithoutVAT = subscriptionAmount - vatAmount;

      await financialsCol.insertOne({
        Revenue: {
          Drawings: subscriptionAmount,
        },
        createdAt: new Date(),
      });

      // Get the created user
      const savedUser = await usersCol.findOne({
        _id: result.insertedId,
      });

      return res.json({
        success: true,
        user: savedUser,
        subscriptionId: subscription.id,
        customerId: customer.id,
      });
    } catch (error) {
      console.error("Error completing subscription:", error);
      return res.status(500).json({
        success: false,
        message: "שגיאה בהשלמת הרשמת מנוי",
        error: error.message,
      });
    }
  });

  // ==================== END SUBSCRIPTION ENDPOINTS ====================

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
          const geocodeResult = await geocodeAddress(city.trim());
          if (geocodeResult) {
            // Convert Google Maps format to Mapbox-like format for compatibility
            const features = [
              {
                text: geocodeResult.formatted_address,
                place_name: geocodeResult.formatted_address,
                center: [geocodeResult.lng, geocodeResult.lat],
                address_components: geocodeResult.address_components,
              },
            ];

            // מצא את התוצאה שתואמת לישוב שנבחר
            let matchingFeature = null;
            if (cityEnglishName && cityEnglishName.trim()) {
              const cityEngName = cityEnglishName.trim().toLowerCase();

              matchingFeature = features.find((feature) => {
                const featureEngName = (
                  feature.text ||
                  feature.place_name ||
                  ""
                )
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
          }
        } catch (fwdErr) {
          // Forward geocoding (Hebrew) failed
        }

        // אם לא מצאנו קואורדינטות בעברית, נסה עם השם באנגלית
        if (!coordinatesFound && cityEnglishName && cityEnglishName.trim()) {
          try {
            const geocodeResultEn = await geocodeAddress(
              cityEnglishName.trim()
            );
            if (geocodeResultEn) {
              // Convert Google Maps format to Mapbox-like format for compatibility
              const featuresEn = [
                {
                  text: geocodeResultEn.formatted_address,
                  place_name: geocodeResultEn.formatted_address,
                  center: [geocodeResultEn.lng, geocodeResultEn.lat],
                  address_components: geocodeResultEn.address_components,
                },
              ];

              // מצא את התוצאה שתואמת לישוב שנבחר
              let matchingFeatureEn = null;
              const cityEngName = cityEnglishName.trim().toLowerCase();

              matchingFeatureEn = featuresEn.find((feature) => {
                const featureEngName = (
                  feature.text ||
                  feature.place_name ||
                  ""
                )
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
            }
          } catch (fwdErrEn) {
            // Forward geocoding (English) failed
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

      if (!handyman) {
        return res.status(404).json({
          success: false,
          message: "Handyman not found",
        });
      }

      const handymanName = handyman?.username || null;

      // Create Stripe Connect account if it doesn't exist
      // This happens when handyman accepts their first job
      // Do this in background to not block response
      // Simple check: if no stripeAccountId in DB, handyman needs to set up payment account
      let needsOnboarding = false;
      let onboardingUrl = null;

      if (!handyman.stripeAccountId) {
        // If no account, create it first and get onboarding link
        try {
          const accountId = await getOrCreateConnectedAccount(
            handyman,
            usersCol
          );
          if (!accountId) {
            return res.status(400).json({
              success: false,
              message:
                "Stripe Connect לא מופעל. לא ניתן לקבל עבודה ללא הגדרת תשלומים.",
              needsOnboarding: true,
              onboardingUrl: null,
            });
          }

          // Reload handyman to get updated stripeAccountId
          const updatedHandyman = await usersCol.findOne({
            _id: new ObjectId(handymanId),
          });
          if (updatedHandyman) {
            Object.assign(handyman, updatedHandyman);
          }

          // Create onboarding link
          try {
            const returnUrl =
              process.env.STRIPE_ONBOARDING_RETURN_URL ||
              `${URL_CLIENT}/stripe/success`;
            const refreshUrl =
              process.env.STRIPE_ONBOARDING_REFRESH_URL ||
              `${URL_CLIENT}/stripe/refresh`;
            onboardingUrl = await createOnboardingLink(
              accountId,
              returnUrl,
              refreshUrl
            );
          } catch (linkError) {
            // Still return error - handyman must complete onboarding
          }

          // Return error - handyman must complete onboarding before accepting job
          return res.status(400).json({
            success: false,
            message: "עליך להשלים את הגדרת חשבון התשלומים לפני קבלת עבודה",
            needsOnboarding: true,
            onboardingUrl: onboardingUrl,
          });
        } catch (stripeError) {
          return res.status(400).json({
            success: false,
            message: "שגיאה ביצירת חשבון תשלומים. אנא נסה שוב מאוחר יותר.",
            needsOnboarding: true,
            onboardingUrl: null,
          });
        }
      }
      // If stripeAccountId exists, continue with job acceptance
      // The account status will be checked later when client approves payment

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

      // Prepare update object
      const updateData = {
        $set: {
          handymanId: handymanIdArray,
          handymanName: handymanNameArray,
          status: "assigned",
        },
      };

      // If job has cancel field, remove it (job is being reassigned)
      if (currentJob?.cancel) {
        updateData.$unset = { cancel: "" };
      }

      await jobsCol.updateOne({ _id: new ObjectId(jobId) }, updateData);

      // Get job details to find client
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      const clientId = job?.clientId;

      // Emit WebSocket event to notify both client and handyman that job was accepted
      // This will trigger chat to open automatically for both parties
      io.to(`job-${jobId}`).emit("job-accepted", {
        jobId: jobId,
        handymanId: handymanId,
        handymanName: handymanName,
        status: "assigned",
      });

      // Also emit to handyman's personal room to ensure they receive the event
      // This is important if the handyman is not yet in the job room
      io.to(`user-${handymanId}`).emit("job-accepted", {
        jobId: jobId,
        handymanId: handymanId,
        handymanName: handymanName,
        status: "assigned",
      });

      // Send Push Notification to client (non-blocking - run in background)
      if (clientId) {
        setImmediate(async () => {
          try {
            // Handle both ObjectId and string clientId
            const clientObjectId =
              clientId instanceof ObjectId ? clientId : new ObjectId(clientId);
            const client = await usersCol.findOne({
              _id: clientObjectId,
            });

            if (client) {
              if (client.fcmToken) {
                // Send notification about job acceptance
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
        });
      }

      // Create Payment Intent for Escrow (if job has a price)
      // This is the Escrow flow: payment is created when handyman accepts,
      // money is held (requires_capture), and released when client approves after job is done
      let paymentIntentCreated = false;
      let clientSecret = null;
      let paymentIntentId = null;

      if (job && !job.paymentIntentId) {
        try {
          // Calculate job price
          let totalPrice = 0;

          if (
            job.subcategoryInfo &&
            Array.isArray(job.subcategoryInfo) &&
            job.subcategoryInfo.length > 0
          ) {
            totalPrice = job.subcategoryInfo.reduce((sum, subcat) => {
              const price = subcat?.price || 0;
              return (
                sum +
                (typeof price === "number" ? price : parseFloat(price) || 0)
              );
            }, 0);
          } else if (
            job.subcategoryInfo &&
            typeof job.subcategoryInfo === "object" &&
            job.subcategoryInfo.price
          ) {
            totalPrice =
              typeof job.subcategoryInfo.price === "number"
                ? job.subcategoryInfo.price
                : parseFloat(job.subcategoryInfo.price) || 0;
          } else if (job.price) {
            totalPrice =
              typeof job.price === "number"
                ? job.price
                : parseFloat(job.price) || 0;
          }

          // Add urgent fee if applicable
          if (job.urgent) {
            totalPrice += 10;
          }

          // Only create payment intent if there's a price
          if (totalPrice > 0 && handyman.stripeAccountId) {
            const amountAgorot = Math.round(totalPrice * 100);
            const platformFeeAgorot = Math.round(
              (amountAgorot * getPlatformFeePercent()) / 100
            );

            // Create Escrow Payment Intent - wait for it to complete
            JSON.stringify(
              {
                amountAgorot,
                currency: "ils",
                handymanAccountId: handyman.stripeAccountId,
                platformFeeAgorot,
                metadata: {
                  jobId: jobId,
                  clientId: job.clientId?.toString() || "",
                  handymanId: handymanId.toString(),
                },
              },
              null,
              2
            );

            const result = await createEscrowPaymentIntent({
              amountAgorot,
              currency: "ils",
              handymanAccountId: handyman.stripeAccountId,
              platformFeeAgorot,
              metadata: {
                jobId: jobId,
                clientId: job.clientId?.toString() || "",
                handymanId: handymanId.toString(),
              },
            });

            paymentIntentId = result.paymentIntentId;
            clientSecret = result.clientSecret;
            const status = result.status;

            // Calculate VAT (MAAM) for payment record
            const maamPercentForPayment = getMaamPercent();
            const amountILSForPayment = amountAgorot / 100;
            const vatCalculationForPayment = calculateVAT(
              amountILSForPayment,
              maamPercentForPayment
            );

            // Save payment record
            const paymentsCol = getCollectionPayments();
            const paymentRecord = {
              _id: new ObjectId(),
              jobId: new ObjectId(jobId),
              clientId: new ObjectId(job.clientId),
              handymanId: new ObjectId(handymanId),
              paymentIntentId: paymentIntentId,
              amount: amountILSForPayment,
              originalPrice: amountILSForPayment,
              priceChangePercent: 0,
              amountWithoutVAT: vatCalculationForPayment.amountWithoutVAT,
              amountWithVAT: vatCalculationForPayment.amountWithVAT,
              vatAmount: vatCalculationForPayment.vatAmount,
              vatPercent: maamPercentForPayment,
              platformFee: platformFeeAgorot / 100,
              currency: "ils",
              status: status,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await paymentsCol.insertOne(paymentRecord);

            // Update job with payment intent ID
            await jobsCol.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  paymentIntentId: paymentIntentId,
                  paymentStatus: "pending",
                },
              }
            );

            // Note: managers_financials record will be created when payment is actually transferred
            // (in /payment/transfer or /jobs/done endpoints) with paymentID reference

            paymentIntentCreated = true;

            // If paymentMethodId exists (from CreateCall), attach it and confirm payment automatically
            // Do this in background to not block response
            if (job.paymentMethodId) {
              setImmediate(async () => {
                try {
                  // Get client's Stripe Customer ID
                  const clientIdForCustomer =
                    job.clientId?.toString() || job.clientId;
                  const client = await usersCol.findOne({
                    _id: new ObjectId(clientIdForCustomer),
                  });

                  let customerId = client?.stripeCustomerId;

                  if (!customerId) {
                    // Create customer if doesn't exist
                    const customer = await stripe.customers.create({
                      email: client?.email || undefined,
                      metadata: {
                        userId: clientIdForCustomer.toString(),
                      },
                    });
                    customerId = customer.id;

                    // Save customer ID to user
                    await usersCol.updateOne(
                      { _id: new ObjectId(clientIdForCustomer) },
                      { $set: { stripeCustomerId: customerId } }
                    );
                  }

                  // Attach payment method to customer if not already attached
                  try {
                    const pm = await stripe.paymentMethods.retrieve(
                      job.paymentMethodId
                    );
                    if (!pm.customer || pm.customer !== customerId) {
                      await stripe.paymentMethods.attach(job.paymentMethodId, {
                        customer: customerId,
                      });
                    }
                  } catch (attachError) {
                    // Continue anyway - might already be attached
                  }

                  // Update payment intent with customer and payment method, then confirm
                  await stripe.paymentIntents.update(paymentIntentId, {
                    customer: customerId,
                    payment_method: job.paymentMethodId,
                  });

                  const confirmedPaymentIntent =
                    await stripe.paymentIntents.confirm(paymentIntentId);

                  // Update payment record with confirmed status
                  await paymentsCol.updateOne(
                    { paymentIntentId: paymentIntentId },
                    {
                      $set: {
                        status: confirmedPaymentIntent.status,
                        updatedAt: new Date(),
                      },
                    }
                  );

                  // Update job payment status
                  await jobsCol.updateOne(
                    { _id: new ObjectId(jobId) },
                    {
                      $set: {
                        paymentStatus:
                          confirmedPaymentIntent.status === "requires_capture"
                            ? "pending"
                            : confirmedPaymentIntent.status,
                      },
                    }
                  );
                } catch (confirmError) {
                  // Don't fail the job acceptance if payment confirmation fails
                  // Payment can be confirmed later manually
                }
              });
            }

            // Send notification to client about payment requirement (non-blocking)
            if (clientId) {
              setImmediate(async () => {
                try {
                  const clientObjectId =
                    clientId instanceof ObjectId
                      ? clientId
                      : new ObjectId(clientId);
                  const client = await usersCol.findOne({
                    _id: clientObjectId,
                  });

                  if (client && client.fcmToken) {
                    await sendPushNotification(
                      client.fcmToken,
                      "נדרש אישור תשלום 💳",
                      `ההנדימן ${handymanName} קיבל את העבודה. אנא אשר את התשלום כדי להמשיך.`,
                      {
                        type: "payment_required",
                        jobId: jobId.toString(),
                        handymanId: handymanId.toString(),
                        paymentIntentId: paymentIntentId,
                      }
                    );
                  }
                } catch (notificationError) {
                  // Don't fail if notification fails
                }
              });
            }
          }
        } catch (paymentError) {
          // Don't fail the job acceptance if payment creation fails
          // Payment can be created later via /api/payments/create-intent
        }
      } else {
        if (job?.paymentIntentId) {
          paymentIntentId = job.paymentIntentId;
        }
      }

      // Return response with payment intent info
      const response = {
        success: true,
        needsOnboarding: needsOnboarding,
        onboardingUrl: onboardingUrl,
        paymentIntentCreated: paymentIntentCreated,
        clientSecret: clientSecret, // Client will use this to confirm payment with Stripe.js
        paymentIntentId: paymentIntentId || job?.paymentIntentId || null,
      };

      // Send response
      res.json(response);

      // Continue with any remaining async operations in background (non-blocking)
      // These won't block the response
      setImmediate(async () => {
        try {
          // Any additional cleanup can go here
        } catch (bgError) {}
      });
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
      const { jobId, userId, cancel } = req.body;
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
      let personCancel = "customer";
      if (job.handymanId) {
        // Support both array and single value for handymanId
        if (Array.isArray(job.handymanId)) {
          const isHandyman = job.handymanId.some(
            (id) => String(id) === String(userId)
          );
          if (isHandyman) {
            personCancel = "handyman";
          }
        } else {
          if (String(job.handymanId) === String(userId)) {
            personCancel = "handyman";
          }
        }
      }
      if (job.clientId && String(job.clientId) === String(userId)) {
        personCancel = "customer";
      }

      // Determine if this is a partial cancellation (for specific handyman) or total cancellation
      const isPartialCancel =
        cancel &&
        cancel["Totally-cancels"] === false &&
        personCancel === "customer";

      // Prepare update object
      const updateData = {};

      // If partial cancellation (customer cancels for specific handyman), reset job to open
      if (isPartialCancel) {
        updateData.handymanId = null;
        updateData.handymanName = null;
        updateData.status = "open";
      }
      // Note: For total cancellation, we don't reset handymanId or status here
      // The job will remain in its current state or be handled separately

      // Get handymanId from job (can be array or single value)
      let handymanIdForCancel = null;
      if (job.handymanId) {
        if (Array.isArray(job.handymanId)) {
          // If array, take the first one (or all if needed)
          handymanIdForCancel =
            job.handymanId.length > 0 ? job.handymanId[0] : null;
        } else {
          handymanIdForCancel = job.handymanId;
        }
      }

      // Add cancel object if provided
      if (cancel) {
        // Validate that reason-for-cancellation is provided (required for all cancellations)
        // Exception: handyman can cancel without reason
        if (
          personCancel === "customer" &&
          (!cancel["reason-for-cancellation"] ||
            !cancel["reason-for-cancellation"].trim())
        ) {
          return res.status(400).json({
            success: false,
            message: "סיבת ביטול היא חובה. אנא הזן סיבת ביטול.",
          });
        }

        // Use cancel object from request, but ensure personcancel is set correctly
        updateData.cancel = {
          personcancel: cancel.personcancel || personCancel,
          "reason-for-cancellation":
            cancel["reason-for-cancellation"]?.trim() || "",
          "Totally-cancels": cancel["Totally-cancels"] || false,
          JobId: cancel.JobId || jobId,
          cancelledAt: new Date(),
        };
        // Add handymanId to cancel object if exists
        if (handymanIdForCancel) {
          updateData.cancel.handymanId = handymanIdForCancel;
        }
      } else {
        // Fallback for old format (backward compatibility) - assume partial cancellation
        // For handyman cancellation, reason is optional. For customer, it's required.
        if (personCancel === "customer") {
          return res.status(400).json({
            success: false,
            message: "סיבת ביטול היא חובה. אנא הזן סיבת ביטול.",
          });
        }

        updateData.cancel = {
          personcancel: personCancel,
          "reason-for-cancellation": "", // Handyman can cancel without reason
          "Totally-cancels": false,
          JobId: jobId,
          cancelledAt: new Date(),
        };
        // Add handymanId to cancel object if exists
        if (handymanIdForCancel) {
          updateData.cancel.handymanId = handymanIdForCancel;
        }
        // If no cancel object provided and it's customer canceling, assume partial cancellation
        if (personCancel === "customer") {
          updateData.handymanId = null;
          updateData.handymanName = null;
          updateData.status = "open";
        }
      }

      // If canceling for this handyman only (customer cancels for specific handyman)
      if (
        cancel &&
        cancel["Totally-cancels"] === false &&
        personCancel === "customer" &&
        job.handymanId
      ) {
        const usersCol = getCollection();
        const handymanIds = Array.isArray(job.handymanId)
          ? job.handymanId
          : [job.handymanId];

        // Add handyman to handiman-Blocked array in the job
        const blockedHandymanIds = handymanIds.map((id) => new ObjectId(id));
        updateData["handiman-Blocked"] = blockedHandymanIds;

        // Also add to user's handymanBlocked list (for backward compatibility)
        for (const handymanId of handymanIds) {
          try {
            const handymanIdStr = String(handymanId);
            await usersCol.updateOne(
              { _id: new ObjectId(handymanIdStr) },
              {
                $addToSet: { handymanBlocked: new ObjectId(jobId) },
              }
            );
          } catch (blockError) {
            // Continue even if blocking fails
          }
        }
      }

      // Handle payment refund if payment exists and is in escrow (requires_capture)
      const paymentsCol = getCollectionPayments();
      if (job.paymentIntentId) {
        try {
          // Check payment status
          const payment = await paymentsCol.findOne({
            paymentIntentId: job.paymentIntentId,
          });

          if (payment && payment.status === "requires_capture") {
            // Payment is in escrow - cancel it to refund the client
            try {
              await cancelEscrow(job.paymentIntentId);

              // Update payment record
              await paymentsCol.updateOne(
                { paymentIntentId: job.paymentIntentId },
                {
                  $set: {
                    status: "cancelled",
                    updatedAt: new Date(),
                  },
                }
              );

              // Update job payment status
              updateData.paymentStatus = "cancelled";
            } catch (cancelError) {
              // Log error but continue with job cancellation
              console.error(
                `Error cancelling payment intent ${job.paymentIntentId}:`,
                cancelError
              );
            }
          }
        } catch (paymentError) {
          // Log error but continue with job cancellation
          console.error("Error checking payment status:", paymentError);
        }
      }

      // Update handymanId and handymanName to null instead of deleting
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: updateData,
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

      // If client cancelled, notify handyman via WebSocket
      if (personCancel === "customer" && job.handymanId) {
        const handymanIds = Array.isArray(job.handymanId)
          ? job.handymanId
          : [job.handymanId];

        for (const handymanId of handymanIds) {
          const handymanIdStr = String(handymanId);
          io.to(`user-${handymanIdStr}`).emit("job-cancelled-by-client", {
            jobId: jobId,
            message:
              "אנחנו מצטערים אך הלקוח ביטל את העבודה במידת הצורך תקבל פיצוי",
          });
        }
      }

      // Emit WebSocket event to notify that job was cancelled
      io.to(`job-${jobId}`).emit("job-cancelled", {
        jobId: jobId,
        status: "open",
        cancelledBy: personCancel,
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

  // Delete job endpoint (client only) - completely delete the job
  app.delete("/jobs/:jobId/delete", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { userId, cancel } = req.body;

      if (!jobId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Job ID and User ID are required",
        });
      }

      const jobsCol = getCollectionJobs();
      const chatsCol = getCollectionChats();
      const usersCol = getCollection();
      const io = req.app.get("io");

      // Find the job
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Verify that the user is the client who created the job
      const userIdStr = String(userId);
      const jobClientIdStr = String(job.clientId);
      if (jobClientIdStr !== userIdStr) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this job",
        });
      }

      // Handle payment refund if payment exists and is in escrow (requires_capture)
      const paymentsCol = getCollectionPayments();
      if (job.paymentIntentId) {
        try {
          // Check payment status
          const payment = await paymentsCol.findOne({
            paymentIntentId: job.paymentIntentId,
          });

          if (payment && payment.status === "requires_capture") {
            // Payment is in escrow - cancel it to refund the client
            try {
              await cancelEscrow(job.paymentIntentId);

              // Update payment record
              await paymentsCol.updateOne(
                { paymentIntentId: job.paymentIntentId },
                {
                  $set: {
                    status: "cancelled",
                    updatedAt: new Date(),
                  },
                }
              );
            } catch (cancelError) {
              // Log error but continue with job deletion
              console.error(
                `Error cancelling payment intent ${job.paymentIntentId}:`,
                cancelError
              );
            }
          }
        } catch (paymentError) {
          // Log error but continue with job deletion
          console.error("Error checking payment status:", paymentError);
        }
      }

      // Prepare update data with cancel object and isDeleted flag
      const updateData = {
        status: "cancelled",
        isDeleted: true, // Mark as deleted
        paymentStatus: job.paymentIntentId ? "cancelled" : undefined,
      };

      // Add cancel object if provided
      if (cancel) {
        updateData.cancel = {
          personcancel: cancel.personcancel || "customer",
          "reason-for-cancellation": cancel["reason-for-cancellation"] || "",
          "Totally-cancels":
            cancel["Totally-cancels"] !== undefined
              ? cancel["Totally-cancels"]
              : true,
          JobId: cancel.JobId || jobId,
          cancelledAt: new Date(),
          isDeleted: cancel.isDeleted !== undefined ? cancel.isDeleted : true,
        };
      } else {
        // Fallback for old format (backward compatibility)
        updateData.cancel = {
          personcancel: "customer",
          "reason-for-cancellation": "",
          "Totally-cancels": true,
          JobId: jobId,
          cancelledAt: new Date(),
          isDeleted: true,
        };
      }

      // Update job with cancel info and mark as deleted
      const updateResult = await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        { $set: updateData }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Delete chat from database
      await chatsCol.deleteOne({
        jobId: new ObjectId(jobId),
      });

      // If job has a handyman assigned, notify them
      if (job.handymanId) {
        const handymanIds = Array.isArray(job.handymanId)
          ? job.handymanId
          : [job.handymanId];

        for (const handymanId of handymanIds) {
          try {
            const handymanIdStr = String(handymanId);
            const handyman = await usersCol.findOne({
              _id: new ObjectId(handymanIdStr),
            });

            if (handyman?.fcmToken) {
              await sendPushNotification(
                handyman.fcmToken,
                "עבודה נמחקה",
                "הלקוח מחק את העבודה"
              );
            }

            // Send WebSocket notification to handyman
            if (io) {
              io.to(`user-${handymanIdStr}`).emit("job-cancelled-by-client", {
                jobId: jobId,
                message:
                  "אנחנו מצטערים אך הלקוח ביטל את העבודה במידת הצורך תקבל פיצוי",
              });
            }
          } catch (notifError) {
            // Continue even if notification fails
          }
        }
      }

      // Emit WebSocket event to notify that job was deleted
      if (io) {
        io.to(`job-${jobId}`).emit("job-deleted", {
          jobId: jobId,
          message: "Job has been deleted",
        });
      }

      return res.json({
        success: true,
        message: "Job deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting job",
        error: error.message,
      });
    }
  });

  // Delete job endpoint (client only) - cancel job
  app.delete("/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { userId, cancel } = req.body;

      if (!jobId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Job ID and User ID are required",
        });
      }

      const jobsCol = getCollectionJobs();
      const chatsCol = getCollectionChats();
      const usersCol = getCollection();
      const io = req.app.get("io");

      // Find the job
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Verify that the user is the client who created the job
      const userIdStr = String(userId);
      const jobClientIdStr = String(job.clientId);
      if (jobClientIdStr !== userIdStr) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this job",
        });
      }

      // Prepare update data with cancel object
      const updateData = {
        status: "cancelled",
        isDeleted: true, // Mark as deleted instead of actually deleting
      };

      // Add cancel object if provided
      if (cancel) {
        updateData.cancel = {
          personcancel: cancel.personcancel || "customer",
          "reason-for-cancellation": cancel["reason-for-cancellation"] || "",
          "Totally-cancels":
            cancel["Totally-cancels"] !== undefined
              ? cancel["Totally-cancels"]
              : true,
          JobId: cancel.JobId || jobId,
          cancelledAt: new Date(),
        };
      } else {
        // Fallback for old format (backward compatibility)
        updateData.cancel = {
          personcancel: "customer",
          "reason-for-cancellation": "",
          "Totally-cancels": true,
          JobId: jobId,
          cancelledAt: new Date(),
        };
      }

      // Update job with cancel info instead of deleting (preserve history)
      const updateResult = await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        { $set: updateData }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // If job has a handyman assigned, notify them
      if (job.handymanId) {
        const handymanIds = Array.isArray(job.handymanId)
          ? job.handymanId
          : [job.handymanId];

        for (const handymanId of handymanIds) {
          try {
            const handymanIdStr = String(handymanId);
            const handyman = await usersCol.findOne({
              _id: new ObjectId(handymanIdStr),
            });

            if (handyman?.fcmToken) {
              await sendPushNotification(
                handyman.fcmToken,
                "עבודה בוטלה",
                "מצטערים, אך המשתמש ביטל את העבודה הזו"
              );
            }

            // Emit WebSocket event to notify handyman
            if (io) {
              io.to(`user-${handymanIdStr}`).emit("job-cancelled", {
                jobId: jobId,
                message: "מצטערים, אך המשתמש ביטל את העבודה הזו",
              });
            }
          } catch (error) {
            // Continue even if notification fails
          }
        }
      }

      // Delete associated chat
      try {
        await chatsCol.deleteMany({ jobId: new ObjectId(jobId) });
      } catch (error) {
        // Continue even if chat deletion fails
      }

      // Emit WebSocket event to notify all connected clients
      if (io) {
        io.to(`job-${jobId}`).emit("job-deleted", {
          jobId: jobId,
        });
      }

      return res.json({
        success: true,
        message: "Job deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting job",
        error: error.message,
      });
    }
  });

  // Update job endpoint (client only)
  app.put("/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const {
        userId,
        subcategoryInfo,
        desc,
        locationText,
        houseNumber,
        locationEnglishName,
        coordinates,
        when,
        workType,
        urgent,
        imageUrl,
      } = req.body;

      if (!jobId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Job ID and User ID are required",
        });
      }

      const jobsCol = getCollectionJobs();

      // Find the job
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Verify that the user is the client who created the job
      const userIdStr = String(userId);
      const jobClientIdStr = String(job.clientId);
      if (jobClientIdStr !== userIdStr) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this job",
        });
      }

      // Only allow editing if job is still "open" (not assigned)
      if (job.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "Cannot edit job that has been assigned to a handyman",
        });
      }

      // Build update object with only provided fields
      const updateObj = {
        updatedAt: new Date(),
      };

      if (subcategoryInfo !== undefined) {
        updateObj.subcategoryInfo = Array.isArray(subcategoryInfo)
          ? subcategoryInfo
          : subcategoryInfo
          ? [subcategoryInfo]
          : [];
      }
      if (desc !== undefined) updateObj.desc = desc;
      if (locationText !== undefined) updateObj.locationText = locationText;
      if (houseNumber !== undefined) updateObj.houseNumber = houseNumber;
      if (locationEnglishName !== undefined)
        updateObj.locationEnglishName = locationEnglishName;
      if (coordinates !== undefined) updateObj.coordinates = coordinates;
      if (when !== undefined) updateObj.when = when;
      if (workType !== undefined) updateObj.workType = workType;
      if (urgent !== undefined) updateObj.urgent = urgent;
      if (imageUrl !== undefined) {
        updateObj.imageUrl = Array.isArray(imageUrl)
          ? imageUrl
          : imageUrl
          ? [imageUrl]
          : [];
      }

      // Update the job
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        { $set: updateObj }
      );

      // Emit WebSocket event to notify all connected clients
      const io = req.app.get("io");
      if (io) {
        io.to(`job-${jobId}`).emit("job-updated", {
          jobId: jobId,
          updates: updateObj,
        });
      }

      return res.json({
        success: true,
        message: "Job updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating job",
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

      // If job has cancel field, remove it (job is being reassigned/continued)
      const updateQuery = { $set: { status: "on_the_way" } };
      if (job?.cancel) {
        updateQuery.$unset = { cancel: "" };
      }
      await jobsCol.updateOne(query, updateQuery);
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

      // If job has cancel field, remove it (job is being reassigned/continued)
      const updateQuery = { $set: { status: "in_progress" } };
      if (job?.cancel) {
        updateQuery.$unset = { cancel: "" };
      }
      await jobsCol.updateOne(query, updateQuery);

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

      // Get handymanId - check both handymanId and handymanIdSpecial (for personal requests)
      let actualHandymanId = job.handymanId;
      if (!actualHandymanId && job.handymanIdSpecial) {
        actualHandymanId = job.handymanIdSpecial;
      }
      if (!actualHandymanId) {
        actualHandymanId = handymanId;
      }

      // Use the handymanId from the job (as it's stored in DB)
      const query = {
        _id: new ObjectId(jobId),
        handymanId: actualHandymanId,
      };

      // Update status to "done" - waiting for client approval before payment capture
      // If job has cancel field, remove it (job is being completed)
      const updateQuery = {
        $set: {
          status: "done",
          clientApproved: false,
          handymanReceivedPayment: false, // Handyman hasn't received payment yet
        },
      };
      if (job?.cancel) {
        updateQuery.$unset = { cancel: "" };
      }
      await jobsCol.updateOne(query, updateQuery);

      // Update jobDone for handyman (handle both array and single handymanId, and handymanIdSpecial)
      if (actualHandymanId) {
        const handymanIds = Array.isArray(actualHandymanId)
          ? actualHandymanId
          : [actualHandymanId];
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
        // Fallback to provided handymanId if actualHandymanId is not set
        await usersCol.updateOne(
          { _id: new ObjectId(handymanId) },
          { $inc: { jobDone: 1 } }
        );
      }

      // Emit WebSocket event to notify clients
      const io = req.app.get("io");
      if (io) {
        // Emit to job room (for all participants)
        io.to(`job-${jobId}`).emit("job-status-updated", {
          jobId,
          status: "done",
          requiresClientApproval: true,
        });

        // Also emit to client's personal room to ensure they receive the event
        const clientId = job?.clientId;
        if (clientId) {
          const clientIdString = clientId.toString();
          const userRoomName = `user-${clientIdString}`;
          const jobRoomName = `job-${jobId}`;

          io.to(userRoomName).emit("job-done", {
            jobId,
            status: "done",
            requiresClientApproval: true,
          });

          // Also emit to job room with specific event for client (in case they're in job room)
          io.to(jobRoomName).emit("job-done", {
            jobId,
            status: "done",
            requiresClientApproval: true,
          });
        }
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
              "העבודה הושלמה ✅",
              `${handymanName} סיים את העבודה. אנא אשר את סיום העבודה כדי לשחרר את התשלום.`,
              {
                type: "job_done",
                jobId: jobId.toString(),
                status: "done",
                requiresApproval: true,
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

      // Send Push Notification to handyman (confirming they marked job as done)
      if (handymanId) {
        try {
          const handymanObjectId =
            handymanId instanceof ObjectId
              ? handymanId
              : new ObjectId(handymanId);
          const handyman = await usersCol.findOne({ _id: handymanObjectId });

          if (handyman?.fcmToken) {
            const pushResult = await sendPushNotification(
              handyman.fcmToken,
              "העבודה סומנה כהושלמה ✅",
              "העבודה סומנה כהושלמה בהצלחה. ממתין לאישור הלקוח לשחרור התשלום.",
              {
                type: "job_marked_done",
                jobId: jobId.toString(),
                status: "done",
                waitingForApproval: true,
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
        }
      }

      // NOTE: Payment capture is NOT performed here - it requires client approval
      // The payment will be captured when client calls /api/jobs/approve
      // Payment Intent remains in "requires_capture" state until client approval

      return res.json({
        success: true,
        message:
          "Job marked as done. Waiting for client approval to release payment.",
        status: "done",
        requiresClientApproval: true,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error finishing job",
        error: error.message,
      });
    }
  });

  // Client approval endpoint - releases Escrow payment after client confirms job completion
  app.post("/api/jobs/approve", async (req, res) => {
    try {
      const { jobId, clientId } = req.body;

      if (!jobId || !clientId) {
        return res.status(400).json({
          success: false,
          message: "jobId and clientId required",
        });
      }

      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();

      // Get job and verify ownership
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Verify that the requester is the client
      const jobClientId = job.clientId?.toString() || job.clientId;
      const requestClientId = clientId.toString();

      if (jobClientId !== requestClientId) {
        return res.status(403).json({
          success: false,
          message: "Only the job client can approve completion",
        });
      }

      if (job.status !== "done") {
        return res.status(400).json({
          success: false,
          message:
            "Job must be marked as done by handyman before client can approve",
          currentStatus: job.status,
        });
      }

      // Note: Each job in a split call is independent
      // Client can approve and release payment for each handyman separately when their job is done
      // No need to wait for all jobs to complete

      // If payment already released, just update clientApproved flag
      if (job.paymentStatus === "paid") {
        // Payment already released, just update clientApproved
        await jobsCol.updateOne(
          { _id: new ObjectId(jobId) },
          {
            $set: {
              clientApproved: true,
            },
          }
        );

        return res.json({
          success: true,
          message: "העבודה אושרה (התשלום כבר שוחרר קודם לכן)",
          paymentStatus: "paid",
          clientApproved: true,
        });
      }

      // If already approved but payment not released, continue to release payment

      // Check if paymentIntentId exists - if not, create it now
      if (!job.paymentIntentId) {
        // Get handyman to create payment intent
        const handymanIdForPayment =
          job.handymanId?.toString() || job.handymanId;
        if (!handymanIdForPayment) {
          return res.status(400).json({
            success: false,
            message: "Job has no handyman assigned. Cannot create payment.",
          });
        }

        const handyman = await usersCol.findOne({
          _id: new ObjectId(handymanIdForPayment),
        });

        if (!handyman || !handyman.stripeAccountId) {
          return res.status(400).json({
            success: false,
            message:
              "Handyman has no payment account set up. Cannot create payment.",
          });
        }

        // Calculate job price
        let totalPrice = 0;
        if (
          job.subcategoryInfo &&
          Array.isArray(job.subcategoryInfo) &&
          job.subcategoryInfo.length > 0
        ) {
          totalPrice = job.subcategoryInfo.reduce((sum, subcat) => {
            const price = subcat?.price || 0;
            return (
              sum + (typeof price === "number" ? price : parseFloat(price) || 0)
            );
          }, 0);
        } else if (
          job.subcategoryInfo &&
          typeof job.subcategoryInfo === "object" &&
          job.subcategoryInfo.price
        ) {
          totalPrice =
            typeof job.subcategoryInfo.price === "number"
              ? job.subcategoryInfo.price
              : parseFloat(job.subcategoryInfo.price) || 0;
        } else if (job.price) {
          totalPrice =
            typeof job.price === "number"
              ? job.price
              : parseFloat(job.price) || 0;
        }

        // Add urgent fee if applicable
        if (job.urgent) {
          totalPrice += 10;
        }

        if (totalPrice > 0) {
          const amountAgorot = Math.round(totalPrice * 100);
          const platformFeeAgorot = Math.round(
            (amountAgorot * getPlatformFeePercent()) / 100
          );

          try {
            const result = await createEscrowPaymentIntent({
              amountAgorot,
              currency: "ils",
              handymanAccountId: handyman.stripeAccountId,
              platformFeeAgorot,
              metadata: {
                jobId: jobId,
                clientId: job.clientId?.toString() || "",
                handymanId: handymanIdForPayment,
              },
            });

            // Update job with payment intent ID

            await jobsCol.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  paymentIntentId: result.paymentIntentId,
                  paymentStatus: "pending",
                },
              }
            );

            // Calculate VAT (MAAM) for payment record
            const maamPercentForApprove = getMaamPercent();
            const amountILSForApprove = amountAgorot / 100;
            const vatCalculationForApprove = calculateVAT(
              amountILSForApprove,
              maamPercentForApprove
            );

            // Save payment record
            const paymentsCol = getCollectionPayments();
            const paymentRecord = {
              _id: new ObjectId(),
              jobId: new ObjectId(jobId),
              clientId: new ObjectId(job.clientId),
              handymanId: new ObjectId(handymanIdForPayment),
              paymentIntentId: result.paymentIntentId,
              amount: amountILSForApprove,
              originalPrice: amountILSForApprove,
              priceChangePercent: 0,
              amountWithoutVAT: vatCalculationForApprove.amountWithoutVAT,
              amountWithVAT: vatCalculationForApprove.amountWithVAT,
              vatAmount: vatCalculationForApprove.vatAmount,
              vatPercent: maamPercentForApprove,
              platformFee: platformFeeAgorot / 100,
              currency: "ils",
              status: result.status,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await paymentsCol.insertOne(paymentRecord);

            // Reload job to get updated paymentIntentId

            const updatedJob = await jobsCol.findOne({
              _id: new ObjectId(jobId),
            });
            Object.assign(job, updatedJob);
          } catch (createError) {
            const errorResponse = {
              success: false,
              message: "שגיאה ביצירת תשלום. אנא נסה שוב מאוחר יותר.",
              error: createError.message,
            };

            res.status(500).json(errorResponse);

            return;
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Job has no price. Cannot create payment.",
          });
        }
      }

      // Update job - mark as client approved (only if not already approved)
      // If already approved, we'll just release the payment

      if (job.clientApproved !== true) {
        await jobsCol.updateOne(
          { _id: new ObjectId(jobId) },
          {
            $set: {
              clientApproved: true,
              // Status remains "done" until payment is captured, then becomes "paid"
            },
          }
        );
      } else {
      }

      // Now capture the payment (if paymentIntentId exists)

      if (job.paymentIntentId) {
        try {
          // Call the capture endpoint logic
          const paymentsCol = getCollectionPayments();
          const jobsCol = getCollectionJobs();

          // Get Payment Intent from Stripe
          let paymentIntent;
          try {
            paymentIntent = await getPaymentIntent(job.paymentIntentId);
          } catch (stripeError) {
            return res.status(500).json({
              success: false,
              message: "Failed to retrieve payment information",
              error: stripeError.message,
            });
          }

          // Check payment status
          // If payment is in requires_payment_method, try to use saved payment method
          if (paymentIntent.status === "requires_payment_method") {
            // First check if job has paymentMethodId (from when job was created)
            let paymentMethodIdToUse = job.paymentMethodId;

            // If job doesn't have paymentMethodId, check user's saved payment method
            if (!paymentMethodIdToUse) {
              const client = await usersCol.findOne({
                _id: new ObjectId(clientId),
              });
              if (client && client.paymentMethodId) {
                paymentMethodIdToUse = client.paymentMethodId;
              }
            }

            if (paymentMethodIdToUse) {
              try {
                // First, verify the payment method exists and is valid
                let pm;
                try {
                  pm = await stripe.paymentMethods.retrieve(
                    paymentMethodIdToUse
                  );
                } catch (pmError) {}

                // Get or create Stripe Customer for the client

                let customerId;
                const client = await usersCol.findOne({
                  _id: new ObjectId(clientId),
                });

                if (client && client.stripeCustomerId) {
                  // Verify that the customer still exists in Stripe
                  try {
                    const existingCustomer = await stripe.customers.retrieve(
                      client.stripeCustomerId
                    );
                    if (existingCustomer && !existingCustomer.deleted) {
                      // Use existing customer
                      customerId = client.stripeCustomerId;
                    } else {
                      // Customer was deleted in Stripe, create a new one
                      const customer = await stripe.customers.create({
                        email: client?.email || undefined,
                        metadata: {
                          userId: clientId.toString(),
                        },
                      });
                      customerId = customer.id;

                      // Save customer ID to user
                      await usersCol.updateOne(
                        { _id: new ObjectId(clientId) },
                        { $set: { stripeCustomerId: customerId } }
                      );
                    }
                  } catch (customerError) {
                    // Customer doesn't exist or error retrieving, create a new one
                    const customer = await stripe.customers.create({
                      email: client?.email || undefined,
                      metadata: {
                        userId: clientId.toString(),
                      },
                    });
                    customerId = customer.id;

                    // Save customer ID to user
                    await usersCol.updateOne(
                      { _id: new ObjectId(clientId) },
                      { $set: { stripeCustomerId: customerId } }
                    );
                  }
                } else {
                  // Create new customer

                  const customer = await stripe.customers.create({
                    email: client?.email || undefined,
                    metadata: {
                      userId: clientId.toString(),
                    },
                  });
                  customerId = customer.id;

                  // Save customer ID to user
                  await usersCol.updateOne(
                    { _id: new ObjectId(clientId) },
                    { $set: { stripeCustomerId: customerId } }
                  );
                }

                // Attach payment method to customer if not already attached

                if (!pm.customer || pm.customer !== customerId) {
                  try {
                    await stripe.paymentMethods.attach(paymentMethodIdToUse, {
                      customer: customerId,
                    });
                  } catch (attachError) {
                    // If the payment method was previously used without customer attachment,
                    // we can't reuse it. Try to find another payment method for this customer.
                    if (
                      attachError.message &&
                      attachError.message.includes(
                        "previously used without being attached"
                      )
                    ) {
                      // Try to list all payment methods for this customer
                      let customerPaymentMethods;
                      try {
                        customerPaymentMethods =
                          await stripe.paymentMethods.list({
                            customer: customerId,
                            type: "card",
                          });

                        if (
                          customerPaymentMethods.data &&
                          customerPaymentMethods.data.length > 0
                        ) {
                        } else {
                        }
                      } catch (listError) {
                        throw new Error(
                          `Failed to retrieve payment methods: ${listError.message}`
                        );
                      }

                      if (
                        customerPaymentMethods.data &&
                        customerPaymentMethods.data.length > 0
                      ) {
                        // Use the first available payment method
                        const alternativePaymentMethod =
                          customerPaymentMethods.data[0];
                        paymentMethodIdToUse = alternativePaymentMethod.id;

                        // Update pm to point to the new payment method
                        pm = alternativePaymentMethod;

                        // Update the user's paymentMethodId in DB
                        const updateResult = await usersCol.updateOne(
                          { _id: new ObjectId(clientId) },
                          {
                            $set: {
                              paymentMethodId: alternativePaymentMethod.id,
                            },
                          }
                        );
                      } else {
                        // No alternative payment method found

                        // Remove the invalid payment method from DB

                        await usersCol.updateOne(
                          { _id: new ObjectId(clientId) },
                          { $unset: { paymentMethodId: "" } }
                        );

                        // Update the existing Payment Intent to allow adding a new payment method
                        // Set setup_future_usage so the new payment method can be saved
                        try {
                          const updatedPaymentIntent =
                            await stripe.paymentIntents.update(
                              job.paymentIntentId,
                              {
                                setup_future_usage: "off_session",
                                customer: customerId,
                              }
                            );

                          // Return error with clientSecret so user can add a new payment method
                          return res.status(400).json({
                            success: false,
                            message:
                              "אמצעי התשלום השמור לא יכול לשמש. אנא הוסף כרטיס אשראי חדש.",
                            requiresPaymentMethod: true,
                            paymentIntentId: job.paymentIntentId,
                            clientSecret: updatedPaymentIntent.client_secret,
                            error:
                              "Payment method cannot be reused. Please add a new payment method.",
                          });
                        } catch (updateError) {
                          console.error(
                            `[jobs/approve] ❌ Error updating Payment Intent: ${updateError.message}`
                          );
                          // Return error with original clientSecret
                          return res.status(400).json({
                            success: false,
                            message:
                              "אמצעי התשלום השמור לא יכול לשמש. אנא הוסף כרטיס אשראי חדש.",
                            requiresPaymentMethod: true,
                            paymentIntentId: job.paymentIntentId,
                            clientSecret: paymentIntent.client_secret,
                            error:
                              "Payment method cannot be reused. Please add a new payment method.",
                          });
                        }
                      }
                    } else {
                      // Other attach errors, re-throw

                      throw attachError;
                    }
                  }
                } else {
                }

                // Update payment intent with customer and payment method

                try {
                  await stripe.paymentIntents.update(job.paymentIntentId, {
                    customer: customerId,
                    payment_method: paymentMethodIdToUse,
                  });
                } catch (updateError) {
                  throw updateError;
                }

                // Confirm the payment intent
                let confirmedPaymentIntent;
                try {
                  confirmedPaymentIntent = await stripe.paymentIntents.confirm(
                    job.paymentIntentId
                  );
                } catch (confirmError) {
                  throw confirmError;
                }

                // Check if confirmation was successful
                if (confirmedPaymentIntent.status === "requires_capture") {
                  // Payment confirmed, continue with capture
                  paymentIntent = confirmedPaymentIntent;
                } else {
                  return res.status(400).json({
                    success: false,
                    message: `שגיאה באישור התשלום. סטטוס: ${confirmedPaymentIntent.status}`,
                    currentStatus: confirmedPaymentIntent.status,
                  });
                }
              } catch (confirmError) {
                // If confirmation fails, return error
                console.error(`[jobs/approve] ❌ Error confirming payment:`, {
                  error: confirmError.message,
                  type: confirmError.type,
                  code: confirmError.code,
                  decline_code: confirmError.decline_code,
                  payment_intent: confirmError.payment_intent,
                  stack: confirmError.stack,
                });
                return res.status(400).json({
                  success: false,
                  message:
                    "שגיאה באישור התשלום עם אמצעי התשלום השמור. אנא נסה להוסיף אמצעי תשלום חדש.",
                  requiresPaymentMethod: true,
                  paymentIntentId: job.paymentIntentId,
                  clientSecret: paymentIntent.client_secret,
                  error: confirmError.message,
                  errorType: confirmError.type,
                  errorCode: confirmError.code,
                });
              }
            } else {
              // No saved payment method, return error
              return res.status(400).json({
                success: false,
                message:
                  "נדרש להוסיף אמצעי תשלום לפני אישור העבודה. אנא הוסף כרטיס אשראי תחילה.",
                requiresPaymentMethod: true,
                paymentIntentId: job.paymentIntentId,
                clientSecret: paymentIntent.client_secret,
              });
            }
          }

          // Check payment status
          // If payment is already succeeded, it means it was already captured (e.g., automatically when handyman accepted)
          // In this case, we just need to update the job status, not capture again
          if (paymentIntent.status === "succeeded") {
            // Payment already captured, just update job status
            const isConnectPayment =
              paymentIntent.transfer_data &&
              paymentIntent.transfer_data.destination;

            // Calculate amounts from the already-captured payment
            const totalAmount = paymentIntent.amount / 100; // Convert from agorot to ILS

            // Calculate VAT (MAAM) for payment record
            const maamPercentForSucceeded = getMaamPercent();
            const vatCalculationForSucceeded = calculateVAT(
              totalAmount,
              maamPercentForSucceeded
            );

            const urgentFee = job.urgent ? 10 : 0;
            const platformFee = paymentIntent.application_fee_amount
              ? paymentIntent.application_fee_amount / 100
              : totalAmount * (getPlatformFeePercent() / 100);
            const handymanRevenue = totalAmount - platformFee;

            // Get handyman ID
            const handymanIdForPayment =
              job.handymanId?.toString() || job.handymanId;
            const clientIdForPayment = job.clientId?.toString() || job.clientId;

            // Update or create payment record
            const existingPayment = await paymentsCol.findOne({
              paymentIntentId: job.paymentIntentId,
            });

            if (existingPayment) {
              // Update existing payment record with VAT if missing
              const updateData = {
                status: "succeeded",
                handymanReceivedPayment: true,
                updatedAt: new Date(),
              };

              // Add VAT fields if they don't exist
              if (
                !existingPayment.vatAmount ||
                existingPayment.vatAmount === 0
              ) {
                updateData.amountWithoutVAT =
                  vatCalculationForSucceeded.amountWithoutVAT;
                updateData.amountWithVAT =
                  vatCalculationForSucceeded.amountWithVAT;
                updateData.vatAmount = vatCalculationForSucceeded.vatAmount;
                updateData.vatPercent = maamPercentForSucceeded;
              }

              await paymentsCol.updateOne(
                { paymentIntentId: job.paymentIntentId },
                { $set: updateData }
              );
            } else {
              // Create new payment record
              await paymentsCol.insertOne({
                jobId: new ObjectId(jobId),
                handymanId: new ObjectId(handymanIdForPayment),
                clientId: new ObjectId(clientIdForPayment),
                paymentIntentId: job.paymentIntentId,
                amount: totalAmount,
                originalPrice: totalAmount,
                priceChangePercent: 0,
                amountWithoutVAT: vatCalculationForSucceeded.amountWithoutVAT,
                amountWithVAT: vatCalculationForSucceeded.amountWithVAT,
                vatAmount: vatCalculationForSucceeded.vatAmount,
                vatPercent: maamPercentForSucceeded,
                platformFee: platformFee,
                handymanRevenue: handymanRevenue,
                currency: "ils",
                status: "succeeded",
                handymanReceivedPayment: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }

            // Update job payment status
            await jobsCol.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  paymentStatus: "completed",
                  handymanReceivedPayment: true,
                  updatedAt: new Date(),
                },
              }
            );

            // Continue with success response (skip capture)
            // The payment was already captured, so we can proceed to send success response
            return res.json({
              success: true,
              message: "התשלום אושר ושחרר בהצלחה",
              paymentStatus: "completed",
              paymentIntentId: job.paymentIntentId,
            });
          }

          // Verify payment is in requires_capture state (ready to be captured)
          if (paymentIntent.status !== "requires_capture") {
            return res.status(400).json({
              success: false,
              message: `Payment is not ready to be captured. Current status: ${paymentIntent.status}`,
              currentStatus: paymentIntent.status,
            });
          }

          // Check if this is a Stripe Connect payment
          const isConnectPayment =
            paymentIntent.transfer_data &&
            paymentIntent.transfer_data.destination;

          // Capture the payment
          let capturedPayment;
          try {
            capturedPayment = await captureEscrow(job.paymentIntentId);
          } catch (captureError) {
            return res.status(500).json({
              success: false,
              message: "Failed to release payment",
              error: captureError.message,
            });
          }

          // Calculate amounts
          const totalAmount = capturedPayment.amount / 100; // Convert from agorot to ILS

          // Calculate VAT (MAAM) for payment record
          const maamPercentForCaptured = getMaamPercent();
          const vatCalculationForCaptured = calculateVAT(
            totalAmount,
            maamPercentForCaptured
          );

          const urgentFee = job.urgent ? 10 : 0;

          // Get handyman ID
          const handymanIdForPayment =
            job.handymanId?.toString() || job.handymanId;
          const clientIdForPayment = job.clientId?.toString() || job.clientId;

          if (isConnectPayment) {
            // Stripe Connect payment - Stripe handles the split automatically
            const platformFee =
              (capturedPayment.application_fee_amount || 0) / 100;
            const handymanRevenue = totalAmount - platformFee;

            // Update or create payment record
            const existingPayment = await paymentsCol.findOne({
              paymentIntentId: job.paymentIntentId,
            });

            const paymentData = {
              jobId: new ObjectId(jobId),
              handymanId: handymanIdForPayment,
              clientId: clientIdForPayment,
              paymentIntentId: job.paymentIntentId,
              amount: totalAmount,
              originalPrice: existingPayment?.originalPrice || totalAmount,
              priceChangePercent: existingPayment?.priceChangePercent || 0,
              amountWithoutVAT:
                existingPayment?.amountWithoutVAT ||
                vatCalculationForCaptured.amountWithoutVAT,
              amountWithVAT:
                existingPayment?.amountWithVAT ||
                vatCalculationForCaptured.amountWithVAT,
              vatAmount:
                existingPayment?.vatAmount ||
                vatCalculationForCaptured.vatAmount,
              vatPercent: existingPayment?.vatPercent || maamPercentForCaptured,
              platformFee: platformFee,
              handymanRevenue: handymanRevenue,
              currency: "ils",
              status: "captured",
              createdAt: existingPayment?.createdAt || new Date(),
              updatedAt: new Date(),
            };

            let paymentID;
            if (existingPayment) {
              await paymentsCol.updateOne(
                { paymentIntentId: job.paymentIntentId },
                { $set: paymentData }
              );
              paymentID = existingPayment._id; // Use existing payment ID
            } else {
              const insertResult = await paymentsCol.insertOne(paymentData);
              paymentID = insertResult.insertedId; // Get new payment ID
            }

            // Update managers_financials - only if financial record doesn't exist for this payment
            const financialsCol = getCollectionFinancials();
            const existingFinancial = await financialsCol.findOne({
              paymentID: paymentID,
            });

            if (!existingFinancial) {
              const clearingFeeRate = 0.029; // 2.9%
              const clearingFeeFixed = 0.3; // 0.3 ILS
              const clearingFee =
                Math.round(
                  (totalAmount * clearingFeeRate + clearingFeeFixed) * 100
                ) / 100;

              const financialsDoc = {
                createdAt: new Date(),
                Revenue: {
                  Fees: platformFee,
                  "Urgent call": urgentFee,
                },
                expenses: {
                  "clearing fee": clearingFee,
                },
                paymentID: paymentID, // Reference to payment document _id
              };
              await financialsCol.insertOne(financialsDoc);
            }
          } else {
            // Legacy payment flow (no Connect) - manual calculation
            const commissionRate = 0.1; // 10%
            const commission =
              Math.round(totalAmount * commissionRate * 100) / 100;
            const systemRevenue = commission + urgentFee;
            const handymanRevenue = totalAmount - commission - urgentFee;

            const paymentData = {
              jobId: new ObjectId(jobId),
              handymanId: handymanIdForPayment,
              clientId: clientIdForPayment,
              paymentIntentId: job.paymentIntentId,
              totalAmount: totalAmount,
              spacious_H: handymanRevenue,
              spacious_M: systemRevenue,
              status: "transferred",
              createdAt: new Date(),
              transferredAt: new Date(),
            };

            const insertResult = await paymentsCol.insertOne(paymentData);
            const paymentID = insertResult.insertedId;

            // Update managers_financials
            const financialsCol = getCollectionFinancials();
            const clearingFeeRate = 0.029; // 2.9%
            const clearingFeeFixed = 0.3; // 0.3 ILS
            const clearingFee =
              Math.round(
                (totalAmount * clearingFeeRate + clearingFeeFixed) * 100
              ) / 100;

            const financialsDoc = {
              createdAt: new Date(),
              Revenue: {
                Fees: commission,
                "Urgent call": urgentFee,
              },
              expenses: {
                "clearing fee": clearingFee,
              },
              paymentID: paymentID, // Reference to payment document _id
            };
            await financialsCol.insertOne(financialsDoc);
          }

          // Update job payment status to paid (status remains "done")
          await jobsCol.updateOne(
            { _id: new ObjectId(jobId) },
            {
              $set: {
                paymentStatus: "paid",
                handymanReceivedPayment: true, // Payment was captured and transferred
              },
            }
          );

          // Get handymanId before using it
          let handymanId =
            Array.isArray(job.handymanId) && job.handymanId.length > 0
              ? job.handymanId[0]
              : job.handymanId;

          // Also check for handymanIdSpecial (for personal requests)
          if (!handymanId && job.handymanIdSpecial) {
            handymanId = job.handymanIdSpecial;
          }

          // Emit WebSocket event
          const io = req.app.get("io");
          if (io) {
            // Emit to job room
            io.to(`job-${jobId}`).emit("job-approved", {
              jobId,
              paymentStatus: "paid",
              paymentReleased: true,
            });
            // Also emit to handyman's personal room
            if (handymanId) {
              io.to(`user-${handymanId.toString()}`).emit("job-approved", {
                jobId,
                paymentStatus: "paid",
                paymentReleased: true,
                clientApproved: true,
              });
            }
          }

          // Send push notification to handyman
          if (handymanId) {
            try {
              const handymanObjectId =
                handymanId instanceof ObjectId
                  ? handymanId
                  : new ObjectId(handymanId);
              const handyman = await usersCol.findOne({
                _id: handymanObjectId,
              });

              if (handyman) {
                // Check if handyman needs onboarding
                let needsOnboarding = false;
                let onboardingUrl = null;

                if (handyman.stripeAccountId) {
                  try {
                    const account = await stripe.accounts.retrieve(
                      handyman.stripeAccountId
                    );
                    if (!account.charges_enabled || !account.payouts_enabled) {
                      needsOnboarding = true;
                      // Create onboarding link
                      const returnUrl =
                        process.env.STRIPE_ONBOARDING_RETURN_URL ||
                        `${URL_CLIENT}/stripe/success`;
                      const refreshUrl =
                        process.env.STRIPE_ONBOARDING_REFRESH_URL ||
                        `${URL_CLIENT}/stripe/refresh`;
                      try {
                        onboardingUrl = await createOnboardingLink(
                          handyman.stripeAccountId,
                          returnUrl,
                          refreshUrl
                        );
                      } catch (linkError) {
                        // Silently ignore link error
                      }
                    }
                  } catch (stripeError) {
                    console.error(
                      "[jobs/approve] Error checking Stripe account status:",
                      stripeError
                    );
                    // If we can't check, assume needs onboarding
                    needsOnboarding = true;
                  }
                } else {
                  // No Stripe account - needs onboarding
                  needsOnboarding = true;
                  // Try to create account and get onboarding link
                  try {
                    const accountId = await getOrCreateConnectedAccount(
                      handyman,
                      usersCol
                    );
                    if (accountId) {
                      // Reload handyman to get updated stripeAccountId
                      const updatedHandyman = await usersCol.findOne({
                        _id: handymanObjectId,
                      });
                      if (updatedHandyman?.stripeAccountId) {
                        const returnUrl =
                          process.env.STRIPE_ONBOARDING_RETURN_URL ||
                          `${URL_CLIENT}/stripe/success`;
                        const refreshUrl =
                          process.env.STRIPE_ONBOARDING_REFRESH_URL ||
                          `${URL_CLIENT}/stripe/refresh`;
                        try {
                          onboardingUrl = await createOnboardingLink(
                            updatedHandyman.stripeAccountId,
                            returnUrl,
                            refreshUrl
                          );
                        } catch (linkError) {
                          console.error(
                            "[jobs/approve] Error creating onboarding link:",
                            linkError
                          );
                        }
                      }
                    }
                  } catch (accountError) {
                    console.error(
                      "[jobs/approve] Error creating Stripe account:",
                      accountError
                    );
                  }
                }

                // Send push notification
                if (handyman?.fcmToken) {
                  if (needsOnboarding) {
                    // Send notification about needing onboarding (with or without URL)
                    const message = onboardingUrl
                      ? "הלקוח אישר את סיום העבודה. כדי לקבל את התשלום, עליך להשלים את הגדרת חשבון התשלומים"
                      : "הלקוח אישר את סיום העבודה והתשלום שוחרר. כדי לקבל את הכסף, עליך להגדיר חשבון תשלומים";
                    await sendPushNotification(
                      handyman.fcmToken,
                      "תשלום שוחרר - נדרש הגדרת תשלומים",
                      message,
                      {
                        type: "payment_released_needs_onboarding",
                        jobId: jobId.toString(),
                        onboardingUrl: onboardingUrl,
                      }
                    );
                  } else {
                    // Regular payment released notification
                    await sendPushNotification(
                      handyman.fcmToken,
                      "תשלום שוחרר",
                      "הלקוח אישר את סיום העבודה והתשלום שוחרר לחשבונך",
                      {
                        type: "payment_released",
                        jobId: jobId.toString(),
                      }
                    );
                  }
                }

                // Emit WebSocket event with onboarding info if needed
                const io = req.app.get("io");
                if (io) {
                  if (needsOnboarding) {
                    const userRoom = `user-${handymanId.toString()}`;
                    io.to(userRoom).emit("onboarding-required", {
                      jobId: jobId.toString(),
                      onboardingUrl: onboardingUrl,
                      message:
                        "הלקוח אישר את סיום העבודה. כדי לקבל את התשלום, עליך להשלים את הגדרת חשבון התשלומים",
                      needsOnboarding: true,
                    });
                  }
                }
              }
            } catch (pushError) {
              console.error(
                "Error sending notification to handyman:",
                pushError
              );
              // Don't fail if push notification fails
            }
          }

          return res.json({
            success: true,
            message: "Job approved and payment released successfully",
            paymentStatus: "paid",
            paymentReleased: true,
          });
        } catch (paymentError) {
          console.error(
            `[Payment Error] Failed to process payment in /api/jobs/approve for jobId: ${jobId}:`,
            paymentError
          );
          // Job is already marked as clientApproved, but payment failed
          // Return success but with warning
          return res.status(500).json({
            success: false,
            message: "Job approved but payment release failed. Please retry.",
            error: paymentError.message,
            jobApproved: true,
            paymentReleased: false,
          });
        }
      } else {
        // No payment intent - job approved but no payment to release
        return res.json({
          success: true,
          message: "Job approved (no payment to release)",
          status: "clientApproved",
          paymentReleased: false,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error approving job",
        error: error.message,
      });
    }
  });

  // Price change request endpoint (handyman requests price change)
  app.post("/api/jobs/price-change-request", async (req, res) => {
    try {
      const { jobId, handymanId, newPrice, subcategoryIndex } = req.body;

      if (!jobId || !handymanId || !newPrice) {
        return res.status(400).json({
          success: false,
          message: "jobId, handymanId, and newPrice are required",
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

      // Verify handyman is assigned to this job
      const handymanIdStr = String(handymanId);
      const jobHandymanIds = Array.isArray(job.handymanId)
        ? job.handymanId.map((id) => String(id))
        : [String(job.handymanId)];
      if (!jobHandymanIds.includes(handymanIdStr)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to change price for this job",
        });
      }

      // Determine current price based on subcategoryIndex if provided
      let currentPrice = job.price || 0;
      let subcategoryInfo = null;

      if (
        subcategoryIndex !== undefined &&
        subcategoryIndex !== null &&
        job.subcategoryInfo &&
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > subcategoryIndex
      ) {
        subcategoryInfo = job.subcategoryInfo[subcategoryIndex];
        currentPrice = subcategoryInfo.price || 0;
        if (typeof currentPrice !== "number") {
          currentPrice = parseFloat(currentPrice) || 0;
        }
      }

      // Validate price change (max 20%)
      const priceChange = Math.abs(newPrice - currentPrice);
      const maxChange = currentPrice * 0.2;

      if (priceChange > maxChange) {
        return res.status(400).json({
          success: false,
          message: `שינוי המחיר לא יכול להיות יותר מ-20% (${maxChange.toFixed(
            2
          )} ₪)`,
        });
      }

      // Get handyman name for the request
      const usersCol = getCollection();
      let handymanName = null;
      try {
        const handymanObjectId = new ObjectId(handymanId);
        const handyman = await usersCol.findOne({ _id: handymanObjectId });
        if (handyman) {
          handymanName = handyman.username || handyman.name || "הנדימן";
        }
      } catch (error) {
        // If we can't get handyman name, use default
        handymanName = job.handymanName || "הנדימן";
      }

      // Send WebSocket event to client
      const io = req.app.get("io");
      if (io) {
        const change = newPrice - currentPrice;
        const changePercent = Math.round((change / currentPrice) * 100);
        const priceChangeData = {
          jobId,
          handymanId,
          handymanName: handymanName,
          oldPrice: currentPrice,
          newPrice,
          change,
          changePercent,
        };

        // Add subcategory info if applicable
        if (
          subcategoryInfo &&
          subcategoryIndex !== undefined &&
          subcategoryIndex !== null
        ) {
          priceChangeData.subcategoryIndex = subcategoryIndex;
          priceChangeData.subcategoryInfo = {
            category: subcategoryInfo.category,
            subcategory: subcategoryInfo.subcategory,
            workType: subcategoryInfo.workType,
          };
        }

        io.to(`job-${jobId}`).emit("price-change-request", priceChangeData);
        // Also emit to client's personal room
        if (job.clientId) {
          io.to(`user-${job.clientId.toString()}`).emit(
            "price-change-request",
            priceChangeData
          );
        }
      }

      return res.json({
        success: true,
        message: "Price change request sent to client",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error sending price change request",
        error: error.message,
      });
    }
  });

  // Price change response endpoint (client responds to price change request)
  app.post("/api/jobs/price-change-response", async (req, res) => {
    try {
      const { jobId, clientId, accepted, newPrice } = req.body;

      if (!jobId || !clientId || accepted === undefined) {
        return res.status(400).json({
          success: false,
          message: "jobId, clientId, and accepted are required",
        });
      }

      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Verify client is the owner of this job
      const clientIdStr = String(clientId);
      const jobClientIdStr = String(job.clientId);
      if (jobClientIdStr !== clientIdStr) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to respond to this price change",
        });
      }

      if (accepted) {
        if (!newPrice) {
          return res.status(400).json({
            success: false,
            message: "newPrice is required when accepting price change",
          });
        }

        // Update job price
        await jobsCol.updateOne(
          { _id: new ObjectId(jobId) },
          { $set: { price: newPrice } }
        );

        // Update Payment Intent in Stripe if it exists
        if (job.paymentIntentId) {
          try {
            // First, retrieve the payment intent to check its status
            const paymentIntent = await stripe.paymentIntents.retrieve(
              job.paymentIntentId
            );

            // Only update if payment intent is in a state that allows updates
            // According to Stripe: Can update: requires_payment_method, requires_confirmation, requires_action
            // Cannot update: requires_capture, succeeded, canceled, processing
            const updatableStatuses = [
              "requires_payment_method",
              "requires_confirmation",
              "requires_action",
            ];

            if (updatableStatuses.includes(paymentIntent.status)) {
              const newAmountAgorot = Math.round(newPrice * 100);
              const platformFeeAgorot = Math.round(
                (newAmountAgorot * getPlatformFeePercent()) / 100
              );

              // Update payment intent with new amount
              await stripe.paymentIntents.update(job.paymentIntentId, {
                amount: newAmountAgorot,
                application_fee_amount: platformFeeAgorot,
              });

              // Also update payment record in database
              const paymentsCol = getCollectionPayments();
              const existingPayment = await paymentsCol.findOne({
                paymentIntentId: job.paymentIntentId,
              });
              const originalPrice =
                existingPayment?.originalPrice ||
                existingPayment?.totalAmount ||
                job.price ||
                newPrice;
              const priceChangePercent =
                Math.round(
                  ((newPrice - originalPrice) / originalPrice) * 100 * 100
                ) / 100;

              await paymentsCol.updateOne(
                { paymentIntentId: job.paymentIntentId },
                {
                  $set: {
                    amount: newPrice,
                    totalAmount: newPrice,
                    originalPrice: originalPrice,
                    priceChangePercent: priceChangePercent,
                    updatedAt: new Date(),
                  },
                }
              );
            } else if (paymentIntent.status === "requires_capture") {
              // Payment intent is already confirmed but not captured
              // We can't update the amount in Stripe, so we need to:
              // 1. Cancel the old payment intent
              // 2. Create a new payment intent with the new price
              // 3. Update the job and payment records

              const oldPaymentIntentId = job.paymentIntentId;
              const oldPrice = paymentIntent.amount / 100;

              // Get handyman account ID from payment intent
              const handymanAccountId =
                paymentIntent.transfer_data?.destination;

              if (!handymanAccountId) {
                console.error(
                  `Cannot recreate payment intent: no handyman account ID found`
                );
                // Fallback: just update DB
                const paymentsColForCapture = getCollectionPayments();
                const existingPaymentForCapture =
                  await paymentsColForCapture.findOne({
                    paymentIntentId: oldPaymentIntentId,
                  });
                const originalPriceForCapture =
                  existingPaymentForCapture?.originalPrice || oldPrice;
                const priceChangePercentForCapture =
                  Math.round(
                    ((newPrice - originalPriceForCapture) /
                      originalPriceForCapture) *
                      100 *
                      100
                  ) / 100;

                await paymentsCol.updateOne(
                  { paymentIntentId: oldPaymentIntentId },
                  {
                    $set: {
                      amount: newPrice,
                      totalAmount: newPrice,
                      originalPrice: originalPrice,
                      priceChangePercent: priceChangePercent,
                      updatedAt: new Date(),
                    },
                  }
                );
              } else {
                // Cancel the old payment intent
                try {
                  await cancelEscrow(oldPaymentIntentId);
                } catch (cancelError) {
                  console.error(
                    `Error cancelling old payment intent:`,
                    cancelError.message
                  );
                  // Continue anyway - try to create new one
                }

                // Create new payment intent with new price
                const newAmountAgorot = Math.round(newPrice * 100);
                const platformFeeAgorot = Math.round(
                  (newAmountAgorot * getPlatformFeePercent()) / 100
                );

                try {
                  const newPaymentIntent = await createEscrowPaymentIntent({
                    amountAgorot: newAmountAgorot,
                    currency: "ils",
                    handymanAccountId: handymanAccountId,
                    platformFeeAgorot: platformFeeAgorot,
                    metadata: {
                      jobId: jobId,
                      clientId: job.clientId?.toString() || "",
                      handymanId:
                        job.handymanId?.toString() ||
                        (Array.isArray(job.handymanId) &&
                          job.handymanId[0]?.toString()) ||
                        "",
                    },
                  });

                  // Update job with new payment intent ID
                  await jobsCol.updateOne(
                    { _id: new ObjectId(jobId) },
                    {
                      $set: {
                        paymentIntentId: newPaymentIntent.paymentIntentId,
                        updatedAt: new Date(),
                      },
                    }
                  );

                  // Update payment record with new payment intent
                  const paymentsColForNewIntent = getCollectionPayments();
                  const existingPaymentForNewIntent =
                    await paymentsColForNewIntent.findOne({
                      paymentIntentId: oldPaymentIntentId,
                    });
                  const originalPriceForNewIntent =
                    existingPaymentForNewIntent?.originalPrice || oldPrice;
                  const priceChangePercentForNewIntent =
                    Math.round(
                      ((newPrice - originalPriceForNewIntent) /
                        originalPriceForNewIntent) *
                        100 *
                        100
                    ) / 100;

                  await paymentsColForNewIntent.updateOne(
                    { paymentIntentId: oldPaymentIntentId },
                    {
                      $set: {
                        paymentIntentId: newPaymentIntent.paymentIntentId,
                        amount: newPrice,
                        totalAmount: newPrice,
                        originalPrice: originalPriceForNewIntent,
                        priceChangePercent: priceChangePercentForNewIntent,
                        status: newPaymentIntent.status,
                        updatedAt: new Date(),
                      },
                    }
                  );

                  // If there's a saved payment method, attach it to the new payment intent
                  if (job.paymentMethodId) {
                    try {
                      // Get customer ID
                      const client = await usersCol.findOne({
                        _id: new ObjectId(job.clientId),
                      });
                      let customerId = client?.stripeCustomerId;

                      if (!customerId && client?.email) {
                        const customer = await stripe.customers.create({
                          email: client.email,
                          metadata: {
                            userId: job.clientId?.toString() || "",
                          },
                        });
                        customerId = customer.id;
                        await usersCol.updateOne(
                          { _id: new ObjectId(job.clientId) },
                          { $set: { stripeCustomerId: customerId } }
                        );
                      }

                      if (customerId) {
                        // Attach payment method to customer if needed
                        try {
                          await stripe.paymentMethods.attach(
                            job.paymentMethodId,
                            { customer: customerId }
                          );
                        } catch (attachError) {
                          // Might already be attached, continue
                        }

                        // Update new payment intent with customer and payment method
                        await stripe.paymentIntents.update(
                          newPaymentIntent.paymentIntentId,
                          {
                            customer: customerId,
                            payment_method: job.paymentMethodId,
                          }
                        );

                        // Confirm the new payment intent
                        await stripe.paymentIntents.confirm(
                          newPaymentIntent.paymentIntentId
                        );
                      }
                    } catch (confirmError) {
                      console.error(
                        `Error confirming new payment intent:`,
                        confirmError.message
                      );
                      // Continue - payment intent is created, can be confirmed later
                    }
                  }
                } catch (createError) {
                  console.error(
                    `Error creating new payment intent:`,
                    createError.message
                  );
                  // Fallback: just update DB
                  const paymentsCol = getCollectionPayments();
                  await paymentsCol.updateOne(
                    { paymentIntentId: oldPaymentIntentId },
                    {
                      $set: {
                        amount: newPrice,
                        totalAmount: newPrice,
                        updatedAt: new Date(),
                      },
                    }
                  );
                }
              }
            } else {
              console.warn(
                `Cannot update payment intent ${job.paymentIntentId}: status is ${paymentIntent.status}. Only updating DB.`
              );

              // Still update payment record in database even if we can't update Stripe
              const paymentsCol = getCollectionPayments();
              await paymentsCol.updateOne(
                { paymentIntentId: job.paymentIntentId },
                {
                  $set: {
                    amount: newPrice,
                    totalAmount: newPrice,
                    updatedAt: new Date(),
                  },
                }
              );
            }
          } catch (stripeError) {
            console.error(
              "Error updating payment intent:",
              stripeError.message
            );
            // Log error but don't fail the request
          }
        }

        // Send WebSocket event to handyman
        const io = req.app.get("io");
        if (io) {
          const handymanId =
            Array.isArray(job.handymanId) && job.handymanId.length > 0
              ? job.handymanId[0]
              : job.handymanId;
          if (handymanId) {
            io.to(`job-${jobId}`).emit("price-change-response", {
              jobId,
              accepted: true,
              newPrice,
            });
            io.to(`user-${handymanId.toString()}`).emit(
              "price-change-response",
              {
                jobId,
                accepted: true,
                newPrice,
              }
            );
          }
        }

        return res.json({
          success: true,
          message: "Price change accepted and updated",
          newPrice,
        });
      } else {
        // Rejected - just notify handyman
        const io = req.app.get("io");
        if (io) {
          const handymanId =
            Array.isArray(job.handymanId) && job.handymanId.length > 0
              ? job.handymanId[0]
              : job.handymanId;
          if (handymanId) {
            io.to(`job-${jobId}`).emit("price-change-response", {
              jobId,
              accepted: false,
            });
            io.to(`user-${handymanId.toString()}`).emit(
              "price-change-response",
              {
                jobId,
                accepted: false,
              }
            );
          }
        }

        return res.json({
          success: true,
          message: "Price change rejected",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error processing price change response",
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
      console.log("🔵 [jobs/rate] Fetching job from database");
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        console.log("❌ [jobs/rate] Job not found:", jobId);
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      console.log("🔵 [jobs/rate] Job found, splitCallId:", job.splitCallId);

      // Note: Each job in a split call is independent
      // Client can rate each handyman separately when their job is done
      // No need to wait for all jobs to complete

      const finalCustomerId =
        customerId || job.clientId?.toString() || job.clientId;
      const finalHandymanId = handymanId?.toString() || handymanId;

      console.log("🔵 [jobs/rate] Saving rating to database");
      // Save rating to collectionRatings
      await ratingsCol.insertOne({
        handymanId: finalHandymanId,
        customerId: finalCustomerId,
        jobId: new ObjectId(jobId),
        rating: parseInt(rating),
        review: review || "",
        createdAt: new Date(),
      });
      console.log("✅ [jobs/rate] Rating saved to database");

      // Update job with ratingSubmitted flag
      console.log("🔵 [jobs/rate] Updating job with ratingSubmitted flag");
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            ratingSubmitted: true,
          },
        }
      );
      console.log("✅ [jobs/rate] Job updated with ratingSubmitted flag");

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
      }

      // Transfer payment to handyman after rating is submitted
      // NOTE: Payment should only be transferred if:
      // 1. Job status is "done" and clientApproved is true (new flow)
      // 2. OR payment is already in requires_capture or succeeded state
      // This endpoint should NOT be called automatically - payment is handled by /api/jobs/approve
      try {
        // Check if job has paymentIntentId and is ready for transfer
        if (job.paymentIntentId) {
          // Check payment status first before attempting transfer
          try {
            const paymentIntent = await getPaymentIntent(job.paymentIntentId);

            // Only attempt transfer if payment is ready (requires_capture or succeeded)
            // AND job is approved by client (new flow) or already done (legacy)
            const isReadyForTransfer =
              (paymentIntent.status === "requires_capture" ||
                paymentIntent.status === "succeeded") &&
              (job.clientApproved === true ||
                job.status === "done" ||
                job.paymentStatus === "paid");

            if (!isReadyForTransfer) {
              // Don't attempt transfer - payment not ready or not approved
              console.log(
                "🔵 [jobs/rate] Payment not ready for transfer, skipping"
              );
              // Don't return here - continue to send response
            } else {
              console.log("🔵 [jobs/rate] Attempting payment transfer");
              // Call payment transfer endpoint internally
              const transferResponse = await axios
                .post(
                  `${req.protocol}://${req.get("host")}/payment/transfer`,
                  { jobId: jobId },
                  {
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                )
                .catch((err) => {
                  return { data: { success: false } };
                });

              if (!transferResponse.data.success) {
                console.error(
                  "Error transferring payment:",
                  transferResponse.data.message
                );
              } else {
                console.log("✅ [jobs/rate] Payment transfer successful");
              }
            }
          } catch (paymentCheckError) {
            console.error(
              "Error checking payment status before transfer:",
              paymentCheckError.message
            );
            // Don't attempt transfer if we can't check payment status
          }
        }
      } catch (paymentError) {
        // Don't fail the rating request if payment transfer fails
      }

      console.log("🔵 [jobs/rate] Calculating average rating for handyman");
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
          } catch (directError) {}
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
        console.error(
          "⚠️ [jobs/rate] Error calculating average rating:",
          ratingError.message
        );
      }

      console.log("✅ [jobs/rate] Sending success response");
      return res.json({ success: true });
    } catch (error) {
      console.error("❌ [jobs/rate] Error in rating endpoint:", error);
      console.error("❌ [jobs/rate] Error stack:", error.stack);
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
      const paymentsCol = getCollectionPayments();
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

      // Get payments for this handyman to calculate earnings
      const payments = await paymentsCol
        .find({
          handymanId: handymanId,
          status: "transferred",
        })
        .toArray();

      // Create a map of jobId -> payment for quick lookup
      const paymentMap = new Map();
      payments.forEach((payment) => {
        const jobIdStr = payment.jobId?.toString();
        if (jobIdStr) {
          paymentMap.set(jobIdStr, payment);
        }
      });

      // Calculate earnings from payments
      let totalEarnings = 0;
      let monthlyEarnings = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      payments.forEach((payment) => {
        const earned = payment.spacious_H || 0;
        totalEarnings += earned;
        if (
          payment.transferredAt &&
          new Date(payment.transferredAt) >= startOfMonth
        ) {
          monthlyEarnings += earned;
        }
      });

      // Get jobs for ratings details
      const jobIds = ratings.map((r) => r.jobId);
      const jobs = await jobsCol.find({ _id: { $in: jobIds } }).toArray();

      const ratingsWithDetails = await Promise.all(
        ratings.map(async (rating) => {
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
          const job = jobs.find(
            (j) => j._id.toString() === rating.jobId.toString()
          );
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
      console.error(
        `[Error] Failed to fetch handyman ratings for handymanId: ${req.params.handymanId}:`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
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

      const paymentsCol = getCollectionPayments();

      // Get all payments for this handyman
      const payments = await paymentsCol
        .find({
          handymanId: handymanId,
          status: "transferred",
        })
        .sort({ transferredAt: -1 })
        .toArray();

      if (payments.length === 0) {
        return res.json({
          success: true,
          chartData: [],
        });
      }

      // Group by date and calculate earnings
      const earningsMap = new Map();

      payments.forEach((payment) => {
        const earned = payment.spacious_H || 0;
        if (earned === 0) return;

        const date = new Date(payment.transferredAt || payment.createdAt);
        if (isNaN(date.getTime())) return; // Skip invalid dates

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

חשוב מאוד - קריטי:
- אתה חייב לבחור תת-קטגוריה מהרשימה לעיל - אסור להחזיר רק את שם הקטגוריה
- ענה רק בשם התת-קטגוריה הכי מתאימה מהרשימה לעיל, ללא מספרים או תווים נוספים
- אסור להמציא תת-קטגוריות שלא קיימות ברשימה
- אסור להחזיר את שם הקטגוריה "${matchedCategory}" - חייב להיות תת-קטגוריה מהרשימה
- אם אין התאמה טובה, בחר את הכי קרוב מהרשימה
- אם אין התאמה בכלל, בחר את הכי קרוב מהרשימה (אל תמציא)
- אם אין תת-קטגוריה מתאימה, בחר את הראשונה מהרשימה`;

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

                  // Validate that the matched subcategory is actually a subcategory, not the category name
                  if (
                    matchedSubcategory &&
                    matchedSubcategory === matchedCategory
                  ) {
                    // If AI returned category name instead of subcategory, try to get first subcategory
                    if (subcategoryNames.length > 0) {
                      matchedSubcategory = subcategoryNames[0];
                    } else {
                      matchedSubcategory = null;
                    }
                  }

                  // Validate that matchedSubcategory exists in the subcategoryNames list
                  if (
                    matchedSubcategory &&
                    !subcategoryNames.includes(matchedSubcategory)
                  ) {
                    // Try to find closest match (case-insensitive)
                    const closestMatch = subcategoryNames.find(
                      (sub) =>
                        sub.toLowerCase() === matchedSubcategory.toLowerCase()
                    );
                    if (closestMatch) {
                      matchedSubcategory = closestMatch;
                    } else {
                      // If no match found, use first subcategory as fallback
                      matchedSubcategory =
                        subcategoryNames.length > 0
                          ? subcategoryNames[0]
                          : null;
                    }
                  }
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
          // If no subcategory found, skip this match - we require subcategory
          // Don't add to subcategoryInfoArray if there's no valid subcategory
          continue;
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

  // Reverse geocoding endpoint - convert coordinates to address
  app.get("/reverse-geocode", async (req, res) => {
    console.log("🚀 [/reverse-geocode] Endpoint called with query:", req.query);
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "נדרש לספק lat ו-lng",
        });
      }

      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        return res.status(400).json({
          success: false,
          message: "קואורדינטות לא תקינות",
        });
      }

      // Use Google Maps Geocoding API for reverse geocoding
      if (process.env.GOOGLE_MAPS_API_KEY) {
        try {
          const reverseGeocodeResult = await reverseGeocodeCoordinates(
            parsedLat,
            parsedLng
          );

          if (
            reverseGeocodeResult &&
            reverseGeocodeResult.results &&
            reverseGeocodeResult.results.length > 0
          ) {
            const result = reverseGeocodeResult.results[0];
            const addressComponents = result.address_components || [];

            // Extract city name from address components
            let cityName = null;
            for (const component of addressComponents) {
              if (
                component.types.includes("locality") ||
                component.types.includes("administrative_area_level_2")
              ) {
                cityName = component.long_name;
                break;
              }
            }

            // If no city found, try other address components
            if (!cityName) {
              for (const component of addressComponents) {
                if (
                  component.types.includes("administrative_area_level_3") ||
                  component.types.includes("sublocality")
                ) {
                  cityName = component.long_name;
                  break;
                }
              }
            }

            return res.json({
              success: true,
              address: result.formatted_address || "מיקום שנבחר במפה",
              city: cityName || null,
              fullAddress: result.formatted_address || null,
            });
          }
        } catch (googleError) {
          // Fall through to fallback
        }
      }

      // Fallback: return coordinates if geocoding fails
      return res.json({
        success: true,
        address: "מיקום שנבחר במפה",
        city: null,
        fullAddress: null,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "שגיאה בקבלת כתובת",
        error: error.message,
      });
    }
  });

  app.post("/create-call-v2", async (req, res) => {
    console.log("🚀 [create-call-v2] Endpoint called");
    console.log(
      "📦 [create-call-v2] Request body keys:",
      Object.keys(req.body)
    );
    try {
      const collection = getCollection();
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

      // Get paymentMethodId from request (created by client with Stripe.js)
      const { paymentMethodId } = req.body;

      // Get userId from request
      const { userId } = req.body;

      // Get coordinates from location
      let userLng = null;
      let userLat = null;
      let resolvedLocationText = null; // Will store the address from geocoding
      const {
        usingMyLocation,
        coordinates,
        locationEnglishName,
        selectedCity,
        location,
      } = req.body;

      console.log("🔍 [create-call-v2] Location data from request:", {
        usingMyLocation,
        coordinates,
        locationEnglishName,
        selectedCity,
        location,
      });

      // Priority 1: If coordinates are sent directly (from map click or my location)
      if (
        coordinates &&
        (coordinates.lng !== undefined || coordinates.lon !== undefined) &&
        coordinates.lat !== undefined
      ) {
        console.log(
          "📍 [create-call-v2] Using direct coordinates from request"
        );
        const rawLng =
          coordinates.lng !== undefined ? coordinates.lng : coordinates.lon;
        const parsedLng = parseFloat(rawLng);
        const parsedLat = parseFloat(coordinates.lat);
        if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
          userLng = parsedLng;
          userLat = parsedLat;
          console.log("✅ [create-call-v2] Direct coordinates set:", {
            lng: userLng,
            lat: userLat,
          });

          // Get address name from coordinates using reverse geocoding
          try {
            console.log(
              "🔄 [create-call-v2] Getting address name from coordinates..."
            );
            const reverseGeocodeResult = await reverseGeocodeCoordinates(
              parsedLat,
              parsedLng
            );
            if (
              reverseGeocodeResult &&
              reverseGeocodeResult.formatted_address
            ) {
              // Remove Plus Code (e.g., "9HXM+88") from address
              let cleanedAddress = reverseGeocodeResult.formatted_address;
              // Remove Plus Code pattern: letters/numbers followed by + followed by numbers/letters
              cleanedAddress = cleanedAddress
                .replace(/\s*[A-Z0-9]+\+[A-Z0-9]+\s*/g, "")
                .trim();
              resolvedLocationText = cleanedAddress;
              console.log("📍 [create-call-v2] Address from coordinates:");
              console.log("   📍 Address:", cleanedAddress);
              console.log("   📍 Coordinates:", {
                lat: parsedLat,
                lng: parsedLng,
              });
            } else {
              console.log(
                "⚠️ [create-call-v2] Could not get address from coordinates"
              );
            }
          } catch (error) {
            console.error(
              "❌ [create-call-v2] Error in reverse geocoding:",
              error.message
            );
          }
        }
      } else if (usingMyLocation && coordinates) {
        console.log("📍 [create-call-v2] Using 'My Location' coordinates");
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
        // Find coordinates via Google Maps Geocoding API
        console.log("🔍 [create-call-v2] Starting geocoding for location:", {
          locationEnglishName,
          selectedCity,
          location,
        });

        const addressToSearch = locationEnglishName || selectedCity || location;

        const searchAddress = async (addr) => {
          console.log(
            "🔍 [create-call-v2 searchAddress] Called with address:",
            addr
          );
          const cleaned = addr.trim();
          if (!cleaned) {
            console.log("🔍 [create-call-v2 searchAddress] Address is empty");
            return null;
          }
          console.log(
            "🔍 [create-call-v2 searchAddress] Calling geocodeAddress with:",
            cleaned
          );
          try {
            const geocodeResult = await geocodeAddress(cleaned);
            if (geocodeResult) {
              console.log(
                "✅ [create-call-v2 searchAddress] Geocoding success!"
              );
              console.log("   📍 Address:", geocodeResult.formatted_address);
              console.log("   📍 Coordinates:", {
                lat: geocodeResult.lat,
                lng: geocodeResult.lng,
              });
              return {
                lng: geocodeResult.lng,
                lat: geocodeResult.lat,
                formatted_address: geocodeResult.formatted_address,
              };
            } else {
              console.log(
                "⚠️ [create-call-v2 searchAddress] Geocoding returned no results"
              );
            }
          } catch (error) {
            console.error(
              "❌ [create-call-v2 searchAddress] Error geocoding:",
              error.message
            );
          }
          return null;
        };

        console.log(
          "🔍 [create-call-v2] Calling searchAddress with:",
          addressToSearch
        );
        const coords = await searchAddress(addressToSearch);
        if (coords) {
          userLng = coords.lng;
          userLat = coords.lat;
          if (coords.formatted_address) {
            // Remove Plus Code (e.g., "9HXM+88") from address
            let cleanedAddress = coords.formatted_address;
            // Remove Plus Code pattern: letters/numbers followed by + followed by numbers/letters
            cleanedAddress = cleanedAddress
              .replace(/\s*[A-Z0-9]+\+[A-Z0-9]+\s*/g, "")
              .trim();
            resolvedLocationText = cleanedAddress;
            console.log("📍 [create-call-v2] Final geocoding result:");
            console.log("   📍 Address:", cleanedAddress);
            console.log("   📍 Coordinates:", {
              lat: coords.lat,
              lng: coords.lng,
            });
          }
        } else {
          console.log("⚠️ [create-call-v2] No coordinates found for address");
        }
      }

      if (!userLng || !userLat) {
        return res.status(400).json({
          success: false,
          message: "לא ניתן למצוא את המיקום. אנא בחר מיקום תקין.",
        });
      }

      console.log(
        "📍 [create-call-v2] Final locationText to save:",
        resolvedLocationText || location || "מיקום"
      );

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

      // Get blocked handymen list from client
      let blockedHandymanIds = [];
      if (userId) {
        try {
          const clientObjectId = new ObjectId(userId);
          const client = await collection.findOne({ _id: clientObjectId });
          if (client && Array.isArray(client["handiman-Blocked"])) {
            blockedHandymanIds = client["handiman-Blocked"].map((id) =>
              String(id)
            );
          }
        } catch (error) {
          // Continue even if client fetch fails
        }
      }

      // Find handymen who match ALL subcategories (excluding blocked handymen)
      const handymenMatchingAll = allHandymenInArea.filter((handyman) => {
        // Skip blocked handymen
        const handymanIdStr = String(handyman._id);
        if (blockedHandymanIds.includes(handymanIdStr)) {
          return false;
        }

        return subcategoryInfoArray.every((subcatInfo) => {
          return handymanHasSpecialty(
            handyman,
            subcatInfo.category,
            subcatInfo.subcategory
          );
        });
      });

      // Find handymen who match SOME subcategories (for partial matches) (excluding blocked)
      const handymenMatchingSome = allHandymenInArea.filter((handyman) => {
        // Skip blocked handymen
        const handymanIdStr = String(handyman._id);
        if (blockedHandymanIds.includes(handymanIdStr)) {
          return false;
        }

        const matchingCount = subcategoryInfoArray.filter((subcatInfo) => {
          return handymanHasSpecialty(
            handyman,
            subcatInfo.category,
            subcatInfo.subcategory
          );
        }).length;
        return matchingCount > 0 && matchingCount < subcategoryInfoArray.length;
      });

      // Find handymen who match at least one subcategory (for split option) (excluding blocked)
      const handymenMatchingAtLeastOne = allHandymenInArea.filter(
        (handyman) => {
          // Skip blocked handymen
          const handymanIdStr = String(handyman._id);
          if (blockedHandymanIds.includes(handymanIdStr)) {
            return false;
          }

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
        // Get client info (userId already defined above)
        const { desc, workType, when, urgent, imageUrls, imageUrl, location } =
          req.body;
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
        let handimanBlocked = []; // Get blocked handymen list from client
        if (userId) {
          try {
            const clientObjectId = new ObjectId(userId);
            const client = await collection.findOne({ _id: clientObjectId });
            if (client) {
              clientName = client.username || null;
              // Copy handiman-Blocked array from client to job
              handimanBlocked = Array.isArray(client["handiman-Blocked"])
                ? client["handiman-Blocked"].map((id) => {
                    if (id instanceof ObjectId) {
                      return id;
                    } else if (typeof id === "string") {
                      try {
                        return new ObjectId(id);
                      } catch (e) {
                        return id; // Return as-is if conversion fails
                      }
                    }
                    return id;
                  })
                : [];
            }
          } catch (error) {
            // Client fetch failed, continue without clientName
          }
        }
        // Ensure handimanBlocked is always an array (even if empty)
        if (!Array.isArray(handimanBlocked)) {
          handimanBlocked = [];
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
          locationText: resolvedLocationText || location || "מיקום",
          imageUrl: imageUrlArray, // Array of image URLs
          when: when || "asap",
          urgent: urgent || false,
          status: "open",
          paymentIntentId: req.body.paymentIntentId || null, // Stripe Payment Intent ID
          paymentMethodId: paymentMethodId || null, // Stripe Payment Method ID (token, not card details)
          "handiman-Blocked": handimanBlocked, // Copy blocked handymen from client
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

        // If paymentMethodId is provided, attach it to customer immediately
        // This ensures the payment method is saved in Stripe and can be reused
        if (paymentMethodId && userId) {
          try {
            // Get or create Stripe Customer for the user

            const client = await collection.findOne({
              _id: new ObjectId(userId),
            });
            let customerId = client?.stripeCustomerId;

            if (!customerId) {
              // Create new customer

              const customer = await stripe.customers.create({
                email: client?.email || undefined,
                metadata: {
                  userId: userId.toString(),
                },
              });
              customerId = customer.id;

              // Save customer ID to user
              await collection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { stripeCustomerId: customerId } }
              );
            } else {
            }

            // Verify payment method exists
            const paymentMethod = await stripe.paymentMethods.retrieve(
              paymentMethodId
            );

            // Attach payment method to customer if not already attached
            if (
              !paymentMethod.customer ||
              paymentMethod.customer !== customerId
            ) {
              try {
                await stripe.paymentMethods.attach(paymentMethodId, {
                  customer: customerId,
                });

                // Save payment method ID and customer ID to user
                await collection.updateOne(
                  { _id: new ObjectId(userId) },
                  {
                    $set: {
                      paymentMethodId: paymentMethodId,
                      stripeCustomerId: customerId,
                    },
                  }
                );
              } catch (attachError) {
                // If the payment method was previously used without customer attachment,
                // we can't reuse it. Log error but continue (user will need to add new payment method later)
                if (
                  attachError.message &&
                  attachError.message.includes(
                    "previously used without being attached"
                  )
                ) {
                } else {
                  // Other attach errors, log but continue
                }
              }
            } else {
              // Save payment method ID and customer ID to user even if already attached
              const updateResult = await collection.updateOne(
                { _id: new ObjectId(userId) },
                {
                  $set: {
                    paymentMethodId: paymentMethodId,
                    stripeCustomerId: customerId,
                  },
                }
              );
            }
          } catch (error) {
            // Error attaching payment method, log but continue (job will be created anyway)
          }
        }

        const jobsCollection = getCollectionJobs();
        const result = await jobsCollection.insertOne(jobData);
        const savedJobId = result.insertedId;

        // Update Payment Intent metadata with actual jobId if paymentIntentId exists
        // NOTE: Payment Intent is now created AFTER job creation, so this might not exist
        if (jobData.paymentIntentId) {
          try {
            const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
            await stripe.paymentIntents.update(jobData.paymentIntentId, {
              metadata: {
                jobId: savedJobId.toString(),
                clientId: userId || "",
                urgent: urgent ? "true" : "false",
              },
            });
          } catch (updateError) {
            // Don't fail the request if metadata update fails
          }
        }

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

        // Update user's Ordered count (+1)
        if (userId) {
          try {
            const clientObjectId = new ObjectId(userId);
            await collection.updateOne(
              { _id: clientObjectId },
              { $inc: { Ordered: 1 } }
            );
          } catch (error) {
            // Silent fail - Ordered update is not critical
            console.error("Error updating Ordered count:", error);
          }
        }

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
      console.log("🔧 [split-call-v2] Received split call request");

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

      console.log("🔧 [split-call-v2] Request data:", {
        userId,
        handymenCount: handymen?.length || 0,
        matchedSubcategoriesCount: matchedSubcategories?.length || 0,
        hasCoordinates: !!(coordinates?.lng && coordinates?.lat),
        coordinates: coordinates,
        usingMyLocation: usingMyLocation,
        location: location || locationEnglishName || selectedCity,
        locationEnglishName: locationEnglishName,
        selectedCity: selectedCity,
      });

      if (!handymen || !Array.isArray(handymen) || handymen.length === 0) {
        console.error("❌ [split-call-v2] No handymen provided");
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
        console.error("❌ [split-call-v2] No matched subcategories provided");
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

      console.log("🔍 [split-call-v2] Checking location data:", {
        hasCoordinates: !!(
          coordinates &&
          (coordinates.lng !== undefined || coordinates.lon !== undefined) &&
          coordinates.lat !== undefined
        ),
        usingMyLocation: usingMyLocation,
        locationEnglishName,
        selectedCity,
        location,
      });

      if (
        coordinates &&
        (coordinates.lng !== undefined || coordinates.lon !== undefined) &&
        coordinates.lat !== undefined
      ) {
        console.log(
          "📍 [split-call-v2] Using direct coordinates:",
          coordinates
        );
        const rawLng =
          coordinates.lng !== undefined ? coordinates.lng : coordinates.lon;
        const parsedLng = parseFloat(rawLng);
        const parsedLat = parseFloat(coordinates.lat);
        if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
          userLng = parsedLng;
          userLat = parsedLat;
          console.log("✅ [split-call-v2] Coordinates set:", {
            lng: userLng,
            lat: userLat,
          });
        }
      } else if (usingMyLocation && coordinates) {
        console.log(
          "📍 [split-call-v2] Using 'My Location' coordinates:",
          coordinates
        );
        // Use coordinates from "My Location"
        const rawLng =
          coordinates.lng !== undefined ? coordinates.lng : coordinates.lon;
        const parsedLng = parseFloat(rawLng);
        const parsedLat = parseFloat(coordinates.lat);
        console.log("🔧 [split-call-v2] Parsed coordinates:", {
          rawLng,
          parsedLng,
          parsedLat,
          isFiniteLng: Number.isFinite(parsedLng),
          isFiniteLat: Number.isFinite(parsedLat),
        });
        if (Number.isFinite(parsedLng) && Number.isFinite(parsedLat)) {
          userLng = parsedLng;
          userLat = parsedLat;
          console.log("✅ [split-call-v2] My Location coordinates set:", {
            lng: userLng,
            lat: userLat,
          });
        } else {
          console.error("❌ [split-call-v2] Failed to parse coordinates:", {
            rawLng,
            parsedLng,
            parsedLat,
            coordinates,
          });
        }
      } else if (locationEnglishName || selectedCity || location) {
        // Find coordinates via Google Maps Geocoding API
        console.log("🔍 [split-call-v2] Starting geocoding for location:", {
          locationEnglishName,
          selectedCity,
          location,
        });

        const addressToSearch = locationEnglishName || selectedCity || location;
        const searchAddress = async (addr) => {
          const cleaned = addr.trim();
          if (!cleaned) {
            console.log("⚠️ [split-call-v2] Address is empty");
            return null;
          }
          try {
            const geocodeResult = await geocodeAddress(cleaned);
            if (geocodeResult) {
              console.log("✅ [split-call-v2] Geocoding success:", {
                address: geocodeResult.formatted_address,
                lat: geocodeResult.lat,
                lng: geocodeResult.lng,
              });
              return {
                lng: geocodeResult.lng,
                lat: geocodeResult.lat,
                formatted_address: geocodeResult.formatted_address,
              };
            } else {
              console.log("⚠️ [split-call-v2] Geocoding returned no results");
            }
          } catch (error) {
            console.error("❌ [split-call-v2] Error geocoding:", error.message);
          }
          return null;
        };

        const coords = await searchAddress(addressToSearch);
        if (coords) {
          userLng = coords.lng;
          userLat = coords.lat;
          console.log("✅ [split-call-v2] Final coordinates:", {
            lng: userLng,
            lat: userLat,
          });
        } else {
          console.log("⚠️ [split-call-v2] No coordinates found for address");
        }
      }

      if (!userLng || !userLat) {
        console.error("❌ [split-call-v2] Missing coordinates:", {
          userLng,
          userLat,
        });
        return res.status(400).json({
          success: false,
          message: "לא ניתן למצוא את המיקום. אנא בחר מיקום תקין.",
        });
      }

      console.log("✅ [split-call-v2] Location resolved:", {
        userLng,
        userLat,
      });

      // Get client name and blocked handymen list
      let clientName = null;
      let handimanBlocked = []; // Get blocked handymen list from client
      if (userId) {
        try {
          const clientObjectId = new ObjectId(userId);
          const client = await collection.findOne({ _id: clientObjectId });
          if (client) {
            clientName = client.username || null;
            // Copy handiman-Blocked array from client to job
            handimanBlocked = Array.isArray(client["handiman-Blocked"])
              ? client["handiman-Blocked"].map((id) => {
                  if (id instanceof ObjectId) {
                    return id;
                  } else if (typeof id === "string") {
                    try {
                      return new ObjectId(id);
                    } catch (e) {
                      return id; // Return as-is if conversion fails
                    }
                  }
                  return id;
                })
              : [];
          }
        } catch (error) {
          // Client fetch failed, continue without clientName
        }
      }
      // Ensure handimanBlocked is always an array (even if empty)
      if (!Array.isArray(handimanBlocked)) {
        handimanBlocked = [];
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
      console.log(
        "🔍 [split-call-v2] Processing handymen and subcategories..."
      );
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
          console.error(
            "❌ [split-call-v2] Error fetching handyman:",
            error.message
          );
          continue;
        }

        if (!handyman || !handyman.specialties) {
          console.log(
            "⚠️ [split-call-v2] Handyman not found or has no specialties:",
            handymanData._id || handymanData.id
          );
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
          console.log(
            `✅ [split-call-v2] Handyman ${
              handyman.username || handyman._id
            } matches ${matchingSubcategories.length} subcategories`
          );
          handymenWithMatches.push({
            handyman: handyman,
            matchingSubcategories: matchingSubcategories,
          });
        } else {
          console.log(
            `⚠️ [split-call-v2] Handyman ${
              handyman.username || handyman._id
            } matches no subcategories`
          );
        }
      }

      console.log(
        `🔍 [split-call-v2] Found ${handymenWithMatches.length} handymen with matches out of ${handymen.length} total`
      );

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

      console.log(
        `🔍 [split-call-v2] Creating ${subcategoryGroups.size} jobs for ${subcategoryGroups.size} unique subcategory groups`
      );

      // Generate a unique splitCallId for this split call
      const splitCallId = new ObjectId().toString();

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
          "handiman-Blocked": handimanBlocked, // Copy blocked handymen from client
          splitCallId: splitCallId, // Link all jobs from the same split call
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

        console.log(
          `🔧 [split-call-v2] Creating job for subcategories:`,
          subcategoryGroup.map((s) => s.subcategory || s.category).join(", ")
        );
        const result = await jobsCollection.insertOne(jobData);
        console.log(
          `✅ [split-call-v2] Job created with ID: ${result.insertedId}`
        );

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
        }
      }

      console.log(
        `✅ [split-call-v2] Successfully created ${createdJobs.length} jobs`
      );
      return res.json({
        success: true,
        message: `נוצרו ${createdJobs.length} עבודות בהצלחה`,
        jobs: createdJobs,
      });
    } catch (error) {
      console.error("❌ [split-call-v2] Error splitting call:", error);
      console.error("❌ [split-call-v2] Error stack:", error.stack);
      return res.status(500).json({
        success: false,
        message: "שגיאה בפיצול הקריאה",
        error: error.message,
      });
    }
  });

  // Get related jobs for a split call
  app.get("/api/jobs/:jobId/related", async (req, res) => {
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

      // If this job has a splitCallId, get all related jobs
      if (job.splitCallId) {
        const relatedJobs = await jobsCol
          .find({
            splitCallId: job.splitCallId,
            clientId: job.clientId,
          })
          .toArray();

        return res.json({
          success: true,
          isSplitCall: true,
          splitCallId: job.splitCallId,
          relatedJobs: relatedJobs.map((j) => ({
            _id: j._id,
            handymanId: j.handymanId,
            handymanName: j.handymanName,
            status: j.status,
            subcategoryInfo: j.subcategoryInfo,
            price: j.price,
            priceChangeRequest: j.priceChangeRequest,
          })),
          allJobsDone: relatedJobs.every((j) => j.status === "done"),
        });
      } else {
        return res.json({
          success: true,
          isSplitCall: false,
          relatedJobs: [],
          allJobsDone: true,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching related jobs",
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

  // Payment endpoint - Create Payment Intent
  app.post("/payment/create-intent", async (req, res) => {
    try {
      const { jobId, clientId, amount, urgent } = req.body;

      if (!jobId || !clientId || !amount) {
        return res.status(400).json({
          success: false,
          message: "jobId, clientId, and amount are required",
        });
      }

      // Convert amount from ILS to agorot (smallest unit)
      const amountInAgorot = Math.round(amount * 100);

      let paymentIntent;
      try {
        paymentIntent = await createPaymentIntent(
          amountInAgorot,
          jobId,
          clientId,
          {
            urgent: urgent ? "true" : "false",
          }
        );
      } catch (stripeError) {
        throw stripeError;
      }

      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error creating Payment Intent",
        error: error.message,
      });
    }
  });

  // Payment endpoint - Transfer payment to handyman after job completion
  app.post("/payment/transfer", async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "jobId is required",
        });
      }

      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();

      // Get job details
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      if (!job.paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Job has no Payment Intent",
        });
      }

      // Check if payment was already transferred
      const existingPaymentForTransferCheck = await paymentsCol.findOne({
        jobId: new ObjectId(jobId),
      });
      if (
        existingPaymentForTransferCheck &&
        existingPaymentForTransferCheck.status === "transferred"
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment already transferred",
        });
      }

      // Get Payment Intent from Stripe
      let paymentIntent;
      try {
        paymentIntent = await getPaymentIntent(job.paymentIntentId);
      } catch (stripeError) {
        throw stripeError;
      }

      // Payment Intent can be in different states:
      // - "requires_capture": Payment authorized, ready to capture (expected state after user confirms payment)
      // - "succeeded": Payment already captured (shouldn't happen, but handle it)
      // - "requires_payment_method": Payment not yet authorized (shouldn't happen at this point)
      // - "requires_confirmation": Payment needs confirmation (shouldn't happen at this point)
      if (
        paymentIntent.status !== "requires_capture" &&
        paymentIntent.status !== "succeeded"
      ) {
        console.error(
          `[Stripe Error] Invalid Payment Intent status: ${paymentIntent.status} for Payment Intent ${job.paymentIntentId}, jobId: ${jobId}`
        );
        return res.status(400).json({
          success: false,
          message: `Payment Intent status is ${paymentIntent.status}, expected requires_capture or succeeded`,
        });
      }

      // Capture the payment (only if status is requires_capture)
      let capturedPayment = paymentIntent;
      if (paymentIntent.status === "requires_capture") {
        try {
          capturedPayment = await capturePaymentIntent(job.paymentIntentId);
        } catch (captureError) {
          throw captureError;
        }
      }

      // Calculate amounts
      const totalAmount = capturedPayment.amount / 100; // Convert from agorot to ILS (basePrice + urgentFee if any) - זה המחיר שהלקוח שילם כולל מע"מ

      // Calculate VAT (MAAM) - המע"מ נגבה מהלקוח
      const maamPercent = getMaamPercent();
      const vatCalculation = calculateVAT(totalAmount, maamPercent);

      // המחיר בלי מע"מ - עליו מחשבים את הרווחים
      const amountWithoutVAT = vatCalculation.amountWithoutVAT;
      const urgentFee = job.urgent ? 10 : 0;
      const commissionRate = 0.1; // 10%
      // העמלה מחושבת על המחיר בלי מע"מ (כי המע"מ נגבה מהלקוח)
      const commission =
        Math.round(amountWithoutVAT * commissionRate * 100) / 100;
      const systemRevenue = commission + urgentFee; // System gets commission + urgent fee
      // הנדימן מקבל: המחיר בלי מע"מ פחות עמלה פחות קריאה דחופה
      const handymanRevenue = amountWithoutVAT - commission - urgentFee;

      // Get handyman ID
      const handymanId = job.handymanId?.toString() || job.handymanId;
      const clientId = job.clientId?.toString() || job.clientId;

      // Get existing payment to preserve originalPrice and priceChangePercent if price was changed
      const paymentsColForTransfer = getCollectionPayments();
      const existingPaymentForTransfer = await paymentsColForTransfer.findOne({
        paymentIntentId: job.paymentIntentId,
      });

      const originalPrice =
        existingPaymentForTransfer?.originalPrice || totalAmount;
      const priceChangePercent =
        existingPaymentForTransfer?.priceChangePercent || 0;

      // Create payment record
      const paymentData = {
        jobId: new ObjectId(jobId),
        handymanId: handymanId,
        clientId: clientId,
        paymentIntentId: job.paymentIntentId,
        totalAmount: totalAmount, // המחיר הכולל שהלקוח שילם (כולל מע"מ)
        originalPrice: originalPrice, // המחיר המקורי (לפני שינוי אם היה)
        priceChangePercent: priceChangePercent, // אחוז השינוי במחיר
        amountWithoutVAT: vatCalculation.amountWithoutVAT,
        amountWithVAT: vatCalculation.amountWithVAT,
        vatAmount: vatCalculation.vatAmount,
        vatPercent: maamPercent,
        spacious_H: handymanRevenue,
        spacious_M: systemRevenue,
        status: "transferred",
        createdAt: new Date(),
        transferredAt: new Date(),
      };

      const insertResult = await paymentsCol.insertOne(paymentData);
      const paymentID = insertResult.insertedId;

      // Calculate clearing fee (2.9% + 0.3 ILS)
      const clearingFeeRate = 0.029; // 2.9%
      const clearingFeeFixed = 0.3; // 0.3 ILS
      const clearingFee =
        Math.round((totalAmount * clearingFeeRate + clearingFeeFixed) * 100) /
        100;

      // Calculate VAT for expenses (clearing fee has VAT)
      const clearingFeeVAT = calculateVAT(clearingFee, maamPercent);
      const commissionVAT = calculateVAT(commission, maamPercent);
      const urgentFeeVAT = calculateVAT(urgentFee, maamPercent);
      const totalVAT =
        clearingFeeVAT.vatAmount +
        commissionVAT.vatAmount +
        urgentFeeVAT.vatAmount;

      // Update managers_financials with revenue tracking and expenses
      const financialsCol = getCollectionFinancials();
      const financialsDoc = {
        createdAt: new Date(),
        Revenue: {
          Fees: commission,
          "Urgent call": urgentFee,
        },
        expenses: {
          "clearing fee": clearingFee,
          'מע"מ': Math.round(totalVAT * 100) / 100, // Total VAT on all expenses
        },
        paymentID: paymentID, // Reference to payment document _id
      };
      await financialsCol.insertOne(financialsDoc);

      return res.json({
        success: true,
        message: "Payment transferred successfully",
        payment: paymentData,
      });
    } catch (error) {
      console.error(
        `[Payment Transfer Error] Failed to transfer payment for jobId: ${req.body.jobId}:`,
        {
          error: error.message,
          stack: error.stack,
          type: error.type,
          code: error.code,
          jobId: req.body.jobId,
        }
      );
      return res.status(500).json({
        success: false,
        message: "Error transferring payment",
        error: error.message,
      });
    }
  });

  // Get payment info for a specific job
  app.get("/payment/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const paymentsCol = getCollectionPayments();

      const payment = await paymentsCol.findOne({
        jobId: new ObjectId(jobId),
      });

      if (!payment) {
        return res.json({
          success: true,
          payment: null,
        });
      }

      return res.json({
        success: true,
        payment: payment,
      });
    } catch (error) {
      console.error(
        `[Error] Failed to fetch payment for jobId: ${req.params.jobId}:`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
      return res.status(500).json({
        success: false,
        message: "Error fetching payment",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get all payments
  app.get("/admin/payments", async (req, res) => {
    try {
      const paymentsCol = getCollectionPayments();
      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Filter out payments with zero or missing amounts (likely incomplete/error records)
      // Also filter out subscription payments (they appear in subscriptions table)
      // Only show payments that have either:
      // 1. A valid amount > 0 (either totalAmount or amount field)
      // 2. A paymentIntentId (meaning it's a real payment, even if amount is 0 temporarily)
      const query = {
        $and: [
          {
            // Exclude subscription payments
            type: { $ne: "subscription" },
          },
          {
            $or: [
              { totalAmount: { $gt: 0 } },
              { amount: { $gt: 0 } },
              {
                $and: [
                  {
                    paymentIntentId: {
                      $exists: true,
                      $ne: null,
                      $ne: "",
                    },
                  },
                  {
                    $or: [
                      { status: { $exists: true, $ne: null } },
                      { createdAt: { $exists: true } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      // Get total count for pagination
      const totalPayments = await paymentsCol.countDocuments(query);

      const payments = await paymentsCol
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Enrich payments with job and user details
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          let job = null;
          let handyman = null;
          let client = null;

          try {
            if (payment.jobId) {
              job = await jobsCol.findOne({
                _id: new ObjectId(payment.jobId),
              });
            }
          } catch (err) {
            // Job not found or invalid ID
          }

          try {
            if (payment.handymanId) {
              handyman = await usersCol.findOne({
                _id: new ObjectId(payment.handymanId),
              });
            }
          } catch (err) {
            // Handyman not found or invalid ID
          }

          try {
            if (payment.clientId) {
              client = await usersCol.findOne({
                _id: new ObjectId(payment.clientId),
              });
            }
          } catch (err) {
            // Client not found or invalid ID
          }

          // Map old field names to new field names for compatibility
          // Old: amount, platformFee, handymanRevenue
          // New: totalAmount, spacious_M, spacious_H
          const totalAmount = payment.totalAmount || payment.amount || 0;
          const spacious_M = payment.spacious_M || payment.platformFee || 0;
          const spacious_H =
            payment.spacious_H ||
            payment.handymanRevenue ||
            totalAmount - spacious_M;

          return {
            ...payment,
            // Ensure new field names are always present
            totalAmount: totalAmount,
            spacious_M: spacious_M,
            spacious_H: spacious_H,
            // Keep old fields for backward compatibility
            amount: payment.amount || totalAmount,
            platformFee: payment.platformFee || spacious_M,
            handymanRevenue: payment.handymanRevenue || spacious_H,
            job: job
              ? {
                  _id: job._id,
                  subcategoryInfo: job.subcategoryInfo || [],
                  locationText: job.locationText,
                }
              : null,
            handyman: handyman
              ? {
                  _id: handyman._id,
                  username: handyman.username,
                  email: handyman.email,
                }
              : null,
            client: client
              ? {
                  _id: client._id,
                  username: client.username,
                  email: client.email,
                }
              : null,
          };
        })
      );

      return res.json({
        success: true,
        payments: enrichedPayments,
        pagination: {
          page: page,
          limit: limit,
          total: totalPayments,
          totalPages: Math.ceil(totalPayments / limit),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching payments",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get active subscriptions
  app.get("/admin/subscriptions", async (req, res) => {
    try {
      const paymentsCol = getCollectionPayments();
      const usersCol = getCollection();

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Get all subscription payments
      const subscriptionPayments = await paymentsCol
        .find({
          type: "subscription",
          status: { $in: ["active", "succeeded"] },
        })
        .sort({ createdAt: -1 })
        .toArray();

      // Get unique active subscriptions (group by userId)
      const subscriptionsMap = new Map();
      for (const payment of subscriptionPayments) {
        const userId = payment.userId?.toString();
        if (userId && !subscriptionsMap.has(userId)) {
          try {
            const user = await usersCol.findOne({
              _id: new ObjectId(userId),
            });
            // Only show users with active subscription (not handimanFree)
            if (user && user.hasActiveSubscription === true) {
              const vatPercent = getMaamPercent();
              const vatAmount = (payment.amount * vatPercent) / 100;

              // Get last payment date for this user
              const lastPayment = await paymentsCol.findOne(
                {
                  type: "subscription",
                  userId: new ObjectId(userId),
                  status: "succeeded",
                },
                { sort: { createdAt: -1 } }
              );

              subscriptionsMap.set(userId, {
                _id: payment._id,
                userId: userId,
                userName: user.username || "ללא שם",
                amount: payment.amount || 0,
                vatAmount: vatAmount,
                createdAt: payment.createdAt,
                lastPaymentDate: lastPayment?.createdAt || payment.createdAt,
                userCreatedAt: user.createdAt || null,
              });
            }
          } catch (err) {
            // User not found, skip
          }
        }
      }

      const allSubscriptions = Array.from(subscriptionsMap.values());

      // Apply pagination
      const totalSubscriptions = allSubscriptions.length;
      const skip = (page - 1) * limit;
      const subscriptions = allSubscriptions.slice(skip, skip + limit);

      return res.json({
        success: true,
        subscriptions: subscriptions,
        pagination: {
          page: page,
          limit: limit,
          total: totalSubscriptions,
          totalPages: Math.ceil(totalSubscriptions / limit),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching subscriptions",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Generate monthly PDF report
  app.get("/admin/payments/monthly-pdf", async (req, res) => {
    try {
      const { chromium } = require("playwright");
      const paymentsCol = getCollectionPayments();
      const financialsCol = getCollectionFinancials();

      // Get current month's data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      // Get transaction payments (not subscriptions) for current month
      const transactionPayments = await paymentsCol
        .find({
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
          type: { $ne: "subscription" }, // Exclude subscriptions
          status: { $in: ["transferred", "succeeded", "captured"] }, // Only completed payments
        })
        .sort({ createdAt: -1 })
        .toArray();

      // Get subscription payments for current month
      const subscriptionPayments = await paymentsCol
        .find({
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
          type: "subscription",
          status: { $in: ["active", "succeeded"] }, // Active or succeeded subscriptions
        })
        .sort({ createdAt: -1 })
        .toArray();

      // Enrich transaction payments with user names
      const usersCol = getCollection();
      const enrichedTransactionPayments = await Promise.all(
        transactionPayments.map(async (payment) => {
          let clientName = "ללא שם";
          let handymanName = "ללא שם";

          try {
            if (payment.clientId) {
              const client = await usersCol.findOne({
                _id: new ObjectId(payment.clientId),
              });
              if (client) {
                clientName = client.username || "ללא שם";
              }
            }
          } catch (err) {
            // Client not found
          }

          try {
            if (payment.handymanId) {
              const handyman = await usersCol.findOne({
                _id: new ObjectId(payment.handymanId),
              });
              if (handyman) {
                handymanName = handyman.username || "ללא שם";
              }
            }
          } catch (err) {
            // Handyman not found
          }

          return {
            ...payment,
            clientName,
            handymanName,
          };
        })
      );

      // Enrich subscription payments with user names
      const enrichedSubscriptionPayments = await Promise.all(
        subscriptionPayments.map(async (payment) => {
          let userName = "ללא שם";

          try {
            if (payment.userId) {
              const user = await usersCol.findOne({
                _id: new ObjectId(payment.userId),
              });
              if (user) {
                userName = user.username || "ללא שם";
              }
            }
          } catch (err) {
            // User not found
          }

          return {
            ...payment,
            userName,
          };
        })
      );

      // Get financials for current month
      const financials = await financialsCol
        .aggregate([
          {
            $match: {
              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $add: [
                    { $ifNull: ["$Revenue.Fees", 0] },
                    { $ifNull: ["$Revenue.Drawings", 0] },
                    { $ifNull: ["$Revenue.Urgent call", 0] },
                  ],
                },
              },
              totalExpenses: {
                $sum: {
                  $add: [
                    { $ifNull: ["$expenses.AI expenses", 0] },
                    { $ifNull: ["$expenses.DB expenses", 0] },
                    { $ifNull: ["$expenses.API expenses", 0] },
                    { $ifNull: ["$expenses.Marketing expenses", 0] },
                    { $ifNull: ["$expenses.clearing fee", 0] },
                    { $ifNull: ["$expenses.VAT", 0] },
                  ],
                },
              },
              totalVAT: {
                $sum: { $ifNull: ["$expenses.VAT", 0] },
              },
            },
          },
        ])
        .toArray();

      const summary = financials[0] || {
        totalRevenue: 0,
        totalExpenses: 0,
        totalVAT: 0,
      };

      // Calculate totals from transaction payments
      const transactionPaymentsTotal = enrichedTransactionPayments.reduce(
        (sum, p) => sum + (p.totalAmount || p.amount || 0),
        0
      );
      const transactionVatTotal = enrichedTransactionPayments.reduce(
        (sum, p) => sum + (p.vatAmount || 0),
        0
      );
      const handymanRevenue = enrichedTransactionPayments.reduce(
        (sum, p) => sum + (p.spacious_H || p.handymanRevenue || 0),
        0
      );
      const systemRevenue = enrichedTransactionPayments.reduce(
        (sum, p) => sum + (p.spacious_M || p.platformFee || 0),
        0
      );

      // Calculate totals from subscription payments
      const vatPercent = getMaamPercent();
      const subscriptionPaymentsTotal = enrichedSubscriptionPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );
      const subscriptionVatTotal = enrichedSubscriptionPayments.reduce(
        (sum, p) => {
          const amount = p.amount || 0;
          return sum + (amount * vatPercent) / 100;
        },
        0
      );

      // Combined totals
      const paymentsTotal =
        transactionPaymentsTotal + subscriptionPaymentsTotal;
      const vatTotal = transactionVatTotal + subscriptionVatTotal;

      // Generate HTML for PDF
      const monthNames = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ];
      const monthName = monthNames[now.getMonth()];
      const year = now.getFullYear();

      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', 'Heebo', sans-serif;
      direction: rtl;
      padding: 40px;
      background: white;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #ff6a00;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #ff6a00;
      margin: 0;
      font-size: 32px;
    }
    .header h2 {
      color: #333;
      margin: 10px 0 0 0;
      font-size: 20px;
    }
    .summary {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary h3 {
      color: #ff6a00;
      margin-top: 0;
      font-size: 18px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ddd;
    }
    .summary-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 16px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #ff6a00;
    }
    .summary-label {
      color: #666;
    }
    .summary-value {
      color: #000;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    th {
      background: #ff6a00;
      color: white;
      padding: 12px;
      text-align: right;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
      text-align: right;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>דוח חודשי - הנדימן</h1>
    <h2>${monthName} ${year}</h2>
  </div>

  <div class="summary">
    <h3>סיכום כספי - חודש ${monthName} ${year}</h3>
    <div class="summary-row">
      <span class="summary-label">סך כל תשלומי עסקאות:</span>
      <span class="summary-value">${transactionPaymentsTotal.toFixed(
        2
      )} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">סך כל תשלומי מנויים:</span>
      <span class="summary-value">${subscriptionPaymentsTotal.toFixed(
        2
      )} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">סך כל התשלומים:</span>
      <span class="summary-value">${paymentsTotal.toFixed(2)} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">סך מע"מ (עסקאות):</span>
      <span class="summary-value">${transactionVatTotal.toFixed(2)} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">סך מע"מ (מנויים):</span>
      <span class="summary-value">${subscriptionVatTotal.toFixed(2)} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">סך כל מע"מ:</span>
      <span class="summary-value">${vatTotal.toFixed(2)} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">סך הכנסות:</span>
      <span class="summary-value">${summary.totalRevenue.toFixed(2)} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">סך הוצאות:</span>
      <span class="summary-value">${summary.totalExpenses.toFixed(2)} ₪</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">רווח נקי:</span>
      <span class="summary-value">${(
        summary.totalRevenue - summary.totalExpenses
      ).toFixed(2)} ₪</span>
    </div>
  </div>

  <h3>פירוט תשלומי עסקאות (${enrichedTransactionPayments.length} תשלומים)</h3>
  <table>
    <thead>
      <tr>
        <th>תאריך</th>
        <th>שעה</th>
        <th>לקוח</th>
        <th>הנדימן</th>
        <th>סכום כולל</th>
        <th>מע"מ</th>
        <th>סכום ללא מע"מ</th>
        <th>רווח הנדימן</th>
        <th>רווח המערכת</th>
      </tr>
    </thead>
    <tbody>
      ${
        enrichedTransactionPayments.length > 0
          ? enrichedTransactionPayments
              .map(
                (payment) => `
        <tr>
          <td>${new Date(payment.createdAt).toLocaleDateString("he-IL")}</td>
          <td>${new Date(payment.createdAt).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          })}</td>
          <td>${payment.clientName || "ללא"}</td>
          <td>${payment.handymanName || "ללא"}</td>
          <td>${(payment.totalAmount || payment.amount || 0).toFixed(2)} ₪</td>
          <td>${(payment.vatAmount || 0).toFixed(2)} ₪</td>
          <td>${(
            (payment.totalAmount || payment.amount || 0) -
            (payment.vatAmount || 0)
          ).toFixed(2)} ₪</td>
          <td>${(payment.spacious_H || payment.handymanRevenue || 0).toFixed(
            2
          )} ₪</td>
          <td>${(payment.spacious_M || payment.platformFee || 0).toFixed(
            2
          )} ₪</td>
        </tr>
      `
              )
              .join("")
          : `<tr><td colspan="9" style="text-align: center; padding: 20px;">אין תשלומי עסקאות בחודש זה</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr style="background: #f0f0f0; font-weight: bold;">
        <td colspan="4" style="text-align: left;">סה"כ:</td>
        <td>${transactionPaymentsTotal.toFixed(2)} ₪</td>
        <td>${transactionVatTotal.toFixed(2)} ₪</td>
        <td>${(transactionPaymentsTotal - transactionVatTotal).toFixed(
          2
        )} ₪</td>
        <td>${handymanRevenue.toFixed(2)} ₪</td>
        <td>${systemRevenue.toFixed(2)} ₪</td>
      </tr>
    </tfoot>
  </table>

  <h3 style="margin-top: 40px;">פירוט תשלומי מנויים (${
    enrichedSubscriptionPayments.length
  } תשלומים)</h3>
  <table>
    <thead>
      <tr>
        <th>תאריך</th>
        <th>שעה</th>
        <th>שם המנוי</th>
        <th>סכום כולל</th>
        <th>מע"מ</th>
        <th>סכום ללא מע"מ</th>
        <th>מספר מנוי</th>
      </tr>
    </thead>
    <tbody>
      ${
        enrichedSubscriptionPayments.length > 0
          ? enrichedSubscriptionPayments
              .map((payment) => {
                const amount = payment.amount || 0;
                const vatAmount = (amount * vatPercent) / 100;
                const amountWithoutVAT = amount - vatAmount;
                return `
        <tr>
          <td>${new Date(payment.createdAt).toLocaleDateString("he-IL")}</td>
          <td>${new Date(payment.createdAt).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          })}</td>
          <td>${payment.userName || "ללא שם"}</td>
          <td>${amount.toFixed(2)} ₪</td>
          <td>${vatAmount.toFixed(2)} ₪</td>
          <td>${amountWithoutVAT.toFixed(2)} ₪</td>
          <td>${
            payment.subscriptionId || payment._id?.toString().slice(-8) || "-"
          }</td>
        </tr>
      `;
              })
              .join("")
          : `<tr><td colspan="7" style="text-align: center; padding: 20px;">אין תשלומי מנויים בחודש זה</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr style="background: #f0f0f0; font-weight: bold;">
        <td colspan="3" style="text-align: left;">סה"כ:</td>
        <td>${subscriptionPaymentsTotal.toFixed(2)} ₪</td>
        <td>${subscriptionVatTotal.toFixed(2)} ₪</td>
        <td>${(subscriptionPaymentsTotal - subscriptionVatTotal).toFixed(
          2
        )} ₪</td>
        <td>-</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <p>דוח זה נוצר אוטומטית על ידי מערכת הנדימן</p>
    <p>תאריך יצירה: ${new Date().toLocaleDateString(
      "he-IL"
    )} ${new Date().toLocaleTimeString("he-IL")}</p>
  </div>
</body>
</html>
      `;

      // Launch browser and generate PDF
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
      });

      await browser.close();

      // Send PDF as response
      res.setHeader("Content-Type", "application/pdf");
      // Use RFC 5987 encoding for Hebrew filename
      const monthNum = String(now.getMonth() + 1).padStart(2, "0");
      const filename = `monthly_report_${monthNum}_${year}.pdf`;
      const filenameUtf8 = encodeURIComponent(
        `דוח_חודשי_${monthNum}_${year}.pdf`
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"; filename*=UTF-8''${filenameUtf8}`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      return res.status(500).json({
        success: false,
        message: "שגיאה ביצירת הדוח",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Capture payment (bypasses client approval requirement)
  app.post("/admin/payments/capture", async (req, res) => {
    try {
      const { paymentId, jobId, paymentIntentId } = req.body;

      // Accept either paymentId (to look up) or jobId+paymentIntentId
      let targetPaymentIntentId = paymentIntentId;
      let targetJobId = jobId;

      const paymentsCol = getCollectionPayments();
      const jobsCol = getCollectionJobs();

      if (paymentId && !targetPaymentIntentId) {
        // Look up payment by ID
        const payment = await paymentsCol.findOne({
          _id: new ObjectId(paymentId),
        });
        if (!payment) {
          return res.status(404).json({
            success: false,
            message: "Payment not found",
          });
        }
        targetPaymentIntentId = payment.paymentIntentId;
        targetJobId = payment.jobId;
      }

      if (!targetPaymentIntentId || !targetJobId) {
        return res.status(400).json({
          success: false,
          message: "paymentId or (jobId and paymentIntentId) required",
        });
      }

      // Get job (for verification, but don't require clientApproved for admin)
      const job = await jobsCol.findOne({ _id: new ObjectId(targetJobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Get payment intent from Stripe to verify status
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(
          targetPaymentIntentId
        );
      } catch (stripeError) {
        return res.status(400).json({
          success: false,
          message: "Payment Intent not found in Stripe",
          error: stripeError.message,
        });
      }

      // Verify payment is in requires_capture state
      if (paymentIntent.status !== "requires_capture") {
        return res.status(400).json({
          success: false,
          message: `Payment is not ready to be captured. Current status: ${paymentIntent.status}`,
          currentStatus: paymentIntent.status,
        });
      }

      // Capture the payment (admin can bypass client approval)
      console.log(
        `[Admin Capture] Capturing payment: ${targetPaymentIntentId} for job: ${targetJobId}`
      );
      const capturedPayment = await captureEscrow(targetPaymentIntentId);
      console.log(
        `[Admin Capture] Payment captured successfully. New status: ${capturedPayment.status}`
      );

      // Update payment record
      const paymentUpdateResult = await paymentsCol.updateOne(
        { paymentIntentId: targetPaymentIntentId },
        {
          $set: {
            status: "captured",
            updatedAt: new Date(),
          },
        }
      );
      console.log(
        `[Admin Capture] Payment record updated: ${paymentUpdateResult.modifiedCount} document(s) modified`
      );

      // Update job payment status
      const jobUpdateResult = await jobsCol.updateOne(
        { _id: new ObjectId(targetJobId) },
        {
          $set: {
            paymentStatus: "paid",
            clientApproved: true, // Mark as approved since admin released it
          },
        }
      );
      console.log(
        `[Admin Capture] Job record updated: ${jobUpdateResult.modifiedCount} document(s) modified`
      );

      return res.json({
        success: true,
        status: capturedPayment.status,
        message: "התשלום שוחרר בהצלחה על ידי מנהל המערכת",
        capturedAmount: capturedPayment.amount
          ? capturedPayment.amount / 100
          : null, // Return amount in ILS
      });
    } catch (error) {
      console.error("Error capturing payment (admin):", error);
      return res.status(500).json({
        success: false,
        message: "שגיאה בשחרור התשלום",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Delete payment
  app.delete("/admin/payments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Payment ID required" });
      }

      const paymentsCol = getCollectionPayments();
      const financialsCol = getCollectionFinancials();
      const paymentId = new ObjectId(id);

      // Check if payment exists
      const payment = await paymentsCol.findOne({ _id: paymentId });
      if (!payment) {
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });
      }

      // Delete payment
      const result = await paymentsCol.deleteOne({ _id: paymentId });
      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      // Delete associated financial record if exists
      await financialsCol.deleteMany({ paymentID: paymentId });

      return res.json({
        success: true,
        message: "Payment deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting payment",
        error: error.message,
      });
    }
  });

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

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalUsers = await collection.countDocuments({});

      const users = await collection
        .find({})
        .project({
          password: 0, // Exclude password
          googleId: 0, // Exclude sensitive data
        })
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.json({
        success: true,
        users: users,
        pagination: {
          page: page,
          limit: limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get user by ID with details
  app.get("/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "User ID required" });
      }

      const collection = getCollection();
      const paymentsCol = getCollectionPayments();

      if (!collection || !paymentsCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      const userId = new ObjectId(id);
      const user = await collection.findOne(
        { _id: userId },
        {
          projection: {
            password: 0,
            googleId: 0,
          },
        }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Calculate total earnings for handymen
      let totalEarnings = 0;
      if (user.isHandyman) {
        const payments = await paymentsCol
          .find({
            "handyman._id": userId,
            status: { $in: ["transferred", "succeeded", "captured"] },
          })
          .toArray();

        totalEarnings = payments.reduce((sum, payment) => {
          return sum + (payment.spacious_H || 0);
        }, 0);
      }

      // Add total earnings to user object
      const userWithDetails = {
        ...user,
        totalEarnings,
      };

      return res.json({
        success: true,
        user: userWithDetails,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching user details",
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

  // Admin endpoint - Block/Unblock user
  app.post("/admin/users/:id/block", async (req, res) => {
    try {
      const { id } = req.params;
      const { isBlocked } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "User ID required" });
      }

      if (typeof isBlocked !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isBlocked must be a boolean",
        });
      }

      const userId = new ObjectId(id);
      const usersCol = getCollection();

      // Check if user exists
      const user = await usersCol.findOne({ _id: userId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Update user blocked status
      await usersCol.updateOne(
        { _id: userId },
        {
          $set: {
            IsBlocked: isBlocked,
            isBlocked: isBlocked, // שמירה גם ב-isBlocked לתאימות לאחור
            updatedAt: new Date(),
          },
        }
      );

      return res.json({
        success: true,
        message: isBlocked
          ? "User blocked successfully"
          : "User unblocked successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating user block status",
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
              totalVAT: {
                $sum: { $ifNull: ['$expenses.מע"מ', 0] },
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
            'מע"מ': totals.totalVAT || 0,
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
        'expenses.מע"מ',
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

      // Get total amount of completed transactions (payments with status "transferred")
      // Only count payments that were actually transferred to handymen
      const paymentsResult = await paymentsCol
        .aggregate([
          {
            $match: {
              status: "transferred",
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
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

  // Admin endpoint - Get platform fee percentage
  app.get("/admin/fee", async (req, res) => {
    try {
      const fee = getPlatformFeePercent();
      return res.json({
        success: true,
        fee: fee,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching platform fee",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Update platform fee percentage
  app.post("/admin/fee", async (req, res) => {
    try {
      const { fee } = req.body;
      if (fee === undefined || fee === null) {
        return res.status(400).json({
          success: false,
          message: "Fee is required",
        });
      }

      const feeNumber = parseFloat(fee);
      if (isNaN(feeNumber) || feeNumber < 0 || feeNumber > 100) {
        return res.status(400).json({
          success: false,
          message: "Fee must be a number between 0 and 100",
        });
      }

      const updated = updatePlatformFeePercent(feeNumber);
      if (updated) {
        return res.json({
          success: true,
          fee: feeNumber,
          message: "Platform fee updated successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Error updating platform fee",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating platform fee",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get MAAM (VAT) percentage
  app.get("/admin/maam", async (req, res) => {
    try {
      const maam = getMaamPercent();
      return res.json({
        success: true,
        maam: maam,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching MAAM percentage",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Update MAAM (VAT) percentage
  app.post("/admin/maam", async (req, res) => {
    try {
      const { maam } = req.body;
      if (maam === undefined || maam === null) {
        return res.status(400).json({
          success: false,
          message: "MAAM is required",
        });
      }

      const maamNumber = parseFloat(maam);
      if (isNaN(maamNumber) || maamNumber < 0 || maamNumber > 100) {
        return res.status(400).json({
          success: false,
          message: "MAAM must be a number between 0 and 100",
        });
      }

      // Update dry-data.json
      try {
        const dryDataPath = path.join(__dirname, "API", "dry-data.json");
        const dryData = JSON.parse(fs.readFileSync(dryDataPath, "utf8"));
        dryData.maam = maamNumber;
        fs.writeFileSync(dryDataPath, JSON.stringify(dryData, null, 2));

        return res.json({
          success: true,
          maam: maamNumber,
          message: "MAAM percentage updated successfully",
        });
      } catch (fileError) {
        return res.status(500).json({
          success: false,
          message: "Error updating MAAM percentage",
          error: fileError.message,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating MAAM percentage",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get Monthly-subscriptions amount
  app.get("/admin/monthly-subscription", async (req, res) => {
    try {
      const amount = getMonthlySubscription();
      return res.json({
        success: true,
        amount: amount,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching Monthly-subscriptions amount",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Update Monthly-subscriptions amount
  app.post("/admin/monthly-subscription", async (req, res) => {
    try {
      const { amount } = req.body;
      if (amount === undefined || amount === null) {
        return res.status(400).json({
          success: false,
          message: "Amount is required",
        });
      }

      const amountNumber = parseFloat(amount);
      if (isNaN(amountNumber) || amountNumber < 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number",
        });
      }

      const updated = updateMonthlySubscription(amountNumber);
      if (updated) {
        return res.json({
          success: true,
          amount: amountNumber,
          message: "Monthly-subscriptions amount updated successfully",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Error updating Monthly-subscriptions amount",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating Monthly-subscriptions amount",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Get all cancellations
  app.get("/admin/cancellations", async (req, res) => {
    try {
      const jobsCol = getCollectionJobs();
      if (!jobsCol) {
        return res.status(500).json({
          success: false,
          message: "Database not connected",
        });
      }

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Get total count for pagination - only jobs that actually have a cancel field (not null/undefined)
      // Important: Only show jobs where cancel field exists - this identifies cancellations
      // We check that cancel exists and is not null
      const cancellationQuery = {
        cancel: { $exists: true, $ne: null },
      };

      const totalCancellations = await jobsCol.countDocuments(
        cancellationQuery
      );

      // Find all jobs with cancel object that is not null
      // This ensures we only show actual cancellations, not completed jobs
      const cancelledJobs = await jobsCol
        .find(cancellationQuery)
        .sort({ "cancel.cancelledAt": -1 }) // Sort by cancellation date, newest first
        .skip(skip)
        .limit(limit)
        .toArray();

      // Filter out jobs where cancel is not actually an object or is empty (additional client-side filter)
      const validCancellations = cancelledJobs.filter((job) => {
        return (
          job.cancel &&
          typeof job.cancel === "object" &&
          job.cancel !== null &&
          !Array.isArray(job.cancel) &&
          Object.keys(job.cancel).length > 0
        );
      });

      return res.json({
        success: true,
        cancellations: validCancellations,
        pagination: {
          page: page,
          limit: limit,
          total: validCancellations.length,
          totalPages: Math.ceil(validCancellations.length / limit),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching cancellations",
        error: error.message,
      });
    }
  });

  // Admin endpoint - Collect fine from cancellation
  app.post("/admin/cancellations/collect-fine", async (req, res) => {
    try {
      const { jobId, fineAmount } = req.body;

      if (!jobId || !fineAmount) {
        return res.status(400).json({
          success: false,
          message: "Job ID and fine amount are required",
        });
      }

      if (fineAmount <= 0 || fineAmount > 200) {
        return res.status(400).json({
          success: false,
          message: "Fine amount must be between 1 and 200",
        });
      }

      const jobsCol = getCollectionJobs();
      const usersCol = getCollection();
      const financialsCol = getCollectionFinancials();

      // Find the job
      const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Check if fine already collected
      if (job.cancel?.fineCollected === true) {
        return res.status(400).json({
          success: false,
          message: "Fine already collected for this cancellation",
        });
      }

      // Get client and handyman - try multiple possible field names
      let clientId = job.clientId || job.client?._id || job.userId;
      let handymanId = job.handymanId
        ? Array.isArray(job.handymanId)
          ? job.handymanId[0]
          : job.handymanId
        : job.handyman?._id || job.handymanIdSpecial || null;

      // If still not found, try to get from payment if exists
      if (!clientId || !handymanId) {
        const paymentsCol = getCollectionPayments();
        const payment = await paymentsCol.findOne({
          jobId: new ObjectId(jobId),
        });
        if (payment) {
          if (!clientId && payment.clientId) {
            clientId = payment.clientId;
          }
          if (!handymanId && payment.handymanId) {
            handymanId = payment.handymanId;
          }
        }
      }

      if (!clientId || !handymanId) {
        return res.status(400).json({
          success: false,
          message:
            "Client or handyman not found for this job. Job ID: " + jobId,
        });
      }

      // Convert to ObjectId if needed
      let clientObjectId;
      let handymanObjectId;

      try {
        clientObjectId =
          clientId instanceof ObjectId ? clientId : new ObjectId(clientId);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID format: " + clientId,
        });
      }

      try {
        handymanObjectId =
          handymanId instanceof ObjectId
            ? handymanId
            : new ObjectId(handymanId);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid handyman ID format: " + handymanId,
        });
      }

      const client = await usersCol.findOne({ _id: clientObjectId });
      const handyman = await usersCol.findOne({
        _id: handymanObjectId,
      });

      if (!client || !handyman) {
        return res.status(404).json({
          success: false,
          message: "Client or handyman not found",
        });
      }

      // Check if job has paymentIntentId - needed to charge the client
      if (!job.paymentIntentId) {
        return res.status(400).json({
          success: false,
          message:
            "Job has no paymentIntentId. Cannot collect fine from client.",
        });
      }

      // Get the original payment intent to retrieve payment method and customer
      let originalPaymentIntent;
      try {
        originalPaymentIntent = await stripe.paymentIntents.retrieve(
          job.paymentIntentId
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Failed to retrieve payment intent for this job",
          error: error.message,
        });
      }

      // Check if payment intent has a payment method attached
      if (!originalPaymentIntent.payment_method) {
        return res.status(400).json({
          success: false,
          message:
            "Payment intent has no payment method. Cannot charge client.",
        });
      }

      // Get customer ID from the original payment intent
      // If payment_method is attached, we need the customer ID
      const customerId = originalPaymentIntent.customer;
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message:
            "Payment intent has no customer. Cannot charge client for fine.",
        });
      }

      // Calculate platform fee
      const platformFeePercent = getPlatformFeePercent();
      const platformFeeAmount = (fineAmount * platformFeePercent) / 100;
      const handymanAmount = fineAmount - platformFeeAmount;

      // Get or create handyman's Stripe Connect account
      const handymanAccountId = await getOrCreateConnectedAccount(
        handyman,
        usersCol
      );

      if (!handymanAccountId) {
        return res.status(400).json({
          success: false,
          message:
            "Handyman does not have a Stripe account. Please complete onboarding first.",
        });
      }

      // Convert amounts to agorot (Stripe uses smallest currency unit)
      const fineAmountAgorot = Math.round(fineAmount * 100);
      const handymanAmountAgorot = Math.round(handymanAmount * 100);
      const platformFeeAgorot = Math.round(platformFeeAmount * 100);

      // Create a new payment intent for the fine using the same payment method and customer
      // Use transfer_data to send money directly from client to handyman, with application_fee for platform
      // This avoids the need for a separate transfer and balance issues in test mode
      let finePaymentIntent;
      try {
        // First, create the payment intent without confirming
        // Must include customer when using payment_method
        // Set allow_redirects to 'never' to avoid redirect-based payment methods (like Link)
        // Use transfer_data to send money directly to handyman, and application_fee_amount for platform fee
        finePaymentIntent = await stripe.paymentIntents.create({
          amount: fineAmountAgorot,
          currency: "ils",
          customer: customerId, // Required when using payment_method
          payment_method: originalPaymentIntent.payment_method,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never", // Prevent redirect-based payment methods
          },
          // Transfer money directly to handyman's account
          // The difference (fineAmountAgorot - handymanAmountAgorot = platformFeeAgorot) stays in our account automatically
          transfer_data: {
            destination: handymanAccountId,
            amount: handymanAmountAgorot, // Amount that goes to handyman
          },
          confirm: false, // Don't confirm immediately
          metadata: {
            jobId: String(jobId),
            type: "cancellation_fine",
            fineAmount: String(fineAmount),
            platformFeeAmount: String(platformFeeAmount),
            handymanAmount: String(handymanAmount),
          },
        });

        // Now confirm the payment intent
        try {
          finePaymentIntent = await stripe.paymentIntents.confirm(
            finePaymentIntent.id
          );
        } catch (confirmError) {
          console.error("Error confirming payment intent:", confirmError);
          // If confirmation fails, try to cancel the payment intent
          try {
            await stripe.paymentIntents.cancel(finePaymentIntent.id);
          } catch (cancelError) {
            console.error("Error cancelling payment intent:", cancelError);
          }
          throw confirmError;
        }
      } catch (chargeError) {
        console.error("Stripe charge error for fine:", chargeError);
        return res.status(500).json({
          success: false,
          message:
            "שגיאה בגביית הקנס מהלקוח: " +
            (chargeError.message || "שגיאה לא ידועה"),
          error: chargeError.message,
          code: chargeError.code || chargeError.type || "unknown",
        });
      }

      // Verify payment was successful
      if (finePaymentIntent.status !== "succeeded") {
        return res.status(500).json({
          success: false,
          message: "תשלום הקנס לא הושלם. סטטוס: " + finePaymentIntent.status,
        });
      }

      console.log(
        "✅ Fine payment collected from client and transferred to handyman:",
        {
          fineAmount: fineAmount,
          fineAmountAgorot: fineAmountAgorot,
          paymentIntentId: finePaymentIntent.id,
          status: finePaymentIntent.status,
          handymanAmount: handymanAmount,
          handymanAmountAgorot: handymanAmountAgorot,
          platformFeeAmount: platformFeeAmount,
          platformFeeAgorot: platformFeeAgorot,
          flow: "Client -> Handyman (handymanAmount) + Platform (platformFeeAmount) - Direct transfer via PaymentIntent transfer_data",
        }
      );

      // No need for separate transfer - money was sent directly via transfer_data in PaymentIntent
      // The difference (fineAmountAgorot - handymanAmountAgorot = platformFeeAgorot) stays in our platform account automatically
      const transfer = {
        id: finePaymentIntent.id, // Use payment intent ID as transfer reference
        amount: handymanAmountAgorot,
        destination: handymanAccountId,
      };

      // Update job with fine information
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            "cancel.fineCollected": true,
            "cancel.fineAmount": fineAmount,
            "cancel.fineCollectedAt": new Date(),
            "cancel.platformFeeAmount": platformFeeAmount,
            "cancel.handymanAmount": handymanAmount,
            "cancel.stripeTransferId": transfer.id,
            "cancel.finePaymentIntentId": finePaymentIntent.id,
          },
        }
      );

      // Update financials - add platform fee to Revenue.Fees
      await financialsCol.updateOne(
        {},
        {
          $inc: {
            "Revenue.Fees": platformFeeAmount,
          },
        },
        { upsert: true }
      );

      console.log("✅ Fine collection completed successfully:", {
        fineAmount: fineAmount,
        platformFeeAmount: platformFeeAmount,
        handymanAmount: handymanAmount,
        transferId: transfer.id,
        paymentIntentId: finePaymentIntent.id,
        flow: "Client -> Platform (full amount) -> Handyman (handymanAmount) + Platform keeps (platformFeeAmount)",
      });

      return res.json({
        success: true,
        message: "Fine collected successfully",
        fineAmount: fineAmount,
        platformFeeAmount: platformFeeAmount,
        handymanAmount: handymanAmount,
        summary: {
          totalCollected: fineAmount,
          platformFee: platformFeeAmount,
          handymanReceived: handymanAmount,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error collecting fine",
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
    // Join user's personal room (for receiving job-accepted events)
    socket.on("join-user", (userId) => {
      const roomName = `user-${userId}`;
      socket.join(roomName);
    });

    // Leave user's personal room
    socket.on("leave-user", (userId) => {
      socket.leave(`user-${userId}`);
    });

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
        } catch (error) {}
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

    // Handle price change request from handyman
    socket.on("price-change-request", async (data) => {
      const {
        jobId,
        handymanId,
        percent,
        oldPrice,
        newPrice,
        changeAmount,
        subcategoryIndex,
      } = data;
      if (!jobId || !handymanId || percent === undefined) return;

      try {
        const jobsCol = getCollectionJobs();
        const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

        if (!job) {
          socket.emit("error", { message: "עבודה לא נמצאה" });
          return;
        }

        // Verify handyman is assigned to this job
        let isHandymanAssigned = false;
        if (job.handymanId) {
          if (Array.isArray(job.handymanId)) {
            isHandymanAssigned = job.handymanId.some(
              (id) => String(id) === String(handymanId)
            );
          } else {
            isHandymanAssigned = String(job.handymanId) === String(handymanId);
          }
        }

        if (!isHandymanAssigned) {
          socket.emit("error", { message: "אין הרשאה לעדכן מחיר עבודה זו" });
          return;
        }

        // Verify percent is within -20% to +20%
        if (Math.abs(percent) > 20) {
          socket.emit("error", {
            message: "שינוי המחיר חייב להיות בין -20% ל-+20%",
          });
          return;
        }

        // Get client ID from job
        const clientId = job.clientId;
        if (!clientId) {
          socket.emit("error", { message: "לקוח לא נמצא" });
          return;
        }

        // Get handyman name
        const usersCol = getCollection();
        let handymanName = null;
        try {
          const handymanObjectId = new ObjectId(handymanId);
          const handyman = await usersCol.findOne({ _id: handymanObjectId });
          if (handyman) {
            handymanName = handyman.username || handyman.name || "הנדימן";
          }
        } catch (error) {
          handymanName = job.handymanName || "הנדימן";
        }

        // Get subcategory info if applicable
        let subcategoryInfo = null;
        if (
          subcategoryIndex !== undefined &&
          subcategoryIndex !== null &&
          job.subcategoryInfo &&
          Array.isArray(job.subcategoryInfo) &&
          job.subcategoryInfo.length > subcategoryIndex
        ) {
          subcategoryInfo = job.subcategoryInfo[subcategoryIndex];
        }

        // Emit price change request to client
        const priceChangeData = {
          jobId,
          handymanId,
          handymanName: handymanName,
          percent,
          oldPrice,
          newPrice,
          changeAmount,
        };

        // Add subcategory info if applicable
        if (
          subcategoryInfo &&
          subcategoryIndex !== undefined &&
          subcategoryIndex !== null
        ) {
          priceChangeData.subcategoryIndex = subcategoryIndex;
          priceChangeData.subcategoryInfo = {
            category: subcategoryInfo.category,
            subcategory: subcategoryInfo.subcategory,
            workType: subcategoryInfo.workType,
          };
        }

        io.to(`job-${jobId}`).emit("price-change-request", priceChangeData);
      } catch (error) {
        console.error("Error handling price change request:", error);
        socket.emit("error", { message: "שגיאה בעיבוד בקשת שינוי המחיר" });
      }
    });

    // Handle price change response from client
    socket.on("price-change-response", async (data) => {
      const { jobId, approved, percent, oldPrice, newPrice } = data;
      if (!jobId || approved === undefined) return;

      try {
        const jobsCol = getCollectionJobs();
        const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

        if (!job) {
          socket.emit("error", { message: "עבודה לא נמצאה" });
          return;
        }

        if (approved) {
          // Update price in job document
          const updateFields = {};

          // Handle subcategoryInfo as array
          if (
            job.subcategoryInfo &&
            Array.isArray(job.subcategoryInfo) &&
            job.subcategoryInfo.length > 0
          ) {
            // Update each subcategory price proportionally
            const totalOldPrice = job.subcategoryInfo.reduce((sum, subcat) => {
              const price = subcat?.price || 0;
              return (
                sum +
                (typeof price === "number" ? price : parseFloat(price) || 0)
              );
            }, 0);

            if (totalOldPrice > 0) {
              const newSubcategoryInfo = job.subcategoryInfo.map((subcat) => {
                const oldSubcatPrice =
                  typeof subcat.price === "number"
                    ? subcat.price
                    : parseFloat(subcat.price) || 0;
                const proportion = oldSubcatPrice / totalOldPrice;
                const newSubcatPrice =
                  Math.round(newPrice * proportion * 100) / 100;
                return {
                  ...subcat,
                  price: newSubcatPrice,
                };
              });
              updateFields.subcategoryInfo = newSubcategoryInfo;
            }
          } else if (job.subcategoryInfo?.price) {
            // Handle subcategoryInfo as object
            updateFields["subcategoryInfo.price"] = newPrice;
          } else {
            // Fallback to job.price
            updateFields.price = newPrice;
          }

          // Update job in database
          await jobsCol.updateOne(
            { _id: new ObjectId(jobId) },
            { $set: updateFields }
          );

          // Update Payment Intent if exists
          if (job.paymentIntentId) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(
                job.paymentIntentId
              );

              // Only update if payment intent is in a state that allows updates
              // According to Stripe: Can update: requires_payment_method, requires_confirmation, requires_action
              // Cannot update: requires_capture, succeeded, canceled, processing
              const updatableStatuses = [
                "requires_payment_method",
                "requires_confirmation",
                "requires_action",
              ];

              if (updatableStatuses.includes(paymentIntent.status)) {
                const newAmountAgorot = Math.round(newPrice * 100);
                const platformFeeAgorot = Math.round(
                  (newAmountAgorot * getPlatformFeePercent()) / 100
                );

                // Update amount and application fee in payment intent
                await stripe.paymentIntents.update(job.paymentIntentId, {
                  amount: newAmountAgorot,
                  application_fee_amount: platformFeeAgorot,
                });

                // Also update payment record in database
                const paymentsCol = getCollectionPayments();
                await paymentsCol.updateOne(
                  { paymentIntentId: job.paymentIntentId },
                  {
                    $set: {
                      amount: newPrice,
                      totalAmount: newPrice,
                      updatedAt: new Date(),
                    },
                  }
                );
              } else if (paymentIntent.status === "requires_capture") {
                // Payment intent is already confirmed but not captured
                // We can't update the amount in Stripe, so we need to:
                // 1. Cancel the old payment intent
                // 2. Create a new payment intent with the new price
                // 3. Update the job and payment records

                const oldPaymentIntentId = job.paymentIntentId;
                const oldPrice = paymentIntent.amount / 100;

                // Get handyman account ID from payment intent
                const handymanAccountId =
                  paymentIntent.transfer_data?.destination;

                if (!handymanAccountId) {
                  console.error(
                    `Cannot recreate payment intent: no handyman account ID found`
                  );
                  // Fallback: just update DB
                  const paymentsCol = getCollectionPayments();
                  await paymentsCol.updateOne(
                    { paymentIntentId: oldPaymentIntentId },
                    {
                      $set: {
                        amount: newPrice,
                        totalAmount: newPrice,
                        updatedAt: new Date(),
                      },
                    }
                  );
                } else {
                  // Cancel the old payment intent
                  try {
                    await cancelEscrow(oldPaymentIntentId);
                    console.log(
                      `Cancelled old payment intent ${oldPaymentIntentId} due to price change`
                    );
                  } catch (cancelError) {
                    console.error(
                      `Error cancelling old payment intent:`,
                      cancelError.message
                    );
                    // Continue anyway - try to create new one
                  }

                  // Create new payment intent with new price
                  const newAmountAgorot = Math.round(newPrice * 100);
                  const platformFeeAgorot = Math.round(
                    (newAmountAgorot * getPlatformFeePercent()) / 100
                  );

                  try {
                    const newPaymentIntent = await createEscrowPaymentIntent({
                      amountAgorot: newAmountAgorot,
                      currency: "ils",
                      handymanAccountId: handymanAccountId,
                      platformFeeAgorot: platformFeeAgorot,
                      metadata: {
                        jobId: jobId,
                        clientId: job.clientId?.toString() || "",
                        handymanId:
                          job.handymanId?.toString() ||
                          (Array.isArray(job.handymanId) &&
                            job.handymanId[0]?.toString()) ||
                          "",
                      },
                    });

                    // Update job with new payment intent ID
                    await jobsCol.updateOne(
                      { _id: new ObjectId(jobId) },
                      {
                        $set: {
                          paymentIntentId: newPaymentIntent.paymentIntentId,
                          updatedAt: new Date(),
                        },
                      }
                    );

                    // Update payment record with new payment intent
                    const paymentsCol = getCollectionPayments();
                    await paymentsCol.updateOne(
                      { paymentIntentId: oldPaymentIntentId },
                      {
                        $set: {
                          paymentIntentId: newPaymentIntent.paymentIntentId,
                          amount: newPrice,
                          totalAmount: newPrice,
                          status: newPaymentIntent.status,
                          updatedAt: new Date(),
                        },
                      }
                    );

                    // If there's a saved payment method, attach it to the new payment intent
                    if (job.paymentMethodId) {
                      try {
                        // Get customer ID
                        const usersCol = getCollection();
                        const client = await usersCol.findOne({
                          _id: new ObjectId(job.clientId),
                        });
                        let customerId = client?.stripeCustomerId;

                        if (!customerId && client?.email) {
                          const customer = await stripe.customers.create({
                            email: client.email,
                            metadata: {
                              userId: job.clientId?.toString() || "",
                            },
                          });
                          customerId = customer.id;
                          await usersCol.updateOne(
                            { _id: new ObjectId(job.clientId) },
                            { $set: { stripeCustomerId: customerId } }
                          );
                        }

                        if (customerId) {
                          // Attach payment method to customer if needed
                          try {
                            await stripe.paymentMethods.attach(
                              job.paymentMethodId,
                              { customer: customerId }
                            );
                          } catch (attachError) {
                            // Might already be attached, continue
                          }

                          // Update new payment intent with customer and payment method
                          await stripe.paymentIntents.update(
                            newPaymentIntent.paymentIntentId,
                            {
                              customer: customerId,
                              payment_method: job.paymentMethodId,
                            }
                          );

                          // Confirm the new payment intent
                          await stripe.paymentIntents.confirm(
                            newPaymentIntent.paymentIntentId
                          );
                        }
                      } catch (confirmError) {
                        console.error(
                          `Error confirming new payment intent:`,
                          confirmError.message
                        );
                        // Continue - payment intent is created, can be confirmed later
                      }
                    }

                    console.log(
                      `Created new payment intent ${newPaymentIntent.paymentIntentId} with price ${newPrice} ₪ (old: ${oldPrice} ₪)`
                    );
                  } catch (createError) {
                    console.error(
                      `Error creating new payment intent:`,
                      createError.message
                    );
                    // Fallback: just update DB
                    const paymentsCol = getCollectionPayments();
                    await paymentsCol.updateOne(
                      { paymentIntentId: oldPaymentIntentId },
                      {
                        $set: {
                          amount: newPrice,
                          totalAmount: newPrice,
                          updatedAt: new Date(),
                        },
                      }
                    );
                  }
                }
              } else {
                console.warn(
                  `Cannot update payment intent ${job.paymentIntentId}: status is ${paymentIntent.status}. Only updating DB.`
                );

                // Still update payment record in database even if we can't update Stripe
                const paymentsCol = getCollectionPayments();
                await paymentsCol.updateOne(
                  { paymentIntentId: job.paymentIntentId },
                  {
                    $set: {
                      amount: newPrice,
                      totalAmount: newPrice,
                      updatedAt: new Date(),
                    },
                  }
                );
              }
            } catch (stripeError) {
              console.error("Error updating payment intent:", stripeError);
              // Continue even if payment intent update fails
            }
          }

          // Emit success to both handyman and client
          io.to(`job-${jobId}`).emit("price-change-response", {
            jobId,
            approved: true,
            percent,
            oldPrice,
            newPrice,
          });
        } else {
          // Client rejected - just notify handyman
          io.to(`job-${jobId}`).emit("price-change-response", {
            jobId,
            approved: false,
            percent,
            oldPrice,
            newPrice,
          });
        }
      } catch (error) {
        console.error("Error handling price change response:", error);
        socket.emit("error", { message: "שגיאה בעדכון המחיר" });
      }
    });
  });

  // Make io available globally for use in routes
  app.set("io", io);

  // ========== INQUIRIES ENDPOINTS ==========

  // Search users for mentions
  app.get("/api/users/search", async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      if (!q || q.trim().length < 1) {
        return res.json({ success: true, users: [] });
      }

      const usersCol = getCollection();
      const searchQuery = q.trim().toLowerCase();

      const users = await usersCol
        .find({
          $or: [
            { username: { $regex: searchQuery, $options: "i" } },
            { name: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
        })
        .limit(parseInt(limit))
        .toArray();

      // Return only necessary fields
      const sanitizedUsers = users.map((user) => ({
        _id: user._id,
        id: user._id?.toString(),
        username: user.username || user.name || "",
        name: user.name || user.username || "",
        email: user.email || "",
      }));

      res.json({ success: true, users: sanitizedUsers });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ success: false, message: "שגיאה בחיפוש משתמשים" });
    }
  });

  // Create inquiry
  app.post("/api/inquiries/create", async (req, res) => {
    try {
      const { title, content, senderName, userId, ArrIDS } = req.body;

      if (!title || !content || !senderName) {
        return res
          .status(400)
          .json({ success: false, message: "נושא, תוכן ושם שולח נדרשים" });
      }

      const inquiriesCol = getCollectionInquiries();
      const inquiry = {
        Title: title,
        Content: content,
        SenderName: senderName,
        userId: userId ? new ObjectId(userId) : null,
        ArrIDS:
          ArrIDS && Array.isArray(ArrIDS)
            ? ArrIDS.map((id) => new ObjectId(id))
            : [],
        createdAt: new Date(),
        status: "pending", // pending, responded, resolved, deleted
      };

      const result = await inquiriesCol.insertOne(inquiry);

      res.json({
        success: true,
        inquiryId: result.insertedId,
        message: "הפנייה נשלחה בהצלחה",
      });
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ success: false, message: "שגיאה ביצירת הפנייה" });
    }
  });

  // Get all inquiries (admin only)
  app.get("/api/inquiries", async (req, res) => {
    try {
      const { status } = req.query;
      const inquiriesCol = getCollectionInquiries();

      const query = {};
      if (status && status !== "all") {
        query.status = status;
      }

      const inquiries = await inquiriesCol
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      // Populate user info
      const usersCol = getCollection();
      const populatedInquiries = await Promise.all(
        inquiries.map(async (inquiry) => {
          let user = null;
          if (inquiry.userId) {
            user = await usersCol.findOne({ _id: inquiry.userId });
          }

          const mentionedUsers = [];
          if (inquiry.ArrIDS && inquiry.ArrIDS.length > 0) {
            const userIds = inquiry.ArrIDS.map((id) => new ObjectId(id));
            const users = await usersCol
              .find({ _id: { $in: userIds } })
              .toArray();
            mentionedUsers.push(...users);
          }

          return {
            ...inquiry,
            user: user
              ? {
                  _id: user._id,
                  username: user.username || user.name,
                  email: user.email,
                }
              : null,
            mentionedUsers: mentionedUsers.map((u) => ({
              _id: u._id,
              username: u.username || u.name,
              email: u.email,
            })),
          };
        })
      );

      res.json({ success: true, inquiries: populatedInquiries });
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ success: false, message: "שגיאה בטעינת הפניות" });
    }
  });

  // Delete inquiry
  app.delete("/api/inquiries/:inquiryId", async (req, res) => {
    try {
      const { inquiryId } = req.params;
      const inquiriesCol = getCollectionInquiries();

      await inquiriesCol.updateOne(
        { _id: new ObjectId(inquiryId) },
        { $set: { status: "deleted", deletedAt: new Date() } }
      );

      res.json({ success: true, message: "הפנייה נמחקה" });
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ success: false, message: "שגיאה במחיקת הפנייה" });
    }
  });

  // Send push notification for inquiry
  app.post("/api/inquiries/:inquiryId/send-push", async (req, res) => {
    try {
      const { inquiryId } = req.params;
      const { message, userId } = req.body;

      if (!message || !userId) {
        return res
          .status(400)
          .json({ success: false, message: "הודעה ומזהה משתמש נדרשים" });
      }

      const inquiriesCol = getCollectionInquiries();
      const inquiry = await inquiriesCol.findOne({
        _id: new ObjectId(inquiryId),
      });

      if (!inquiry) {
        return res
          .status(404)
          .json({ success: false, message: "פנייה לא נמצאה" });
      }

      // Send push notification
      try {
        await sendPushNotification(userId, message, {
          type: "inquiry-response",
          inquiryId: inquiryId,
        });
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
      }

      res.json({ success: true, message: "ההודעה נשלחה" });
    } catch (error) {
      console.error("Error sending push for inquiry:", error);
      res.status(500).json({ success: false, message: "שגיאה בשליחת ההודעה" });
    }
  });

  // Send email for inquiry (placeholder - endpoint empty as requested)
  app.post("/api/inquiries/:inquiryId/send-email", async (req, res) => {
    try {
      const { inquiryId } = req.params;
      const { emailContent, recipientEmail } = req.body;

      // TODO: Implement email sending when email service is ready
      // For now, just return success
      res.json({
        success: true,
        message: "שליחת מייל תתמוך בקרוב",
      });
    } catch (error) {
      console.error("Error sending email for inquiry:", error);
      res.status(500).json({ success: false, message: "שגיאה בשליחת המייל" });
    }
  });

  // Update inquiry status (e.g., mark as responded)
  app.patch("/api/inquiries/:inquiryId/status", async (req, res) => {
    try {
      const { inquiryId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: "סטטוס נדרש" });
      }

      const inquiriesCol = getCollectionInquiries();
      await inquiriesCol.updateOne(
        { _id: new ObjectId(inquiryId) },
        { $set: { status, updatedAt: new Date() } }
      );

      res.json({ success: true, message: "הסטטוס עודכן" });
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ success: false, message: "שגיאה בעדכון הסטטוס" });
    }
  });

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
