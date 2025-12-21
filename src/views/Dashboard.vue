<template>
  <div class="dash" dir="rtl">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="loading-text">טוען נתונים...</p>
      </div>
    </div>

    <!-- TOP BAR -->
    <DashboardTopBar
      :me="me"
      :isHendiman="isHendiman"
      :isAvailable="isAvailable"
      :stats="stats"
      :hasActiveJob="!!currentAssignedJob"
      :isChatMinimized="isChatMinimized"
      @open-profile="onOpenProfile"
      @open-handymen-chat="onOpenHandymenChat"
      @open-all-users-chat="onOpenAllUsersChat"
      @view-ratings="onViewRatings"
      @return-to-job="onReturnToJob"
    />

    <!-- MAIN -->
    <main class="grid">
      <!-- Job Chat (when job is assigned) -->
      <JobChat
        v-if="currentAssignedJob && !isChatMinimized"
        :job="currentAssignedJob"
        :isHandyman="isHendiman"
        @minimize="isChatMinimized = true"
        @status-updated="onJobStatusUpdated"
        @rating-submitted="onRatingSubmitted"
        @cancel-job="onCancelJob"
      />

      <!-- Regular Dashboard (when no assigned job) -->
      <template v-else>
        <!-- CLIENT: Create Call Button (above jobs - mobile only) -->
        <ClientActions
          v-if="!isHendiman"
          @create-call="onCreateCallCta"
          class="client-actions-top"
        />
        <!-- LEFT ~60% JOBS -->
        <JobsSection
          :isHendiman="isHendiman"
          :filteredJobs="pagedJobs"
          :jobsPagination="jobsPagination"
          :handymanCoords="
            isHendiman
              ? store.user?.location?.coordinates
                ? {
                    lng: store.user.location.coordinates[0],
                    lat: store.user.location.coordinates[1],
                  }
                : store.user?.coordinates || null
              : null
          "
          :statusTabsWithCounts="statusTabsWithCounts"
          :activeStatus="activeStatus"
          :handymanFilters="handymanFilters"
          @refresh="onRefresh"
          @pick-status="onPickStatus"
          @change-km="onChangeKm"
          @reset-km="onResetKm"
          @skip="onSkip"
          @accept="onAccept"
          @view="onView"
          @next-jobs-page="onJobsNextPage"
          @prev-jobs-page="onJobsPrevPage"
        />

        <!-- RIGHT SIDE -->
        <aside class="side">
          <!-- CLIENT: Create Call Button (desktop only) -->
          <ClientActions
            v-if="!isHendiman"
            @create-call="onCreateCallCta"
            class="client-actions-desktop"
          />
          <!-- CLIENT: handymen in area + action buttons -->
          <section v-if="!isHendiman" class="panel">
            <div class="panel__head">
              <h2 class="h2">
                הנדימנים באזורך
                <span v-if="handymenPagination.total" class="h2__count"
                  >({{ handymenPagination.total }})</span
                >
              </h2>
              <p class="sub">
                הנדימנים הזמינים באזור שלך · לחץ על כפתור לפעולה
              </p>
            </div>

            <HandymenList
              :filteredHandymen="filteredHandymen"
              :pagination="handymenPagination"
              @view-details="onViewHandymanDetails"
              @open-chat="onOpenUserChat"
              @personal-request="onPersonalRequest"
              @next-page="onNextPage"
              @prev-page="onPrevPage"
            />
          </section>

          <!-- HANDYMAN: quick profile & notes -->
          <section v-else class="panel">
            <div class="panel__head">
              <h2 class="h2">כלים להנדימן</h2>
              <p class="sub">עבודות מופיעות רק לפי ההתמחויות שבחרת בהרשמה</p>
            </div>

            <HandymanTools
              :specialties="me.specialties"
              @edit-profile="onGoProfile"
              @open-chat="onOpenHandymenChat"
            />
          </section>
        </aside>
        <ViewHandymanDetails
          v-if="handymanDetails"
          :handymanDetails="handymanDetails"
          @close="onCloseHandymanDetails"
          @book="onBookHandyman"
          @block="onBlockHandymanFromModal"
        />
        <ViewJob
          v-if="jobDetails"
          :jobDetails="jobDetails"
          :isHendiman="isHendiman"
          :getStatusLabel="getStatusLabel"
          @close="onCloseJobDetails"
          @accept="onAcceptJobFromModal"
          @skip="onSkipJobFromModal"
        />
        <ProfileSheet
          :visible="showProfileSheet"
          :user="store.user"
          :isHandyman="isHendiman"
          @close="showProfileSheet = false"
          @save="onSaveProfile"
        />
        <!-- Job Cancelled Modal -->
        <div v-if="showJobCancelledModal" class="jobCancelledModal" dir="rtl">
          <div
            class="jobCancelledModal__backdrop"
            @click="showJobCancelledModal = false"
          />
          <div class="jobCancelledModal__content">
            <div class="jobCancelledModal__icon">⚠️</div>
            <h2 class="jobCancelledModal__title">העבודה בוטלה</h2>
            <p class="jobCancelledModal__message">
              <span v-if="cancelledBy === 'handyman'">
                מצטערים, אך ההנדימן ביטל את העבודה
              </span>
              <span v-else-if="cancelledBy === 'client'">
                מצטערים, אך הלקוח ביטל את העבודה
              </span>
            </p>
            <button
              class="jobCancelledModal__btn"
              type="button"
              @click="handleJobCancelledClose"
            >
              הבנתי
            </button>
          </div>
        </div>
      </template>
    </main>

    <!-- Mobile Bottom Navigation & CTA -->
    <!-- Removed: Create Call button moved to top -->
  </div>
</template>

<script>
import { useMainStore } from "@/store/index";
import DashboardTopBar from "@/components/Dashboard/DashboardTopBar.vue";
import JobsSection from "@/components/Dashboard/JobsSection.vue";
import HandymenList from "@/components/Dashboard/HandymenList.vue";
import ClientActions from "@/components/Dashboard/ClientActions.vue";
import HandymanTools from "@/components/Dashboard/HandymanTools.vue";
import ViewHandymanDetails from "@/components/Dashboard/ViewHandymanDetails.vue";
import ViewJob from "@/components/Dashboard/ViewJob.vue";
import ProfileSheet from "@/components/ProfileSheet.vue";
import JobChat from "@/components/Dashboard/JobChat.vue";
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { io } from "socket.io-client";

