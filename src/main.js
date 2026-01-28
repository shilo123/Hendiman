import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import "./firebase";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

// Production diagnostics: report unexpected runtime errors to the server.
// Helps debug production-only issues (e.g., third-party scripts like core.js).
if (process.env.NODE_ENV === "production") {
  try {
    window.addEventListener("unhandledrejection", (event) => {
      try {
        const reason = event?.reason;
        fetch("/api/client-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "unhandledrejection",
            href: window.location.href,
            userAgent: navigator.userAgent,
            message: reason?.message || String(reason || ""),
            stack: reason?.stack,
            reason:
              typeof reason === "object"
                ? JSON.stringify(reason)
                : String(reason),
          }),
        }).catch(() => {});
      } catch (e) {
        // ignore
      }
    });

    window.addEventListener("error", (event) => {
      try {
        const err = event?.error;
        fetch("/api/client-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "error",
            href: window.location.href,
            userAgent: navigator.userAgent,
            message: event?.message,
            filename: event?.filename,
            lineno: event?.lineno,
            colno: event?.colno,
            stack: err?.stack,
          }),
        }).catch(() => {});
      } catch (e) {
        // ignore
      }
    });
  } catch (e) {
    // ignore
  }
}

// FontAwesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUpload,
  faInfoCircle,
  faCheckCircle,
  faComment,
  faCalendar,
  faStar,
  faStarHalfStroke,
  faShare,
  faBell,
  faMagnifyingGlass,
  faLocationDot,
  faScrewdriverWrench,
  faCircleUser,
  faEdit,
  faTrash,
  faPlus,
  faEnvelope,
  faBan,
  faUnlock,
  faMicrophone,
  faPaperPlane,
  faLock,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faEdit,
  faTrash,
  faPlus,
  faEye,
  faEyeSlash,
  faUpload,
  faInfoCircle,
  faCheckCircle,
  faComment,
  faCalendar,
  faStar,
  faStarHalfStroke,
  faShare,
  faBell,
  faMagnifyingGlass,
  faLocationDot,
  faScrewdriverWrench,
  faCircleUser,
  faEnvelope,
  faBan,
  faUnlock,
  faMicrophone,
  faPaperPlane,
  faLock,
  faXmark
);

const app = createApp(App);
const pinia = createPinia();

app.component("font-awesome-icon", FontAwesomeIcon);
app.use(pinia).use(router);

// Mount the app first
app.mount("#app");

// Keep splash screen visible until app is ready
if (Capacitor.isNativePlatform()) {
  // Wait for router to be ready, then hide splash screen
  router.isReady().then(() => {
    // Additional delay to ensure all components are rendered
    setTimeout(() => {
      SplashScreen.hide().catch(() => {
        // Ignore errors if splash screen is not available
      });
    }, 500);
  }).catch(() => {
    // If router fails, hide splash after a reasonable timeout
    setTimeout(() => {
      SplashScreen.hide().catch(() => {});
    }, 2000);
  });
}
