const admin = require("firebase-admin");

// Get client URL from environment variable (set in server.js or .env)
// Default to relative path if not set (will resolve to origin)
const CLIENT_URL = process.env.CLIENT_URL || process.env.URL_CLIENT || "";

// Initialize Firebase Admin (only once)
let initialized = false;
let initializationError = null;

function initializeFirebaseAdmin() {
  // If already initialized successfully, return
  if (initialized && admin.apps.length > 0) {
    return;
  }

  // If initialization failed before, throw the error
  if (initialized && initializationError) {
    throw initializationError;
  }

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
      try {
        console.log("[Firebase] Initializing from FIREBASE_SERVICE_ACCOUNT environment variable");
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        // Ensure projectId is set (from service account or env variable)
        const projectId =
          serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;
        
        console.log("[Firebase] Project ID:", projectId);
        console.log("[Firebase] Client Email:", serviceAccount.client_email);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: projectId,
        });
        
        console.log("[Firebase] ✅ Successfully initialized!");
      } catch (error) {
        console.error("[Firebase] ❌ Initialization failed:", error.message);
        console.error("[Firebase] Error stack:", error.stack);
        initializationError = new Error(
          `Firebase initialization failed: ${error.message}`
        );
        initialized = true;
        throw initializationError;
      }
    } else {
      // Option 3: Use default credentials (for local development with gcloud)
      // Note: This requires Google Cloud credentials to be configured
      try {
        // Try to get project ID from environment or service account
        const projectId =
          process.env.FIREBASE_PROJECT_ID ||
          process.env.GOOGLE_CLOUD_PROJECT ||
          process.env.GCLOUD_PROJECT;

        const initOptions = {};
        if (projectId) {
          initOptions.projectId = projectId;
        }

        admin.initializeApp(initOptions);
      } catch (error) {
        // Don't throw error - allow app to continue without push notifications
        initializationError = new Error(
          `Firebase לא מוגדר. יש להגדיר FIREBASE_SERVICE_ACCOUNT או FIREBASE_PROJECT_ID.`
        );
        initialized = true;
        // Don't throw - allow app to continue
      }
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
  // 🔍 LOG: Start of push notification
  console.log("[Push] 📤 START | Token:", fcmToken ? `${fcmToken.substring(0, 30)}...` : "❌ NO TOKEN");
  console.log("[Push] 📤 START | Title:", title, "| Body:", body);
  
  try {
    try {
      initializeFirebaseAdmin();
    } catch (initError) {
      console.error("[Push] ❌ Firebase init error:", initError.message);
      return { success: false, error: initError.message, silent: true };
    }

    // Check if Firebase is actually initialized and has project ID
    if (!admin.apps.length || admin.apps.length === 0) {
      console.error("[Push] ❌ Firebase not initialized");
      return {
        success: false,
        error: "Firebase not initialized",
        silent: true,
      };
    }

    // Check if project ID is available (needed for messaging)
    const app = admin.app();
    const projectId = app?.options?.projectId;
    if (!projectId) {
      console.error("[Push] ❌ Firebase project ID not configured");
      return {
        success: false,
        error: "Firebase project ID not configured",
        silent: true,
      };
    }
    
    console.log("[Push] ✅ Firebase ready | Project:", projectId);

    // ⚠️ CRITICAL: Payload structure for Native Android apps only
    // For native Android apps with Capacitor Push Notifications:
    // - Root-level notification is REQUIRED for the plugin to display notifications
    // - Data field contains action buttons info for native app to handle
    // - NOTE: icon field is NOT supported in root-level notification for native apps
    const message = {
      // Root-level notification - REQUIRED for Capacitor Push Notifications plugin
      // This is what makes notifications appear in native Android apps
      // NOTE: Do NOT include 'icon' here - it's not supported for native apps
      notification: {
        title: title,
        body: body,
      },
      // Data field - REQUIRED for native apps to handle notifications when app is in foreground
      // Also contains action buttons info for the app to create notification with actions
      data: {
        title: title,
        body: body,
        // Action buttons info - will be used by native app to create notification with actions
        action_buttons: JSON.stringify([
          { action: "skip", title: "דלג" },
          { action: "accept", title: "קבל" },
          { action: "view", title: "צפה" }
        ]),
        ...data,
        // Convert all data values to strings (FCM requirement)
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      token: fcmToken,
      // Android priority - CRITICAL for native Android apps
      // Capacitor Push Notifications plugin uses the root-level notification field
      android: {
        priority: "high",
        // Note: Action buttons are included in data.action_buttons
        // The native app will need to create notification with actions using this data
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
            alert: {
              title: title,
              body: body,
            },
          },
        },
      },
    };

    // 🔍 LOG: Before sending to FCM
    console.log("[Push] 🚀 Sending to FCM | Token length:", fcmToken?.length || 0);
    
    const response = await admin.messaging().send(message);
    
    // 🔍 LOG: Success
    console.log("[Push] ✅ SUCCESS | Message ID:", response);
    return { success: true, messageId: response };
  } catch (error) {
    // 🔍 LOG: Error details
    console.error("[Push] ❌ ERROR | Code:", error.code, "| Message:", error.message);
    
    // Handle invalid token error
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      console.log("[Push] ⚠️ Invalid token - should be removed from DB");
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
      // Root-level notification - REQUIRED for native Android apps
      // NOTE: Do NOT include 'icon' here - it's not supported for native apps
      notification: {
        title: title,
        body: body,
      },
      // Data field for navigation and app logic
      data: {
        title: title,
        body: body,
        // Action buttons info - will be used by native app to create notification with actions
        action_buttons: JSON.stringify([
          { action: "skip", title: "דלג" },
          { action: "accept", title: "קבל" },
          { action: "view", title: "צפה" }
        ]),
        ...data,
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
      },
      token: token,
      android: {
        priority: "high",
        // Note: Action buttons are included in data.action_buttons
        // The native app will need to create notification with actions using this data
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