export default {
  name: "DashboardView",
  components: {
    DashboardTopBar,
    JobsSection,
    HandymenList,
    ClientActions,
    HandymanTools,
    ViewHandymanDetails,
    ViewJob,
    ProfileSheet,
    JobChat,
  },
  data() {
    return {
      // will come from server
      isHendiman: false,

      isAvailable: true,
      toast: null,
      userCoordinates: null, // שמור את הקואורדינטות כאן

      me: {
        _id: null,
        name: "",
        avatarUrl: "",
        specialties: [],
      },
      jobsPage: 1,
      jobsPageSize: 5,

      statusTabs: [
        { label: "הכל", value: "all" },
        { label: "פתוחות", value: "open" },
        { label: "שובצו", value: "assigned" },
        { label: "בדרך", value: "on_the_way" },
        { label: "בביצוע", value: "in_progress" },
        { label: "הושלמו", value: "done" },
        { label: "בוטלו", value: "cancelled" },
      ],
      activeStatus: "open", // Default to "open" for handyman
      jobDetails: null,
      showProfileSheet: false,
      profileForm: {
        name: "",
        phone: "",
        email: "",
        city: "",
        specialties: [],
      },
      socket: null,
      handymanFilters: { maxKm: 25 },
      handymanDetails: null,
      dirFilters: { q: "", minRating: 0, minJobs: 0 },
      activeAssignedJob: null,
      isChatMinimized: false,
      showJobCancelledModal: false,
      cancelledBy: "handyman", // Track who cancelled: "handyman" or "client"
    };
  },

  setup() {
    const store = useMainStore();
    return { store };
  },
  created() {
    this.toast = useToast();
  },
  computed: {
    jobs() {
      return this.store.jobs;
    },
    jobsPagination() {
      const total = this.filteredJobs.length;
      const pageCount = Math.max(1, Math.ceil(total / this.jobsPageSize));
      const page = Math.min(this.jobsPage, pageCount);
      return {
        page,
        total,
        pageSize: this.jobsPageSize,
        pageCount,
        hasNext: page < pageCount,
        hasPrev: page > 1,
      };
    },
    handymen() {
      return this.store.handymen;
    },
    stats() {
      return this.store.stats;
    },
    isLoading() {
      return this.store.isLoading;
    },
    handymenPagination() {
      return this.store.handymenPagination;
    },
    filteredJobs() {
      return this.store.filteredJobs(
        this.isHendiman ? this.activeStatus : null,
        this.isHendiman ? this.handymanFilters.maxKm : null,
        this.isHendiman,
        this.isHendiman && this.me?.specialties ? this.me.specialties : null,
        this.isHendiman && this.me?.fullCategories
          ? this.me.fullCategories
          : null,
        this.isHendiman
          ? this.store.user?.location?.coordinates
            ? {
                lng: this.store.user.location.coordinates[0],
                lat: this.store.user.location.coordinates[1],
              }
            : this.store.user?.coordinates || null
          : null
      );
    },
    pagedJobs() {
      const start = (this.jobsPagination.page - 1) * this.jobsPageSize;
      const end = start + this.jobsPageSize;
      return this.filteredJobs.slice(start, end);
    },

    filteredHandymen() {
      return this.store.filteredHandymen(this.dirFilters);
    },
    statusTabsWithCounts() {
      // השתמש ב-filteredJobs שכבר מסנן לפי התמחויות ומרחק
      const allFilteredJobs = this.store.filteredJobs(
        null, // לא מסנן לפי סטטוס כאן
        this.isHendiman ? this.handymanFilters.maxKm : null,
        this.isHendiman,
        this.isHendiman && this.me?.specialties ? this.me.specialties : null,
        this.isHendiman && this.me?.fullCategories
          ? this.me.fullCategories
          : null,
        this.isHendiman
          ? this.store.user?.location?.coordinates
            ? {
                lng: this.store.user.location.coordinates[0],
                lat: this.store.user.location.coordinates[1],
              }
            : this.store.user?.coordinates || null
          : null
      );

      return this.statusTabs.map((tab) => {
        let count = 0;
        if (tab.value === "all") {
          count = allFilteredJobs.length;
        } else {
          count = allFilteredJobs.filter((j) => j.status === tab.value).length;
        }
        return { ...tab, count };
      });
    },
    currentAssignedJob() {
      if (this.activeAssignedJob) return this.activeAssignedJob;
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return null;

      // חיפוש ישירות ב-store.jobs
      const allJobs = this.store.jobs || [];
      const assignedJob = allJobs.find((job) => {
        if (this.isHendiman) {
          // עבור הנדימן - בודק אם handymanId תואם
          // עבור הנדימן: עבודה ב-"done" לא נחשבת כעבודה פעילה (צריך להמתין לדירוג)
          return (
            job.handymanId &&
            String(job.handymanId) === String(userId) &&
            (job.status === "assigned" ||
              job.status === "on_the_way" ||
              job.status === "in_progress")
          );
        } else {
          // עבור לקוח - בודק אם clientId תואם
          return (
            job.clientId &&
            String(job.clientId) === String(userId) &&
            job.handymanId && // רק עבודות ששובצו
            (job.status === "assigned" ||
              job.status === "on_the_way" ||
              job.status === "in_progress" ||
              (job.status === "done" && !job.ratingSubmitted))
          );
        }
      });

      return assignedJob || null;
    },
  },

  methods: {
    async onRefresh() {
      const coords = this.userCoordinates;
      await this.store.fetchDashboardData(this.$route.params.id, coords);
      this.jobsPage = 1;
    },

    async fetchHandymanJobs(userData = null) {
      try {
        // השתמש בקואורדינטות מה-user במסד הנתונים, לא מ-geolocation
        // אם userData לא נשלח, נסה מ-store.user
        const user = userData || this.store.user || this.me;
        let coordinates = null;
        if (user) {
          if (user.location && user.location.coordinates) {
            coordinates = {
              lng: user.location.coordinates[0],
              lat: user.location.coordinates[1],
            };
            console.log(
              "📍 [HANDYMAN] Using coordinates from user.location:",
              coordinates
            );
          } else if (user.coordinates) {
            coordinates = {
              lng: user.coordinates.lng,
              lat: user.coordinates.lat,
            };
            console.log(
              "📍 [HANDYMAN] Using coordinates from user.coordinates:",
              coordinates
            );
          } else if (user.Coordinates) {
            // Fallback למקרה של Coordinates עם C גדולה
            coordinates = {
              lng: user.Coordinates.lng,
              lat: user.Coordinates.lat,
            };
            console.log(
              "📍 [HANDYMAN] Using coordinates from user.Coordinates:",
              coordinates
            );
          } else {
            console.warn("⚠️ [HANDYMAN] No coordinates found in user object:", {
              hasLocation: !!user.location,
              hasCoordinates: !!user.coordinates,
              hasCoordinatesCapital: !!user.Coordinates,
            });
          }
        } else {
          console.warn("⚠️ [HANDYMAN] No user data available!");
        }

        console.log("🔍 [HANDYMAN] Fetching jobs with:", {
          status: this.activeStatus,
          maxKm: this.handymanFilters.maxKm,
          coordinates,
        });

        // אם אין קואורדינטות, עדיין נטען עבודות (בלי סינון מרחק)
        await this.store.fetchFilteredJobsForHandyman({
          status: this.activeStatus,
          maxKm: this.handymanFilters.maxKm,
          coordinates: coordinates,
        });
        // אחרי טעינת העבודות, בדוק אם יש עבודה משובצת
        this.$nextTick(() => {
          this.checkForAssignedJob();
        });
      } catch (error) {
        console.error("Error fetching handyman jobs:", error);
        // גם אם יש שגיאה, נסה לטעון עבודות בלי סינון
        try {
          await this.store.fetchFilteredJobsForHandyman({
            status: this.activeStatus,
            maxKm: null,
            coordinates: null,
          });
        } catch (fallbackError) {
          console.error("Error in fallback fetch:", fallbackError);
        }
      }
    },

    onOpenProfile() {
      this.profileForm = {
        name: this.store.user?.username || this.store.user?.name || "",
        phone: this.store.user?.phone || "",
        email: this.store.user?.email || "",
        city: this.store.user?.city || "",
        specialties: this.store.user?.specialties
          ? [...this.store.user.specialties]
          : [],
      };
      this.showProfileSheet = true;
    },

    onOpenHandymenChat() {
      console.log("open handymen general chat");
    },

    onOpenAllUsersChat() {
      console.log("open all users chat");
    },

    onPickStatus(v) {
      this.activeStatus = v;
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    onChangeKm(value) {
      this.handymanFilters.maxKm = parseInt(value);
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    onResetKm() {
      this.handymanFilters.maxKm = 25;
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    onOpenJobMenu(job) {
      console.log("open job menu", job.id);
    },

    onOpenJobChat(job) {
      console.log("open job chat", job.id);
    },

    onOpenUserChat(userId) {
      console.log("open user chat", userId);
    },

    onSkip(job) {
      const handymanId = this.store.user?._id || this.me?.id;
      if (!handymanId) return;
      axios
        .post(`${URL}/jobs/skip`, {
          jobId: job._id || job.id,
          handymanId,
        })
        .then(() => {
          this.fetchHandymanJobs();
        })
        .catch(() => {});
    },

    async onAccept(job) {
      const handymanId = this.store.user?._id || this.me?.id;
      if (!handymanId) return;
      try {
        const { data } = await axios.post(`${URL}/jobs/accept`, {
          jobId: job._id || job.id,
          handymanId,
        });

        // Refresh dashboard data to get all jobs including the accepted one
        await this.store.fetchDashboardData(
          this.$route.params.id,
          this.userCoordinates
        );

        // Wait for store to update
        await this.$nextTick();

        // Find the accepted job in store
        const jobId = job._id || job.id;
        const acceptedJob = this.store.jobs?.find(
          (j) => String(j._id || j.id) === String(jobId)
        );

        if (acceptedJob) {
          // Open chat with the updated job
          this.activeAssignedJob = acceptedJob;
        } else {
          // Fallback: use the job with updated status from response or original job
          this.activeAssignedJob = data?.job || {
            ...job,
            status: "assigned",
            handymanId: handymanId.toString(),
          };
        }
      } catch (error) {
        console.error("Error accepting job:", error);
      }
    },

    onView(job) {
      console.log("view job", job.id);
      this.jobDetails = job;
    },
    onJobsNextPage() {
      if (this.jobsPagination.hasNext) {
        this.jobsPage = this.jobsPagination.page + 1;
      }
    },
    onJobsPrevPage() {
      if (this.jobsPagination.hasPrev) {
        this.jobsPage = this.jobsPagination.page - 1;
      }
    },
    async onJobStatusUpdated(newStatus) {
      // Update the job in store immediately
      const jobId = this.activeAssignedJob?._id || this.activeAssignedJob?.id;
      if (jobId && this.store.jobs) {
        const jobIndex = this.store.jobs.findIndex(
          (j) => String(j._id || j.id) === String(jobId)
        );
        if (jobIndex !== -1) {
          // Update job in store
          this.store.jobs[jobIndex] = {
            ...this.store.jobs[jobIndex],
            status: newStatus,
          };
        }
      }

      // If job is marked as done and user is handyman, close the chat (even if minimized)
      if (newStatus === "done" && this.isHendiman) {
        this.activeAssignedJob = null;
        this.isChatMinimized = false;
        // Refresh to update job list
        await this.onRefresh();
      }
    },

    async onCancelJob() {
      // Update the job in store - remove handyman assignment and set status to open
      const jobId = this.activeAssignedJob?._id || this.activeAssignedJob?.id;
      if (jobId && this.store.jobs) {
        const jobIndex = this.store.jobs.findIndex(
          (j) => String(j._id || j.id) === String(jobId)
        );
        if (jobIndex !== -1) {
          // Update job in store - remove handyman assignment and set status to open
          const updatedJob = { ...this.store.jobs[jobIndex] };
          delete updatedJob.handymanId;
          delete updatedJob.handymanName;
          updatedJob.status = "open";
          this.store.jobs[jobIndex] = updatedJob;
        }
      }
      // Clear the assigned job to close the chat
      this.activeAssignedJob = null;
      this.isChatMinimized = false;
      // Refresh jobs list to get updated status
      await this.onRefresh();
    },

    handleJobCancelledClose() {
      this.showJobCancelledModal = false;
    },

    async onRatingSubmitted() {
      // Save jobId before closing
      const jobId = this.activeAssignedJob?._id || this.activeAssignedJob?.id;

      // Update store jobs to mark rating as submitted
      if (this.store.jobs && jobId) {
        const jobIndex = this.store.jobs.findIndex(
          (j) => String(j._id || j.id) === String(jobId)
        );
        if (jobIndex !== -1 && this.store.jobs[jobIndex]) {
          this.store.jobs[jobIndex].ratingSubmitted = true;
        }
      }

      // Refresh after rating to update job data
      await this.onRefresh();
      // Close chat after rating
      this.activeAssignedJob = null;
    },
    async checkForAssignedJob() {
      // בדוק ישירות ב-store.jobs אם יש עבודה משובצת
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return;

      // קודם נבדוק ב-store.jobs הקיים
      let allJobs = this.store.jobs || [];
      let assignedJob = allJobs.find((job) => {
        if (this.isHendiman) {
          // עבור הנדימן - בודק אם handymanId תואם
          return (
            job.handymanId &&
            String(job.handymanId) === String(userId) &&
            (job.status === "assigned" ||
              job.status === "on_the_way" ||
              job.status === "in_progress" ||
              (job.status === "done" && !job.ratingSubmitted))
          );
        } else {
          // עבור לקוח - בודק אם clientId תואם
          return (
            job.clientId &&
            String(job.clientId) === String(userId) &&
            job.handymanId && // רק עבודות ששובצו
            (job.status === "assigned" ||
              job.status === "on_the_way" ||
              job.status === "in_progress" ||
              (job.status === "done" && !job.ratingSubmitted))
          );
        }
      });

      // אם לא מצאנו עבודה משובצת
      if (!assignedJob) {
        // רק אם store.jobs ריק, נטען מחדש
        // אם יש עבודות ב-store אבל הן לא משובצות (כי הן ב-Done עם ratingSubmitted), לא נטען שוב
        if (!allJobs.length) {
          try {
            // רק עבור הנדימן - נטען שוב כי fetchFilteredJobsForHandyman עלול להחליף את store.jobs
            // עבור לקוח - לא נטען שוב כדי לא לגרום ל-loading מיותר
            if (this.isHendiman) {
              const dashboardData = await this.store.fetchDashboardData(
                this.$route.params.id,
                this.userCoordinates
              );
              if (dashboardData && dashboardData.Jobs) {
                allJobs = dashboardData.Jobs || [];
                assignedJob = allJobs.find((job) => {
                  return (
                    job.handymanId &&
                    String(job.handymanId) === String(userId) &&
                    (job.status === "assigned" ||
                      job.status === "on_the_way" ||
                      job.status === "in_progress" ||
                      (job.status === "done" && !job.ratingSubmitted))
                  );
                });
              }
            }
          } catch (error) {
            console.error("Error checking for assigned job:", error);
          }
        }
      }

      if (assignedJob && !this.activeAssignedJob) {
        this.activeAssignedJob = assignedJob;
      } else if (!assignedJob && this.activeAssignedJob) {
        // אם אין עבודה משובצת אבל יש activeAssignedJob, נסיר אותו
        this.activeAssignedJob = null;
      }
    },
    initWebSocket() {
      // Connect to WebSocket server
      this.socket = io(URL, {
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        // Join all jobs that belong to this user
        const userId = this.store.user?._id || this.me?.id;
        if (userId && this.store.jobs) {
          this.store.jobs.forEach((job) => {
            const jobId = job._id || job.id;
            if (jobId) {
              this.socket.emit("join-job", String(jobId));
            }
          });
        }
      });

      // Listen for job accepted event (for clients)
      this.socket.on("job-accepted", async (data) => {
        const jobId = String(data.jobId || "");
        if (!this.isHendiman) {
          // For client: check if this is their job
          const userId = this.store.user?._id || this.me?.id;
          if (userId) {
            // Refresh to get updated job data
            await this.onRefresh();
            // Find the accepted job
            const acceptedJob = this.store.jobs?.find(
              (j) => String(j._id || j.id) === jobId
            );
            // Only open chat if this job belongs to the current client
            if (
              acceptedJob &&
              !this.activeAssignedJob &&
              String(acceptedJob.clientId || acceptedJob.client?._id || "") ===
                String(userId)
            ) {
              this.activeAssignedJob = acceptedJob;
            }
          }
        }
      });

      // Listen for job cancelled event (for both clients and handymen)
      this.socket.on("job-cancelled", async (data) => {
        const jobId = String(data.jobId || "");
        const cancelledBy = data.cancelledBy || "handyman"; // "handyman" or "client"
        const userId = this.store.user?._id || this.me?.id;
        if (userId) {
          // Check if this is the currently assigned job
          const currentJobId =
            this.activeAssignedJob?._id || this.activeAssignedJob?.id;
          if (currentJobId && String(currentJobId) === jobId) {
            // Close the chat
            this.activeAssignedJob = null;
            this.isChatMinimized = false;
            // Show modal with appropriate message
            if (
              (this.isHendiman && cancelledBy === "client") ||
              (!this.isHendiman && cancelledBy === "handyman")
            ) {
              this.cancelledBy = cancelledBy;
              this.showJobCancelledModal = true;
            }
            // Refresh to get updated job data
            await this.onRefresh();
          }
        }
      });
    },
    disconnectWebSocket() {
      if (this.socket) {
        // Leave all job rooms
        const userId = this.store.user?._id || this.me?.id;
        if (userId && this.store.jobs) {
          this.store.jobs.forEach((job) => {
            const jobId = job._id || job.id;
            if (jobId) {
              this.socket.emit("leave-job", String(jobId));
            }
          });
        }
        this.socket.disconnect();
        this.socket = null;
      }
    },
    onCreateCallCta() {
      this.$router.push({
        name: "CreateCall",
        params: { id: this.$route.params.id },
      });
    },
    onGoProfile() {
      this.onOpenProfile();
    },
    onViewRatings() {
      this.$router.push({
        name: "HandymanRatings",
        params: { id: this.$route.params.id },
      });
    },

    onReturnToJob() {
      this.isChatMinimized = false;
    },

    onBlockHandyman(id) {
      console.log("block handyman", id);
    },

    onPersonalRequest(id) {
      console.log("personal request handyman", id);
    },

    async onSaveProfile(form) {
      const userId = this.store.user?._id;
      if (!userId) {
        this.toast?.showError("שגיאה: לא נמצא מזהה משתמש");
        return;
      }
      try {
        const res = await axios.post(`${URL}/user/update-profile`, {
          userId,
          username: form.name,
          phone: form.phone,
          email: form.email,
          city: form.city,
          specialties: form.specialties,
        });
        if (res.data?.success) {
          // עדכן את המשתמש ב-store
          this.store.user = res.data.user;
          this.me.name = res.data.user?.username || this.me.name;
          this.me.specialties =
            res.data.user?.specialties || this.me.specialties;
          // עדכן גם את שאר השדות
          if (res.data.user?.phone) {
            this.me.phone = res.data.user.phone;
          }
          if (res.data.user?.email) {
            this.me.email = res.data.user.email;
          }
          if (res.data.user?.city) {
            this.me.city = res.data.user.city;
          }
          this.toast?.showSuccess("הפרופיל עודכן בהצלחה");
          this.showProfileSheet = false;
        } else {
          this.toast?.showError("שגיאה בעדכון הפרופיל");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        this.toast?.showError("שגיאה בעדכון הפרופיל");
      }
    },

    async onViewHandymanDetails(id) {
      try {
        const { data } = await axios.get(`${URL}/Gethandyman/${id}`);
        console.log("handyman details", data);
        if (data.success) {
          this.handymanDetails = data.Handyman;
        } else {
          this.toast.showError(data.message);
        }
      } catch (error) {
        console.log("error", error);
        this.toast.showError("שגיאה בטעינת פרטי ההנדימן");
      }
    },

    onCloseHandymanDetails() {
      this.handymanDetails = null;
    },

    onBookHandyman(handyman) {
      console.log("book handyman", handyman);
      this.onPersonalRequest(handyman._id || handyman.id);
      this.onCloseHandymanDetails();
    },

    onBlockHandymanFromModal(handyman) {
      console.log("block handyman from modal", handyman);
      this.onBlockHandyman(handyman._id || handyman.id);
      this.onCloseHandymanDetails();
    },

    onCloseJobDetails() {
      this.jobDetails = null;
    },

    onAcceptJobFromModal(job) {
      console.log("accept job from modal", job.id);
      this.onAccept(job);
      this.onCloseJobDetails();
    },

    onSkipJobFromModal(job) {
      console.log("skip job from modal", job.id);
      this.onSkip(job);
      this.onCloseJobDetails();
    },

    async onNextPage() {
      if (this.handymenPagination.hasNext) {
        // קבל את הקואורדינטות מהמשתמש (תחילה נסה מהמשתנה המקומי, אחרת מה-store)
        // השתמש בקואורדינטות מה-user במסד הנתונים, לא מ-geolocation
        let coordinates = null;
        if (this.store.user) {
          if (
            this.store.user.location &&
            this.store.user.location.coordinates
          ) {
            coordinates = {
              lng: this.store.user.location.coordinates[0],
              lat: this.store.user.location.coordinates[1],
            };
          } else if (this.store.user.coordinates) {
            coordinates = {
              lng: this.store.user.coordinates.lng,
              lat: this.store.user.coordinates.lat,
            };
          }
        }

        await this.store.fetchHandymen(
          this.handymenPagination.page + 1,
          coordinates
        );
      }
    },

    async onPrevPage() {
      if (this.handymenPagination.hasPrev) {
        // השתמש בקואורדינטות מה-user במסד הנתונים, לא מ-geolocation
        let coordinates = null;
        if (this.store.user) {
          if (
            this.store.user.location &&
            this.store.user.location.coordinates
          ) {
            coordinates = {
              lng: this.store.user.location.coordinates[0],
              lat: this.store.user.location.coordinates[1],
            };
          } else if (this.store.user.coordinates) {
            coordinates = {
              lng: this.store.user.coordinates.lng,
              lat: this.store.user.coordinates.lat,
            };
          }
        }

        await this.store.fetchHandymen(
          this.handymenPagination.page - 1,
          coordinates
        );
      }
    },

    getUserCoordinates() {
      // נסה לקבל את הקואורדינטות מהמשתמש
      if (this.store.user) {
        if (this.store.user.location && this.store.user.location.coordinates) {
          return {
            lng: this.store.user.location.coordinates[0],
            lat: this.store.user.location.coordinates[1],
          };
        } else if (this.store.user.Coordinates) {
          return {
            lng: this.store.user.Coordinates.lng,
            lat: this.store.user.Coordinates.lat,
          };
        }
      }
      return null;
    },

    getStatusLabel(status) {
      const labels = {
        open: "פתוחה",
        assigned: "שובצה",
        on_the_way: "בדרך",
        in_progress: "בביצוע",
        done: "הושלמה",
        cancelled: "בוטלה",
      };
      return labels[status] || status;
    },
  },
  async mounted() {
    try {
      // קבל את הקואורדינטות הנוכחיות של המשתמש
      let coordinates = null;

      // נסה לקבל את הקואורדינטות מהמשתמש שנשמרו במסד הנתונים
      // קודם נטען את המשתמש כדי לקבל את הקואורדינטות שלו
      const tempData = await this.store.fetchDashboardData(
        this.$route.params.id
      );

      // אם המשתמש לא נמצא, החזר ל-דף הבית
      if (!tempData || !tempData.User) {
        this.$router.push("/");
        return;
      }

      if (tempData.User) {
        // בדוק אם יש location בפורמט GeoJSON
        if (tempData.User.location && tempData.User.location.coordinates) {
          coordinates = {
            lng: tempData.User.location.coordinates[0],
            lat: tempData.User.location.coordinates[1],
          };
        }
        // אם אין location, נסה Coordinates
        else if (tempData.User.Coordinates) {
          coordinates = {
            lng: tempData.User.Coordinates.lng,
            lat: tempData.User.Coordinates.lat,
          };
        }
      }

      // שמור את הקואורדינטות לשימוש מאוחר יותר (pagination)
      // ודא שהקואורדינטות נשמרות גם אם הן null (למקרה שיהיו מאוחר יותר)
      this.userCoordinates = coordinates;

      // אם יש קואורדינטות, שלוף שוב את הנתונים עם הקואורדינטות
      const data = coordinates
        ? await this.store.fetchDashboardData(
            this.$route.params.id,
            coordinates
          )
        : tempData;

      // עדכן את הנתונים המקומיים מהמשתמש
      // אם המשתמש לא נמצא גם אחרי הבקשה השנייה, החזר ל-דף הבית
      if (!data || !data.User) {
        this.$router.push("/");
        return;
      }

      if (data.User) {
        this.me.name = data.User.username;
        this.me.specialties = data.User.specialties;
        this.me.avatarUrl = data.User.imageUrl;
        this.me.id = data.User._id;
        this.me.phone = data.User.phone;
        this.me.email = data.User.email;
        this.me.city = data.User.city;
        this.isHendiman = data.User.isHandyman;

        // עדכן את הקואורדינטות גם מה-User שנטען (למקרה שהן השתנו)
        if (data.User.location && data.User.location.coordinates) {
          this.userCoordinates = {
            lng: data.User.location.coordinates[0],
            lat: data.User.location.coordinates[1],
          };
        } else if (data.User.Coordinates) {
          this.userCoordinates = {
            lng: data.User.Coordinates.lng,
            lat: data.User.Coordinates.lat,
          };
        }

        // טען handymen עם pagination (רק אם זה לקוח)
        if (!this.isHendiman) {
          // שלח את הקואורדינטות גם ל-fetchHandymen
          await this.store.fetchHandymen(1, this.userCoordinates);
        } else {
          // עבור הנדימן - טען עבודות מסוננות
          await this.fetchHandymanJobs(data.User);

          // בנוסף, בדוק ישירות בשרת אם יש עבודה משובצת (גם אם מעל 10 ק"מ)
          // על ידי בדיקה ב-store.jobs מהנתונים הראשוניים של fetchDashboardData
          // הנתונים הראשוניים כוללים את כל העבודות, לא רק המסוננות
        }

        // בדוק אם יש עבודה משובצת ונפתח את הצ'אט אוטומטית
        // עבור הנדימן ולקוח - בודק אם יש עבודה משובצת
        this.$nextTick(() => {
          this.checkForAssignedJob();
        });
      }

      // Initialize WebSocket for real-time updates
      this.initWebSocket();
    } catch (error) {
      // אם יש שגיאה או שהמשתמש לא נמצא, החזר ל-דף הבית
      this.$router.push("/");
    }
  },
  beforeUnmount() {
    this.disconnectWebSocket();
  },
  watch: {
    // צפה בשינויים ב-jobs כדי לבדוק עבודה משובצת
    "store.jobs": {
      handler(newJobs, oldJobs) {
        // רק אם יש שינוי אמיתי ב-jobs, נבדוק עבודה משובצת
        // נמנע מקריאות מיותרות אם ה-jobs לא השתנו
        if (
          newJobs &&
          newJobs.length > 0 &&
          (!oldJobs || newJobs.length !== oldJobs.length)
        ) {
          this.$nextTick(() => {
            this.checkForAssignedJob();
          });
        }
      },
      immediate: false,
      deep: false, // לא צריך deep watch, רק לבדוק אם המערך השתנה
    },
  },
};
</script>

<style lang="scss" scoped>
/* ====== THEME: BLACK + ORANGE (HENDIMAN) ====== */
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;

$bg: #0b0b0f;
$bg2: #0f1016;
$card: rgba(255, 255, 255, 0.06);
$card2: rgba(255, 255, 255, 0.085);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;

$danger: #ff3b3b;

$shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 44px rgba(255, 106, 0, 0.18);

$r: 18px;
$r2: 26px;

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.dash {
  direction: rtl;
  min-height: 100vh;
  min-height: -webkit-fill-available; // iOS fix
  color: $text;
  padding: 16px;
  background: radial-gradient(
      900px 520px at 10% -10%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    radial-gradient(
      700px 420px at 95% 10%,
      rgba($orange2, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, $bg, $bg2);

  @media (max-width: 768px) {
    padding: 12px 10px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom)); // iOS safe area
    padding-top: calc(12px + env(safe-area-inset-top)); // iOS safe area
  }
}

/* Styles moved to DashboardTopBar component */

/* GRID */
.grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr; /* ~60/40 */
  gap: 14px;
  align-items: stretch; // זה יגרום לשני הבלוקים להיות באותו גובה

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    gap: clamp(16px, 4vw, 24px);
    display: flex;
    flex-direction: column;
    padding: clamp(12px, 3vw, 16px);
    padding-bottom: calc(
      80px + env(safe-area-inset-bottom)
    ); // Space for bottom nav
  }
}

/* JOBS */
.jobs {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__head {
    padding: 14px;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: radial-gradient(
        900px 240px at 20% 0%,
        rgba($orange, 0.14),
        transparent 55%
      ),
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.06),
        rgba(255, 255, 255, 0.03)
      );

    @media (max-width: 768px) {
      padding: 8px 6px;
      gap: 6px;
      border-radius: 12px 12px 0 0;
    }
  }
}

