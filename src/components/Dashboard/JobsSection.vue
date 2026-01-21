<template>
  <section class="jobs" id="jobs">
    <!-- Header -->
    <header class="jobs__header">
      <div class="jobs__header-content">
        <div>
          <h1 class="jobs__header-title"> עבודות במערכת</h1>
          <p class="jobs__header-subtitle">
            {{ filteredJobs.length }} משימות ממתינות לטיפול
        </p>
      </div>
        <button
          v-if="isHendiman"
          class="jobs__filter-btn"
          type="button"
          @click="openFilterModal"
        >
          <span class="material-symbols-outlined">filter_list</span>
        </button>
        <button
          v-else
          class="jobs__filter-btn"
          type="button"
          @click="$emit('refresh')"
        >
          <span class="material-symbols-outlined">refresh</span>
      </button>
    </div>
    </header>

    <!-- Filters (handyman only) -->
    <div
      v-if="isHendiman"
      class="filters"
      :class="{ 'filters--hidden-desktop': hideFiltersOnDesktop }"
    >
      <div class="filters__grid">
        <!-- Desktop Filters (visible only on desktop) -->
        <div class="panel panel--filter-desktop">
          <div class="panel__label">מיקום</div>
          <div class="radio-group radio-group--horizontal">
            <label class="radio-item radio-item--inline">
              <input
                type="radio"
                name="locationFilterDesktop"
                value="myLocation"
                :checked="handymanFilters.locationType === 'myLocation'"
                @change="$emit('change-location-type', 'myLocation')"
              />
              <span class="radio-label">המיקום שלי</span>
            </label>
            <label class="radio-item radio-item--inline">
              <input
                type="radio"
                name="locationFilterDesktop"
                value="residence"
                :checked="handymanFilters.locationType === 'residence'"
                @change="$emit('change-location-type', 'residence')"
              />
              <span class="radio-label">מקום המגורים שלי</span>
            </label>
          </div>
        </div>

        <div class="panel panel--filter-desktop">
          <div class="panel__label">
            מרחק (ק"מ)
            <button
              class="link link--small"
              type="button"
              @click="$emit('reset-km')"
            >
              איפוס
            </button>
          </div>

          <div class="range-display">
            <span class="range-value">עד {{ displayMaxKm }} ק״מ</span>
          </div>

          <input
            class="range-input"
            type="range"
            min="1"
            max="50"
            step="1"
            :value="handymanFilters.maxKm"
            @input="handleKmInput($event.target.value)"
            @change="handleKmChange($event.target.value)"
          />
        </div>

        <div class="panel panel--filter-desktop">
          <div class="panel__label">
            מחיר (₪)
            <button
              class="link link--small"
              type="button"
              @click="
                $emit('change-price-range', { minPrice: null, maxPrice: null })
              "
            >
              איפוס
            </button>
          </div>

          <div class="price-range price-range--horizontal">
            <div class="price-input-group">
              <label class="price-label">מינימום:</label>
              <input
                class="price-input"
                type="number"
                min="0"
                :value="handymanFilters.minPrice"
                @input="
                  $emit('change-price-range', {
                    minPrice: $event.target.value
                      ? Number($event.target.value)
                      : null,
                    maxPrice: handymanFilters.maxPrice,
                  })
                "
                placeholder="0"
              />
            </div>

            <div class="price-input-group">
              <label class="price-label">מקסימום:</label>
              <input
                class="price-input"
                type="number"
                min="0"
                :value="handymanFilters.maxPrice"
                @input="
                  $emit('change-price-range', {
                    minPrice: handymanFilters.minPrice,
                    maxPrice: $event.target.value
                      ? Number($event.target.value)
                      : null,
                  })
                "
                placeholder="ללא הגבלה"
              />
            </div>
          </div>
        </div>

        <div class="panel panel--filter-desktop">
          <div class="panel__label">סוג קריאה</div>
          <div class="radio-group radio-group--horizontal">
            <label class="radio-item radio-item--inline">
              <input
                type="radio"
                name="workTypeFilterDesktop"
                value=""
                :checked="handymanFilters.workType === ''"
                @change="$emit('change-work-type', '')"
              />
              <span class="radio-label">הכל</span>
            </label>

            <label class="radio-item radio-item--inline">
              <input
                type="radio"
                name="workTypeFilterDesktop"
                value="קלה"
                :checked="handymanFilters.workType === 'קלה'"
                @change="$emit('change-work-type', 'קלה')"
              />
              <span class="radio-label">קלה</span>
            </label>

            <label class="radio-item radio-item--inline">
              <input
                type="radio"
                name="workTypeFilterDesktop"
                value="מורכבת"
                :checked="handymanFilters.workType === 'מורכבת'"
                @change="$emit('change-work-type', 'מורכבת')"
              />
              <span class="radio-label">מורכבת</span>
            </label>

            <label class="radio-item radio-item--inline">
              <input
                type="radio"
                name="workTypeFilterDesktop"
                value="קשה"
                :checked="handymanFilters.workType === 'קשה'"
                @change="$emit('change-work-type', 'קשה')"
              />
              <span class="radio-label">קשה</span>
            </label>
          </div>
        </div>

        <!-- Filter Button (mobile) -->
        <div class="panel panel--filter panel--filter-mobile">
          <button class="filter-btn" type="button" @click="openFilterModal">
            <span class="filter-btn__ic" aria-hidden="true">🔍</span>
            <span>סנן</span>
            <span class="filter-btn__hint" aria-hidden="true">חכם</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Modal Component -->
    <JobFilterModal
      :is-open="showFilterModal"
      :filters="localFilters"
      :user-name="userName || ''"
      :user-plan="userPlan || ''"
      :user-avatar="userAvatar || ''"
      :user-city="userCity || ''"
      @close="closeFilterModal"
      @apply="handleFilterApply"
      @location-type-change="handleLocationTypeChange"
      @reset-distance="resetKmRange"
      @reset-price="resetPriceRange"
    />

    <!-- Main Content -->
    <main class="jobs__main">
      <!-- Urgent Jobs Section -->
      <section v-if="urgentJobs.length > 0" class="jobs__urgent-section">
        <div class="jobs__section-header">
          <span class="jobs__section-dot"></span>
          <h2 class="jobs__section-title">דחיפות גבוהה</h2>
        </div>
        <div class="jobs__urgent-list" ref="urgentListRef" @scroll="handleUrgentScroll">
          <article
            v-for="job in urgentJobs"
            :key="job.id || job._id"
            class="job job--urgent-card"
          >
          <div class="job__urgent-glow"></div>
          <div class="job__content">
            <div class="job__header">
              <div class="job__header-left">
                <div class="job__icon-box">
                  <span class="material-symbols-outlined job__icon">
                    {{ getJobIcon(job) }}
                  </span>
                </div>
                <div class="job__info">
                  <h3 class="job__title" :title="getJobDisplayName(job)">
                    {{ getJobDisplayName(job) }}
                  </h3>
                  <div class="job__location">
                    <span class="material-symbols-outlined">location_on</span>
                    <span>{{ formatJobLocation(job) }}</span>
                  </div>
                </div>
              </div>
              <div class="job__priority-badge">
                <span class="material-symbols-outlined">priority_high</span>
              </div>
          </div>

            <div class="job__tags" v-if="getJobChips(job).length">
              <span
                v-for="chip in getJobChips(job)"
                :key="chip.text"
                class="job__tag"
              >
                {{ chip.text }}
              </span>
        </div>

            <div class="job__footer">
              <div class="job__time">
                <span class="material-symbols-outlined">schedule</span>
                <span>{{ getTimeAgo(job) || "לפני זמן מה" }}</span>
            </div>
              <div class="job__footer-actions">
                <button
                  v-if="isHendiman && isQuotedJob(job)"
                  class="job__quote-btn"
                  type="button"
                  @click="$emit('open-quotation-modal', job)"
                >
                  <span class="material-symbols-outlined">attach_money</span>
                  <span>שלח הצעת מחיר</span>
                </button>
                <button
                  class="job__view-btn"
                  type="button"
                  @click="$emit('view', job)"
                >
                  <span>צפייה בעבודה</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
            </div>
        </article>
        <div class="jobs__urgent-spacer"></div>
          </div>
        <!-- Dots indicator for scroll -->
        <div v-if="urgentJobs.length > 0" class="jobs__urgent-dots">
          <span
            v-for="(job, index) in urgentJobs"
            :key="index"
            class="jobs__urgent-dot"
            :class="{ 'jobs__urgent-dot--active': currentUrgentIndex === index }"
            @click="scrollToUrgentJob(index)"
          ></span>
        </div>
      </section>

      <!-- Regular Jobs Section -->
      <section v-if="regularJobs.length > 0" class="jobs__regular-section">
        <div class="jobs__section-header">
          <h2 class="jobs__section-title">משימות נוספות</h2>
        </div>
        <div class="jobs__regular-list" ref="regularListRef" @scroll="handleRegularScroll">
          <article
            v-for="job in regularJobs"
            :key="job.id || job._id"
            class="job job--regular-card"
          >
            <div class="job__hover-glow"></div>
            <div class="job__content">
              <div class="job__header">
                <div class="job__icon-box job__icon-box--regular">
                  <span class="material-symbols-outlined job__icon">
                    {{ getJobIcon(job) }}
                  </span>
                </div>
              <button
                  v-if="!isHendiman && isClientJob(job)"
                  class="job__menu-btn"
                type="button"
                  @click.stop="toggleJobMenu(job.id || job._id)"
              >
                  <span class="material-symbols-outlined">more_horiz</span>
              </button>
            </div>

              <h3 class="job__title job__title--regular" :title="getJobDisplayName(job)">
                {{ getJobDisplayName(job) }}
              </h3>

              <div class="job__location job__location--regular">
                <span class="material-symbols-outlined">location_on</span>
                <span class="job__location-text">{{ formatJobLocation(job) }}</span>
          </div>

              <div class="job__tags job__tags--regular" v-if="getJobChips(job).length">
                <span
                  v-for="chip in getJobChips(job)"
                  :key="chip.text"
                  class="job__tag job__tag--regular"
                >
                  {{ chip.text }}
                </span>
        </div>

              <div class="job__footer job__footer--regular">
                <span class="job__time job__time--regular">
                  {{ getTimeAgo(job) || "לפני זמן מה" }}
                </span>
                <div class="job__footer-actions job__footer-actions--regular">
                  <button
                    v-if="isHendiman && isQuotedJob(job)"
                    class="job__quote-btn job__quote-btn--regular"
                    type="button"
                    @click="$emit('open-quotation-modal', job)"
                  >
                    <span class="material-symbols-outlined">attach_money</span>
                  </button>
                  <button
                    class="job__view-btn job__view-btn--regular"
                    type="button"
                    @click="$emit('view', job)"
                  >
                    <span class="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Client job menu dropdown -->
          <div
            v-if="!isHendiman && isClientJob(job)"
            class="job__menu"
            :class="{
                'job__menu--open': openJobMenuId === job.id || openJobMenuId === job._id,
              }"
            >
            <div
              v-if="openJobMenuId === (job.id || job._id)"
              class="job__menu-dropdown"
              @click.stop
            >
              <button
                class="job__menu-item"
                type="button"
                @click="handleEditJob(job)"
              >
                <span class="job__menu-icon">✏️</span>
                עריכה
              </button>
              <button
                class="job__menu-item"
                type="button"
                @click="handleDeleteJob(job)"
              >
                <span class="job__menu-icon">🗑️</span>
                מחיקה
              </button>
              <button
                class="job__menu-item"
                type="button"
                @click="handleViewJob(job)"
              >
                <span class="job__menu-icon">👁️</span>
                צפייה
              </button>
            </div>
          </div>
          </article>
          <div class="jobs__regular-spacer"></div>
        </div>
        <!-- Dots indicator for scroll -->
        <div v-if="regularJobs.length > 0" class="jobs__regular-dots">
          <span
            v-for="(job, index) in regularJobs"
            :key="index"
            class="jobs__regular-dot"
            :class="{ 'jobs__regular-dot--active': currentRegularIndex === index }"
            @click="scrollToRegularJob(index)"
          ></span>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="filteredJobs.length === 0" class="empty">
        <div class="empty__ic" aria-hidden="true">🧰</div>
        <div class="empty__title">אין עבודות להצגה כרגע</div>
        <div class="empty__sub">נסה לרענן או לשנות סינון.</div>
          </div>
    </main>

        <!-- Client job menu dropdown -->
        <div
          v-if="!isHendiman && isClientJob(job)"
          class="job__menu"
          :class="{
            'job__menu--open': openJobMenuId === job.id || openJobMenuId === job._id,
          }"
        >
          <div
            v-if="openJobMenuId === (job.id || job._id)"
            class="job__menu-dropdown"
            @click.stop
          >
            <button
              class="job__menu-item"
              type="button"
              @click="handleEditJob(job)"
            >
              <span class="job__menu-icon">✏️</span>
              עריכה
            </button>
          <button
              class="job__menu-item"
            type="button"
              @click="handleDeleteJob(job)"
          >
              <span class="job__menu-icon">🗑️</span>
              מחיקה
          </button>
          <button
              class="job__menu-item"
            type="button"
              @click="handleViewJob(job)"
          >
              <span class="job__menu-icon">👁️</span>
            צפייה
          </button>
      </div>
    </div>


    <!-- Pagination -->
    <div
      v-if="jobsPagination && jobsPagination.total > jobsPagination.pageSize"
      class="pager"
    >
      <button
        class="pageBtn pageBtn--ghost"
        type="button"
        :disabled="jobsPagination.page <= 1"
        @click="$emit('prev-jobs-page')"
      >
        ← הקודם
      </button>

      <div class="pager__mid">
        <div class="dots" aria-hidden="true">
          <span
            v-for="n in Math.max(
              1,
              Math.ceil(jobsPagination.total / jobsPagination.pageSize)
            )"
            :key="n"
            class="dot"
            :class="{ 'dot--on': n === jobsPagination.page }"
          />
        </div>
        <div class="pager__txt">
          עמוד {{ jobsPagination.page }} מתוך
          {{ Math.ceil(jobsPagination.total / jobsPagination.pageSize) }}
        </div>
      </div>

      <button
        class="pageBtn pageBtn--primary"
        type="button"
        :disabled="
          jobsPagination.page >=
          Math.ceil(jobsPagination.total / jobsPagination.pageSize)
        "
        @click="$emit('next-jobs-page')"
      >
        הבא →
      </button>
    </div>
  </section>
