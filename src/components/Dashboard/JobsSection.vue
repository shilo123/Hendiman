<template>
  <section class="jobs" id="jobs">
    <!-- Header -->
    <div class="jobs__head">
      <div class="jobs__headText">
        <h2 class="jobs__title">עבודות</h2>
        <p class="jobs__sub">
          {{
            isHendiman
              ? "עבודות לפי ההתמחויות שלך · סינון לפי סטטוס ומרחק"
              : "כל הקריאות  · צפייה וסטטוסים"
          }}
        </p>
      </div>

      <button class="btn btn--primary" type="button" @click="$emit('refresh')">
        ↻ <span class="btn__txt">רענן</span>
      </button>
    </div>

    <!-- Filters (handyman only) -->
    <div v-if="isHendiman" class="filters">
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
            @input="handleKmChange($event.target.value)"
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

        <!-- Filter Button (visible only on mobile) -->
        <div class="panel panel--filter panel--filter-mobile">
          <button class="filter-btn" type="button" @click="openFilterModal">
            <span>🔍 סנן</span>
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
          <h3 class="filter-modal__title">סנן עבודות</h3>
          <button class="filter-modal__close" @click="closeFilterModal">
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
      <article v-for="job in filteredJobs" :key="job.id" class="job">
        <div class="job__header">
          <div class="job__title">
            {{ getJobDisplayName(job) }}
          </div>
        </div>

        <div class="job__meta">
          <div class="metaLine">
            <span class="metaItem">👤 {{ job.clientName }}</span>
            <span class="metaSep">•</span>
            <span class="metaItem">📍 {{ job.locationText }}</span>
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
          <span v-if="job.isUrgent" class="chip chip--urgent">דחוף</span>

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

        <button class="job__action" type="button" @click="$emit('view', job)">
          צפייה
        </button>
      </article>

      <div v-if="!filteredJobs || filteredJobs.length === 0" class="empty">
        אין עבודות להצגה כרגע.
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
        <div class="dots">
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
  ],
  data() {
    return {
      isStatusDropdownOpen: false,
      isFilterDropdownOpen: false,
      localMaxKm: null, // Local value for display while dragging
      showFilterModal: false,
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
      // Show local value while dragging, otherwise show the actual value
      return this.localMaxKm !== null
        ? this.localMaxKm
        : this.handymanFilters.maxKm;
    },
  },
  watch: {
    "handymanFilters.maxKm"(newVal) {
      // Reset local value when actual value changes
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
      // Handle subcategoryInfo as array
      if (
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 0
      ) {
        if (job.subcategoryInfo.length === 1) {
          // Single job - show name
          return (
            job.subcategoryInfo[0].subcategory ||
            job.subcategoryInfo[0].category ||
            job.subcategoryName ||
            "ללא שם"
          );
        } else {
          // Multiple jobs - show count
          return `${job.subcategoryInfo.length} עבודות`;
        }
      }
      // Fallback for old format (object) or no subcategoryInfo
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
    handleKmChange(value) {
      // Reset local value and emit the change
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
      // Emit all filter changes
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
$shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 44px rgba(255, 106, 0, 0.18);

.jobs {
  border-radius: 16px;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: 768px) {
    border-radius: 12px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.55);
  }
}

/* Header */
.jobs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
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
  direction: rtl;
  text-align: right;

  @media (max-width: 768px) {
    padding: 10px;
  }
}

.jobs__headText {
  min-width: 0;
}
.jobs__title {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;

  @media (max-width: 768px) {
    font-size: 15px;
  }
}
.jobs__sub {
  margin: 4px 0 0;
  color: $muted;
  font-weight: 800;
  font-size: 12px;
  line-height: 1.25;

  @media (max-width: 768px) {
    font-size: 9.5px;
  }
}

/* Button */
.btn {
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;

  &--primary {
    color: #111;
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    box-shadow: $shadowO;
  }

  .btn__txt {
    @media (max-width: 400px) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    padding: 9px 10px;
    font-size: 12px;
    border-radius: 10px;
  }
}

/* Filters */
.filters {
  padding: 10px 12px 0;
  @media (max-width: 768px) {
    padding: 8px 10px 0;
  }
}

.filters__grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 10px;

  @media (min-width: 769px) {
    grid-template-columns: 1fr; /* On desktop, all filters in single column */
    gap: 12px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

.panel {
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 12px;
  }
  @media (max-width: 400px) {
    padding: 6px;
    border-radius: 10px;
  }
}

.panel__label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 10px;
    margin-bottom: 6px;
  }
  @media (max-width: 400px) {
    font-size: 9px;
    margin-bottom: 4px;
  }
}