.h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  &__count {
    color: $orange3;
    font-weight: 1100;
    margin-right: 6px;

    @media (max-width: 768px) {
      margin-right: 4px;
      font-size: 12px;
    }
  }
}

.sub {
  margin: 4px 0 0;
  color: $muted;
  font-weight: 800;
  font-size: 12.5px;

  @media (max-width: 768px) {
    font-size: 9px;
    margin: 2px 0 0;
  }
}

.headActions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(0, 0, 0, 0.25);
  padding: 9px 10px;
  color: $text;
  font-weight: 900;
  font-size: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);

  &--on {
    background: $orange;
    box-shadow: 0 0 0 4px rgba($orange, 0.22);
  }
}

/* FILTERS */
.filters {
  padding: 12px 14px 0;

  @media (max-width: 768px) {
    padding: 6px 6px 0;
  }

  &__card {
    border-radius: $r;
    border: 1px solid rgba($orange, 0.18);
    background: rgba($orange, 0.08);
    padding: 12px;

    @media (max-width: 768px) {
      padding: 6px;
      border-radius: 10px;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 12px;

    @media (max-width: 980px) {
      grid-template-columns: 1fr;
    }
  }
}

.field {
  display: grid;
  gap: 8px;

  &--narrow {
    align-content: start;
  }
}

.label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.78);

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 20px;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  transition: transform 120ms ease, box-shadow 120ms ease;
  min-width: fit-content;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 20px rgba($orange, 0.12);
  }

  &:focus {
    @include focusRing;
  }

  &--active {
    background: linear-gradient(135deg, $orange, $orange2);
    border-color: rgba($orange, 0.55);
  }

  &__txt {
    font-size: 12px;
    font-weight: 1000;
    color: $text;
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 9px;
    }
  }

  &__count {
    font-size: 12px;
    font-weight: 1000;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.25);
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 8px;
      padding: 2px 6px;
    }
  }
}

