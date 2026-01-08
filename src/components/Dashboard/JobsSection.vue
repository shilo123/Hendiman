<template>
  <section class="jobs" id="jobs">
    <!-- Ambient background (pure HTML/CSS, no logic changes) -->
    <div class="jobs__amb" aria-hidden="true">
      <span class="orb orb--1"></span>
      <span class="orb orb--2"></span>
      <span class="orb orb--3"></span>
      <span class="gridGlow"></span>
    </div>

    <!-- Header -->
    <div class="jobs__head">
      <div class="jobs__headText">
        <!-- <div class="jobs__kicker">HENDIMAN</div> -->
        <h2 class="jobs__title">עבודות</h2>
        <p class="jobs__sub">
          {{
            isHendiman
              ? "עבודות לפי ההתמחויות שלך · סינון לפי סטטוס ומרחק"
              : "כל הקריאות · צפייה וסטטוסים"
          }}
        </p>
      </div>

      <button class="btn btn--primary" type="button" @click="$emit('refresh')">
        <span class="btn__ic" aria-hidden="true">↻</span>
        <span class="btn__txt">רענן</span>
      </button>
    </div>

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

    <!-- Filter Modal -->
    <div
      v-if="showFilterModal"
      class="filter-modal-overlay"
      @click="closeFilterModal"
    >
      <div class="filter-modal" @click.stop>
        <div class="filter-modal__header">
          <div class="filter-modal__titleWrap">
            <div class="filter-modal__badge">Filters</div>
            <h3 class="filter-modal__title">סנן עבודות</h3>
          </div>

          <button
            class="filter-modal__close"
            @click="closeFilterModal"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div class="filter-modal__body">
          <!-- Location Filter -->
          <div class="filter-section">
            <div class="filter-section__title">מיקום</div>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  type="radio"
                  name="locationFilter"
                  value="myLocation"
                  :checked="localFilters.locationType === 'myLocation'"
                  @change="localFilters.locationType = 'myLocation'"
                />
                <span class="radio-label">המיקום שלי</span>
              </label>
              <label class="radio-item">
                <input
                  type="radio"
                  name="locationFilter"
                  value="residence"
                  :checked="localFilters.locationType === 'residence'"
                  @change="localFilters.locationType = 'residence'"
                />
                <span class="radio-label">מקום המגורים שלי</span>
              </label>
            </div>
          </div>

          <!-- Distance Filter -->
          <div class="filter-section">
            <div class="filter-section__title">
              מרחק (ק"מ)
              <button
                class="link link--small"
                type="button"
                @click="resetKmRange"
              >
                איפוס
              </button>
            </div>

            <div class="range-display">
              <span class="range-value">עד {{ localFilters.maxKm }} ק״מ</span>
            </div>

            <input
              class="range-input"
              type="range"
              min="1"
              max="50"
              step="1"
              v-model.number="localFilters.maxKm"
            />
          </div>

          <!-- Price Filter -->
          <div class="filter-section">
            <div class="filter-section__title">
              מחיר (₪)
              <button
                class="link link--small"
                type="button"
                @click="resetPriceRange"
              >
                איפוס
              </button>
            </div>

            <div class="price-range">
              <div class="price-input-group">
                <label class="price-label">מינימום:</label>
                <input
                  class="price-input"
                  type="number"
                  min="0"
                  v-model.number="localFilters.minPrice"
                  placeholder="0"
                />
              </div>

              <div class="price-input-group">
                <label class="price-label">מקסימום:</label>
                <input
                  class="price-input"
                  type="number"
                  min="0"
                  v-model.number="localFilters.maxPrice"
                  placeholder="ללא הגבלה"
                />
              </div>
            </div>
          </div>

          <!-- Work Type Filter -->
          <div class="filter-section">
            <div class="filter-section__title">סוג קריאה</div>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  type="radio"
                  name="workTypeFilter"
                  value=""
                  :checked="localFilters.workType === ''"
                  @change="localFilters.workType = ''"
                />
                <span class="radio-label">הכל</span>
              </label>

              <label class="radio-item">
                <input
                  type="radio"
                  name="workTypeFilter"
                  value="קלה"
                  :checked="localFilters.workType === 'קלה'"
                  @change="localFilters.workType = 'קלה'"
                />
                <span class="radio-label">קלה</span>
              </label>

              <label class="radio-item">
                <input
                  type="radio"
                  name="workTypeFilter"
                  value="מורכבת"
                  :checked="localFilters.workType === 'מורכבת'"
                  @change="localFilters.workType = 'מורכבת'"
                />
                <span class="radio-label">מורכבת</span>
              </label>

              <label class="radio-item">
                <input
                  type="radio"
                  name="workTypeFilter"
                  value="קשה"
                  :checked="localFilters.workType === 'קשה'"
                  @change="localFilters.workType = 'קשה'"
                />
                <span class="radio-label">קשה</span>
              </label>
            </div>
          </div>
        </div>

        <div class="filter-modal__footer">
          <button
            class="filter-modal__btn filter-modal__btn--cancel"
            @click="closeFilterModal"
          >
            ביטול
          </button>
          <button
            class="filter-modal__btn filter-modal__btn--apply"
            @click="applyFilters"
          >
            סנן
          </button>
        </div>
      </div>
    </div>

    <!-- Jobs list -->
    <div class="jobs__list">
      <article
        v-for="job in filteredJobs"
        :key="job.id"
        class="job"
        :class="{
          'job--urgent': job.urgent || job.isUrgent,
          'job--special': job.handymanIdSpecial,
        }"
      >
        <div class="job__sheen" aria-hidden="true"></div>

        <div class="job__header">
          <div class="job__title">
            {{ getJobDisplayName(job) }}
          </div>

          <!-- Client job menu button -->
          <div
            v-if="!isHendiman && isClientJob(job)"
            class="job__menu"
            :class="{
              'job__menu--open':
                openJobMenuId === job.id || openJobMenuId === job._id,
            }"
          >
            <button
              class="job__menu-btn"
              type="button"
              @click.stop="toggleJobMenu(job.id || job._id)"
              aria-label="תפריט עבודה"
            >
              <span class="job__menuDots" aria-hidden="true">
                <i></i><i></i><i></i>
              </span>
              <span class="job__menu-text">אפשרויות</span>
            </button>

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
        </div>

        <div class="job__meta">
          <div class="metaLine">
            <span class="metaItem">👤 {{ job.clientName }}</span>
            <span class="metaSep">•</span>
            <span class="metaItem">📍 {{ job.locationText }}</span>
            <span v-if="isHendiman && getTimeAgo(job)" class="metaSep">•</span>
            <span
              v-if="isHendiman && getTimeAgo(job)"
              class="metaItem metaItem--time"
              >⏰ {{ getTimeAgo(job) }}</span
            >
          </div>

          <div class="metaLine metaLine--secondary">
            <template v-if="distanceLabel(job)">
              <span class="metaItem">🧭 {{ distanceLabel(job) }} ק״מ</span>
            </template>

            <template v-if="job.subcategoryInfo?.price || job.price">
              <span class="metaSep" v-if="distanceLabel(job)">•</span>
              <span class="price"
                >{{ job.subcategoryInfo?.price || job.price }} ₪</span
              >
            </template>
          </div>
        </div>

        <div class="chips" aria-label="תגיות">
          <span v-if="job.urgent || job.isUrgent" class="chip chip--urgent"
            >דחוף</span
          >

          <span
            v-if="job.handymanIdSpecial && isHendiman"
            class="chip chip--special"
            >הזמנה אישית</span
          >

          <span
            class="chip chip--status"
            :class="{ 'chip--done': job.status === 'done' }"
          >
            {{ getStatusLabel(job.status) }}
          </span>

          <span
            class="chip"
            :class="
              (job.subcategoryInfo?.typeWork || job.billingType) === 'לשעה'
                ? 'chip--hourly'
                : 'chip--fixed'
            "
          >
            {{ job.subcategoryInfo?.typeWork || job.billingType || "קבלנות" }}
          </span>

          <span
            v-if="job.subcategoryInfo?.workType || job.workType"
            class="chip chip--work"
          >
            {{ job.subcategoryInfo?.workType || job.workType }}
          </span>
        </div>

        <div class="job__footer">
          <button class="job__action" type="button" @click="$emit('view', job)">
            <span class="job__actionIc" aria-hidden="true">👁️</span>
            צפייה
          </button>
        </div>
      </article>

      <div v-if="!filteredJobs || filteredJobs.length === 0" class="empty">
        <div class="empty__ic" aria-hidden="true">🧰</div>
        <div class="empty__title">אין עבודות להצגה כרגע</div>
        <div class="empty__sub">נסה לרענן או לשנות סינון.</div>
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
export default {
  name: "JobsSection",
  props: {
    isHendiman: { type: Boolean, default: false },
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
  ],
  data() {
    return {
      isStatusDropdownOpen: false,
      isFilterDropdownOpen: false,
      localMaxKm: null,
      showFilterModal: false,
      openJobMenuId: null,
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
    getJobDisplayName(job) {
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
      if (!this.currentUserId || this.isHendiman) return false;
      return (
        job.clientId && String(job.clientId) === String(this.currentUserId)
      );
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
      if (!job.createdAt) return null;
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
    },
    closeFilterModal() {
      this.showFilterModal = false;
    },
    resetKmRange() {
      this.localFilters.maxKm = 25;
    },
    resetPriceRange() {
      this.localFilters.minPrice = null;
      this.localFilters.maxPrice = null;
    },
    applyFilters() {
      this.$emit("pick-status", this.localFilters.status);
      this.$emit("change-location-type", this.localFilters.locationType);
      this.$emit("change-km", this.localFilters.maxKm);
      this.$emit("change-work-type", this.localFilters.workType);
      this.$emit("change-price-range", {
        minPrice: this.localFilters.minPrice,
        maxPrice: this.localFilters.maxPrice,
      });
      this.closeFilterModal();
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #0b0b0f;
$card: rgba(255, 255, 255, 0.06);
$card2: rgba(255, 255, 255, 0.085);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$danger: #ff3b3b;

$shadow: 0 22px 70px rgba(0, 0, 0, 0.62);
$shadowO: 0 22px 80px rgba(255, 106, 0, 0.18);

.jobs {
  position: relative;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.18);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.04)
  );
  box-shadow: $shadow;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  isolation: isolate;

  &:before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
        900px 260px at 15% -10%,
        rgba($orange, 0.18),
        transparent 58%
      ),
      radial-gradient(
        700px 260px at 110% 20%,
        rgba($orange2, 0.12),
        transparent 60%
      ),
      radial-gradient(
        900px 320px at 50% 120%,
        rgba(255, 255, 255, 0.06),
        transparent 60%
      );
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 768px) {
    border-radius: 14px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.62);
  }
}

