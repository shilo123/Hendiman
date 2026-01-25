<template>
  <header class="mHdr" v-if="isHendiman">
    <!-- LEFT: Icons -->
    <div class="mHdr__icons">
      <!-- Return to job button (mobile) -->
      <button
        v-if="hasActiveJob && isChatMinimized"
        class="mHdr__icon"
        type="button"
        aria-label="חזור לעבודה"
        @click="$emit('return-to-job')"
      >
        <span>🔧</span>
      </button>
    </div>

    <!-- CENTER: Name + Type -->
    <div class="mHdr__center">
      <div class="mHdr__kicker">
        <span v-if="subscriptionTypeLabel">{{ subscriptionTypeLabel }}</span>
        <span v-else>הנדימן</span>
      </div>
      <div class="mHdr__name">{{ me?.name || me?.username }}</div>
    </div>

    <!-- RIGHT: Avatar -->
    <button
      class="mHdr__avatar"
      type="button"
      aria-label="פרופיל"
      @click="$emit('open-profile')"
    >
      <div class="mHdr__avatar-wrapper">
        <img v-if="me?.avatarUrl" :src="me.avatarUrl" alt="" />
        <span v-else class="mHdr__ph">👤</span>
        <div
          class="mHdr__status-indicator"
          :title="isAvailable ? 'זמין' : 'לא זמין'"
        >
          <span
            class="mHdr__status-dot"
            :class="{ 'mHdr__status-dot--available': isAvailable }"
          />
        </div>
      </div>
    </button>
  </header>

  <!-- OLD DESIGN for non-handyman (keeping for backward compatibility) -->
  <header class="top" v-else>
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

          <!-- Overlay -->
          <div class="me__edit-overlay" aria-hidden="true">
            <span class="me__edit-text">ערוך פרופיל</span>
          </div>

          <!-- Glow ring -->
          <div class="me__ring" aria-hidden="true"></div>
        </div>

        <div
          class="me__status-indicator"
          :title="isHendiman ? (isAvailable ? 'זמין' : 'לא זמין') : 'מחובר'"
        >
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
        <div class="me__role">
          <span
            class="role-pill"
            :class="{
              'role-pill--handy': isHendiman,
              'role-pill--client': !isHendiman,
            }"
          >
            {{ isHendiman ? "הנדימן" : "לקוח" }}
          </span>
          <!-- Subscription Type Badge (only for handyman) -->
          <span
            v-if="isHendiman && subscriptionTypeLabel"
            class="subscription-type-badge"
            :class="subscriptionTypeClass"
          >
            {{ subscriptionTypeLabel }}
          </span>
        </div>
      </div>

      <span class="me__chev" aria-hidden="true">›</span>
    </button>

    <!-- RIGHT: Actions + KPI -->
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
        <span class="btn__spark" aria-hidden="true"></span>
      </button>

      <!-- Desktop: KPI -->
      <div class="kpi kpi--desktop" role="group" aria-label="סטטיסטיקות">
        <div class="kpi__item">
          <div class="kpi__num">{{ stats.clients }}</div>
          <div class="kpi__label">לקוחות</div>
          <span class="kpi__shine" aria-hidden="true"></span>
        </div>

        <div class="kpi__item">
          <div class="kpi__num">{{ stats.handymen }}</div>
          <div class="kpi__label">הנדימנים</div>
          <span class="kpi__shine" aria-hidden="true"></span>
        </div>

        <div class="kpi__item kpi__item--hot">
          <div class="kpi__num">{{ stats.users }}</div>
          <div class="kpi__label">משתמשים</div>
          <span class="kpi__shine" aria-hidden="true"></span>
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
      imageLoaded: false,
    };
  },
  watch: {
    "me.avatarUrl"(newUrl) {
      if (newUrl) this.imageLoaded = false;
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },
  computed: {
    subscriptionTypeLabel() {
      if (!this.isHendiman) return null;

      // Check if FREE
      if (
        this.me?.subscriptionPlanType === "FREE" ||
        this.me?.subscriptionExpiresAt === "FREE" ||
        this.me?.trialExpiresAt === "always" ||
        this.me?.billingStartDate === "FREE"
      ) {
        return "לתמיד";
      }

      // Check subscription plan type
      if (this.me?.subscriptionPlanType === "annual") {
        return "שנתי";
      } else if (this.me?.subscriptionPlanType === "monthly") {
        return "חודשי";
      }

      return null;
    },
    subscriptionTypeClass() {
      if (!this.subscriptionTypeLabel) return "";

      if (this.subscriptionTypeLabel === "לתמיד") {
        return "subscription-type-badge--free";
      } else if (this.subscriptionTypeLabel === "שנתי") {
        return "subscription-type-badge--annual";
      } else if (this.subscriptionTypeLabel === "חודשי") {
        return "subscription-type-badge--monthly";
      }

      return "";
    },
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
$card2: rgba(255, 255, 255, 0.095);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;

$shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 55px rgba(255, 106, 0, 0.2);

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 4px rgba($orange, 0.28);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
  min-width: 0;
  background: #000 !important;
  padding: 10px 14px;
  border-radius: 0;
  border: none;

  @media (max-width: 768px) {
    flex-wrap: nowrap;
    gap: 8px;

    margin: 0;
    padding: 10px 12px;

    border-radius: 0;
    border: none;
    background: #000;

    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

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
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;

  border-radius: 999px;
  border: 1px solid rgba($orange, 0.22);

  background: radial-gradient(
      140px 60px at 20% 0%,
      rgba($orange, 0.2),
      transparent 60%
    ),
    linear-gradient(180deg, $card2, $card);

  box-shadow: $shadow;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease,
    border-color 140ms ease;
  min-width: 0;
  overflow: hidden;

  /* moving light */
  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: translateX(-60%);
    opacity: 0;
    transition: opacity 180ms ease;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: 6px 8px;
    border-radius: 14px;
    gap: 8px;
    flex: 0 0 auto;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow, $shadowO;
    border-color: rgba($orange, 0.34);

    &::before {
      opacity: 1;
      animation: sweep 1.1s ease-in-out infinite;
    }
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

  &__ring {
    position: absolute;
    inset: -6px;
    border-radius: 999px;
    background: radial-gradient(
      closest-side,
      rgba($orange, 0),
      rgba($orange, 0) 60%,
      rgba($orange, 0.22) 78%,
      rgba($orange2, 0) 100%
    );
    opacity: 0;
    transform: scale(0.92);
    transition: opacity 180ms ease, transform 180ms ease;
    pointer-events: none;
  }

  &:hover .me__ring {
    opacity: 1;
    transform: scale(1);
    animation: ringPulse 1.4s ease-in-out infinite;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba($orange, 0.35);
    display: block;
    transition: opacity 0.3s ease, transform 0.25s ease;

    @media (max-width: 768px) {
      width: 30px;
      height: 30px;
      border-width: 1.5px;
    }

    &--loading {
      opacity: 0;
    }
  }

  &:hover .me__avatar {
    transform: scale(1.03);
  }

  &__avatar--placeholder {
    background: linear-gradient(
      135deg,
      rgba($orange, 0.22),
      rgba($orange2, 0.14)
    );
    border-color: rgba($orange, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__avatar-placeholder-icon {
    font-size: 20px;
    opacity: 0.75;

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
      rgba(255, 255, 255, 0.22) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.3s ease-in-out infinite;
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
    background: rgba(0, 0, 0, 0.82);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  /* FIX: overlay works on hover of the whole button */
  &:hover .me__edit-overlay {
    opacity: 1;
  }

  &__edit-text {
    color: $orange2;
    font-weight: 1000;
    font-size: 10px;
    text-align: center;
    line-height: 1.1;
    padding: 0 6px;
    text-shadow: 0 10px 24px rgba($orange, 0.25);
  }

  &__status-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid $bg;
    background: rgba(0, 0, 0, 0.35);
    display: grid;
    place-items: center;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);

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
    gap: 4px;
    min-width: 0;
  }

  &__name {
    font-weight: 1000;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 12px;
      font-weight: 1000;
    }
  }

  &__role {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .role-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 1000;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.78);

    &--handy {
      border-color: rgba($orange, 0.22);
      background: rgba($orange, 0.1);
      color: $orange2;
    }

    &--client {
      border-color: rgba(16, 185, 129, 0.22);
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
    }

    @media (max-width: 768px) {
      font-size: 9px;
      padding: 3px 8px;
      border-radius: 12px;
    }
  }

  .subscription-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 1000;
    border: 1px solid;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &--free {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    &--annual {
      border-color: rgba($orange, 0.4);
      background: rgba($orange, 0.15);
      color: $orange2;
    }

    &--monthly {
      border-color: rgba(59, 130, 246, 0.4);
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    @media (max-width: 768px) {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 10px;
    }
  }

  &__chev {
    color: rgba($orange3, 0.95);
    font-weight: 1000;
    font-size: 18px;
    margin-right: 4px;
    text-shadow: 0 10px 22px rgba($orange, 0.22);

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

  @media (max-width: 768px) {
    flex: 1 1 auto;
    flex-wrap: nowrap;
    gap: 8px;
    justify-content: flex-end;
    z-index: 100001;
  }
}

/* Buttons */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.28);

  background: radial-gradient(
      120px 60px at 20% 0%,
      rgba($orange, 0.18),
      transparent 60%
    ),
    linear-gradient(135deg, rgba($orange, 0.14), rgba($orange2, 0.1));

  color: $orange2;
  cursor: pointer;
  font-weight: 1000;
  font-size: 13px;

  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
  transition: transform 120ms ease, box-shadow 120ms ease,
    border-color 120ms ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
    border-color: rgba($orange, 0.42);
  }
  &:focus {
    @include focusRing;
  }

  &__icon {
    font-size: 16px;
    line-height: 1;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.35));
  }
  &__text {
    white-space: nowrap;
  }

  /* tiny moving spark */
  &__spark {
    position: absolute;
    inset: -2px;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: translateX(-70%);
    opacity: 0;
    pointer-events: none;
  }

  &:hover &__spark {
    opacity: 1;
    animation: sweep 1.15s ease-in-out infinite;
  }

  @media (max-width: 768px) {
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

/* KPI */
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
    position: relative;
    background: radial-gradient(
        140px 60px at 20% 0%,
        rgba($orange, 0.1),
        transparent 60%
      ),
      linear-gradient(180deg, $card2, $card);

    border: 1px solid $stroke;
    border-radius: 999px;
    padding: 10px 12px;
    box-shadow: $shadow;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    overflow: hidden;

    &:hover .kpi__shine {
      opacity: 1;
      animation: sweep 1.4s ease-in-out infinite;
    }
  }

  &__shine {
    position: absolute;
    inset: -2px;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: translateX(-70%);
    opacity: 0;
    pointer-events: none;
  }

  &__num {
    font-size: 18px;
    font-weight: 1000;
    color: $text;
    text-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  }

  &__label {
    font-size: 12px;
    font-weight: 1000;
    color: $muted;
    white-space: nowrap;
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
    animation: dotPulse 1.6s ease-in-out infinite;
  }

  &--green {
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.22);
    animation: dotPulse 1.8s ease-in-out infinite;
  }
}

