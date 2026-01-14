import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import "./firebase";

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