</template>

<script>
import JobFilterModal from "./JobFilterModal.vue";

export default {
  name: "JobsSection",
  components: {
    JobFilterModal,
  },
  props: {
    isHendiman: { type: Boolean, default: false },
    isMobile: { type: Boolean, default: false },
    filteredJobs: { type: Array, required: true },
    statusTabsWithCounts: { type: Array, default: () => [] },
    activeStatus: { type: String, default: "all" },
    handymanFilters: { type: Object, default: () => ({ maxKm: 25 }) },
    jobsPagination: {
      type: Object,
      default: () => ({ page: 1, total: 0, pageSize: 5 }),
    },
    handymanCoords: { type: Object, default: () => null },
    currentUserId: { type: String, default: null },
    hideFiltersOnDesktop: { type: Boolean, default: false },
    userName: { type: String, default: "" },
    userPlan: { type: String, default: "" },
    userAvatar: { type: String, default: "" },
    userCity: { type: String, default: "" },
  },
  emits: [
    "refresh",
    "pick-status",
    "change-km",
    "reset-km",
    "change-location-type",
    "change-work-type",
    "change-price-range",
    "view",
    "next-jobs-page",
    "prev-jobs-page",
    "edit-job",
    "delete-job",
    "quotation",
    "open-quotation-modal",
    "open-filter-modal",
    "close-filter-modal",
  ],
  data() {
    return {
      isStatusDropdownOpen: false,
      isFilterDropdownOpen: false,
      localMaxKm: null,
      showFilterModal: false,
      openJobMenuId: null,
      jobCarouselIndex: 0,
      currentUrgentIndex: 0,
      currentRegularIndex: 0,
      localFilters: {
        status: "all",
        locationType: "residence",
        maxKm: 25,
        minPrice: null,
        maxPrice: null,
        workType: "",
      },
    };
  },
  computed: {
    displayMaxKm() {
      return this.localMaxKm !== null
        ? this.localMaxKm
        : this.handymanFilters.maxKm;
    },
    urgentJobs() {
      if (!this.filteredJobs) return [];
      const urgent = this.filteredJobs.filter(
        (job) => job && (job.urgent || job.isUrgent)
      );
      // מיין - עבודות פתוחות ראשונות
      return urgent.sort((a, b) => {
        const aIsOpen = a.status === "open";
        const bIsOpen = b.status === "open";
        if (aIsOpen && !bIsOpen) return -1;
        if (!aIsOpen && bIsOpen) return 1;
        return 0;
      });
    },
    regularJobs() {
      if (!this.filteredJobs) return [];
      const regular = this.filteredJobs.filter(
        (job) => job && !job.urgent && !job.isUrgent
      );
      // מיין - עבודות פתוחות ראשונות
      return regular.sort((a, b) => {
        const aIsOpen = a.status === "open";
        const bIsOpen = b.status === "open";
        if (aIsOpen && !bIsOpen) return -1;
        if (!aIsOpen && bIsOpen) return 1;
        return 0;
      });
    },
  },
  watch: {
    "handymanFilters.maxKm"(newVal) {
      if (this.localMaxKm !== null && this.localMaxKm === newVal) {
        this.localMaxKm = null;
      }
    },
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
    this.initializeLocalFilters();
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    onJobTrackScroll() {
      // no-op (kept to avoid breaking existing listeners)
    },
    scrollToJob(index) {
      // no-op (carousel removed)
    },
    getJobDisplayName(job) {
      if (!job) return "ללא שם";
      if (
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 0
      ) {
        if (job.subcategoryInfo.length === 1) {
          return (
            job.subcategoryInfo[0].subcategory ||
            job.subcategoryInfo[0].category ||
            job.subcategoryName ||
            "ללא שם"
          );
        } else {
          return `${job.subcategoryInfo.length} עבודות`;
        }
      }
      return (
        job.subcategoryInfo?.name ||
        job.subcategoryInfo?.subcategory ||
        job.subcategoryName ||
        "ללא שם"
      );
    },
    getJobIcon(job) {
      if (!job) return "construction";
      if (job.urgent || job.isUrgent) return "emergency";
      if (job.handymanIdSpecial) return "star";
      if (job.status === "quoted") return "attach_money";
      return "construction";
    },
    formatJobLocation(job) {
      if (!job) return "לא צוין";
      const location = job.locationText || "";
      const distance = this.distanceLabel(job);
      
      if (distance && this.isHendiman && location) {
        return distance < 1
          ? `${location} - בעיר שלך`
          : `${location} - ${distance} ק״מ`;
      }
      
      return location || "לא צוין";
    },
    getJobChips(job) {
      if (!job) return [];
      const chips = [];
      
      if (job.urgent || job.isUrgent) {
        chips.push({ text: "דחוף", class: "job__cat--urgent" });
      }
      
      if (job.handymanIdSpecial && this.isHendiman) {
        chips.push({ text: "הזמנה אישית", class: "job__cat--special" });
      }
      
      // בדוק אם יש מחיר "bid" או "quoted" ב-subcategoryInfo
      const hasBidPrice = (() => {
        if (Array.isArray(job.subcategoryInfo)) {
          return job.subcategoryInfo.some((sub) => 
            sub?.price === "bid" || 
            sub?.price === "quoted" || 
            sub?.price === "הצעת מחיר"
          );
        }
        return (
          job.subcategoryInfo?.price === "bid" || 
          job.subcategoryInfo?.price === "quoted" ||
          job.subcategoryInfo?.price === "הצעת מחיר" || 
          job.price === "bid" ||
          job.price === "quoted"
        );
      })();
      
      // הוסף סוג תשלום (קבלנות/לשעה) - רק אם אין הצעת מחיר
      const billingType = Array.isArray(job.subcategoryInfo) 
        ? job.subcategoryInfo[0]?.typeWork || job.billingType
        : job.subcategoryInfo?.typeWork || job.billingType;
      
      const workTypeText = Array.isArray(job.subcategoryInfo)
        ? job.subcategoryInfo[0]?.workType || job.workType
        : job.subcategoryInfo?.workType || job.workType;
      
      // אם יש הצעת מחיר, נציג "עבודה בהצעת מחיר"
      if (hasBidPrice || job.status === "quoted") {
        chips.push({ text: "עבודה בהצעת מחיר", class: "job__cat--quoted" });
      }
      
      // הצג את ה-step של העבודה (אם יש status ולא "open")
      if (job.status && job.status !== "open" && !hasBidPrice && job.status !== "quoted") {
        chips.push({
          text: this.getStatusLabel(job.status),
          class: job.status === "done" ? "job__cat--done" : "job__cat--status",
        });
      }
      
      // הוסף סוג תשלום (קבלנות/לשעה) - רק אם זה לא הצעת מחיר
      if (!hasBidPrice && job.status !== "quoted" && billingType) {
        chips.push({
          text: billingType,
          class: billingType === "לשעה" ? "job__cat--hourly" : "job__cat--fixed",
        });
      }
      
      // הוסף סוג עבודה (קלה/מורכבת/קשה) - רק אם זה שונה מ-billingType ולא הצעת מחיר
      if (!hasBidPrice && job.status !== "quoted" && workTypeText && workTypeText !== billingType) {
        // workType יכול להיות "קלה", "מורכבת", "קשה" - לא "קבלנות" או "לשעה"
        // אם workType הוא "קבלנות" או "לשעה", זה כפילות - נדלג עליו
        if (workTypeText !== "קבלנות" && workTypeText !== "לשעה" && workTypeText !== "hourly") {
          chips.push({
            text: workTypeText,
            class: "job__cat--work",
          });
        }
      }
      
      return chips;
    },
    handleUrgentScroll() {
      if (!this.$refs.urgentListRef) return;
      const container = this.$refs.urgentListRef;
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.querySelector('.job--urgent-card')?.offsetWidth || 320;
      const gap = 16;
      const newIndex = Math.round(scrollLeft / (cardWidth + gap));
      this.currentUrgentIndex = Math.min(newIndex, this.urgentJobs.length - 1);
    },
    scrollToUrgentJob(index) {
      if (!this.$refs.urgentListRef) return;
      const container = this.$refs.urgentListRef;
      const cardWidth = container.querySelector('.job--urgent-card')?.offsetWidth || 320;
      const gap = 16;
      const scrollPosition = index * (cardWidth + gap);
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    },
    handleRegularScroll() {
      if (!this.$refs.regularListRef) return;
      const container = this.$refs.regularListRef;
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.querySelector('.job--regular-card')?.offsetWidth || 320;
      const gap = 16;
      const newIndex = Math.round(scrollLeft / (cardWidth + gap));
      this.currentRegularIndex = Math.min(newIndex, this.regularJobs.length - 1);
    },
    scrollToRegularJob(index) {
      if (!this.$refs.regularListRef) return;
      const container = this.$refs.regularListRef;
      const cardWidth = container.querySelector('.job--regular-card')?.offsetWidth || 320;
      const gap = 16;
      const scrollPosition = index * (cardWidth + gap);
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    },
    handleClickOutside(e) {
      if (this.isStatusDropdownOpen && !e.target.closest(".selectWrap")) {
        this.isStatusDropdownOpen = false;
      }
      if (this.isFilterDropdownOpen && !e.target.closest(".filter-dropdown")) {
        this.isFilterDropdownOpen = false;
      }
      if (
        this.openJobMenuId &&
        !e.target.closest(".job__menu") &&
        !e.target.closest(".job__menu-dropdown")
      ) {
        this.openJobMenuId = null;
      }
    },
    isClientJob(job) {
      if (!job || !this.currentUserId || this.isHendiman) return false;
      return (
        job.clientId && String(job.clientId) === String(this.currentUserId)
      );
    },
    isQuotedJob(job) {
      if (!job) return false;
      // Job is a "quoted" job if status is "quoted" or if it has a bid price subcategory
      if (job.status === "quoted") return true;
      if (Array.isArray(job.subcategoryInfo)) {
        return job.subcategoryInfo.some((sub) => sub.price === "bid");
      }
      return false;
    },
    toggleJobMenu(jobId) {
      this.openJobMenuId = this.openJobMenuId === jobId ? null : jobId;
    },
    handleViewJob(job) {
      this.openJobMenuId = null;
      this.$emit("view", job);
    },
    handleEditJob(job) {
      this.openJobMenuId = null;
      this.$emit("edit-job", job);
    },
    handleDeleteJob(job) {
      this.openJobMenuId = null;
      this.$emit("delete-job", job);
    },
    getActiveFilterLabel() {
      const labels = [];
      if (this.handymanFilters.locationType === "myLocation") {
        labels.push("מיקום: שלי");
      } else {
        labels.push("מיקום: מגורים");
      }
      labels.push(`ק״מ: ${this.handymanFilters.maxKm}`);
      if (this.handymanFilters.workType) {
        labels.push(`סוג: ${this.handymanFilters.workType}`);
      }
      return labels.join(" • ");
    },
    handleFilterChange(filterType, value) {
      if (filterType === "location") {
        this.$emit("change-location-type", value);
      } else if (filterType === "workType") {
        this.$emit("change-work-type", value);
      }
    },
    handleResetKm() {
      this.$emit("reset-km");
    },
    selectStatus(value) {
      this.$emit("pick-status", value);
      this.isStatusDropdownOpen = false;
    },
    getSelectedStatusLabel() {
      const selected = this.statusTabsWithCounts.find(
        (t) => t.value === this.activeStatus
      );
      return selected ? `${selected.label} (${selected.count})` : "הכל";
    },
    haversineKm(lat1, lon1, lat2, lon2) {
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
    },
    distanceLabel(job) {
      if (!job) return null;
      const d =
        job?.distanceKm ??
        (this.handymanCoords &&
        this.handymanCoords.lat &&
        this.handymanCoords.lng &&
        job?.coordinates?.lat !== undefined &&
        job?.coordinates?.lng !== undefined
          ? this.haversineKm(
              this.handymanCoords.lat,
              this.handymanCoords.lng,
              job.coordinates.lat,
              job.coordinates.lng
            )
          : null);

      if (d === null || d === undefined || Number.isNaN(d)) return null;
      return d < 1 ? d.toFixed(2) : d.toFixed(1);
    },
    getStatusLabel(status) {
      if (status === "quoted") return "הצעת מחיר";
      if (status === "expired") return "פג תוקף";
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
    getTimeAgo(job) {
      if (!job || !job.createdAt) return null;
      const createdAt = new Date(job.createdAt);
      const now = new Date();
      const diffMs = now - createdAt;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "עכשיו";
      if (diffMins < 60) return `לפני ${diffMins} דקות`;
      if (diffHours < 24) return `לפני ${diffHours} שעות`;
      if (diffDays < 7) return `לפני ${diffDays} ימים`;
      return null;
    },
    handleKmInput(value) {
      this.localMaxKm = Number(value);
    },
    handleKmChange(value) {
      this.localMaxKm = null;
      this.$emit("change-km", value);
    },
    initializeLocalFilters() {
      this.localFilters = {
        status: this.activeStatus || "all",
        locationType: this.handymanFilters.locationType || "residence",
        maxKm: this.handymanFilters.maxKm || 25,
        minPrice: this.handymanFilters.minPrice || null,
        maxPrice: this.handymanFilters.maxPrice || null,
        workType: this.handymanFilters.workType || "",
      };
    },
    openFilterModal() {
      this.initializeLocalFilters();
      this.showFilterModal = true;
      this.$emit('filter-opened');
    },
    closeFilterModal() {
      this.showFilterModal = false;
      this.$emit('filter-closed');
    },
    resetKmRange() {
      this.localFilters.maxKm = 25;
    },
    resetPriceRange() {
      this.localFilters.minPrice = null;
      this.localFilters.maxPrice = null;
    },
    handleFilterApply(filters) {
      this.localFilters = { ...filters };
      this.$emit("pick-status", filters.status || this.activeStatus);
      this.$emit("change-location-type", filters.locationType);
      this.$emit("change-km", filters.maxKm);
      this.$emit("change-work-type", filters.workType);
      this.$emit("change-price-range", {
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });
      this.closeFilterModal();
    },
    handleLocationTypeChange(locationType) {
      this.localFilters.locationType = locationType;
      // Emit the change so Dashboard can update coordinates
      this.$emit('change-location-type', locationType);
    },
  },
};
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

$bg: #050505;
$card-dark: #121212;
$card-highlight: #1E1E1E;
$text: rgba(255, 255, 255, 0.92);
$text-secondary: rgba(161, 161, 170, 1);
$muted: rgba(255, 255, 255, 0.62);
$primary: #F97316;
$primary-dark: #C2410C;
$danger: #ff3b3b;

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

$shadow: 0 22px 70px rgba(0, 0, 0, 0.62);
$shadowO: 0 22px 80px rgba(255, 106, 0, 0.18);

.jobs {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: visible;
  display: flex;
  flex-direction: column;
  min-height: 0;
  isolation: isolate;
  box-sizing: border-box;
  background: $bg;
  color: white;
  font-family: 'Heebo', sans-serif;
  min-width: 0;
  min-height: 100vh;
  -webkit-tap-highlight-color: transparent;
}

/* Header */
.jobs__header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(5, 5, 5, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: env(safe-area-inset-top, 0);
  direction: rtl;
}

.jobs__header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;

  @media (max-width: 640px) {
    padding: 14px 16px;
  }
}

