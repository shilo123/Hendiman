// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

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

// VAPID Key for Web Push Notifications (only for web)
const VAPID_KEY =
  "BN3ht8xCTjrn0Kpch6scCHTQTDQpiErIbRm7hoLzUtBLVbAJlbt8uNuFNSvbeVS5JT2H2XY7hz7C4kpfTkThAvE";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment and not in native app
let analytics = null;
if (typeof window !== "undefined" && !Capacitor.isNativePlatform()) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics initialization failed
  }
}

// Initialize Firebase Cloud Messaging
// In native apps (Android/iOS), FCM works through native plugins
// In web, it uses service workers
const isNative = Capacitor.isNativePlatform();
const isAndroid = Capacitor.getPlatform() === "android";
const isIOS = Capacitor.getPlatform() === "ios";

let messaging = null;
if (typeof window !== "undefined") {
  // For web platform, check for service worker support
  // For Android/iOS, we'll use native FCM (configured via google-services.json)
  // Firebase JS SDK can still work in native apps, but service worker is not available
  if (!isNative || (isAndroid && typeof navigator !== "undefined" && "serviceWorker" in navigator)) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      // Messaging not supported or already initialized
    }
  }
}

export { app, analytics, messaging, VAPID_KEY, getToken, onMessage, isNative, isAndroid, isIOS };
