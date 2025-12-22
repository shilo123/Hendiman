<template>
  <section class="jobs" id="jobs">
    <!-- Header -->
    <div class="jobs__head">
      <div class="jobs__headText">
        <h2 class="jobs__title">עבודות</h2>
        <p class="jobs__sub">
          {{
            isHendiman
              ? "עבודות לפי ההתמחויות שלך · סינון לפי מצב ומרחק"
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
        <!-- Status -->
        <div class="panel">
          <div class="panel__label">מצב קריאה</div>

          <!-- Desktop tabs -->
          <div class="tabs">
            <button
              v-for="t in statusTabsWithCounts"
              :key="t.value"
              class="tab"
              :class="{ 'tab--active': activeStatus === t.value }"
              type="button"
              @click="$emit('pick-status', t.value)"
            >
              <span class="tab__txt">{{ t.label }}</span>
              <span class="tab__count">{{ t.count }}</span>
            </button>
          </div>

          <!-- Mobile dropdown -->
          <div class="selectWrap">
            <button
              class="select"
              type="button"
              @click="isStatusDropdownOpen = !isStatusDropdownOpen"
            >
              <span class="select__value">{{ getSelectedStatusLabel() }}</span>
              <span class="select__chev">▼</span>
            </button>

            <div v-if="isStatusDropdownOpen" class="menu" @click.stop>
              <button
                v-for="t in statusTabsWithCounts"
                :key="t.value"
                class="menu__item"
                :class="{ 'menu__item--active': activeStatus === t.value }"
                type="button"
                @click="selectStatus(t.value)"
              >
                <span class="menu__label">{{ t.label }}</span>
                <span class="menu__count">{{ t.count }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Distance -->
        <div class="panel">
          <div class="panel__top">
            <div class="panel__label">מרחק</div>
            <button class="link" type="button" @click="$emit('reset-km')">
              איפוס
            </button>
          </div>

          <div class="badgeRow">
            <span class="badge"
              >עד <b>{{ handymanFilters.maxKm }}</b> ק״מ</span
            >
          </div>

          <input
            class="range"
            type="range"
            min="1"
            max="30"
            step="1"
            :value="handymanFilters.maxKm"
            @input="$emit('change-km', $event.target.value)"
          />

          <div class="hint">* סינון תצוגה בלבד (לפי אזור הפעילות בפרופיל).</div>
        </div>
      </div>
    </div>

    <!-- Jobs list -->
    <div class="jobs__list">
      <article v-for="job in filteredJobs" :key="job.id" class="job">
        <div class="job__header">
          <div class="job__title">
            {{ job.subcategoryInfo?.name || job.subcategoryName || "ללא שם" }}
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
    "view",
    "next-jobs-page",
    "prev-jobs-page",
  ],
  data() {
    return { isStatusDropdownOpen: false };
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    handleClickOutside(e) {
      if (this.isStatusDropdownOpen && !e.target.closest(".selectWrap")) {
        this.isStatusDropdownOpen = false;
      }
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

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (max-width: 380px) {
    grid-template-columns: 1fr;
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

/* Mobile select */
.selectWrap {
  position: relative;
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
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
</style>