.jobs__header-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: white;

  @media (max-width: 640px) {
    font-size: 20px;
  }
}

.jobs__header-subtitle {
  margin: 0;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(156, 163, 175, 1);

  @media (max-width: 640px) {
    font-size: 11px;
  }
}

.jobs__filter-btn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(209, 213, 219, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .material-symbols-outlined {
    font-size: 24px;
  }

  @media (max-width: 640px) {
    width: 36px;
    height: 36px;

    .material-symbols-outlined {
      font-size: 20px;
    }
  }
}

/* Button (legacy - keeping for other uses) */
.btn {
  cursor: pointer;
  position: relative;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba($primary, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1100;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  overflow: hidden;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    width: 50px;
    height: 50px;
    border-radius: inherit;
    scale: 0;
    z-index: -1;
    background: rgba($primary, 0.2);
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba($primary, 0.15) inset;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($primary, 0.35);
  }

  &:hover::before {
    scale: 3;
  }

  &:active {
    transform: translateY(0px) scale(0.98);
  }

  .btn__ic {
    position: relative;
    z-index: 1;
    width: 30px;
    height: 30px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1),
      background 0.3s ease;
  }

  &:hover .btn__ic {
    transform: rotate(180deg) scale(1.1);
    background: rgba(255, 255, 255, 0.15);
  }

  &--primary {
    color: $primary-dark;
    border: 2px solid $primary-dark;
    background: transparent;
    box-shadow: 0 8px 24px rgba($primary, 0.15);

    &::before {
      background: linear-gradient(135deg, $primary, $primary-dark);
    }

    &:hover {
      color: #0b0b0f;
      scale: 1.05;
      box-shadow: 0 12px 32px rgba($primary, 0.4),
        0 0 0 1px rgba($primary, 0.2) inset;
      border-color: $primary;
      background: transparent;
    }

    .btn__ic {
      background: rgba($primary, 0.15);
      border-color: rgba($primary, 0.3);
      color: $primary-dark;
    }

    &:hover .btn__ic {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.3);
      color: #0b0b0f;
    }
  }

  .btn__txt {
    position: relative;
    z-index: 1;
    @media (max-width: 430px) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    padding: 9px 10px;
    font-size: 12px;
    border-radius: 12px;

    .btn__ic {
      width: 28px;
      height: 28px;
      border-radius: 9px;
    }
  }
}

