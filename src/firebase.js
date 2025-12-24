// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxeezzgGApMz6TNUHejV2QILSZHYJCRn4",
  authDomain: "handiman-243d8.firebaseapp.com",
  projectId: "handiman-243d8",
  storageBucket: "handiman-243d8.firebasestorage.app",
  messagingSenderId: "779398614816",
  appId: "1:779398614816:web:40a763fa2f8d29ab7fd145",
  measurementId: "G-VJQBL5RGHN",
};

// VAPID Key for Web Push Notifications
const VAPID_KEY =
  "BN3ht8xCTjrn0Kpch6scCHTQTDQpiErIbRm7hoLzUtBLVbAJlbt8uNuFNSvbeVS5JT2H2XY7hz7C4kpfTkThAvE";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Firebase Cloud Messaging and get a token
let messaging = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);

    // Register service worker for Firebase Messaging
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          // Service worker registered successfully
        })
        .catch((error) => {
          // Service worker registration failed
        });
    }
  } catch (error) {
    // Messaging not supported or already initialized
  }
}

export { app, analytics, messaging, VAPID_KEY, getToken, onMessage };
