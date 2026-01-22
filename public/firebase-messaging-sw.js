// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyAxeezzgGApMz6TNUHejV2QILSZHYJCRn4",
  authDomain: "handiman-243d8.firebaseapp.com",
  projectId: "handiman-243d8",
  storageBucket: "handiman-243d8.firebasestorage.app",
  messagingSenderId: "779398614816",
  appId: "1:779398614816:web:40a763fa2f8d29ab7fd145",
  measurementId: "G-VJQBL5RGHN",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle service worker updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      // Service worker is now active and controlling all clients
    })
  );
});

// Handle background messages when app is closed or in background
// ⚠️ CRITICAL: This handler MUST exist for notifications to work when app is closed
// Service Worker can ONLY show notifications if payload.notification exists
messaging.onBackgroundMessage((payload) => {
  // ⚠️ CRITICAL: Firebase automatically provides payload.notification when using notification field in message
  // This is REQUIRED - without notification field, Service Worker cannot show notification
  const notificationTitle =
    payload.notification?.title || payload.data?.title || "הודעה חדשה";
  const notificationBody =
    payload.notification?.body || payload.data?.body || "יש לך הודעה חדשה";
  const notificationIcon = payload.notification?.icon || "/icon-192x192.png";

  // Extract actions from payload if available
  const actions = payload.notification?.actions || [
    {
      action: "skip",
      title: "דלג",
      icon: "/icon-192x192.png"
    },
    {
      action: "accept",
      title: "קבל",
      icon: "/icon-192x192.png"
    },
    {
      action: "view",
      title: "צפה",
      icon: "/icon-192x192.png"
    }
  ];

  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    badge: "/icon-192x192.png",
    tag: payload.data?.jobId || payload.data?.tag || "default",
    requireInteraction: false,
    dir: "rtl",
    data: payload.data || {},
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    actions: actions, // Add action buttons
  };

  // ⚠️ MUST use self.registration.showNotification for background messages
  // This is the ONLY way to show notifications when app is closed
  // This works even when tab is closed, browser is in background, or screen is locked
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks and action button clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action; // Get the action button that was clicked
  const data = event.notification.data || {};

  // Handle different actions
  let url = self.location.origin;
  
  if (action === "accept") {
    // Handle accept action - navigate to accept page
    url = `${self.location.origin}/dashboard?action=accept&jobId=${data.jobId || ''}`;
  } else if (action === "view") {
    // Handle view action - navigate to view page
    url = `${self.location.origin}/dashboard?action=view&jobId=${data.jobId || ''}`;
  } else if (action === "skip") {
    // Handle skip action - just close notification
    return;
  }
  // If no action or default click, open dashboard

  // Open the app when notification is clicked
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url === self.location.origin && "focus" in client) {
            if ("navigate" in client) {
              return client.navigate(url).then(() => client.focus());
            }
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