/* Filters */
.filters {
  position: relative;
  z-index: 1;
  padding: 10px 14px 0;

  @media (max-width: 768px) {
    padding: 8px 12px 0;
  }

  &--hidden-desktop {
    @media (min-width: 981px) {
      display: none;
    }
  }
}

.filters__grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 10px;

  @media (min-width: 769px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.panel {
  border-radius: 16px;
  border: 1px solid rgba($primary, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: 9px;
    border-radius: 14px;
  }
}

.panel__label {
  font-size: 12px;
  font-weight: 1100;
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  @media (max-width: 768px) {
    font-size: 10px;
    margin-bottom: 7px;
  }
}

.link {
  border: none;
  background: transparent;
  color: $primary;
  font-weight: 1100;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s ease, transform 0.15s ease;

  &--small {
    font-size: 10px;
    padding: 6px 10px;
    border: 1px solid rgba($primary, 0.22);
    background: rgba($primary, 0.08);
  }

  &:hover {
    background: rgba($primary, 0.14);
  }
  &:active {
    transform: scale(0.98);
  }
}

/* Radio Group */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.radio-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($primary, 0.25);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0px) scale(0.99);
  }

  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: $primary;
    margin: 0;
    flex-shrink: 0;
  }

  input[type="radio"]:checked + .radio-label {
    color: $primary;
    font-weight: 1100;
  }
}
.radio-item--inline {
  flex: 1;
  min-width: 120px;
}
.radio-label {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 1000;
  font-size: 14px;
  user-select: none;
}

