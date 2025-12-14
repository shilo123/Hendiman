import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LogIn from "@/views/Login/log-in.vue";
import Register from "@/views/Login/register.vue";
import Dashboard from "@/views/Dashboard.vue";
import CreateCall from "@/views/CreateCall.vue";
import SelectHandyman from "@/views/SelectHandyman.vue";

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
    path: "/Dashboard/:id/select-handyman",
    name: "SelectHandyman",
    component: SelectHandyman,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