.jobs__amb {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.orb {
  position: absolute;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  filter: blur(18px);
  opacity: 0.9;
  mix-blend-mode: screen;
  background: radial-gradient(
    circle at 35% 30%,
    rgba($orange, 0.5),
    transparent 60%
  );
  animation: floaty 10s ease-in-out infinite;

  &--1 {
    top: -220px;
    right: -170px;
    background: radial-gradient(
      circle at 35% 30%,
      rgba($orange, 0.42),
      transparent 62%
    );
    animation-delay: 0s;
  }
  &--2 {
    bottom: -230px;
    left: -200px;
    background: radial-gradient(
      circle at 40% 35%,
      rgba($orange2, 0.35),
      transparent 62%
    );
    animation-delay: 1.7s;
  }
  &--3 {
    top: 35%;
    left: 55%;
    width: 520px;
    height: 520px;
    opacity: 0.5;
    background: radial-gradient(
      circle at 35% 30%,
      rgba(255, 255, 255, 0.16),
      transparent 62%
    );
    animation-delay: 3.2s;
  }
}

.gridGlow {
  position: absolute;
  inset: 0;
  opacity: 0.25;
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.06) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse at 50% 20%, #000 35%, transparent 70%);
}

@keyframes floaty {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, 14px, 0) scale(1.03);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