.range-display {
  margin: 6px 0 10px;
  text-align: center;
}
.range-value {
  font-size: 13px;
  font-weight: 1100;
  color: $primary-dark;
  padding: 8px 14px;
  background: rgba($primary, 0.14);
  border: 1px solid rgba($primary, 0.24);
  border-radius: 12px;
  display: inline-block;
}

.range-input {
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary, $primary-dark);
    cursor: pointer;
    border: 2px solid $bg;
    box-shadow: 0 8px 18px rgba($primary, 0.35);
  }
  &::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary, $primary-dark);
    cursor: pointer;
    border: 2px solid $bg;
    box-shadow: 0 8px 18px rgba($primary, 0.35);
  }
}

.price-range {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.price-range--horizontal {
  flex-direction: row;
  gap: 16px;

  .price-input-group {
    flex: 1;
  }
}

.price-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.price-label {
  font-size: 13px;
  font-weight: 1000;
  color: $text;
  min-width: 72px;
}
.price-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba($primary, 0.26);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  font-family: inherit;
  transition: box-shadow 0.18s ease, border-color 0.18s ease,
    background 0.18s ease;

  &:focus {
    outline: none;
    border-color: rgba($primary, 0.7);
    box-shadow: 0 0 0 4px rgba($primary, 0.18);
    background: rgba(255, 255, 255, 0.08);
  }
  &::placeholder {
    color: $muted;
  }
}

/* Main Content */
.jobs__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 40px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom, 0));

  @media (max-width: 640px) {
    gap: 24px;
    padding-bottom: 32px;
    padding-bottom: calc(32px + env(safe-area-inset-bottom, 0));
  }
}

/* Section Headers */
.jobs__section-header {
    display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 20px;

  @media (max-width: 640px) {
    padding: 0 16px;
    margin-bottom: 12px;
  }
}

.jobs__section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $primary;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.8);
  animation: pulse 2s ease-in-out infinite;
}

