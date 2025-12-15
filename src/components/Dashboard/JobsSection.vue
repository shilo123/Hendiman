<template>
  <section class="jobs">
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
              ? "סינון לפי מצב ומרחק · קבל/דלג · צ׳אט לכל עבודה"
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
          <div class="job-card__tags">
            <span v-if="job.isUrgent" class="tag tag--urgent">דחוף</span>
            <span
              class="tag tag--status"
              :title="`סטטוס: ${getStatusLabel(job.status)}`"
            >
              {{ getStatusLabel(job.status) }}
            </span>
            <span
              class="tag"
              :class="
                job.billingType === 'hourly' ? 'tag--hourly' : 'tag--fixed'
              "
            >
              {{ job.billingType === "hourly" ? "לשעה" : "קבלנות" }}
            </span>
          </div>

          <div class="job-card__meta">
            <div class="job-card__title">{{ job.subcategoryName }}</div>
            <div class="job-card__sub">
              👤 {{ job.clientName }} · 📍 {{ job.locationText }} ·
              {{ job.distanceKm }} ק״מ
            </div>
            <div class="job-card__price">{{ job.price }} שקלות</div>
          </div>
        </div>

        <div class="job-card__actions">
          <template v-if="isHendiman">
            <button
              class="mini mini--ghost"
              type="button"
              @click="$emit('skip', job)"
            >
              דלג
            </button>
            <button
              class="mini mini--primary"
              type="button"
              :disabled="job.status !== 'open'"
              @click="$emit('accept', job)"
            >
              קבל
            </button>
          </template>
          <template v-else>
            <button
              class="mini mini--primary"
              type="button"
              @click="$emit('view', job)"
            >
              צפייה
            </button>
          </template>
        </div>
      </article>
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
      default: () => ({ maxKm: 10 }),
    },
  },
  emits: [
    "refresh",
    "pick-status",
    "change-km",
    "reset-km",
    "skip",
    "accept",
    "view",
  ],
  methods: {
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