.panel__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.link {
  border: none;
  background: transparent;
  color: $orange3;
  font-weight: 1000;
  cursor: pointer;

  &--small {
    font-size: 10px;
    padding: 4px 8px;
  }
}

/* Desktop tabs */
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    display: none;
  }
}
.tab {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 16px;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 1000;

  &--active {
    background: linear-gradient(135deg, $orange, $orange2);
    border-color: rgba($orange, 0.55);
    color: #111;
  }

  &__txt {
    font-size: 12px;
    color: $text;
  }
  &__count {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.25);
    color: $text;
  }
}

/* Mobile select - Hidden on mobile as requested */
.selectWrap {
  position: relative;
  display: none;
}
.select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.25);
  background: rgba($orange, 0.12);
  color: $text;
  font-weight: 1000;
  font-size: 11px;
  padding: 10px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;

  @media (max-width: 768px) {
    padding: 9px 9px;
    border-radius: 10px;
  }
}
.select__value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 50;
  background: rgba(15, 16, 22, 0.98);
  border: 1px solid rgba($orange, 0.25);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  max-height: 260px;
  overflow-y: auto;
}
.menu__item {
  width: 100%;
  padding: 12px 12px;
  border: none;
  background: transparent;
  color: $text;
  font-weight: 1000;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  text-align: right;

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: rgba($orange, 0.1);
  }
  &--active {
    background: rgba($orange, 0.2);
    color: $orange3;
  }
}
.menu__label {
  min-width: 0;
}
.menu__count {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.25);
  font-size: 10px;
}

/* Distance bits */
.badgeRow {
  margin: 2px 0 8px;
}
.badge {
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  font-weight: 900;
  font-size: 12px;

  b {
    font-weight: 1100;
    color: $orange3;
  }

  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 10px;
  }
}
.range {
  width: 100%;
  accent-color: $orange;
}
/* Radio Group */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;

  @media (max-width: 400px) {
    gap: 8px;
    margin-top: 6px;
  }
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;

  @media (max-width: 400px) {
    padding: 8px 10px;
    gap: 8px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.2);
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

.radio-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  font-size: 14px;
  transition: all 0.2s ease;
  user-select: none;
}

.hint {
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 9px;
    margin-top: 6px;
  }
}

/* Filter Dropdown */
.panel--filter {
  position: relative;
}

.filter-dropdown {
  position: relative;
}

.filter-dropdown__button {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.25);
  background: rgba($orange, 0.12);
  color: $text;
  font-weight: 1000;
  font-size: 11px;
  padding: 10px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.18);
    border-color: rgba($orange, 0.35);
  }

  @media (max-width: 768px) {
    padding: 9px 9px;
    font-size: 10px;
  }
  @media (max-width: 400px) {
    padding: 8px 8px;
    font-size: 9px;
  }
}

.filter-dropdown__value {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  direction: rtl;
}

.filter-dropdown__chev {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.filter-dropdown__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  z-index: 100;
  background: rgba(15, 16, 22, 0.98);
  border: 1px solid rgba($orange, 0.25);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  overflow-y: auto;
  max-height: 500px;
  padding: 12px;

  @media (max-width: 400px) {
    padding: 10px;
    max-height: 400px;
  }
}

.filter-menu__section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 400px) {
    margin-bottom: 12px;
  }
}

.filter-menu__title {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  @media (max-width: 400px) {
    font-size: 11px;
    margin-bottom: 8px;
  }
}

/* List */
.jobs__list {
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;

  @media (max-width: 768px) {
    padding: 10px;
    gap: 8px;
  }
}

.job {
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 10px;
  display: grid;
  gap: 8px;

  @media (max-width: 768px) {
    padding: 10px; /* חשוב: לא להקטין מדי – נותן אוויר */
    border-radius: 14px;
    gap: 8px;
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
  font-size: 15px;
  color: $text;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.job__action {
  border: none;
  border-radius: 12px;
  padding: 8px 10px;
  font-weight: 1100;
  cursor: pointer;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
  width: auto;
  align-self: flex-end;
  min-width: 80px;

  @media (max-width: 768px) {
    padding: 5px 8px;
    border-radius: 8px;
    font-size: 10px;
    min-width: 60px;
  }
}

/* Meta as two lines */
.job__meta {
  display: grid;
  gap: 4px;
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
    font-size: 11px;
  }
}
.metaLine--secondary {
  opacity: 0.95;
}
.metaSep {
  opacity: 0.6;
}
.price {
  font-weight: 1100;
  color: $orange3;
}

/* Chips: horizontal scroll on mobile, limit clutter */
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

/* במובייל מסתירים צ׳יפים מעבר ל-3 כדי שלא יהיה “גוש” */
@media (max-width: 768px) {
  .chips .chip:nth-child(n + 4) {
    display: none;
  }
}

.chip {
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 1000;
  font-size: 11px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  color: $text;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 4px 10px;
  }

  &--urgent {
    border-color: rgba($danger, 0.45);
    background: rgba($danger, 0.12);
    color: #ffd4d4;
  }

  &--status {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.86);
  }

  &--done {
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.2);
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