.jobs__section-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(156, 163, 175, 1);

  @media (max-width: 640px) {
    font-size: 12px;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Urgent Section */
.jobs__urgent-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.jobs__urgent-list {
  display: flex;
    overflow-x: auto;
  gap: 16px;
  padding: 0 20px 40px;
    scroll-snap-type: x mandatory;
  -ms-overflow-style: none;
    scrollbar-width: none;
  max-width: 100%;
  box-sizing: border-box;

    &::-webkit-scrollbar {
      display: none;
    }

  @media (max-width: 640px) {
    padding: 0 16px 32px;
    gap: 12px;
  }
}

.jobs__urgent-spacer {
  width: 1px;
  flex-shrink: 0;
}

.jobs__urgent-dots {
    display: flex;
    justify-content: center;
  align-items: center;
    gap: 8px;
  padding: 12px 20px 8px;
  margin-top: -32px;
  position: relative;
  z-index: 5;

  @media (max-width: 640px) {
    padding: 8px 16px 6px;
    margin-top: -28px;
    gap: 6px;
  }
}

.jobs__urgent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
    cursor: pointer;

  @media (max-width: 640px) {
    width: 6px;
    height: 6px;
  }

  &--active {
    background-color: #ff6a00;
    width: 24px;
    border-radius: 4px;

    @media (max-width: 640px) {
      width: 20px;
    }
  }

  &:hover {
    background-color: rgba(255, 106, 0, 0.5);
  }
}

/* (carousel wrappers removed) */

/* Urgent Job Card */
.job--urgent-card {
  position: relative;
  background: #121212;
  border-radius: 1.5rem;
  padding: 24px;
  box-shadow: 0 0 40px -5px rgba(249, 115, 22, 0.25);
  overflow: hidden;
  direction: rtl;
  flex: 0 0 auto;
  min-width: 320px;
  width: 90%;
  max-width: 450px;
  box-sizing: border-box;
  scroll-snap-align: start;

  @media (max-width: 640px) {
    padding: 20px;
    border-radius: 1.25rem;
    min-width: 300px;
    width: 90%;
    max-width: 380px;
  }

  &::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: 1.55rem;
    padding: 2px;
    background: linear-gradient(135deg, #F97316, rgba(249, 115, 22, 0.1), rgba(255, 255, 255, 0.05));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
}

.job__urgent-glow {
  position: absolute;
  right: -80px;
  top: -80px;
  width: 256px;
  height: 256px;
  background: rgba(249, 115, 22, 0.1);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  transition: background 0.5s ease;
}

.job--urgent-card:hover .job__urgent-glow {
  background: rgba(249, 115, 22, 0.15);
}

.job__content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Job Header */
.job__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.job__header-left {
  display: flex;
  gap: 16px;
  flex: 1;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 12px;
  }
}

.job__icon-box {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  background: linear-gradient(to bottom right, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(249, 115, 22, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.05);
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 48px;
    height: 48px;
  }
}

.job__icon {
  font-size: 28px;
  color: $primary;

  @media (max-width: 640px) {
    font-size: 24px;
  }
}

.job__info {
  flex: 1;
  min-width: 0;
}

.job__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  color: white;
  margin-bottom: 6px;

  @media (max-width: 640px) {
    font-size: 18px;
  }
}

.job__location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(161, 161, 170, 1);

  .material-symbols-outlined {
    font-size: 16px;
    color: $primary;
  }

  @media (max-width: 640px) {
    font-size: 13px;
  }
}

.job__priority-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 18px;
  }

  @media (max-width: 640px) {
    width: 28px;
    height: 28px;

    .material-symbols-outlined {
      font-size: 16px;
    }
  }
}

/* Job Tags */
.job__tags {
  display: flex;
  flex-wrap: wrap;
    gap: 8px;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    gap: 6px;
    margin-bottom: 20px;
  }
}

.job__tag {
  padding: 6px 12px;
  border-radius: 0.5rem;
  font-size: 12px;
  font-weight: 500;
  color: rgba(209, 213, 219, 1);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 640px) {
    padding: 5px 10px;
    font-size: 11px;
  }
}

/* Job Footer */
.job__footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 640px) {
    padding-top: 16px;
    gap: 8px;
  }
}

.job__time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(107, 114, 128, 1);

  .material-symbols-outlined {
    font-size: 14px;
  }

  @media (max-width: 640px) {
    font-size: 11px;
  }
}

.job__view-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: $primary;
  color: white;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 15px -3px rgba(249, 115, 22, 0.15);

  &:hover {
    background: #ea580c;
    box-shadow: 0 0 20px rgba(249, 115, 22, 0.4);
  }

  .material-symbols-outlined {
    font-size: 18px;
    transform: rotate(180deg);
    transition: transform 0.2s ease;
  }

  &:hover .material-symbols-outlined {
    transform: rotate(180deg) translateX(-4px);
  }

  @media (max-width: 640px) {
    padding: 10px 20px;
    font-size: 13px;
    gap: 6px;

    .material-symbols-outlined {
      font-size: 16px;
    }
  }
}

.job__footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;

  &--regular {
    gap: 8px;
  }
}

.job__quote-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: white;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 15px -3px rgba(168, 85, 247, 0.3);

  &:hover {
    background: linear-gradient(135deg, #9333ea, #6d28d9);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
    transform: translateY(-2px);
  }

  .material-symbols-outlined {
    font-size: 18px;
  }

  @media (max-width: 640px) {
    padding: 8px 14px;
    font-size: 12px;
    gap: 6px;

    .material-symbols-outlined {
      font-size: 16px;
    }
  }

  &--regular {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.1));
    border: 1px solid rgba(168, 85, 247, 0.4);
    box-shadow: none;

    &:hover {
      background: linear-gradient(135deg, #a855f7, #7c3aed);
      border-color: transparent;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
    }

    .material-symbols-outlined {
      font-size: 20px;
    }

    @media (max-width: 640px) {
      width: 36px;
      height: 36px;

      .material-symbols-outlined {
        font-size: 18px;
      }
    }
  }
}

@keyframes urgentBorderPulse {
  0%,
  100% {
    border-bottom-color: rgba($danger, 0.65);
  }
  50% {
    border-bottom-color: rgba($danger, 0.95);
  }
}
@keyframes specialBorderPulse {
  0%,
  100% {
    border-bottom-color: rgba(255, 215, 0, 0.6);
  }
  50% {
    border-bottom-color: rgba(255, 215, 0, 0.95);
  }
}
@keyframes urgentSpecialBorderPulse {
  0%,
  100% {
    border-bottom-color: rgba(255, 140, 0, 0.75);
  }
  50% {
    border-bottom-color: rgba(255, 140, 0, 1);
  }
}

/* Regular Jobs Section */
.jobs__regular-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.jobs__regular-list {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding: 0 20px 40px;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 640px) {
    padding: 0 16px 32px;
    gap: 12px;
  }
}

.jobs__regular-spacer {
  width: 1px;
  flex-shrink: 0;
}

.jobs__regular-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 8px;
  margin-top: -32px;
  position: relative;
  z-index: 5;

  @media (max-width: 640px) {
    padding: 8px 16px 6px;
    margin-top: -28px;
    gap: 6px;
  }
}

.jobs__regular-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;

  @media (max-width: 640px) {
    width: 6px;
    height: 6px;
  }

  &--active {
    background-color: #10b981; /* ירוק */
    width: 24px;
    border-radius: 4px;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);

    @media (max-width: 640px) {
      width: 20px;
    }
  }

  &:hover {
    background-color: rgba(16, 185, 129, 0.5);
  }
}