.rangeBox {
  border-radius: $r;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
}

.badge {
  border-radius: 999px;
  padding: 7px 10px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  font-weight: 900;
  font-size: 12px;

  b {
    font-weight: 1100;
    color: $orange3;
  }
}

.range {
  width: 100%;
  accent-color: $orange;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}

/* JOB CARDS */
.jobs__list {
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (max-width: 768px) {
    padding: 6px 4px;
    gap: 6px;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
}

.job-card {
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: transform 120ms ease, box-shadow 120ms ease;

  @media (max-width: 768px) {
    padding: 6px;
    border-radius: 12px;
    gap: 6px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
  }

  &__left {
    display: flex;
    gap: 10px;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  &__tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    flex-shrink: 0;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }

  &__meta {
    display: grid;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-weight: 1100;
    font-size: 14px;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 9px;
      margin-top: 1px;
    }
  }

  &__price {
    font-weight: 1100;
    color: $orange3;
    font-size: 13px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 1000;
  font-size: 11.5px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  color: $text;

  @media (max-width: 768px) {
    padding: 2px 4px;
    font-size: 7px;
    border-radius: 6px;
  }

  &--urgent {
    border-color: rgba($danger, 0.45);
    background: rgba($danger, 0.12);
    color: #ffd4d4;
  }

  &--status {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.84);
  }

  &--hourly {
    border-color: rgba($orange2, 0.28);
    background: rgba($orange2, 0.14);
  }

  &--fixed {
    border-color: rgba($orange, 0.22);
    background: rgba($orange, 0.12);
  }
}

.iconBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.28);
  color: $text;
  cursor: pointer;

  &:hover {
    box-shadow: 0 10px 18px rgba($orange, 0.14);
  }

  &:focus {
    @include focusRing;
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    font-size: 12px;
  }
}

.job__titleRow {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.job__title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 1100;

  @media (max-width: 768px) {
    font-size: 11px;
    line-height: 1.25;
  }
}

.price {
  font-weight: 1200;
  color: $orange3;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 9px;
  }

  span {
    font-weight: 900;
    color: rgba(255, 255, 255, 0.7);
    margin-right: 4px;
  }
}

.job__desc {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 800;
  font-size: 13px;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 9px;
    margin: 3px 0 0;
    line-height: 1.25;
  }
}

.metaGrid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 768px) {
    gap: 3px;
    margin-top: 4px;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.meta {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  @media (max-width: 768px) {
    padding: 4px;
    border-radius: 8px;
  }

  &__k {
    display: block;
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.62);
    margin-bottom: 4px;

    @media (max-width: 768px) {
      font-size: 8px;
      margin-bottom: 2px;
    }
  }

  &__v {
    font-size: 12.5px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.9);

    @media (max-width: 768px) {
      font-size: 8px;
      line-height: 1.2;
    }
  }
}

.spacer {
  flex: 1 1 auto;
}