/* tiny screens */
@media (max-width: 360px) {
  .kpi__label {
    display: none;
  }
}

/* ===== Animations ===== */
@keyframes sweep {
  0% {
    transform: translateX(-70%);
  }
  100% {
    transform: translateX(70%);
  }
}
@keyframes ringPulse {
  0%,
  100% {
    filter: blur(0px);
    opacity: 0.85;
  }
  50% {
    filter: blur(0.6px);
    opacity: 1;
  }
}
@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* ===== Handyman Header (mHdr style) ===== */
.mHdr {
  position: sticky;
  top: 0;
  z-index: 2500;
  direction: ltr;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  margin: -16px -16px 6px;
  background: #000;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    margin: calc(-12px - env(safe-area-inset-top)) -10px 6px;
    padding-top: calc(14px + env(safe-area-inset-top));
  }
}

.mHdr__icons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mHdr__icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  display: grid;
  place-items: center;
  position: relative;
  cursor: pointer;
  font-size: 18px;

  &:active {
    transform: scale(0.92);
  }
}

.mHdr__center {
  direction: rtl;
  text-align: right;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.mHdr__kicker {
  font-size: 10px;
  font-weight: 1000;
  color: rgba(249, 115, 22, 0.75);
  letter-spacing: 2px;
  text-align: right;
  width: 100%;
  direction: rtl;
}

.mHdr__name {
  font-size: 24px;
  font-weight: 1100;
  letter-spacing: -0.4px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
  text-align: right;
  direction: rtl;
  width: 100%;
}

.mHdr__avatar {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 2px solid rgba(249, 115, 22, 0.95);
  background: rgba(255, 255, 255, 0.03);
  padding: 2px;
  overflow: hidden;
  cursor: pointer;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    object-fit: cover;
    display: block;
  }
}

.mHdr__avatar-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.mHdr__ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 24px;
}

.mHdr__status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(3, 3, 3, 0.95);
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.mHdr__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.25s ease;

  &--available {
    background: $orange;
    box-shadow: 0 0 0 2px rgba($orange, 0.3);
    animation: dotPulse 1.6s ease-in-out infinite;
  }
}
</style>
