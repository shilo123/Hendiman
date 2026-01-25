import { defineStore } from "pinia";
import axios from "axios";
import { URL } from "@/Url/url";
import { loadCategories, getCategories } from "@/utils/categoriesLoader";
import logger from "@/utils/logger";

// Load categories from server
let categoriesData = { categories: [] };

// Initialize categories (async)
loadCategories().then((data) => {
  categoriesData = data;
});

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
function buildSubcategoryToCategoryMap(catsData) {
  const map = new Map();
  if (catsData && Array.isArray(catsData.categories)) {
    catsData.categories.forEach((cat) => {
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
}

// Build map when categories are loaded
let subcategoryToCategory = buildSubcategoryToCategoryMap({ categories: [] });

// Update map when categories are loaded
loadCategories().then((data) => {
  categoriesData = data;
  subcategoryToCategory = buildSubcategoryToCategoryMap(data);
});

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
          // Only use full categories (not subcategories)
          const fullCategoriesFromSpecs = Array.isArray(specialties)
            ? specialties.filter(
                (s) =>
                  (s && s.type === "category") ||
                  (s && s.isFullCategory === true)
              )
            : [];

          const mergedFullCategories = [
            ...(Array.isArray(fullCategories) ? fullCategories : []),
            ...fullCategoriesFromSpecs,
          ];

          const fullCategoryNames = (mergedFullCategories || [])
            .map((cat) => {
              if (typeof cat === "object" && cat.name) return cat.name.trim();
              if (typeof cat === "string") return cat.trim();
              return null;
            })
            .filter((name) => name && name.length > 0)
            .map((n) => n.toLowerCase());

          // Not using subcategories anymore - set to empty array
          const specialtyNames = [];

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
              // subcategoryInfo is an array, need to check all items
              const subcategoryInfoArray = Array.isArray(job.subcategoryInfo)
                ? job.subcategoryInfo
                : job.subcategoryInfo
                ? [job.subcategoryInfo]
                : [];

              // If no subcategoryInfo, check old format
              if (subcategoryInfoArray.length === 0) {
                const jobCategory = (job.category || "").trim().toLowerCase();

                // Only check if handyman has full category match
                const matchesFullCat =
                  fullCategoryNames.length === 0
                    ? false
                    : fullCategoryNames.includes(jobCategory);

                // Only return true if matches full category
                // If no specialties defined, show all jobs
                if (fullCategoryNames.length === 0) {
                  return true; // אין סינון - הצג את כל העבודות
                }
                return matchesFullCat;
              }

              // Check each subcategoryInfo item - ALL categories must match
              // Only match by full categories (not subcategories)
              return subcategoryInfoArray.every((subcatInfo) => {
                const jobCategory = (subcatInfo.category || "")
                  .trim()
                  .toLowerCase();

                // Only check if handyman has full category match
                const matchesFullCat =
                  fullCategoryNames.length === 0
                    ? false
                    : fullCategoryNames.includes(jobCategory);

                // Only return true if matches full category
                // If no specialties defined, show all jobs
                if (fullCategoryNames.length === 0) {
                  return true; // אין סינון - הצג את כל העבודות
                }
                return matchesFullCat;
              });
            });

          // סינון לפי סטטוס
          if (status && status !== "all") {
            // אם status הוא "open", הצג גם "open" וגם "quoted" עבודות
            if (status === "open") {
              list = list.filter((j) => j.status === "open" || j.status === "quoted");
            } else {
              list = list.filter((j) => j.status === status);
            }
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

        // מיון: קודם כל עבודות דחופות (urgent), ואז לפי מרחק
        const sorted = [...list].sort((a, b) => {
          // עבודות דחופות תמיד ראשונות
          const aUrgent = a.urgent === true;
          const bUrgent = b.urgent === true;
          if (aUrgent && !bUrgent) return -1;
          if (!aUrgent && bUrgent) return 1;

          // אם שתיהן דחופות או שתיהן לא דחופות, מיין לפי מרחק
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

      // מיין: לפי דירוג ואז לפי מרחק נסיעה, הנדימנים החסומים יופיעו אחרונים
      const sorted = [...list].sort((a, b) => {
        const aBlocked = a.isBlocked === true;
        const bBlocked = b.isBlocked === true;
        // אם אחד חסום והשני לא - החסום יופיע אחרון
        if (aBlocked && !bBlocked) return 1;
        if (!aBlocked && bBlocked) return -1;
        
        // אם שניהם לא חסומים, מיין לפי דירוג (גבוה יותר קודם)
        if (!aBlocked && !bBlocked) {
          const aRating = Number(a?.rating) || 0;
          const bRating = Number(b?.rating) || 0;
          if (bRating !== aRating) {
            return bRating - aRating; // דירוג גבוה יותר קודם
          }
          
          // אם הדירוג זהה, מיין לפי מרחק נסיעה (קרוב יותר קודם)
          const aTravelTime = Number(a?.travelTimeMinutes) ?? Infinity;
          const bTravelTime = Number(b?.travelTimeMinutes) ?? Infinity;
          if (aTravelTime !== bTravelTime) {
            return aTravelTime - bTravelTime; // קרוב יותר קודם
          }
        }
        
        // אם כל השווים, שמור על הסדר המקורי
        return 0;
      });

      return sorted;
    },
  },
  actions: {
    async checkActiveJob(userId) {
      try {
        const response = await axios.get(`${URL}/check-active-job/${userId}`);
        if (response.data && response.data.success) {
          return response.data;
        }
        return { success: false, hasActiveJob: false };
      } catch (error) {
        logger.error("Error checking active job:", error);
        return { success: false, hasActiveJob: false };
      }
    },
    async fetchDashboardData(userId, coordinates = null) {
      try {
        console.log("[STORE] fetchDashboardData started, userId:", userId, "coordinates:", coordinates);
        this.isLoading = true;

        // בנה את ה-URL עם קואורדינטות אם הן קיימות
        let url = `${URL}/GetDataDeshboard/${userId}`;
        if (coordinates && coordinates.lng && coordinates.lat) {
          url += `?lng=${coordinates.lng}&lat=${coordinates.lat}`;
        }

        console.log("[STORE] Fetching dashboard data from:", url);
        let data;
        try {
          const response = await axios.get(url);
          data = response.data;
          console.log("[STORE] Dashboard data received, success:", data?.success, "hasUser:", !!data?.User);
        } catch (axiosError) {
          console.error("[STORE] Error fetching dashboard data:", axiosError.response?.status, axiosError.message);
          // אם יש שגיאה 400 או 404, המשתמש לא נמצא או ה-ID לא תקין
          if (
            axiosError.response &&
            (axiosError.response.status === 400 ||
              axiosError.response.status === 404)
          ) {
            console.log("[STORE] User not found (400/404), returning null");
            return null;
          }
          // אם יש שגיאה אחרת, זרוק אותה
          throw axiosError;
        }

        // אם המשתמש לא נמצא או שיש שגיאה, החזר null
        if (!data || !data.success || !data.User) {
          console.log("[STORE] Invalid data received, returning null");
          return null;
        }

        // עדכן את הנתונים
        console.log("[STORE] Updating store with user data, jobs:", data.Jobs?.length || 0, "handymen:", data.Hendimands?.length || 0);
        this.user = data.User;
        this.jobs = data.Jobs || [];
        this.handymen = data.Hendimands || [];

        // ה-stats נשארים קשיחים (142, 148) ולא מתעדכנים מהשרת
        // אם (data.stats) {
        //   this.stats = data.stats;
        // }

        console.log("[STORE] fetchDashboardData completed successfully");
        return data;
      } catch (error) {
        console.error("[STORE] Fatal error in fetchDashboardData:", error);
        // אם יש שגיאה (כמו ID לא תקין), החזר null
        // אבל תמיד ודא ש-isLoading מוגדר ל-false
        this.isLoading = false;
        return null;
      } finally {
        console.log("[STORE] Setting isLoading to false");
        // ודא ש-isLoading תמיד מוגדר ל-false גם אם יש שגיאה
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
      //
    },
    async fetchFilteredJobsForHandyman({
      status = "all",
      maxKm = null,
      coordinates = null,
      workType = null,
      minPrice = null,
      maxPrice = null,
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
        // Add handymanId to filter by specialties
        if (this.user && this.user._id) {
          params.push(`handymanId=${this.user._id}`);
        }
        // Add workType filter if specified
        if (workType && workType !== "") {
          params.push(`workType=${encodeURIComponent(workType)}`);
        }
        // Add price filters if specified
        if (minPrice !== null && minPrice !== undefined) {
          params.push(`minPrice=${minPrice}`);
        }
        if (maxPrice !== null && maxPrice !== undefined) {
          params.push(`maxPrice=${maxPrice}`);
        }
        const queryString = params.length ? `?${params.join("&")}` : "";
        const url = `${URL}/jobs/filter${queryString}`;

        const { data } = await axios.get(url);
        if (data.success) {
          this.jobs = data.jobs || [];

          if (this.jobs.length > 0) {
            this.jobs.forEach((job) => {});
          } else {
          }
        } else {
        }
        return data;
      } catch (error) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchHandymen(page = 1, coordinates = null, userId = null) {
      try {
        this.isLoading = true;

        // בנה את ה-URL עם קואורדינטות אם הן קיימות
        let url = `${URL}/handymen?page=${page}`;
        if (coordinates && coordinates.lng && coordinates.lat) {
          url += `&lng=${coordinates.lng}&lat=${coordinates.lat}`;
        }
        // Add userId to mark blocked handymen
        if (userId) {
          url += `&userId=${userId}`;
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
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