/* SIDE PANEL */
.panel {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  padding: 14px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;

  @media (max-width: 768px) {
    padding: 8px 6px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 8px;
  }
}

.panel__head {
  margin-bottom: 10px;
}

.cta {
  border-radius: $r2;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 12px;
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.handymen-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;

  @media (max-width: 768px) {
    gap: 6px;
  }

  // Scrollbar styling
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($orange, 0.3);
    border-radius: 10px;

    &:hover {
      background: rgba($orange, 0.5);
    }
  }
}

/* Button: "צור קריאה" (Orange + Black) */
.btn-create-call {
  --orange: #ff7a00;
  --orange-2: #ff9a3c;
  --black: #0b0b0f;
  --black-2: #14141a;

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.95rem 1.25rem;
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(255, 122, 0, 0.55);
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--black) 0%,
    var(--black-2) 55%,
    rgba(255, 122, 0, 0.1) 100%
  );
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45), 0 0 0 0 rgba(255, 122, 0, 0);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  font-weight: 800;
  letter-spacing: 0.2px;
  text-transform: none;
  transition: transform 0.12s ease, box-shadow 0.18s ease,
    border-color 0.18s ease, background 0.18s ease, filter 0.18s ease;
  position: relative;
  overflow: hidden;
  font-size: 14px;
  border: none;

  .icon {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
  }

  &:hover {
    border-color: rgba(255, 122, 0, 0.9);
    background: linear-gradient(
      135deg,
      #0f0f14 0%,
      #1a1a22 55%,
      rgba(255, 122, 0, 0.16) 100%
    );
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55),
      0 0 0 6px rgba(255, 122, 0, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px) scale(0.99);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 122, 0, 0.1);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 122, 0, 0.25),
      0 16px 40px rgba(0, 0, 0, 0.55);
  }

  &:disabled,
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
    filter: grayscale(0.2);
    transform: none;
    box-shadow: none;
  }

  // subtle animated shine
  &::after {
    content: "";
    position: absolute;
    inset: -40% -60%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 35%,
      rgba(255, 255, 255, 0) 70%
    );
    transform: translateX(-40%) rotate(10deg);
    transition: transform 0.55s ease;
    pointer-events: none;
  }

  &:hover::after {
    transform: translateX(40%) rotate(10deg);
  }

  // optional "urgent" variant
  &.is-urgent {
    border-color: rgba(255, 122, 0, 0.95);
    background: linear-gradient(
      135deg,
      #0b0b0f 0%,
      #1b1208 55%,
      rgba(255, 122, 0, 0.22) 100%
    );
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55),
      0 0 0 6px rgba(255, 122, 0, 0.18);
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    min-height: 42px; // Smaller on mobile
    font-size: 13px;
    border-radius: 12px;
    gap: 0.5rem;

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}

