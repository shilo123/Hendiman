import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import "./firebase";

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
  faUnlock
);

const app = createApp(App);
const pinia = createPinia();

app.component("font-awesome-icon", FontAwesomeIcon);
app.use(pinia).use(router).mount("#app");
