const admin = require("firebase-admin");

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

    const message = {
      // ⚠️ CRITICAL: notification field is REQUIRED for background messages (when app is closed)
      // Service Worker can ONLY show notifications if payload.notification exists
      notification: {
        title: title,
        body: body,
        icon: "/icon-192x192.png",
      },
      // Additional data for the app to use (optional)
      data: {
        ...data,
        // Convert all data values to strings (FCM requirement)
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      token: fcmToken,
      // Android priority - ensures high priority delivery
      android: {
        priority: "high",
      },
      // Web push specific options - REQUIRED for web browsers
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          dir: "rtl", // Right-to-left for Hebrew
          requireInteraction: false,
        },
        fcmOptions: {
          link: "/", // Link to open when notification is clicked
        },
        // Add priority headers for web push
        headers: {
          Urgency: "high",
        },
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
      // ⚠️ CRITICAL: notification field is REQUIRED for background messages
      notification: {
        title: title,
        body: body,
        icon: "/icon-192x192.png",
      },
      data: {
        ...data,
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      token: token,
      android: {
        priority: "high",
      },
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
          link: "/",
        },
        headers: {
          Urgency: "high",
        },
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
