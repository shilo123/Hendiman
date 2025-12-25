import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LogIn from "@/views/Login/log-in.vue";
import Register from "@/views/Login/register.vue";
import Dashboard from "@/views/Dashboard.vue";
import CreateCall from "@/views/CreateCall.vue";
import JobSummary from "@/views/JobSummary.vue";
import HandymanRatings from "@/views/HandymanRatings.vue";
import About from "@/views/About.vue";
import AdminManager from "@/views/Admin-manager.vue";
import Payments from "@/views/Payments.vue";
import PersonalRequestCall from "@/views/PersonalRequestCall.vue";
const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/log-in",
    name: "logIn",
    component: LogIn,
  },
  {
    path: "/login",
    name: "login",
    component: LogIn,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/Dashboard/:id",
    name: "Dashboard",
    component: Dashboard,
    props: true,
  },
  {
    path: "/Dashboard/:id/create-call",
    name: "CreateCall",
    component: CreateCall,
    props: true,
  },
  {
    path: "/Dashboard/:id/job-summary/:jobId",
    name: "JobSummary",
    component: JobSummary,
    props: true,
  },
  {
    path: "/Dashboard/:id/ratings",
    name: "HandymanRatings",
    component: HandymanRatings,
    props: true,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
  {
    path: "/admin-manager",
    name: "AdminManager",
    component: AdminManager,
  },
  {
    path: "/Dashboard/:id/payments",
    name: "Payments",
    component: Payments,
    props: true,
  },
  {
    path: "/Dashboard/:id/personal-request/:handymanId",
    name: "PersonalRequestCall",
    component: PersonalRequestCall,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