.empty {
  padding: 14px 10px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  font-weight: 900;
}

/* Pager */
.pager {
  padding: 12px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);

  @media (max-width: 768px) {
    padding: 10px;
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
  font-weight: 800;
  font-size: 12px;
  @media (max-width: 768px) {
    font-size: 11px;
  }
}

.pageBtn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
@media (max-width: 768px) {
  /* 1. כותרת עבודה – מקסימום 2 שורות */
  .job__title {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.25;
  }

  /* 2. צ׳יפים – יותר קומפקטיים */
  .chips {
    gap: 4px;
    margin-top: 2px;
  }

  .chip {
    padding: 3px 8px;
    font-size: 10px;
    border-radius: 999px;
  }

  /* לקוח: רק 2 צ׳יפים ראשונים (דחוף + סטטוס) */
  .chips .chip:nth-child(n + 3) {
    display: none;
  }

  /* 3. מטא – שורות יותר צפויות אבל קריאות */
  .metaLine {
    font-size: 10px;
    gap: 4px;
  }

  /* 4. מחיר – מיושר וברור */
  .price {
    margin-inline-start: auto;
    font-weight: 1100;
    font-size: 11px;
    white-space: nowrap;
  }

  /* 5. כרטיס עבודה – פחות “גובה מיותר” */
  .job {
    gap: 6px;
    padding: 8px;
  }

  /* 6. כפתור צפייה – פחות דומיננטי */
  .job__action {
    padding: 7px 10px;
    font-size: 11px;
    border-radius: 10px;
  }
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
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-weight: 1000;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
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

.radio-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
}

.radio-item--inline {
  flex: 1;
  min-width: 120px;
}

.price-range--horizontal {
  flex-direction: row;
  gap: 16px;

  .price-input-group {
    flex: 1;
  }
}

/* Filter Modal - Mobile Only */
.filter-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  direction: rtl;

  @media (min-width: 769px) {
    display: none;
  }
}

.filter-modal {
  background: $bg;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;

  @media (max-width: 450px) {
    max-width: 400px;
    border-radius: 14px;
  }
}

.filter-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba($orange, 0.2);

  @media (max-width: 450px) {
    padding: 16px;
  }
}

.filter-modal__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;

  @media (max-width: 450px) {
    font-size: 18px;
  }
}

.filter-modal__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: $text;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.filter-modal__body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;

  @media (max-width: 450px) {
    padding: 16px;
  }
}

.filter-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-section__title {
  font-size: 14px;
  font-weight: 1000;
  color: $text;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  @media (max-width: 450px) {
    font-size: 13px;
    margin-bottom: 10px;
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.3);
  }

  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: $orange;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  input[type="radio"]:checked + .radio-label {
    color: $orange2;
    font-weight: 1000;
  }
}

.radio-label {
  font-size: 14px;
  font-weight: 900;
  color: $text;
  flex: 1;

  @media (max-width: 450px) {
    font-size: 13px;
  }
}

.range-display {
  margin-bottom: 12px;
  text-align: center;
}

.range-value {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
  padding: 8px 16px;
  background: rgba($orange, 0.15);
  border-radius: 8px;
  display: inline-block;
}

.range-input {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: $orange2;
    cursor: pointer;
    border: 2px solid $bg;
    box-shadow: 0 2px 8px rgba($orange, 0.4);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: $orange2;
    cursor: pointer;
    border: 2px solid $bg;
    box-shadow: 0 2px 8px rgba($orange, 0.4);
  }
}

.price-range {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-label {
  font-size: 14px;
  font-weight: 900;
  color: $text;
  min-width: 80px;

  @media (max-width: 450px) {
    font-size: 13px;
    min-width: 70px;
  }
}

.price-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }

  &::placeholder {
    color: $muted;
  }

  @media (max-width: 450px) {
    padding: 9px 10px;
    font-size: 13px;
  }
}

.filter-modal__footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba($orange, 0.2);
  background: rgba(0, 0, 0, 0.3);

  @media (max-width: 450px) {
    padding: 16px;
    gap: 10px;
  }
}

.filter-modal__btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;

  @media (max-width: 450px) {
    padding: 11px 16px;
    font-size: 13px;
  }

  &--cancel {
    background: rgba(255, 255, 255, 0.06);
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &--apply {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: $shadowO;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 20px 50px rgba($orange, 0.25);
    }
  }
}
</style>
