<template>
  <div
    class="hsOverlay"
    role="dialog"
    aria-modal="true"
    @click.self="emitClose"
  >
    <div
      class="hsSheet"
      :class="{ 'hsSheet--dragging': isDragging }"
      :style="sheetStyle"
      @click.stop
    >
      <div
        class="hsHandleArea"
        @pointerdown="onDragStart"
        @touchstart.passive="onTouchStart"
      >
        <div class="hsHandle" aria-hidden="true"></div>
      </div>

      <header class="hsHeader" dir="rtl">
        <button
          class="hsClose"
          type="button"
          aria-label="סגור"
          @click="emitClose"
        >
          ✕
        </button>

        <div class="hsProfile">
          <div class="hsAvatar">
            <img :src="avatarUrl" alt="" @error="onAvatarError" />
            <span class="hsAvatarRing" aria-hidden="true"></span>
          </div>

          <div class="hsProfileText">
            <div class="hsName">
              {{ handyman?.username || handyman?.name || "הנדימן" }}
            </div>
            <div class="hsMeta">
              <span class="hsMetaItem"
                >⭐ {{ formatRating(handyman?.rating) }}</span
              >
              <span class="hsDot" aria-hidden="true">•</span>
              <span class="hsMetaItem"
                >{{ handyman?.jobDone || 0 }} עבודות</span
              >
            </div>
          </div>
        </div>

        <div class="hsTabs" role="tablist" aria-label="פרטי הנדימן">
          <button
            class="hsTab"
            :class="{ 'hsTab--on': activeTab === 'ratings' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'ratings'"
            @click="activeTab = 'ratings'"
          >
            דירוגים
          </button>
          <button
            class="hsTab"
            :class="{ 'hsTab--on': activeTab === 'jobs' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'jobs'"
            @click="activeTab = 'jobs'"
          >
            היסטוריית עבודות
          </button>
        </div>
      </header>

      <div class="hsBody" dir="rtl">
        <div v-if="activeTab === 'ratings'" class="hsPane" role="tabpanel">
          <div v-if="loadingRatings" class="hsLoading">טוען דירוגים…</div>
          <div v-else-if="ratingsError" class="hsEmpty">{{ ratingsError }}</div>
          <div v-else-if="ratings.length === 0" class="hsEmpty">
            אין דירוגים עדיין
          </div>

          <div
            v-else
            class="hsPaginationWrapper"
            @touchstart.passive="onRatingsSwipeStart"
            @touchend.passive="onRatingsSwipeEnd"
          >
            <transition-group
              :name="`rating-slide-${swipeDirection}`"
              tag="div"
              class="hsHTrack"
              @before-enter="onBeforeEnter"
              @enter="onEnter"
            >
              <article
                v-for="(r, idx) in paginatedRatings"
                :key="`page-${currentRatingPage}-${String(
                  r._id || r.jobId || r.createdAt || idx
                )}`"
                class="hsCard hsCard--h"
                :data-index="idx"
                dir="rtl"
              >
                <div class="hsCardTop">
                  <!-- Customer Profile with full info -->
                  <div class="hsCustomerProfile">
                    <img
                      :src="r.customerImage || '/img/Hendima-logo.png'"
                      :alt="r.customerName || 'לקוח'"
                      class="hsCustomerAvatar"
                      @error="(e) => (e.target.src = '/img/Hendima-logo.png')"
                    />
                    <div class="hsCustomerInfo">
                      <div class="hsCustomerHeader">
                        <div class="hsCustomerName">
                          {{ r.customerName || "לקוח" }}
                        </div>
                        <div class="hsStars">⭐ {{ r.rating || 0 }}</div>
                      </div>
                      <div class="hsCardDate" v-if="r.createdAt">
                        {{ formatDate(r.createdAt) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="hsReview" v-if="r.review">{{ r.review }}</div>
                <div class="hsReview hsReview--muted" v-else>ללא טקסט</div>
              </article>
            </transition-group>

            <!-- Pagination dots -->
            <div class="hsPaginationDots" v-if="totalRatingPages > 1">
              <button
                v-for="page in totalRatingPages"
                :key="page"
                class="hsPaginationDot"
                :class="{
                  'hsPaginationDot--active': page === currentRatingPage + 1,
                }"
                @click="goToRatingPage(page - 1)"
                :aria-label="`עמוד ${page}`"
              ></button>
            </div>
          </div>
        </div>

        <div v-else class="hsPane" role="tabpanel">
          <div v-if="loadingJobs" class="hsLoading">טוען היסטוריית עבודות…</div>
          <div v-else-if="jobsError" class="hsEmpty">{{ jobsError }}</div>
          <div v-else-if="jobs.length === 0" class="hsEmpty">
            אין עבודות להצגה
          </div>

          <div
            v-else
            class="hsPaginationWrapper"
            @touchstart.passive="onJobsSwipeStart"
            @touchend.passive="onJobsSwipeEnd"
          >
            <transition-group
              :name="`job-slide-${jobsSwipeDirection}`"
              tag="div"
              class="hsHTrack"
              @before-enter="onBeforeEnter"
              @enter="onEnter"
            >
              <article
                v-for="(j, idx) in paginatedJobs"
                :key="`page-${currentJobPage}-${String(j._id || idx)}`"
                class="hsCard hsCard--h hsCard--job"
                :data-index="idx"
                dir="rtl"
              >
                <!-- Customer Profile Header -->
                <div class="hsJobHeader">
                  <div class="hsJobProfileSection">
                    <img
                      :src="j.clientImage || '/img/Hendima-logo.png'"
                      :alt="j.clientName || 'לקוח'"
                      class="hsJobAvatar"
                      @error="(e) => (e.target.src = '/img/Hendima-logo.png')"
                    />
                    <div class="hsJobInfo">
                      <div class="hsJobClientName">
                        {{ j.clientName || "לקוח" }}
                      </div>
                      <div class="hsJobTitle">{{ j.jobName || "עבודה" }}</div>
                    </div>
                  </div>
                  <div
                    class="hsCardPill hsCardPill--sm"
                    :class="pillClass(j.status)"
                  >
                    {{ statusText(j.status) }}
                  </div>
                </div>

                <!-- Rating and Date Row -->
                <div class="hsJobFooter">
                  <div class="hsJobRating">
                    <span
                      v-if="Number.isFinite(Number(j.jobRating))"
                      class="hsJobStars"
                    >
                      {{ starsText(j.jobRating) }}
                    </span>
                    <span v-else class="hsJobStars hsJobStars--muted">
                      {{ starsText(0) }}
                    </span>
                    <span
                      v-if="Number.isFinite(Number(j.jobRating))"
                      class="hsJobRatingNum"
                    >
                      {{ j.jobRating }}
                    </span>
                  </div>
                  <div class="hsJobDate" v-if="j.updatedAt">
                    {{ formatDate(j.updatedAt) }}
                  </div>
                </div>
              </article>
            </transition-group>

            <!-- Pagination dots -->
            <div class="hsPaginationDots" v-if="totalJobPages > 1">
              <button
                v-for="page in totalJobPages"
                :key="page"
                class="hsPaginationDot"
                :class="{
                  'hsPaginationDot--active': page === currentJobPage + 1,
                }"
                @click="goToJobPage(page - 1)"
                :aria-label="`עמוד ${page}`"
              ></button>
            </div>
          </div>
        </div>
      </div>

      <footer class="hsFooter" dir="rtl">
        <button
          class="hsAction hsAction--primary"
          type="button"
          @click="emitBook"
        >
          הזמן
        </button>
        <button class="hsAction" type="button" @click="emitBlock">
          {{ handyman?.isBlocked ? "בטל חסימה" : "חסום" }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "HandymanDetailsSheet",
  props: {
    handyman: { type: Object, required: true },
  },
  emits: ["close", "book", "block"],
  data() {
    return {
      activeTab: "ratings",
      ratings: [],
      jobs: [],
      loadingRatings: false,
      loadingJobs: false,
      ratingsError: "",
      jobsError: "",

      ratingsSkip: 0,
      jobsSkip: 0,
      currentRatingPage: 0,
      currentJobPage: 0,
      ratingsPerPage: 4,
      jobsPerPage: 3,
      // How many cards to show per "page" in the horizontal scroller.
      // Updates based on available width (max 4).
      ratingsCols: 4,
      jobsCols: 4,
      hasMoreRatings: true,
      hasMoreJobs: true,
      loadingMoreRatings: false,
      loadingMoreJobs: false,
      _ratingsScrollTick: false,
      _jobsScrollTick: false,

      _ratingsSwipeStartX: 0,
      _ratingsSwipeStartY: 0,
      _jobsSwipeStartX: 0,
      _jobsSwipeStartY: 0,
      isAnimating: false,
      isJobsAnimating: false,
      swipeDirection: "right",
      jobsSwipeDirection: "right",

      _ratingsResizeObserver: null,
      _jobsResizeObserver: null,

      isDragging: false,
      dragStartY: 0,
      dragOffsetY: 0,
      avatarErrored: false,
    };
  },
  computed: {
    handymanId() {
      return this.handyman?._id || this.handyman?.id;
    },
    paginatedRatings() {
      const start = this.currentRatingPage * this.ratingsPerPage;
      const end = start + this.ratingsPerPage;
      return this.ratings.slice(start, end);
    },
    totalRatingPages() {
      const loadedPages = Math.max(
        1,
        Math.ceil(this.ratings.length / this.ratingsPerPage) || 1
      );
      // If the server says there are more ratings, expose one extra page dot.
      return this.hasMoreRatings ? loadedPages + 1 : loadedPages;
    },
    paginatedJobs() {
      const start = this.currentJobPage * this.jobsPerPage;
      const end = start + this.jobsPerPage;
      return this.jobs.slice(start, end);
    },
    totalJobPages() {
      const loadedPages = Math.max(
        1,
        Math.ceil(this.jobs.length / this.jobsPerPage) || 1
      );
      return this.hasMoreJobs ? loadedPages + 1 : loadedPages;
    },
    avatarUrl() {
      if (this.avatarErrored) return "/img/Hendima-logo.png";
      return (
        this.handyman?.imageUrl ||
        this.handyman?.avatarUrl ||
        this.handyman?.profileImage ||
        "/img/Hendima-logo.png"
      );
    },
    sheetStyle() {
      const y = Math.max(0, this.dragOffsetY || 0);
      return {
        transform: `translate3d(0, ${y}px, 0)`,
      };
    },
  },
  watch: {
    handymanId: {
      immediate: true,
      async handler() {
        await this.loadAll();
      },
    },
    activeTab() {
      // lazy-load jobs tab if user switches quickly
      if (this.activeTab === "jobs" && this.jobs.length === 0) {
        this.loadJobs({ reset: true });
      }

      // Ensure resize observers are attached to the active scroller
      this.$nextTick(() => {
        this.setupScrollObservers();
      });
    },
  },
  mounted() {
    document.addEventListener("keydown", this.onKeydown);
    this.lockBodyScroll();

    this.$nextTick(() => {
      this.setupScrollObservers();
    });
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.onKeydown);
    this.unlockBodyScroll();

    try {
      this._ratingsResizeObserver?.disconnect?.();
    } catch (e) {}
    try {
      this._jobsResizeObserver?.disconnect?.();
    } catch (e) {}
  },
  methods: {
    async goToRatingPage(page) {
      if (this.isAnimating) return; // Prevent multiple animations

      const safePage = Math.max(0, Number(page) || 0);
      const maxCurrentPage = Math.max(
        0,
        Math.ceil(this.ratings.length / this.ratingsPerPage) - 1
      );

      // Don't go beyond loaded pages if no more to load
      if (safePage > maxCurrentPage && !this.hasMoreRatings) return;

      // Start animation immediately
      this.isAnimating = true;
      this.currentRatingPage = Math.min(safePage, maxCurrentPage);

      // Wait for slide-out animation (300ms for leave transition)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Now load more data if needed
      const needed = (safePage + 1) * this.ratingsPerPage;
      if (this.hasMoreRatings && this.ratings.length < needed) {
        await this.loadRatings();

        // Update page after loading
        const newMaxPage = Math.max(
          0,
          Math.ceil(this.ratings.length / this.ratingsPerPage) - 1
        );
        this.currentRatingPage = Math.min(safePage, newMaxPage);
      }

      // Wait for slide-in animation to complete (500ms for enter transition)
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.isAnimating = false;
    },

    onRatingsSwipeStart(e) {
      try {
        const t = e?.touches?.[0];
        if (!t) return;
        this._ratingsSwipeStartX = t.clientX;
        this._ratingsSwipeStartY = t.clientY;
      } catch (_) {}
    },

    async onRatingsSwipeEnd(e) {
      try {
        if (this.isAnimating) return; // Prevent swipe during animation

        const t = e?.changedTouches?.[0];
        if (!t) return;

        const dx = t.clientX - (this._ratingsSwipeStartX || 0);
        const dy = t.clientY - (this._ratingsSwipeStartY || 0);

        // Only treat mostly-horizontal swipes
        if (Math.abs(dx) < 40 || Math.abs(dy) > 70) return;

        // Set swipe direction based on swipe
        // swipe right (dx > 0) = going back (left direction)
        // swipe left (dx < 0) = going forward (right direction)
        if (dx > 0) {
          this.swipeDirection = "left";
          await this.goToRatingPage(this.currentRatingPage - 1);
        } else {
          this.swipeDirection = "right";
          await this.goToRatingPage(this.currentRatingPage + 1);
        }
      } catch (_) {}
    },

    onBeforeEnter(el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
    },

    onEnter(el, done) {
      const delay = Number(el.dataset.index) * 80;
      setTimeout(() => {
        el.style.transition = "all 0.5s ease-out";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        done();
      }, delay);
    },

    // Jobs pagination and swipe handlers
    async goToJobPage(page) {
      if (this.isJobsAnimating) return;

      const safePage = Math.max(0, Number(page) || 0);
      const maxCurrentPage = Math.max(
        0,
        Math.ceil(this.jobs.length / this.jobsPerPage) - 1
      );

      if (safePage > maxCurrentPage && !this.hasMoreJobs) return;

      this.isJobsAnimating = true;
      this.currentJobPage = Math.min(safePage, maxCurrentPage);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const needed = (safePage + 1) * this.jobsPerPage;
      if (this.hasMoreJobs && this.jobs.length < needed) {
        await this.loadJobs();

        const newMaxPage = Math.max(
          0,
          Math.ceil(this.jobs.length / this.jobsPerPage) - 1
        );
        this.currentJobPage = Math.min(safePage, newMaxPage);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      this.isJobsAnimating = false;
    },

    onJobsSwipeStart(e) {
      try {
        const t = e?.touches?.[0];
        if (!t) return;
        this._jobsSwipeStartX = t.clientX;
        this._jobsSwipeStartY = t.clientY;
      } catch (_) {}
    },

    async onJobsSwipeEnd(e) {
      try {
        if (this.isJobsAnimating) return;

        const t = e?.changedTouches?.[0];
        if (!t) return;

        const dx = t.clientX - (this._jobsSwipeStartX || 0);
        const dy = t.clientY - (this._jobsSwipeStartY || 0);

        if (Math.abs(dx) < 40 || Math.abs(dy) > 70) return;

        if (dx > 0) {
          this.jobsSwipeDirection = "left";
          await this.goToJobPage(this.currentJobPage - 1);
        } else {
          this.jobsSwipeDirection = "right";
          await this.goToJobPage(this.currentJobPage + 1);
        }
      } catch (_) {}
    },

    setupScrollObservers() {
      // No ResizeObserver support? fall back to 4.
      if (typeof ResizeObserver === "undefined") return;

      const computeCols = (el) => {
        try {
          const w = el?.clientWidth || 0;
          const gap = 12;
          const minCard = 120;
          const maxCols = 4;
          const cols = Math.floor((w + gap) / (minCard + gap));
          return Math.max(1, Math.min(maxCols, cols || 1));
        } catch (e) {
          return 4;
        }
      };

      const ratingsEl = this.$refs.ratingsScroll;
      if (ratingsEl) {
        try {
          this._ratingsResizeObserver?.disconnect?.();
        } catch (e) {}
        this.ratingsCols = computeCols(ratingsEl);
        this._ratingsResizeObserver = new ResizeObserver(() => {
          this.ratingsCols = computeCols(ratingsEl);
        });
        this._ratingsResizeObserver.observe(ratingsEl);
      }

      const jobsEl = this.$refs.jobsScroll;
      if (jobsEl) {
        try {
          this._jobsResizeObserver?.disconnect?.();
        } catch (e) {}
        this.jobsCols = computeCols(jobsEl);
        this._jobsResizeObserver = new ResizeObserver(() => {
          this.jobsCols = computeCols(jobsEl);
        });
        this._jobsResizeObserver.observe(jobsEl);
      }
    },

    starsText(val) {
      const n = Math.max(0, Math.min(5, Math.round(Number(val) || 0)));
      return "★".repeat(n) + "☆".repeat(5 - n);
    },
    lockBodyScroll() {
      try {
        this._prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      } catch (e) {}
    },
    unlockBodyScroll() {
      try {
        document.body.style.overflow = this._prevBodyOverflow || "";
      } catch (e) {}
    },
    emitClose() {
      this.$emit("close");
    },
    emitBook() {
      this.$emit("book", this.handyman);
    },
    emitBlock() {
      this.$emit("block", this.handyman);
    },
    onKeydown(e) {
      if (e.key === "Escape") this.emitClose();
    },
    onAvatarError() {
      this.avatarErrored = true;
    },

    formatRating(val) {
      const n = Number(val);
      if (!Number.isFinite(n)) return "0";
      return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");
    },
    formatDate(dateLike) {
      const d = new Date(dateLike?.$date || dateLike);
      if (Number.isNaN(d.getTime())) return "";
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    },
    statusText(status) {
      const s = String(status || "").toLowerCase();
      if (s === "done" || s === "completed") return "הושלמה";
      if (s === "cancelled" || s === "canceled") return "בוטלה";
      if (s === "in_progress") return "בתהליך";
      if (s === "assigned") return "שובצה";
      if (s === "on_the_way") return "בדרך";
      if (s === "expired") return "פג תוקף";
      if (s === "quoted") return "בהצעה";
      if (s === "open") return "פתוחה";
      return status || "";
    },
    pillClass(status) {
      const s = String(status || "").toLowerCase();
      if (s === "done" || s === "completed") return "hsCardPill--good";
      if (s === "cancelled" || s === "canceled") return "hsCardPill--bad";
      if (s === "in_progress" || s === "assigned" || s === "on_the_way")
        return "hsCardPill--mid";
      return "";
    },

    async loadAll() {
      await this.loadRatings({ reset: true });
      // jobs are lazy-loaded when switching to the tab
      this.jobs = [];
      this.jobsSkip = 0;
      this.hasMoreJobs = true;
    },

    async loadRatings({ reset = false } = {}) {
      if (!this.handymanId) return;
      if (this.loadingRatings || this.loadingMoreRatings) return;
      if (reset) {
        this.ratings = [];
        this.ratingsSkip = 0;
        this.hasMoreRatings = true;
        this.ratingsError = "";
        this.currentRatingPage = 0;

        try {
          // reset scroll position so user starts from the beginning
          this.$nextTick(() => {
            const el = this.$refs.ratingsScroll;
            if (el && el.scrollTo) el.scrollTo({ left: 0, behavior: "auto" });
          });
        } catch (_) {}
      }

      if (!this.hasMoreRatings) return;

      const isFirstLoad = this.ratings.length === 0;
      if (isFirstLoad) this.loadingRatings = true;
      else this.loadingMoreRatings = true;

      try {
        const { URL } = await import("@/Url/url");
        const limit = Math.max(1, Number(this.ratingsPerPage) || 5);

        const { data } = await axios.get(
          `${URL}/ratings/handyman/${this.handymanId}?limit=${limit}&skip=${this.ratingsSkip}&includeSummary=false`,
          { timeout: 30000 }
        );

        const batch = Array.isArray(data?.ratings) ? data.ratings : [];
        if (batch.length > 0) {
          this.ratings = [...this.ratings, ...batch];
          this.ratingsSkip += batch.length;
        }

        const hasMoreFromServer =
          typeof data?.pagination?.hasMore === "boolean"
            ? data.pagination.hasMore
            : batch.length === limit;
        this.hasMoreRatings = hasMoreFromServer;
      } catch (e) {
        this.ratingsError =
          e?.code === "ECONNABORTED"
            ? "הטעינה לוקחת יותר מדי זמן. נסה שוב בעוד רגע."
            : "לא הצלחנו לטעון דירוגים כרגע";
        this.hasMoreRatings = false;
      } finally {
        this.loadingRatings = false;
        this.loadingMoreRatings = false;
      }
    },

    async loadJobs({ reset = false } = {}) {
      if (!this.handymanId) return;
      if (this.loadingJobs || this.loadingMoreJobs) return;
      if (reset) {
        this.jobs = [];
        this.jobsSkip = 0;
        this.hasMoreJobs = true;
        this.jobsError = "";

        try {
          this.$nextTick(() => {
            const el = this.$refs.jobsScroll;
            if (el && el.scrollTo) el.scrollTo({ left: 0, behavior: "auto" });
          });
        } catch (_) {}
      }

      if (!this.hasMoreJobs) return;

      const isFirstLoad = this.jobs.length === 0;
      if (isFirstLoad) this.loadingJobs = true;
      else this.loadingMoreJobs = true;

      try {
        const { URL } = await import("@/Url/url");
        const limit = this.jobsPerPage; // Use 3 jobs per page
        const { data } = await axios.get(
          `${URL}/handyman/${this.handymanId}/jobs/history?limit=${limit}&skip=${this.jobsSkip}`,
          { timeout: 30000 }
        );

        const batch = Array.isArray(data?.jobs) ? data.jobs : [];
        if (batch.length > 0) {
          this.jobs = [...this.jobs, ...batch];
          this.jobsSkip += batch.length;
        }

        const hasMoreFromServer =
          typeof data?.pagination?.hasMore === "boolean"
            ? data.pagination.hasMore
            : batch.length === limit;
        this.hasMoreJobs = hasMoreFromServer;
      } catch (e) {
        this.jobsError =
          e?.code === "ECONNABORTED"
            ? "הטעינה לוקחת יותר מדי זמן. נסה שוב בעוד רגע."
            : "לא הצלחנו לטעון היסטוריית עבודות כרגע";
        this.hasMoreJobs = false;
      } finally {
        this.loadingJobs = false;
        this.loadingMoreJobs = false;
      }
    },

    onRatingsScroll() {
      if (this._ratingsScrollTick) return;
      this._ratingsScrollTick = true;
      requestAnimationFrame(() => {
        this._ratingsScrollTick = false;
        const el = this.$refs.ratingsScroll;
        if (!el) return;

        const threshold = 60;
        const nearEnd =
          el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold;
        if (nearEnd) this.loadRatings();
      });
    },
    onJobsScroll() {
      if (this._jobsScrollTick) return;
      this._jobsScrollTick = true;
      requestAnimationFrame(() => {
        this._jobsScrollTick = false;
        const el = this.$refs.jobsScroll;
        if (!el) return;

        const threshold = 60;
        const nearEnd =
          el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold;
        if (nearEnd) this.loadJobs();
      });
    },

    // Drag to close (pointer)
    onDragStart(e) {
      try {
        if (e.button !== undefined && e.button !== 0) return;
      } catch (_) {}

      this.isDragging = true;
      this.dragStartY = e.clientY;
      this.dragOffsetY = 0;

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}

      window.addEventListener("pointermove", this.onDragMove, {
        passive: false,
      });
      window.addEventListener("pointerup", this.onDragEnd, { passive: true });
      window.addEventListener("pointercancel", this.onDragEnd, {
        passive: true,
      });
    },
    onDragMove(e) {
      if (!this.isDragging) return;
      if (e.cancelable) e.preventDefault();
      const delta = e.clientY - this.dragStartY;
      this.dragOffsetY = Math.max(0, delta);
    },
    onDragEnd() {
      if (!this.isDragging) return;
      const shouldClose = (this.dragOffsetY || 0) > 120;
      this.isDragging = false;

      window.removeEventListener("pointermove", this.onDragMove);
      window.removeEventListener("pointerup", this.onDragEnd);
      window.removeEventListener("pointercancel", this.onDragEnd);

      if (shouldClose) {
        this.emitClose();
      } else {
        this.dragOffsetY = 0;
      }
    },

    // iOS Safari: ensure touchstart works even if pointer events are flaky
    onTouchStart() {
      // no-op; keeping listener improves responsiveness on some devices
    },
  },
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$orange2: #ff8a2b;

.hsOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(10px);
  z-index: 6000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.hsSheet {
  width: 100%;
  max-width: 520px;
  height: min(92vh, 860px);
  border-radius: 26px 26px 0 0;
  background: linear-gradient(
    180deg,
    rgba(15, 16, 22, 0.98),
    rgba(11, 11, 15, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.75);
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  transition: transform 220ms ease;
  animation: hsIn 240ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

.hsSheet--dragging {
  transition: none;
}

.hsHandleArea {
  padding: 10px 0 4px;
  display: flex;
  justify-content: center;
  touch-action: none;
}

.hsHandle {
  width: 56px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.hsHeader {
  padding: 10px 16px 12px;
}

.hsClose {
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.hsProfile {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hsAvatar {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
}

.hsAvatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hsAvatarRing {
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  border: 2px solid rgba(249, 115, 22, 0.36);
  pointer-events: none;
}

.hsName {
  font-size: 20px;
  font-weight: 1100;
  color: rgba(255, 255, 255, 0.96);
  line-height: 1.1;
}

.hsMeta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(161, 161, 170, 0.95);
  font-weight: 900;
  font-size: 12px;
}

.hsDot {
  opacity: 0.65;
}

.hsTabs {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.hsTab {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  padding: 12px 10px;
  font-weight: 1100;
  cursor: pointer;
}

.hsTab--on {
  background: linear-gradient(
    135deg,
    rgba(255, 106, 0, 0.26),
    rgba(255, 138, 43, 0.12)
  );
  border-color: rgba(255, 138, 43, 0.34);
  color: rgba(255, 255, 255, 0.96);
}

.hsBody {
  padding: 0 16px 14px;
  height: calc(100% - 220px);
  overflow: hidden;
}

.hsPane {
  height: 100%;
  overflow: hidden;
  padding-right: 2px;
}

.hsLoading,
.hsEmpty {
  padding: 18px 8px;
  color: rgba(161, 161, 170, 0.95);
  font-weight: 900;
  text-align: center;
}

.hsHScroll {
  height: 100%;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  padding: 2px 2px 16px;
  direction: ltr;
}

.hsHScroll::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

.hsHScroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.hsHTrack {
  --hs-gap: 12px;
  display: flex !important;
  flex-direction: column !important;
  gap: var(--hs-gap);
  align-items: stretch;
  height: auto !important;
  padding-bottom: 2px;
  width: 100% !important;
}

.hsCard {
  position: relative;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 10px 12px 10px;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.hsCard--h {
  width: 100% !important;
  scroll-snap-align: none;
  max-width: 100%;
  overflow: hidden;
  overflow-x: hidden;
}

.hsCustomerProfile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  overflow: hidden;
}

.hsCustomerAvatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 122, 0, 0.3);
  flex-shrink: 0;
}

.hsCustomerInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  width: 100%;
}

.hsCustomerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.hsCustomerName {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  flex: 1;
  min-width: 0;
}

.hsHintCard {
  width: auto;
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(161, 161, 170, 0.95);
  font-weight: 900;
  display: grid;
  place-items: center;
  padding: 14px;
  scroll-snap-align: start;
}

.hsJobMetaStars {
  font-weight: 1100;
  letter-spacing: 0.5px;
}

.hsHintCard--end {
  color: rgba(255, 255, 255, 0.65);
}

.hsCardTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  overflow: hidden;
}

.hsCardTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
  width: 100%;
}

.hsStars {
  font-weight: 1100;
  color: rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
  font-size: 14px;
}

.hsCardSub {
  color: rgba(161, 161, 170, 0.95);
  font-weight: 900;
  font-size: 12px;
  white-space: normal;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.hsCardDate {
  color: rgba(161, 161, 170, 0.9);
  font-size: 12px;
  font-weight: 900;
  flex: 0 0 auto;
}

.hsReview {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 900;
  line-height: 1.35;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  overflow: hidden;
}

.hsReview--muted {
  color: rgba(161, 161, 170, 0.9);
}

.hsJobTitle {
  font-weight: 1100;
  color: rgba(255, 255, 255, 0.96);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 62vw;
}

.hsCardPill {
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 1100;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
}

.hsCardPill--good {
  border-color: rgba(34, 197, 94, 0.25);
  background: rgba(34, 197, 94, 0.08);
}

.hsCardPill--mid {
  border-color: rgba(249, 115, 22, 0.22);
  background: rgba(249, 115, 22, 0.07);
}

.hsCardPill--bad {
  border-color: rgba(239, 68, 68, 0.22);
  background: rgba(239, 68, 68, 0.06);
}

.hsJobMeta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: rgba(161, 161, 170, 0.95);
  font-weight: 900;
  font-size: 12px;
}

.hsFooter {
  padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(11, 11, 15, 0.92);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.hsAction {
  border-radius: 14px;
  padding: 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 1100;
  font-size: 13px;
  cursor: pointer;
}

.hsAction--primary {
  border: none;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0b0f;
  box-shadow: 0 10px 22px rgba(249, 115, 22, 0.25);
}

.hsPaginationWrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-x: hidden;
  touch-action: pan-y;
}

.hsPaginationDots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.hsPaginationDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.hsPaginationDot--active {
  width: 24px;
  border-radius: 4px;
  background: #ff7a00;
}

.hsPaginationDot:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Swipe right - cards come from LEFT (going back) */
.rating-slide-left-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rating-slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}

.rating-slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.rating-slide-left-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Swipe left - cards come from RIGHT (going forward) */
.rating-slide-right-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rating-slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}

.rating-slide-right-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.rating-slide-right-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.rating-slide-left-move,
.rating-slide-right-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Jobs swipe animations */
.job-slide-left-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}

.job-slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.job-slide-left-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.job-slide-right-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}

.job-slide-right-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.job-slide-right-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.job-slide-left-move,
.job-slide-right-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Job Card Styles */
.hsCard--job {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.02)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 14px;
}

.hsJobHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.hsJobProfileSection {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.hsJobAvatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 122, 0, 0.4);
  flex-shrink: 0;
}

.hsJobInfo {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.hsJobClientName {
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.96);
}

.hsJobTitle {
  font-size: 13px;
  font-weight: 600;
  color: rgba(161, 161, 170, 0.95);
}

.hsCardPill--sm {
  padding: 6px 10px;
  font-size: 11px;
  flex-shrink: 0;
}

.hsJobFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.hsJobRating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hsJobStars {
  font-size: 16px;
  letter-spacing: 1px;
  color: #ff7a00;
}

.hsJobStars--muted {
  color: rgba(255, 255, 255, 0.2);
}

.hsJobRatingNum {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.hsJobDate {
  font-size: 12px;
  font-weight: 900;
  color: rgba(161, 161, 170, 0.9);
}

.hsJobName {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 2px;
}

@media (max-width: 420px) {
  .hsSheet {
    height: min(94vh, 900px);
    border-radius: 22px 22px 0 0;
  }
}

@keyframes hsIn {
  from {
    transform: translate3d(0, 18px, 0);
    opacity: 0.85;
  }
  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}
</style>