/* Header */
.jobs__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(
      900px 240px at 20% 0%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.08),
      rgba(255, 255, 255, 0.03)
    );
  direction: rtl;
  text-align: right;

  @media (max-width: 768px) {
    padding: 12px;
  }
}

.jobs__headText {
  min-width: 0;
}
.jobs__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 1100;
  letter-spacing: 0.18em;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 4px;

  &:before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: linear-gradient(135deg, $orange, $orange2);
    box-shadow: 0 10px 26px rgba($orange, 0.35);
  }
}
.jobs__title {
  margin: 0;
  font-size: 19px;
  font-weight: 1100;

  @media (max-width: 768px) {
    font-size: 15.5px;
  }
}
.jobs__sub {
  margin: 6px 0 0;
  color: $muted;
  font-weight: 900;
  font-size: 12px;
  line-height: 1.25;

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

/* Button */
.btn {
  cursor: pointer;
  position: relative;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba($orange, 0.22);
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
    background: rgba($orange, 0.2);
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba($orange, 0.15) inset;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.35);
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
    color: $orange2;
    border: 2px solid $orange2;
    background: transparent;
    box-shadow: 0 8px 24px rgba($orange, 0.15);

    &::before {
      background: linear-gradient(135deg, $orange, $orange2);
    }

    &:hover {
      color: #0b0b0f;
      scale: 1.05;
      box-shadow: 0 12px 32px rgba($orange, 0.4),
        0 0 0 1px rgba($orange, 0.2) inset;
      border-color: $orange;
      background: transparent;
    }

    .btn__ic {
      background: rgba($orange, 0.15);
      border-color: rgba($orange, 0.3);
      color: $orange2;
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
    @media (max-width: 420px) {
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
  border: 1px solid rgba($orange, 0.18);
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
  color: $orange3;
  font-weight: 1100;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s ease, transform 0.15s ease;

  &--small {
    font-size: 10px;
    padding: 6px 10px;
    border: 1px solid rgba($orange, 0.22);
    background: rgba($orange, 0.08);
  }

  &:hover {
    background: rgba($orange, 0.14);
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
    border-color: rgba($orange, 0.25);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0px) scale(0.99);
  }

  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: $orange;
    margin: 0;
    flex-shrink: 0;
  }

  input[type="radio"]:checked + .radio-label {
    color: $orange3;
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
  color: $orange2;
  padding: 8px 14px;
  background: rgba($orange, 0.14);
  border: 1px solid rgba($orange, 0.24);
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
    background: linear-gradient(135deg, $orange, $orange2);
    cursor: pointer;
    border: 2px solid $bg;
    box-shadow: 0 8px 18px rgba($orange, 0.35);
  }
  &::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, $orange, $orange2);
    cursor: pointer;
    border: 2px solid $bg;
    box-shadow: 0 8px 18px rgba($orange, 0.35);
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
  border: 1px solid rgba($orange, 0.26);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  font-family: inherit;
  transition: box-shadow 0.18s ease, border-color 0.18s ease,
    background 0.18s ease;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.7);
    box-shadow: 0 0 0 4px rgba($orange, 0.18);
    background: rgba(255, 255, 255, 0.08);
  }
  &::placeholder {
    color: $muted;
  }
}

