import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";

// FontAwesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUpload,
  faInfoCircle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

library.add(faEye, faEyeSlash, faUpload, faInfoCircle, faCheckCircle);

const app = createApp(App);
const pinia = createPinia();

app.component("font-awesome-icon", FontAwesomeIcon);
app.use(pinia).use(router).mount("#app");
