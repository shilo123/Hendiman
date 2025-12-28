<template>
  <header class="top">
    <!-- LEFT: Profile -->
    <button class="me" type="button" @click="$emit('open-profile')">
      <div class="me__avatar-wrapper">
        <div class="me__avatar-container">
          <!-- Loading skeleton for profile image -->
          <div
            v-if="!imageLoaded && me.avatarUrl"
            class="me__avatar-skeleton"
          ></div>
          <img
            v-if="me.avatarUrl"
            class="me__avatar"
            :class="{ 'me__avatar--loading': !imageLoaded }"
            :src="me.avatarUrl"
            alt="avatar"
            @load="imageLoaded = true"
            @error="imageLoaded = true"
          />
          <div v-else class="me__avatar me__avatar--placeholder">
            <span class="me__avatar-placeholder-icon">👤</span>
          </div>
          <div class="me__edit-overlay">
            <span class="me__edit-text">ערוך פרופיל</span>
          </div>
        </div>

        <div class="me__status-indicator">
          <span
            class="dot"
            :class="{
              'dot--on': isHendiman ? isAvailable : true,
              'dot--green': !isHendiman,
            }"
          />
        </div>
      </div>

      <div class="me__meta">
        <div class="me__name">{{ me.name }}</div>
        <div class="me__role">{{ isHendiman ? "הנדימן" : "לקוח" }}</div>
      </div>

      <span class="me__chev">›</span>
    </button>

    <!-- RIGHT: Actions + KPI (same row always on mobile) -->
    <div class="right">
      <!-- Return to job (desktop only) -->
      <button
        v-if="hasActiveJob && isChatMinimized"
        class="btn btn--job"
        :class="{ 'btn--job-red': isHendiman }"
        type="button"
        @click="$emit('return-to-job')"
      >
        <span class="btn__icon">🔧</span>
        <span class="btn__text">חזור לעבודה שלך</span>
      </button>

      <!-- Ratings (handyman) -->
      <button
        v-if="isHendiman"
        class="btn btn--ratings"
        type="button"
        @click="$emit('view-ratings')"
        aria-label="הדירוגים והביקורות שלי"
        title="הדירוגים והביקורות שלי"
      >
        <span class="btn__icon">⭐</span>
        <span class="btn__text">הדירוגים והביקורות שלי</span>
      </button>

      <!-- Desktop: KPI -->
      <div class="kpi kpi--desktop" role="group" aria-label="סטטיסטיקות">
        <div class="kpi__item">
          <div class="kpi__num">{{ stats.clients }}</div>
          <div class="kpi__label">לקוחות</div>
        </div>

        <div class="kpi__item">
          <div class="kpi__num">{{ stats.handymen }}</div>
          <div class="kpi__label">הנדימנים</div>
        </div>

        <div class="kpi__item kpi__item--hot">
          <div class="kpi__num">{{ stats.users }}</div>
          <div class="kpi__label">משתמשים</div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: "DashboardTopBar",
  props: {
    me: { type: Object, required: true },
    isHendiman: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    stats: { type: Object, required: true },
    hasActiveJob: { type: Boolean, default: false },
    isChatMinimized: { type: Boolean, default: false },
  },
  emits: [
    "open-profile",
    "open-handymen-chat",
    "open-all-users-chat",
    "view-ratings",
    "return-to-job",
  ],
  data() {
    return {
      isMobile: window.innerWidth <= 768,
      imageLoaded: false, // Track if profile image has loaded
    };
  },
  watch: {
    "me.avatarUrl"(newUrl) {
      // Reset loading state when avatar URL changes
      if (newUrl) {
        this.imageLoaded = false;
      }
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
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

$shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 44px rgba(255, 106, 0, 0.18);

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  min-width: 0;

  @media (max-width: 768px) {
    // חד-שורה קשיח
    flex-wrap: nowrap;
    gap: 8px;

    margin-bottom: 6px;
    padding: 8px 10px;
    background: linear-gradient(180deg, $card2, $card);
    border-radius: 14px;
    border: 1px solid $stroke;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    position: sticky;
    top: 0;
    z-index: 100000;

    margin-left: calc(-6px - env(safe-area-inset-left));
    margin-right: calc(-6px - env(safe-area-inset-right));
    padding-left: calc(14px + env(safe-area-inset-left));
    padding-right: calc(14px + env(safe-area-inset-right));
  }
}

/* LEFT: profile */
.me {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(180deg, $card2, $card);
  border: 1px solid rgba($orange, 0.22);
  border-radius: 999px;
  padding: 10px 14px;
  box-shadow: $shadow;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease;
  min-width: 0;

  @media (max-width: 768px) {
    // קומפקט במובייל כדי להשאיר מקום ל-KPI
    padding: 6px 8px;
    border-radius: 14px;
    gap: 8px;
    flex: 0 0 auto;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow, $shadowO;
  }
  &:focus {
    @include focusRing;
  }

  &__avatar-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__avatar-container {
    position: relative;
    display: inline-block;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba($orange, 0.35);
    display: block;
    transition: opacity 0.3s ease;

    @media (max-width: 768px) {
      width: 30px;
      height: 30px;
      border-width: 1.5px;
    }

    &--loading {
      opacity: 0;
    }

    &--placeholder {
      background: linear-gradient(
        135deg,
        rgba($orange, 0.2),
        rgba($orange2, 0.15)
      );
      border-color: rgba($orange, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__avatar-placeholder-icon {
    font-size: 20px;
    opacity: 0.7;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }

  &__avatar-skeleton {
    position: absolute;
    inset: 0;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border: 2px solid rgba($orange, 0.35);
    z-index: 1;

    @media (max-width: 768px) {
      width: 30px;
      height: 30px;
      border-width: 1.5px;
    }
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  &__edit-overlay {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  &__edit-text {
    color: $orange;
    font-weight: 900;
    font-size: 9px;
    text-align: center;
    line-height: 1.2;
    padding: 0 4px;
  }

  &:hover .me__avatar-container:hover .me__edit-overlay {
    opacity: 1;
    pointer-events: auto;
  }

  &__status-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid $bg;
    background: rgba(0, 0, 0, 0.3);
    display: grid;
    place-items: center;

    @media (max-width: 768px) {
      width: 12px;
      height: 12px;
      border-width: 1.5px;
      bottom: -1px;
      right: -1px;
    }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    @media (max-width: 768px) {
      // במובייל — מציגים את השם והתפקיד
      gap: 2px;
    }
  }

  &__name {
    font-weight: 1000;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 12px;
      font-weight: 900;
    }
  }

  &__role {
    font-weight: 900;
    font-size: 11px;
    color: $muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 9px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  &__chev {
    color: rgba($orange3, 0.9);
    font-weight: 1000;
    font-size: 18px;
    margin-right: 4px;

    @media (max-width: 768px) {
      display: none;
    }
  }
}

/* RIGHT side */
.right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  position: relative;

  @media (max-width: 768px) {
    // חד-שורה קשיח + בלי wrap
    flex: 1 1 auto;
    flex-wrap: nowrap;
    gap: 8px;
    justify-content: flex-end;
    z-index: 100001;
  }
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.3);
  background: linear-gradient(135deg, rgba($orange, 0.15), rgba($orange2, 0.1));
  color: $orange2;
  cursor: pointer;
  font-weight: 1000;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba($orange, 0.1);
  transition: transform 120ms ease, box-shadow 120ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba($orange, 0.22);
  }
  &:focus {
    @include focusRing;
  }

  &__icon {
    font-size: 16px;
    line-height: 1;
  }
  &__text {
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    // במובייל: כפתורים קטנים יותר
    padding: 8px 10px;
    border-radius: 14px;
    flex: 0 0 auto;

    &__text {
      display: none;
    }
  }
}

/* Ratings button - show text on mobile */
.btn--ratings {
  @media (max-width: 768px) {
    padding: 8px 10px;
    border-radius: 14px;
    flex: 0 0 auto;
    font-size: 11px;
    gap: 6px;

    .btn__text {
      display: inline;
      white-space: nowrap;
      font-size: 10px;
    }

    .btn__icon {
      font-size: 14px;
    }
  }
}

/* Job button stays desktop-only */
.btn--job {
  @media (max-width: 768px) {
    display: none;
  }
}
.btn--job-red {
  border: 2px solid rgba(239, 68, 68, 0.55);
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.22),
    rgba(220, 38, 38, 0.16)
  );
  color: #ef4444;
}

