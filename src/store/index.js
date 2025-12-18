import { defineStore } from "pinia";
import axios from "axios";
import categoriesData from "@/APIS/Categorhs.json";
import { URL } from "@/Url/url";

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// מפה מתת־קטגוריה לקטגוריה (להשלמה כששדה category חסר בעבודה)
const subcategoryToCategory = (() => {
  const map = new Map();
  if (categoriesData && Array.isArray(categoriesData.categories)) {
    categoriesData.categories.forEach((cat) => {
      if (!cat?.name || !Array.isArray(cat.subcategories)) return;
      const catName = String(cat.name).trim().toLowerCase();
      cat.subcategories.forEach((sub) => {
        if (sub?.name) {
          const subName = String(sub.name).trim().toLowerCase();
          map.set(subName, catName);
        }
      });
    });
  }
  return map;
})();

export const useMainStore = defineStore("main", {
  state: () => ({
    jobs: [],
    handymen: [],
    user: null,
    stats: { clients: 142, handymen: 148, users: 142 + 148 },
    isLoading: false,
    handymenPagination: {
      page: 1,
      limit: 5,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }),
  getters: {
    filteredJobs:
      (state) =>
      (
        status,
        maxKm,
        isHendiman,
        specialties,
        fullCategories,
        handymanCoords = null
      ) => {
        let list = [...state.jobs];

        if (isHendiman) {
          // הפקה של קטגוריות שלימות ותתי-קטגוריות מתוך specialties עם type
          const fullCategoriesFromSpecs = Array.isArray(specialties)
            ? specialties.filter(
                (s) =>
                  (s && s.type === "category") ||
                  (s && s.isFullCategory === true)
              )
            : [];

          const subCategoriesFromSpecs = Array.isArray(specialties)
            ? specialties.filter(
                (s) =>
                  !s ||
                  s.type === "subCategory" ||
                  (!s.type && !s.isFullCategory)
              )
            : [];

          const mergedFullCategories = [
            ...(Array.isArray(fullCategories) ? fullCategories : []),
            ...fullCategoriesFromSpecs,
          ];

          const mergedSpecialties =
            subCategoriesFromSpecs.length > 0
              ? subCategoriesFromSpecs
              : specialties;

          const fullCategoryNames = (mergedFullCategories || [])
            .map((cat) => {
              if (typeof cat === "object" && cat.name) return cat.name.trim();
              if (typeof cat === "string") return cat.trim();
              return null;
            })
            .filter((name) => name && name.length > 0)
            .map((n) => n.toLowerCase());

          const specialtyNames = (mergedSpecialties || [])
            .map((spec) => {
              if (typeof spec === "object" && spec.name)
                return spec.name.trim();
              if (typeof spec === "string") return spec.trim();
              return null;
            })
            .filter((name) => name && name.length > 0)
            .map((n) => n.toLowerCase());

          list = state.jobs
            .map((job) => {
              if (
                handymanCoords &&
                handymanCoords.lat &&
                handymanCoords.lng &&
                job?.coordinates?.lat !== undefined &&
                job?.coordinates?.lng !== undefined &&
                (job.distanceKm === undefined || job.distanceKm === null)
              ) {
                const d = haversineKm(
                  handymanCoords.lat,
                  handymanCoords.lng,
                  job.coordinates.lat,
                  job.coordinates.lng
                );
                return { ...job, distanceKm: d };
              }
              return job;
            })
            .filter((job) => {
              const jobCategory =
                job.subcategoryInfo?.category || job.category || "";
              const jobCategoryLower = jobCategory.trim().toLowerCase();
              const jobSubcategoryName =
                job.subcategoryInfo?.name || job.subcategoryName || "";
              const jobSubLower = jobSubcategoryName.trim().toLowerCase();
              const jobCategoryFromSub =
                jobSubLower && subcategoryToCategory.get(jobSubLower);
              const resolvedJobCategory =
                jobCategoryLower || jobCategoryFromSub || "";

              const matchesFullCat =
                fullCategoryNames.length === 0
                  ? false
                  : fullCategoryNames.includes(resolvedJobCategory);

              const matchesSubCat =
                specialtyNames.length === 0
                  ? false
                  : specialtyNames.some((spec) => {
                      if (jobSubLower === spec) return true;
                      if (
                        jobSubLower.includes(spec) ||
                        spec.includes(jobSubLower)
                      )
                        return true;
                      const jobWords = jobSubLower.split(/\s+/);
                      const specWords = spec.split(/\s+/);
                      return jobWords.some((w) => specWords.includes(w));
                    });

              // OR logic: קטגוריה שלימה או תת-קטגוריה
              if (
                fullCategoryNames.length === 0 &&
                specialtyNames.length === 0
              ) {
                return true; // אין סינון
              }
              return matchesFullCat || matchesSubCat;
            });

          // סינון לפי סטטוס
          if (status && status !== "all") {
            list = list.filter((j) => j.status === status);
          }

          // סינון לפי מרחק
          if (maxKm) {
            list = list.filter((j) => {
              // אם אין distanceKm, נשאיר את העבודה
              if (j.distanceKm === undefined || j.distanceKm === null) {
                return true;
              }
              return j.distanceKm <= maxKm;
            });
          }
        } else {
          // אם זה לא הנדימן, רק סנן לפי סטטוס אם יש
          if (status && status !== "all") {
            list = list.filter((j) => j.status === status);
          }
        }

        // מיון לפי מרחק (אם קיים), אחרת שימור סדר
        const sorted = [...list].sort((a, b) => {
          const da = a.distanceKm;
          const db = b.distanceKm;
          if (da === undefined || da === null) return 1;
          if (db === undefined || db === null) return -1;
          return da - db;
        });

        return sorted;
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
    async fetchDashboardData(userId, coordinates = null) {
      try {
        this.isLoading = true;

        // בנה את ה-URL עם קואורדינטות אם הן קיימות
        let url = `${URL}/GetDataDeshboard/${userId}`;
        if (coordinates && coordinates.lng && coordinates.lat) {
          url += `?lng=${coordinates.lng}&lat=${coordinates.lat}`;
        }

        let data;
        try {
          const response = await axios.get(url);
          data = response.data;
        } catch (axiosError) {
          // אם יש שגיאה 400 או 404, המשתמש לא נמצא או ה-ID לא תקין
          if (
            axiosError.response &&
            (axiosError.response.status === 400 ||
              axiosError.response.status === 404)
          ) {
            return null;
          }
          // אם יש שגיאה אחרת, זרוק אותה
          throw axiosError;
        }

        // אם המשתמש לא נמצא או שיש שגיאה, החזר null
        if (!data || !data.success || !data.User) {
          return null;
        }

        // עדכן את הנתונים
        this.user = data.User;
        this.jobs = data.Jobs || [];
        this.handymen = data.Hendimands || [];

        // ה-stats נשארים קשיחים (142, 148) ולא מתעדכנים מהשרת
        // אם (data.stats) {
        //   this.stats = data.stats;
        // }

        return data;
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // אם יש שגיאה (כמו ID לא תקין), החזר null
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    setJobs(jobs) {
      this.jobs = jobs || [];
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
    async fetchFilteredJobsForHandyman({
      status = "all",
      maxKm = null,
      coordinates = null,
    }) {
      try {
        this.isLoading = true;
        const params = [];
        if (status) params.push(`status=${status}`);
        if (maxKm) params.push(`maxKm=${maxKm}`);
        if (coordinates && coordinates.lng && coordinates.lat) {
          params.push(`lng=${coordinates.lng}`);
          params.push(`lat=${coordinates.lat}`);
        }
        const queryString = params.length ? `?${params.join("&")}` : "";
        const url = `${URL}/jobs/filter${queryString}`;

        const { data } = await axios.get(url);
        if (data.success) {
          this.jobs = data.jobs || [];
        } else {
          console.error("Failed to fetch filtered jobs:", data.message);
        }
        return data;
      } catch (error) {
        console.error("Error fetching filtered jobs for handyman:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchHandymen(page = 1, coordinates = null) {
      try {
        this.isLoading = true;

        // בנה את ה-URL עם קואורדינטות אם הן קיימות
        let url = `${URL}/handymen?page=${page}`;
        if (coordinates && coordinates.lng && coordinates.lat) {
          url += `&lng=${coordinates.lng}&lat=${coordinates.lat}`;
        }

        const { data } = await axios.get(url);

        if (data.success) {
          this.handymen = data.handymen || [];
          this.handymenPagination = {
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
            hasNext: data.pagination.hasNext,
            hasPrev: data.pagination.hasPrev,
          };
        } else {
          this.toast.showError(data.message);
          this.$router.push("/");
        }

        return data;
      } catch (error) {
        console.error("Error fetching handymen:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