/* Regular Job Card */
.job--regular-card {
  position: relative;
  flex-shrink: 0;
  width: 85%;
  max-width: 320px;
  background: rgba(22, 22, 22, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  scroll-snap-align: center;
  direction: rtl;

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 1rem;
  }
}

.job__hover-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.job--regular-card:hover .job__hover-glow {
  opacity: 1;
}

.job__icon-box--regular {
  width: 48px;
  height: 48px;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(209, 213, 219, 1);
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 44px;
    height: 44px;
  }

  .job__icon {
    font-size: 24px;
    color: rgba(209, 213, 219, 1);

    @media (max-width: 640px) {
      font-size: 20px;
    }
  }
}

.job__menu-btn {
  background: transparent;
  border: none;
  color: rgba(107, 114, 128, 1);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: white;
  }

  .material-symbols-outlined {
    font-size: 20px;
  }
}

.job__title--regular {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 16px;
  }
}

.job__location--regular {
  font-size: 14px;
  color: rgba(161, 161, 170, 1);
  margin-bottom: 16px;

  .material-symbols-outlined {
    font-size: 16px;
    color: rgba(161, 161, 170, 1);
  }

  @media (max-width: 640px) {
    font-size: 13px;
    margin-bottom: 12px;
  }
}

.job__location-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job__tags--regular {
  margin-bottom: 24px;

  @media (max-width: 640px) {
    margin-bottom: 20px;
  }
}

.job__tag--regular {
  padding: 4px 10px;
  border-radius: 0.375rem;
  font-size: 11px;
  color: rgba(156, 163, 175, 1);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 640px) {
    padding: 3px 8px;
    font-size: 10px;
  }
}

.job__footer--regular {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 640px) {
    padding-top: 12px;
  }
}

.job__time--regular {
  font-size: 11px;
  font-weight: 500;
  color: rgba(75, 85, 99, 1);

  @media (max-width: 640px) {
    font-size: 10px;
  }
}

.job__view-btn--regular {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: $primary;
    border-color: $primary;
  }

  .material-symbols-outlined {
    font-size: 20px;
    transform: rotate(180deg);
  }

  @media (max-width: 640px) {
    width: 36px;
    height: 36px;

    .material-symbols-outlined {
      font-size: 18px;
    }
  }
}

/* Job menu */
.job__menu {
  position: relative;
  flex-shrink: 0;
  z-index: 100;
}

.job__menu-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  color: rgba(255, 255, 255, 0.85);
  min-height: 38px;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba($primary, 0.22);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0px) scale(0.98);
  }

  @media (max-width: 768px) {
    padding: 7px 10px;
    min-height: 34px;
  }
}

.job__menuDots {
  display: inline-flex;
  gap: 4px;
  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.75);
    display: inline-block;
  }
}

.job__menu-text {
  font-size: 13px;
  line-height: 1;
  font-weight: 1000;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.job__menu-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 100;
  background: rgba(15, 16, 22, 0.98);
  border: 1px solid rgba($primary, 0.25);
  border-radius: 14px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.65);
  overflow: hidden;
  min-width: 170px;
  backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    min-width: 150px;
    left: auto;
    right: 0;
  }
}

.job__menu-item {
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: transparent;
  color: $text;
  font-weight: 1000;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: right;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: rgba($primary, 0.16);
    color: $primary;
  }
  &:active {
    background: rgba($primary, 0.25);
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 12px;
  }
}
.job__menu-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* Meta */
.job__meta {
  display: grid;
  gap: 6px;
}
.metaLine {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  color: rgba(255, 255, 255, 0.74);
  font-weight: 900;
  font-size: 12px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 10.5px;
    gap: 4px;
  }
}
.metaLine--secondary {
  opacity: 0.96;
}
.metaSep {
  opacity: 0.55;
}
.price {
  font-weight: 1100;
  color: $primary;
  white-space: nowrap;

  &--bid {
    background: rgba($primary, 0.2);
    border: 1px solid rgba($primary, 0.4);
    padding: 4px 10px;
    border-radius: 8px;
    color: $primary-dark;
    font-weight: 1000;
  }

  @media (max-width: 768px) {
    margin-inline-start: auto;
    font-size: 11px;
  }
}
.metaItem--time {
  color: rgba(255, 255, 255, 0.88);
  font-weight: 900;
}

/* Job Categories - Similar to HandymenList */
.job__cats {
  margin-top: -4px;
  max-width: 100%;
  overflow: hidden;
}

.job__catsTrack {
  display: flex;
  direction: rtl;
  flex-wrap: wrap;
  gap: 8px;
  row-gap: 8px;
  max-width: 100%;
  width: 100%;
  padding: 4px 2px 0;
  overflow: hidden;
  
  @media (max-width: 420px) {
    gap: 6px;
    row-gap: 6px;
    padding: 2px 2px 0;
  }
}

.job__cat {
  flex: 0 0 auto;
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 420px) {
    padding: 5px 8px;
    font-size: 11px;
  }
}

/* Chips (fallback/legacy) */
.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
.job__cat {
  flex: 0 0 auto;
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--urgent {
    border-color: rgba($danger, 0.45);
    background: rgba($danger, 0.12);
    color: #ffd4d4;
    animation: chipPulse 2s ease-in-out infinite;
  }
  &--special {
    border-color: rgba(255, 215, 0, 0.55);
    background: linear-gradient(
      135deg,
      rgba(255, 215, 0, 0.2),
      rgba(138, 43, 226, 0.18)
    );
    color: #ffd700;
    font-weight: 1100;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.25);
  }
  &--status {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.88);
  }
  &--done {
    border-color: rgba(16, 185, 129, 0.45);
    background: rgba(16, 185, 129, 0.18);
    color: #10b981;
  }
  &--quoted {
    border-color: rgba($primary, 0.5);
    background: linear-gradient(
      135deg,
      rgba($primary, 0.2),
      rgba($primary-dark, 0.15)
    );
    color: $primary-dark;
    font-weight: 1200;
    box-shadow: 0 0 10px rgba($primary, 0.3);
  }
  &--hourly {
    border-color: rgba($primary-dark, 0.28);
    background: rgba($primary-dark, 0.14);
  }
  &--fixed {
    border-color: rgba($primary, 0.22);
    background: rgba($primary, 0.12);
  }
  &--work {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }
}

.chip {
  border-radius: 999px;
  padding: 5px 11px;
  font-weight: 1100;
  font-size: 11px;
  border: 1px solid rgba($primary, 0.18);
  background: rgba($primary, 0.12);
  color: $text;
  line-height: 1;
  transition: transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 4px 9px;
  }

  &--urgent {
    border-color: rgba($danger, 0.45);
    background: rgba($danger, 0.12);
    color: #ffd4d4;
    animation: chipPulse 2s ease-in-out infinite;
  }
  &--special {
    border-color: rgba(255, 215, 0, 0.55);
    background: linear-gradient(
      135deg,
      rgba(255, 215, 0, 0.2),
      rgba(138, 43, 226, 0.18)
    );
    color: #ffd700;
    font-weight: 1100;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.25);
  }
  &--status {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.88);
  }
  &--done {
    border-color: rgba(16, 185, 129, 0.45);
    background: rgba(16, 185, 129, 0.18);
    color: #10b981;
  }
  &--quoted {
    border-color: rgba($primary, 0.5);
    background: linear-gradient(
      135deg,
      rgba($primary, 0.2),
      rgba($primary-dark, 0.15)
    );
    color: $primary-dark;
    font-weight: 1200;
    box-shadow: 0 0 10px rgba($primary, 0.3);
  }
  &--hourly {
    border-color: rgba($primary-dark, 0.28);
    background: rgba($primary-dark, 0.14);
  }
  &--fixed {
    border-color: rgba($primary, 0.22);
    background: rgba($primary, 0.12);
  }
  &--work {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }
}