/* form controls */
.input,
.select,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 12px 12px;
  font-weight: 900;
  -webkit-appearance: none; // Remove iOS styling
  appearance: none;
  font-size: 16px; // Prevent zoom on iOS

  @media (max-width: 768px) {
    padding: 10px 8px;
    font-size: 16px; // Prevent iOS zoom
    border-radius: 10px;
    min-height: 40px; // Smaller on mobile
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.45);
  }
}

.textarea {
  resize: vertical;
  min-height: 92px;
}

.preview {
  margin-top: 10px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  padding: 10px;

  &__row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 4px 0;

    span {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 900;
      font-size: 12px;
    }

    b {
      font-weight: 1100;
      color: $orange3;
      font-size: 12.5px;
    }
  }
}

.apiNote {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  font-size: 12px;

  @media (max-width: 768px) {
    font-size: 11px;
    margin-top: 4px;
  }
}

/* File upload styles for call image */
.file-upload-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.file-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: $r;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  text-align: center;

  &:hover {
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.3);
  }

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 12px;
  }
}

.image-preview-small {
  position: relative;
  margin-top: 10px;
  width: 100%;
  max-width: 200px;
  border-radius: $r;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);

  img {
    width: 100%;
    height: auto;
    display: block;
  }

  @media (max-width: 768px) {
    max-width: 150px;
  }
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 59, 59, 0.9);
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    font-size: 18px;
    top: 6px;
    left: 6px;
  }
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;

  &--2 {
    display: grid;
    grid-template-columns: 1fr 1fr;

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  }
}

.toggle {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 1000;

  &--on {
    border-color: rgba($orange, 0.45);
    box-shadow: 0 14px 22px rgba($orange, 0.16);
  }

  &:focus {
    @include focusRing;
  }
}

