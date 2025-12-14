import { defineStore } from "pinia";
import axios from "axios";
import { URL } from "@/Url/url";

export const useMainStore = defineStore("main", {
  state: () => ({
    jobs: [],
    handymen: [],
    user: null,
    stats: { clients: 142, handymen: 148, users: 142 + 148 },
    isLoading: false,
  }),
  getters: {
    filteredJobs: (state) => (status, maxKm, isHendiman) => {
      let list = [...state.jobs];

      if (isHendiman) {
        // אם status הוא "all" או null, לא לסנן לפי סטטוס
        if (status && status !== "all") {
          list = list.filter((j) => j.status === status);
        }
        if (maxKm) {
          list = list.filter((j) => j.distanceKm <= maxKm);
        }
      }

      return list;
    },
    filteredHandymen: (state) => (filters) => {
      let list = [...state.handymen];

      if (filters?.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(
          (h) =>
            h.username?.toLowerCase().includes(q) ||
            h.name?.toLowerCase().includes(q)
        );
      }
      if (filters?.minRating) {
        list = list.filter((h) => h.rating >= filters.minRating);
      }
      if (filters?.minJobs) {
        list = list.filter((h) => h.jobsDone >= filters.minJobs);
      }

      return list;
    },
  },
  actions: {
    async fetchDashboardData(userId) {
      try {
        this.isLoading = true;
        const { data } = await axios.get(`${URL}/GetDataDeshboard/${userId}`);

        // עדכן את הנתונים
        this.user = data.User;
        this.jobs = data.Jobs || [];
        this.handymen = data.Hendimands || [];

        // עדכן את ה-stats אם הם מגיעים מהשרת
        if (data.stats) {
          this.stats = data.stats;
        }

        return data;
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    setJobs(jobs) {
      this.jobs = jobs;
    },
    setHandymen(handymen) {
      this.handymen = handymen;
    },
    setUser(user) {
      this.user = user;
    },
    //eslint-disable-next-line no-unused-vars
    setStats(stats) {
      this.stats.clients = 142;
      this.stats.handymen = 148;
      this.stats.users = 142 + 148;
      // console.log(this.stats, stats);
    },
  },
});