@keyframes chipPulse {
  0%,
  100% {
    box-shadow: 0 0 6px rgba($danger, 0.28);
  }
  50% {
    box-shadow: 0 0 16px rgba($danger, 0.55);
  }
}

/* Mobile: keep it clean */
@media (max-width: 768px) {
  .chips .chip:nth-child(n + 4) {
    display: none;
  }
  .chips .chip:nth-child(n + 3) {
    display: none;
  } /* client – like you had */
}

/* Job Actions - Similar to HandymenList */
.job__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: end;
  width: 100%;
  min-width: 0;
  
  @media (max-width: 420px) {
    gap: 8px;
    grid-template-columns: 1fr 1fr;
  }
}

.jobBtn {
  border-radius: 14px;
  padding: 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 1100;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 120ms ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  cursor: pointer;
  min-height: 46px;
  white-space: nowrap;

  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 420px) {
    padding: 10px 8px;
    font-size: 11px;
    min-height: 40px;
    gap: 6px;
    border-radius: 12px;
  }
}

.jobBtn__ic {
  font-size: 15px;
}

.jobBtn--primary {
  background: linear-gradient(135deg, #fb923c, #ea580c);
  border: none;
  color: #0b0b0f;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);

  &:hover {
    box-shadow: 0 12px 28px rgba(249, 115, 22, 0.35);
    transform: translateY(-1px);
  }
}

.jobBtn--skip {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }
}

.jobBtn--edit {
  background: rgba(249, 115, 22, 0.08);
  border-color: rgba(249, 115, 22, 0.22);
  color: rgba(249, 115, 22, 0.95);

  &:hover {
    background: rgba(249, 115, 22, 0.12);
    border-color: rgba(249, 115, 22, 0.32);
    transform: translateY(-1px);
  }
}

/* Footer / Action (legacy) */
.job__footer {
  display: flex;
  justify-content: flex-start;
}
.job__action {
  cursor: pointer;
  position: relative;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 1100;
  color: $primary-dark;
  border: 2px solid $primary-dark;
  border-radius: 34px;
  background-color: transparent;
  width: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 110px;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  z-index: 1;
  font-family: inherit;
  box-shadow: 0 8px 24px rgba($primary, 0.15);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    width: 50px;
    height: 50px;
    border-radius: inherit;
    scale: 0;
    z-index: -1;
    background: linear-gradient(135deg, $primary, $primary-dark);
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  &:hover {
    color: #0b0b0f;
    scale: 1.05;
    box-shadow: 0 12px 32px rgba($primary, 0.4),
      0 0 0 1px rgba($primary, 0.2) inset;
    border-color: $primary;
  }

  &:hover::before {
    scale: 3;
  }

  &:active {
    scale: 1;
    box-shadow: 0 8px 20px rgba($primary, 0.3);
  }

  @media (max-width: 768px) {
    padding: 8px 18px;
    font-size: 13px;
    min-width: 164px;
    border-radius: 28px;
  }
}
.job__actionIc {
  position: relative;
  z-index: 1;
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.job__action:hover .job__actionIc {
  transform: scale(1.1) rotate(5deg);
}

.job__action--quotation {
  background: linear-gradient(135deg, rgba($primary, 0.2), rgba($primary-dark, 0.15));
  border-color: rgba($primary, 0.5);
  color: $primary-dark;
  box-shadow: 0 8px 24px rgba($primary, 0.25);

  &:hover {
    background: linear-gradient(
      135deg,
      rgba($primary, 0.3),
      rgba($primary-dark, 0.2)
    );
    border-color: $primary;
    box-shadow: 0 12px 32px rgba($primary, 0.35);
  }
}

/* Empty */
.empty {
  padding: 40px 20px;
  border-radius: 1rem;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  text-align: center;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  margin: 0 20px;

  @media (max-width: 640px) {
    padding: 32px 16px;
    margin: 0 16px;
  }

  .empty__ic {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;

    @media (max-width: 640px) {
      font-size: 40px;
      margin-bottom: 10px;
    }
  }
  .empty__title {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;

    @media (max-width: 640px) {
    font-size: 14px;
    }
  }
  .empty__sub {
    margin-top: 8px;
    font-size: 14px;
    color: $text-secondary;
    font-weight: 400;

    @media (max-width: 640px) {
    font-size: 12px;
    }
  }
}

/* Pager */
.pager {
  position: relative;
  z-index: 1;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);

  @media (max-width: 768px) {
    padding: 10px 12px;
    gap: 8px;
  }
}
.pager__mid {
  display: grid;
  gap: 6px;
  justify-items: center;
}
.dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
}
.dot--on {
  background: #ff7a00;
  box-shadow: 0 0 0 4px rgba(255, 122, 0, 0.12);
}
.pager__txt {
  color: #cbd5e1;
  font-weight: 900;
  font-size: 12px;
  @media (max-width: 768px) {
    font-size: 11px;
  }
}

.pageBtn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 1000;
  font-size: 13px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.07);
  }
  &:active {
    transform: translateY(0px) scale(0.98);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 9px 10px;
    font-size: 12px;
  }
}
.pageBtn--primary {
  background: linear-gradient(135deg, #ff7a00, #ff9a3c);
  color: #0f1116;
  border-color: rgba(255, 122, 0, 0.35);
}
.pageBtn--ghost {
  background: rgba(0, 0, 0, 0.22);
}

/* Filter Button - Mobile Only */
.panel--filter-mobile {
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
}
.filter-btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 14px;
  border: 1px solid rgba($primary, 0.32);
  background: rgba($primary, 0.14);
  color: $primary-dark;
  font-weight: 1100;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  .filter-btn__hint {
    font-size: 11px;
    font-weight: 1100;
    color: rgba(255, 255, 255, 0.75);
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(0, 0, 0, 0.22);
  }

  &:hover {
    transform: translateY(-1px);
    background: rgba($primary, 0.22);
    border-color: rgba($primary, 0.52);
  }
  &:active {
    transform: translateY(0px) scale(0.99);
  }

  @media (max-width: 400px) {
    padding: 9px 12px;
    font-size: 13px;
  }
}

/* Desktop Filters - Hidden on mobile */
.panel--filter-desktop {
  display: none;
  @media (min-width: 769px) {
    display: block;
  }
}

/* Filter Modal styles moved to JobFilterModal.vue component */

/* A11y: reduced motion */
@media (prefers-reduced-motion: reduce) {
  .orb,
  .job--urgent,
  .job--special,
  .chip--urgent {
    animation: none !important;
  }
  .job,
  .btn,
  .pageBtn,
  .radio-item,
  .filter-btn,
  .job__action {
    transition: none !important;
  }
}
</style>