.fine {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba($danger, 0.28);
  background: rgba($danger, 0.1);
  color: rgba(255, 255, 255, 0.88);
  font-weight: 900;

  b {
    color: #ffd4d4;
    font-weight: 1100;
  }

  &__icon {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: rgba($danger, 0.16);
    border: 1px solid rgba($danger, 0.18);
  }
}

.divider {
  height: 14px;
}

/* directory */
.dir {
  border-radius: $r2;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 12px;
  }
}

.dir__list {
  margin-top: 12px;
  display: grid;
  gap: 10px;

  @media (max-width: 768px) {
    margin-top: 8px;
    gap: 6px;
  }
}

.hcard {
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: transform 120ms ease, box-shadow 120ms ease;

  @media (max-width: 768px) {
    padding: 6px;
    border-radius: 12px;
    gap: 6px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
  }

  &__left {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  &__av {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 2px solid rgba($orange, 0.28);
    object-fit: cover;

    @media (max-width: 768px) {
      width: 32px;
      height: 32px;
      border-width: 1.5px;
    }
  }

  &__name {
    font-weight: 1100;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 9px;
      margin-top: 1px;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.04);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  &__info {
    color: $muted;
    font-weight: 900;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  .btn {
    min-width: 100px;

    @media (max-width: 768px) {
      min-width: 80px;
      width: 100%;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  font-weight: 1000;
  font-size: 12px;
  color: $text;
  flex-wrap: wrap;
  margin: 4px;

  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 9px;
    gap: 4px;
    margin: 3px;
  }

  &__name {
    color: $text;
    font-weight: 1000;
  }

  &__price {
    color: $orange3;
    font-weight: 1100;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba($orange, 0.15);
    border: 1px solid rgba($orange, 0.25);

    @media (max-width: 768px) {
      font-size: 8px;
      padding: 1px 4px;
    }
  }

  &__type {
    font-size: 10px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 999px;
    border: 1px solid;

    @media (max-width: 768px) {
      font-size: 7px;
      padding: 1px 4px;
    }

    &--hourly {
      color: $orange2;
      background: rgba($orange2, 0.15);
      border-color: rgba($orange2, 0.25);
    }

    &--fixed {
      color: $orange;
      background: rgba($orange, 0.15);
      border-color: rgba($orange, 0.25);
    }
  }
}

/* buttons */
.btn {
  border-radius: 16px;
  padding: 11px 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  font-size: 13px;

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 10px;
    border-radius: 10px;
    min-height: 32px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
    background: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }

  &:focus {
    @include focusRing;
  }

  &--primary {
    color: #111;
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    box-shadow: $shadowO;
  }

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &--full {
    width: 100%;
    justify-content: center;
  }
}

.mini {
  border-radius: 999px;
  padding: 9px 10px;
  font-weight: 1000;
  font-size: 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  cursor: pointer;

  &:focus {
    @include focusRing;
  }

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &--primary {
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
  }

  &--danger {
    border-color: rgba($danger, 0.35);
    background: rgba($danger, 0.14);
    color: #ffd4d4;
  }
}

.link {
  border: none;
  background: transparent;
  color: $orange3;
  font-weight: 1000;
  cursor: pointer;

  &:focus {
    @include focusRing;
    border-radius: 12px;
  }
}

.side {
  display: grid;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      900px 520px at 10% -10%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    radial-gradient(
      700px 420px at 95% 10%,
      rgba($orange2, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, $bg, $bg2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba($orange, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba($orange, 0.3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: $text;
  font-weight: 900;
  font-size: 16px;
  margin: 0;
  animation: pulse 1.5s ease-in-out infinite;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// Additional mobile app-like enhancements
@media (max-width: 768px) {
  // Smooth scrolling
  .dash,
  .jobs__list,
  main {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  // Better text rendering on mobile
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  // Disable text selection on buttons for better UX
  button,
  .btn,
  .tab,
  .toggle {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  // Better focus states for accessibility
  button:focus-visible,
  .btn:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid rgba($orange, 0.6);
    outline-offset: 2px;
  }
}

/* Mobile Bottom Navigation & CTA */
.client-actions-top {
  display: none; // Hidden on desktop

  @media (max-width: 768px) {
    display: block;
    position: sticky;
    top: 0;
    z-index: 100;
    background: #0b0b0f;
    padding-top: 10px;
    padding-bottom: 10px;
    backdrop-filter: blur(10px);
    margin-bottom: 12px;
  }
}

.client-actions-desktop {
  display: block; // Visible on desktop
  width: 100%;
  // No margin-bottom - let .side gap handle spacing

  @media (max-width: 768px) {
    display: none; // Hidden on mobile
  }
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  display: none;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(11, 11, 15, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 122, 0, 0.2);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
  z-index: 2000;
  align-items: center;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 56px; // WCAG AA minimum touch target
  padding: 8px 12px;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
  touch-action: manipulation;
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(255, 122, 0, 0.2);

  &:focus-visible {
    outline: 2px solid rgba(255, 122, 0, 0.6);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.1);
  }

  &__icon {
    font-size: 20px;
    line-height: 1;
  }

  &__label {
    font-size: clamp(11px, 2.5vw, 12px);
    line-height: 1.2;
  }

  &--primary {
    background: linear-gradient(135deg, #ff6a00, #ff8a2b);
    color: #0b0b0f;
    font-weight: 800;
    box-shadow: 0 4px 12px rgba(255, 106, 0, 0.3);
    min-height: 56px; // Primary CTA: 48-56px range

    &:hover {
      box-shadow: 0 6px 16px rgba(255, 106, 0, 0.4);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }

    .nav-btn__icon {
      font-size: 24px;
    }

    .nav-btn__label {
      font-size: clamp(13px, 3vw, 14px);
      font-weight: 900;
    }
  }
}

@media (max-width: 768px) {
  .mobile-nav {
    display: flex;
  }

  // Removed bottom nav padding since nav is removed
  .grid {
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
  }
}

.jobCancelledModal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-family;
}

.jobCancelledModal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.jobCancelledModal__content {
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: calc(100% - 40px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  text-align: center;
}

.jobCancelledModal__icon {
  font-size: 64px;
  margin-bottom: 16px;
  line-height: 1;
}

.jobCancelledModal__title {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 12px 0;
}

.jobCancelledModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.jobCancelledModal__btn {
  padding: 12px 32px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #ff6a00, #ff8a2b);
  color: #0b0b0f;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
}

.jobCancelledModal__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 106, 0, 0.4);
}

.jobCancelledModal__btn:active {
  transform: translateY(0);
}
</style>