/* Jobs list */
.jobs__list {
  position: relative;
  z-index: 1;
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  overflow-y: auto;
  min-height: 0;

  @media (max-width: 768px) {
    padding: 12px;
    gap: 10px;
  }
}

/* Job card */
.job {
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.16);
  background: rgba(255, 255, 255, 0.06);
  padding: 12px;
  display: grid;
  gap: 10px;
  transition: transform 0.22s ease, border-color 0.22s ease,
    background 0.22s ease, box-shadow 0.22s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($orange, 0.28);
    background: rgba(255, 255, 255, 0.075);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
  }

  &--urgent {
    border-bottom: 3px solid rgba($danger, 0.75);
    animation: urgentBorderPulse 2s ease-in-out infinite;
  }
  &--special {
    border-bottom: 3px solid rgba(255, 215, 0, 0.7);
    animation: specialBorderPulse 2s ease-in-out infinite;
  }
  &--urgent.job--special {
    border-bottom: 3px solid rgba(255, 140, 0, 0.8);
    animation: urgentSpecialBorderPulse 2s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    padding: 10px;
    border-radius: 16px;
    gap: 8px;
  }
}

.job__sheen {
  content: "";
  position: absolute;
  inset: -2px;
  background: radial-gradient(
      700px 200px at 20% 0%,
      rgba($orange, 0.12),
      transparent 60%
    ),
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 45%);
  opacity: 0.85;
  pointer-events: none;
  z-index: 0;
}

