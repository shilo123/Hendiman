<template>
  <section class="jobs" id="jobs">
    <div class="jobs__head">
      <div class="headActions">
        <button
          class="btn btn--primary"
          type="button"
          @click="$emit('refresh')"
        >
          ↻ רענן
        </button>
      </div>

      <div>
        <h2 class="h2">עבודות</h2>
        <p class="sub">
          {{
            isHendiman
              ? "עבודות לפי ההתמחויות שלך · סינון לפי מצב ומרחק · קבל/דלג · צ׳אט לכל עבודה"
              : "כל הקריאות שלך · צפייה וסטטוסים"
          }}
        </p>
      </div>
    </div>

    <!-- Handyman filters -->
    <div v-if="isHendiman" class="filters">
      <div class="filters__card">
        <div class="filters__row">
          <div class="field">
            <label class="label">מצב קריאה</label>
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
          </div>

          <div class="field field--narrow">
            <label class="label">מרחק</label>
            <div class="rangeBox">
              <div class="rangeBox__top">
                <span class="badge"
                  >עד <b>{{ handymanFilters.maxKm }}</b> ק״מ</span
                >
                <button class="link" type="button" @click="$emit('reset-km')">
                  איפוס
                </button>
              </div>
              <input
                class="range"
                type="range"
                min="1"
                max="30"
                step="1"
                :value="handymanFilters.maxKm"
                @change="$emit('change-km', $event.target.value)"
              />
              <div class="hint">
                * סינון תצוגה. בפועל הקריאות מגיעות לפי אזור פעילות בפרופיל.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Jobs list -->
    <div class="jobs__list">
      <article v-for="job in filteredJobs" :key="job.id" class="job-card">
        <div class="job-card__left">
          <div class="job-card__meta">
            <div class="job-card__title-row">
              <div class="job-card__title">
                {{
                  job.subcategoryInfo?.name || job.subcategoryName || "ללא שם"
                }}
              </div>
              <div class="job-card__tags">
                <span v-if="job.isUrgent" class="tag tag--urgent">דחוף</span>
                <span
                  class="tag tag--status"
                  :class="{ 'tag--done': job.status === 'done' }"
                  :title="`סטטוס: ${getStatusLabel(job.status)}`"
                >
                  {{ getStatusLabel(job.status) }}
                </span>
                <span
                  class="tag"
                  :class="
                    (job.subcategoryInfo?.typeWork || job.billingType) ===
                    'לשעה'
                      ? 'tag--hourly'
                      : 'tag--fixed'
                  "
                >
                  {{
                    job.subcategoryInfo?.typeWork || job.billingType || "קבלנות"
                  }}
                </span>
                <span
                  v-if="job.subcategoryInfo?.workType || job.workType"
                  class="tag tag--work-type"
                  :class="{
                    'tag--easy': job.workType === 'קלה',
                    'tag--medium': job.workType === 'מורכבת',
                    'tag--hard': job.workType === 'קשה',
                  }"
                >
                  {{ job.subcategoryInfo?.workType || job.workType }}
                </span>
              </div>
            </div>
            <div class="job-card__sub">
              👤 {{ job.clientName }} · 📍 {{ job.locationText }}
              <span v-if="distanceLabel(job)"
                >· {{ distanceLabel(job) }} ק״מ</span
              >
              <span
                v-if="job.subcategoryInfo?.price || job.price"
                class="job-card__price-inline"
              >
                {{ job.subcategoryInfo?.price }} שקלות
              </span>
            </div>
          </div>
        </div>

        <div class="job-card__actions">
          <button
            class="mini mini--primary"
            type="button"
            @click="$emit('view', job)"
          >
            צפייה
          </button>
        </div>
      </article>
    </div>
    <div
      v-if="jobsPagination && jobsPagination.total > jobsPagination.pageSize"
      class="jobs-pagination"
    >
      <button
        class="page-btn primary"
        type="button"
        :disabled="
          jobsPagination.page >=
          Math.ceil(jobsPagination.total / jobsPagination.pageSize)
        "
        @click="$emit('next-jobs-page')"
      >
        → הבא
      </button>
      <div class="pager">
        <div class="pager__dots">
          <span
            v-for="n in Math.max(
              1,
              Math.ceil(jobsPagination.total / jobsPagination.pageSize)
            )"
            :key="n"
            class="dot"
            :class="{ 'dot--active': n === jobsPagination.page }"
          ></span>
        </div>
        <div class="pager__info">
          עמוד {{ jobsPagination.page }} מתוך
          {{ Math.ceil(jobsPagination.total / jobsPagination.pageSize) }}
        </div>
      </div>
      <button
        class="page-btn ghost"
        type="button"
        :disabled="jobsPagination.page <= 1"
        @click="$emit('prev-jobs-page')"
      >
        הקודם ←
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: "JobsSection",
  props: {
    isHendiman: {
      type: Boolean,
      default: false,
    },
    filteredJobs: {
      type: Array,
      required: true,
    },
    statusTabsWithCounts: {
      type: Array,
      default: () => [],
    },
    activeStatus: {
      type: String,
      default: "all",
    },
    handymanFilters: {
      type: Object,
      default: () => ({ maxKm: 25 }),
    },
    jobsPagination: {
      type: Object,
      default: () => ({ page: 1, total: 0, pageSize: 5 }),
    },
    handymanCoords: {
      type: Object,
      default: () => null,
    },
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
  methods: {
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

.jobs {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;

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

.jobs__list {
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;

  @media (max-width: 768px) {
    padding: 6px 4px;
    gap: 6px;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
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

.jobs-pagination {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.pager {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-self: center;
}
.pager__dots {
  display: flex;
  gap: 6px;
  justify-content: center;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  transition: transform 0.15s ease, background 0.15s ease;
}
.dot--active {
  background: #ff7a00;
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(255, 122, 0, 0.12);
}
.pager__info {
  color: #cbd5e1;
  font-weight: 800;
  font-size: 12px;
}

.page-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(255, 122, 0, 0.4);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
.page-btn.primary {
  background: linear-gradient(135deg, #ff7a00, #ff9a3c);
  color: #0f1116;
  border-color: rgba(255, 122, 0, 0.35);
}
.page-btn.ghost {
  background: rgba(0, 0, 0, 0.22);
}
.job-card {
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: transform 120ms ease, box-shadow 120ms ease;
  min-height: auto;
  height: 80px;

  @media (max-width: 768px) {
    padding: 5px 6px;
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

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    justify-content: center;
    flex-grow: 1;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__title {
    font-weight: 1100;
    font-size: 16px;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    min-width: 0;

    @media (max-width: 768px) {
      font-size: 13px;
    }
  }

  &__tags {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    flex-shrink: 0;
    align-items: center;

    @media (max-width: 768px) {
      gap: 2px;
    }
  }

  &__sub {
    margin-top: 1px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: 11px;
      margin-top: 0;
      gap: 2px;
    }
  }

  &__price-inline {
    font-weight: 1100;
    color: $orange3;
    font-size: 14px;
    margin-right: 4px;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: 11px;
    }
  }

  &__price {
    display: none; // הסתר את המחיר הישן
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

.tag {
  border-radius: 999px;
  padding: 3px 8px;
  font-weight: 1000;
  font-size: 11px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  color: $text;
  line-height: 1.2;
  margin: 0 2px;

  @media (max-width: 768px) {
    padding: 2px 5px;
    font-size: 8px;
    border-radius: 6px;
    margin: 0 1px;
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

  &--work-type {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
  }

  &--easy {
    border-color: rgba(76, 175, 80, 0.4);
    background: rgba(76, 175, 80, 0.15);
    color: #81c784;
  }

  &--medium {
    border-color: rgba(255, 193, 7, 0.4);
    background: rgba(255, 193, 7, 0.15);
    color: #ffd54f;
  }

  &--hard {
    border-color: rgba(244, 67, 54, 0.4);
    background: rgba(244, 67, 54, 0.15);
    color: #ef5350;
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
}

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
</style>
