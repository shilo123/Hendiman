import { createRouter, createWebHistory } from "vue-router";

// Public routes
import HomeView from "@/views/HomeView.vue";
import About from "@/views/About.vue";
import TermsOfService from "@/views/TermsOfService.vue";

// Auth routes
import LogIn from "@/views/Login/log-in.vue";
import Register from "@/views/Login/register.vue";

// Dashboard routes
import Dashboard from "@/views/Dashboard.vue";
import CreateCall from "@/views/CreateCall.vue";
import JobSummary from "@/views/JobSummary.vue";
import JobView from "@/views/JobView.vue";
import RatingPage from "@/views/RatingPage.vue";
import HandymanRatings from "@/views/HandymanRatings.vue";
import Payments from "@/views/Payments.vue";
import PersonalRequestCall from "@/views/PersonalRequestCall.vue";
import SubscriptionPaymentSettings from "@/views/SubscriptionPaymentSettings.vue";

// Admin routes
import AdminManager from "@/views/Admin-manager.vue";

// Stripe routes
import StripeSuccess from "@/views/StripeSuccess.vue";
import StripeRefresh from "@/views/StripeRefresh.vue";

const routes = [
  // Public routes
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
  {
    path: "/terms-of-service",
    name: "TermsOfService",
    component: TermsOfService,
  },

  // Auth routes
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

  // Dashboard routes (all require :id param)
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
    path: "/job-summary/:jobId",
    name: "JobSummary",
    component: JobSummary,
    props: true,
  },
  {
    path: "/job/:jobId",
    name: "JobView",
    component: JobView,
    props: true,
  },
  {
    path: "/Dashboard/:id/job-summary/:jobId",
    name: "JobSummaryLegacy",
    component: JobSummary,
    props: true,
  },
  {
    path: "/rating/:jobId",
    name: "RatingPage",
    component: RatingPage,
    props: true,
  },
  {
    path: "/Dashboard/:id/ratings",
    name: "HandymanRatings",
    component: HandymanRatings,
    props: true,
  },
  {
    path: "/Dashboard/:id/payments",
    name: "Payments",
    component: Payments,
    props: true,
  },
  {
    path: "/Dashboard/:id/subscription-payment-settings",
    name: "SubscriptionPaymentSettings",
    component: SubscriptionPaymentSettings,
    props: true,
  },
  {
    path: "/Dashboard/:id/personal-request/:handymanId",
    name: "PersonalRequestCall",
    component: PersonalRequestCall,
    props: true,
  },

  // Admin routes
  {
    path: "/admin-manager",
    name: "AdminManager",
    component: AdminManager,
  },

  // Stripe routes
  {
    path: "/stripe/success",
    name: "StripeSuccess",
    component: StripeSuccess,
  },
  {
    path: "/stripe/refresh",
    name: "StripeRefresh",
    component: StripeRefresh,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