.job__header,
.job__meta,
.chips,
.job__footer {
  position: relative;
  z-index: 1;
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

.job__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.job__title {
  font-weight: 1100;
  font-size: 15.5px;
  color: $text;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 14.5px;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.25;
  }
}

/* Job menu */
.job__menu {
  position: relative;
  flex-shrink: 0;
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
    border-color: rgba($orange, 0.22);
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
  border: 1px solid rgba($orange, 0.25);
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
    background: rgba($orange, 0.16);
    color: $orange3;
  }
  &:active {
    background: rgba($orange, 0.25);
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
  color: $orange3;
  white-space: nowrap;

  @media (max-width: 768px) {
    margin-inline-start: auto;
    font-size: 11px;
  }
}
.metaItem--time {
  color: rgba(255, 255, 255, 0.88);
  font-weight: 900;
}

/* Chips */
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
.chip {
  border-radius: 999px;
  padding: 5px 11px;
  font-weight: 1100;
  font-size: 11px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
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
  &--hourly {
    border-color: rgba($orange2, 0.28);
    background: rgba($orange2, 0.14);
  }
  &--fixed {
    border-color: rgba($orange, 0.22);
    background: rgba($orange, 0.12);
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

/* Footer / Action */
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
  color: $orange2;
  border: 2px solid $orange2;
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
  box-shadow: 0 8px 24px rgba($orange, 0.15);

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
    background: linear-gradient(135deg, $orange, $orange2);
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  &:hover {
    color: #0b0b0f;
    scale: 1.05;
    box-shadow: 0 12px 32px rgba($orange, 0.4),
      0 0 0 1px rgba($orange, 0.2) inset;
    border-color: $orange;
  }

  &:hover::before {
    scale: 3;
  }

  &:active {
    scale: 1;
    box-shadow: 0 8px 20px rgba($orange, 0.3);
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

/* Empty */
.empty {
  padding: 18px 14px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.82);
  text-align: center;
  font-weight: 1000;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(10px);

  .empty__ic {
    font-size: 26px;
    margin-bottom: 6px;
  }
  .empty__title {
    font-size: 14px;
  }
  .empty__sub {
    margin-top: 6px;
    font-size: 12px;
    color: $muted;
    font-weight: 900;
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
  border: 1px solid rgba($orange, 0.32);
  background: rgba($orange, 0.14);
  color: $orange2;
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
    background: rgba($orange, 0.22);
    border-color: rgba($orange, 0.52);
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

/* Filter Modal - Mobile Only */
.filter-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 18px;
  direction: rtl;

  @media (min-width: 769px) {
    display: none;
  }
}

.filter-modal {
  background: $bg;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.22);
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 26px 90px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &:before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
        600px 240px at 20% 0%,
        rgba($orange, 0.18),
        transparent 55%
      ),
      radial-gradient(
        520px 220px at 110% 30%,
        rgba($orange2, 0.12),
        transparent 58%
      );
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 450px) {
    border-radius: 16px;
  }
}

.filter-modal__header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba($orange, 0.18);
}
.filter-modal__titleWrap {
  display: grid;
  gap: 4px;
}
.filter-modal__badge {
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.72);
  font-weight: 1100;
  font-size: 11px;
}
.filter-modal__title {
  font-size: 19px;
  font-weight: 1100;
  color: $orange2;
  margin: 0;
}

.filter-modal__close {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: $text;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    transform: rotate(2deg);
  }
  &:active {
    transform: scale(0.98);
  }
}

.filter-modal__body {
  position: relative;
  z-index: 1;
  padding: 18px;
  flex: 1;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 22px;
}
.filter-section__title {
  font-size: 13px;
  font-weight: 1100;
  color: $text;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.filter-modal__footer {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 12px;
  padding: 16px 18px;
  border-top: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.28);
}
.filter-modal__btn {
  flex: 1;
  padding: 12px 18px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 1100;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  border: none;
  font-family: inherit;

  &:active {
    transform: scale(0.99);
  }

  &--cancel {
    background: rgba(255, 255, 255, 0.06);
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.18);
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  &--apply {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: 0 22px 70px rgba($orange, 0.2);
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 26px 80px rgba($orange, 0.25);
    }
  }
}

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
