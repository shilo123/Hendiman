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

// Optional:
// If you want to customize the notification that appears when a message is received
// while the app is in the background, you can set a default background message handler
// here. For more information, see:
// https://firebase.google.com/docs/cloud-messaging/js/receive#handle_background_messages
messaging.onBackgroundMessage((payload) => {
  // Customize notification here
  const notificationTitle = payload.notification?.title || "הודעה חדשה";
  const notificationOptions = {
    body: payload.notification?.body || "יש לך הודעה חדשה",
    icon: payload.notification?.icon || "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: payload.data?.tag || "default",
    requireInteraction: true,
    dir: "rtl",
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