/* KPI: forced single row */
.kpi {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  &--desktop {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &__item {
    background: linear-gradient(180deg, $card2, $card);
    border: 1px solid $stroke;
    border-radius: 999px;
    padding: 10px 12px;
    box-shadow: $shadow;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    min-width: 0;

    @media (max-width: 768px) {
      // הכי חשוב: כולם שווים ומצטמצמים שווה
      flex: 1 1 0;
      padding: 6px 8px;
      border-radius: 14px;
      gap: 6px;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
    }
  }

  &__num {
    font-size: 18px;
    font-weight: 1000;
    color: $text;

    @media (max-width: 768px) {
      font-size: 12px;
      line-height: 1;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 900;
    color: $muted;
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 9px;
      line-height: 1;
    }
  }

  &__item--hot {
    border-color: rgba($orange, 0.45);
    box-shadow: $shadow, $shadowO;

    .kpi__num {
      color: $orange3;
    }
  }
}

/* Status dot */
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.25s ease;

  @media (max-width: 768px) {
    width: 8px;
    height: 8px;
  }

  &--on {
    background: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.22);

    @media (max-width: 768px) {
      box-shadow: 0 0 0 2px rgba($orange, 0.22);
    }
  }

  &--green {
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.22);

    @media (max-width: 768px) {
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.22);
    }
  }
}

/* אם המסך ממש צר — מסתירים תוויות KPI ומשאירים רק מספרים (עדיין אותה שורה) */
@media (max-width: 360px) {
  .kpi__label {
    display: none;
  }
}
</style>
