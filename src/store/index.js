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
      (state) => (status, maxKm, isHendiman, specialties, fullCategories) => {
        let list = [...state.jobs];

        if (isHendiman) {
          // סינון לפי קטגוריות שלימות - אם הנדימן בחר קטגוריה שלימה, כל העבודות מאותה קטגוריה יופיעו
          if (
            fullCategories &&
            Array.isArray(fullCategories) &&
            fullCategories.length > 0
          ) {
            const fullCategoryNames = fullCategories
              .map((cat) => {
                if (typeof cat === "object" && cat.name) {
                  return cat.name.trim();
                }
                if (typeof cat === "string") {
                  return cat.trim();
                }
                return null;
              })
              .filter((name) => name && name.length > 0);

            if (fullCategoryNames.length > 0) {
              // נבדוק את הקטגוריה של העבודה
              list = list.filter((job) => {
                const jobCategory =
                  job.subcategoryInfo?.category || job.category || null;
                if (!jobCategory) {
                  // אם אין קטגוריה בעבודה, נבדוק לפי תת-קטגוריה
                  return false;
                }

                const jobCategoryLower = jobCategory.trim().toLowerCase();
                return fullCategoryNames.some((fullCatName) => {
                  const fullCatNameLower = fullCatName.trim().toLowerCase();
                  return jobCategoryLower === fullCatNameLower;
                });
              });
            }
          }

          // סינון לפי התמחויות של ההנדימן (תת-קטגוריות)
          if (
            specialties &&
            Array.isArray(specialties) &&
            specialties.length > 0
          ) {
            const specialtyNames = specialties
              .map((spec) => {
                if (typeof spec === "object" && spec.name) {
                  return spec.name.trim();
                }
                if (typeof spec === "string") {
                  return spec.trim();
                }
                return null;
              })
              .filter((name) => name && name.length > 0);

            if (specialtyNames.length > 0) {
              // אם יש גם קטגוריות שלימות וגם תת-קטגוריות, נאחד את התוצאות (OR logic)
              // כלומר, עבודה תופיע אם היא מתאימה לקטגוריה שלימה או לתת-קטגוריה
              const jobsFromFullCategories =
                list.length < state.jobs.length ? list : [];
              const jobsFromSubcategories = [...state.jobs].filter((job) => {
                const jobSubcategoryName =
                  job.subcategoryInfo?.name || job.subcategoryName || null;
                if (!jobSubcategoryName) return false;
                const jobSubcategory = jobSubcategoryName.trim().toLowerCase();

                return specialtyNames.some((specName) => {
                  const specNameLower = specName.trim().toLowerCase();
                  // התאמה מדויקת
                  if (jobSubcategory === specNameLower) return true;
                  // התאמה חלקית - אם שם העבודה מכיל את שם ההתמחות או להיפך
                  if (
                    jobSubcategory.includes(specNameLower) ||
                    specNameLower.includes(jobSubcategory)
                  ) {
                    return true;
                  }
                  // בדיקה נוספת - אם יש מילים משותפות
                  const jobWords = jobSubcategory.split(/\s+/);
                  const specWords = specNameLower.split(/\s+/);
                  const hasCommonWords = jobWords.some((word) =>
                    specWords.includes(word)
                  );
                  if (
                    hasCommonWords &&
                    jobWords.length > 0 &&
                    specWords.length > 0
                  ) {
                    return true;
                  }
                  return false;
                });
              });

              // אם יש גם קטגוריות שלימות וגם תת-קטגוריות, נאחד את התוצאות
              if (
                fullCategories &&
                Array.isArray(fullCategories) &&
                fullCategories.length > 0 &&
                jobsFromFullCategories.length > 0
              ) {
                // נאחד את שתי הרשימות (ללא כפילויות)
                const combinedJobs = [...jobsFromFullCategories];
                jobsFromSubcategories.forEach((job) => {
                  if (
                    !combinedJobs.find(
                      (j) => j._id === job._id || j.id === job.id
                    )
                  ) {
                    combinedJobs.push(job);
                  }
                });
                list = combinedJobs;
              } else {
                // אם אין קטגוריות שלימות, נשתמש רק בתת-קטגוריות
                list = jobsFromSubcategories;
              }
            }
          }

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
