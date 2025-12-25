const admin = require("firebase-admin");

// Get client URL from environment variable (set in server.js or .env)
// Default to relative path if not set (will resolve to origin)
const CLIENT_URL = process.env.CLIENT_URL || process.env.URL_CLIENT || "";

// Initialize Firebase Admin (only once)
let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized) return;

  // Check if Firebase Admin is already initialized
  if (admin.apps.length === 0) {
    // Initialize with service account or use default credentials
    // Option 1: Use service account JSON file (recommended for production)
    // const serviceAccount = require("../path/to/serviceAccountKey.json");
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount),
    // });

    // Option 2: Use environment variables (recommended for Heroku/cloud)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Option 3: Use default credentials (for local development with gcloud)
      admin.initializeApp();
    }
  }

  initialized = true;
}

/**
 * Send push notification to a user by their FCM token
 * @param {string} fcmToken - The FCM token of the user
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 * @returns {Promise}
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  try {
    initializeFirebaseAdmin();

    // ⚠️ CRITICAL for Web Push: Payload structure
    const message = {
      // Root-level notification - REQUIRED for Service Worker background messages
      notification: {
        title: title,
        body: body,
        icon: "/icon-192x192.png",
      },
      // Data field for navigation and app logic (optional)
      data: {
        ...data,
        // Convert all data values to strings (FCM requirement)
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      token: fcmToken,
      // ⚠️ CRITICAL for Web Push: webpush configuration - This is what makes it work when app is closed
      webpush: {
        // Notification payload specifically for web browsers - REQUIRED
        notification: {
          title: title,
          body: body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          dir: "rtl", // Right-to-left for Hebrew
          requireInteraction: false,
        },
        // FCM options for web - use full URL if available, otherwise relative path
        // Full URL is recommended for better reliability across different environments
        fcmOptions: {
          link: CLIENT_URL ? `${CLIENT_URL}/` : "/",
        },
        // ⚠️ CRITICAL: Headers for web push delivery - ensures reliable delivery
        headers: {
          Urgency: "high", // High urgency for immediate delivery (not "normal")
          TTL: "86400", // 24 hours in seconds - how long message is stored if device is offline
        },
      },
      // Android priority (for Android apps, not web)
      android: {
        priority: "high",
      },
      // APNS for iOS devices (if needed)
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    // Handle invalid token error
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      // Token is invalid, should be removed from database
      return { success: false, error: "invalid_token", shouldRemove: true };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to multiple users
 * @param {string[]} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 * @returns {Promise}
 */
async function sendPushNotificationToMultiple(
  fcmTokens,
  title,
  body,
  data = {}
) {
  try {
    initializeFirebaseAdmin();

    if (!fcmTokens || fcmTokens.length === 0) {
      return { success: false, error: "No tokens provided" };
    }

    const messages = fcmTokens.map((token) => ({
      // Root-level notification - REQUIRED for Service Worker background messages
      notification: {
        title: title,
        body: body,
        icon: "/icon-192x192.png",
      },
      // Data field for navigation and app logic
      data: {
        ...data,
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      token: token,
      // ⚠️ CRITICAL for Web Push: webpush configuration
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          dir: "rtl",
          requireInteraction: false,
        },
        fcmOptions: {
          link: CLIENT_URL ? `${CLIENT_URL}/` : "/",
        },
        headers: {
          Urgency: "high",
          TTL: "86400",
        },
      },
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    }));

    const response = await admin.messaging().sendAll(messages);
    return { success: true, responses: response.responses };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendPushNotificationToMultiple,
};
