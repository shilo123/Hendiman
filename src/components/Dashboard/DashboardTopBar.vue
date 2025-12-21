<template>
  <header class="top">
    <div class="top__left">
      <div class="me" role="button" tabindex="0" @click="$emit('open-profile')">
        <div class="me__avatar-wrapper">
          <div class="me__avatar-container">
            <img class="me__avatar" :src="me.avatarUrl" alt="avatar" />
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
            ></span>
          </div>
        </div>
        <div class="me__meta">
          <div class="me__name">{{ me.name }}</div>
          <div class="me__role">{{ isHendiman ? "הנדימן" : "לקוח" }}</div>
          <!-- <span class="me__status-text">{{
            isHendiman ? (isAvailable ? "זמין" : "לא זמין") : "מחובר"
          }}</span> -->
        </div>

        <span class="me__chev">›</span>
      </div>
    </div>

    <div class="top__right">
      <!-- Return to job button (when job is active but chat is minimized) - hidden on mobile -->
      <button
        v-if="hasActiveJob && isChatMinimized"
        class="top__returnJobBtn top__returnJobBtn--desktop"
        :class="{ 'top__returnJobBtn--handyman': isHendiman }"
        type="button"
        @click="$emit('return-to-job')"
      >
        <span class="top__returnJobBtnIcon">🔧</span>
        <span class="top__returnJobBtnText">חזור לעבודה שלך</span>
      </button>

      <button
        v-if="isHendiman"
        class="top__ratingsBtn"
        type="button"
        @click="$emit('view-ratings')"
      >
        <span class="top__ratingsBtnIcon">⭐</span>
        <span class="top__ratingsBtnText">הדירוגים והביקורות שלי</span>
      </button>

      <div class="kpi">
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
    me: {
      type: Object,
      required: true,
    },
    isHendiman: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    stats: {
      type: Object,
      required: true,
    },
    hasActiveJob: {
      type: Boolean,
      default: false,
    },
    isChatMinimized: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "open-profile",
    "open-handymen-chat",
    "open-all-users-chat",
    "view-ratings",
    "return-to-job",
  ],
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

$shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 44px rgba(255, 106, 0, 0.18);

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  @media (max-width: 768px) {
    margin-bottom: 6px;
    gap: 4px;
    padding: 6px 8px;
    background: linear-gradient(180deg, $card2, $card);
    border-radius: 12px;
    border: 1px solid $stroke;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
    margin-left: calc(-6px - env(safe-area-inset-left));
    margin-right: calc(-6px - env(safe-area-inset-right));
    padding-left: calc(14px + env(safe-area-inset-left));
    padding-right: calc(14px + env(safe-area-inset-right));
  }
}

.kpi {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 4px;
  }

  &__item {
    background: linear-gradient(180deg, $card2, $card);
    border: 1px solid $stroke;
    border-radius: 999px;
    padding: 10px 12px;
    box-shadow: $shadow;
    display: flex;
    align-items: baseline;
    gap: 10px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    @media (max-width: 768px) {
      padding: 4px 6px;
      gap: 4px;
      border-radius: 12px;
    }

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba($orange, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.4s ease, height 0.4s ease;
    }

    &:hover {
      transform: translateY(-2px);
      border-color: rgba($orange, 0.4);
      box-shadow: $shadow, 0 8px 20px rgba($orange, 0.2);
      background: linear-gradient(
        180deg,
        rgba($orange, 0.08),
        rgba($orange, 0.04)
      );

      &::before {
        width: 200px;
        height: 200px;
      }

      .kpi__num {
        color: $orange;
        transform: scale(1.05);
      }

      .kpi__label {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  &__num {
    font-size: 18px;
    font-weight: 1000;
    color: $text;
    transition: all 0.25s ease;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      font-size: 11px;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 900;
    color: $muted;
    transition: color 0.25s ease;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      font-size: 8px;
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

.top__left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;

  @media (max-width: 768px) {
    gap: 4px;
    flex: 0 0 auto;
  }
}

.top__chats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-left: 70px;

  @media (max-width: 768px) {
    display: none;
  }
}

.top__right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    gap: 6px;
    flex: 1;
    justify-content: flex-end;
  }
}

.me {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(180deg, $card2, $card);
  border: 1px solid rgba($orange, 0.22);
  border-radius: 999px;
  padding: 10px 14px;
  box-shadow: $shadow;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease;
  min-width: 0;

  @media (max-width: 768px) {
    padding: 6px 8px;
    gap: 6px;
    border-radius: 12px;
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
    flex-shrink: 0;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba($orange, 0.35);
    transition: all 0.25s ease;
    display: block;

    @media (max-width: 768px) {
      width: 28px;
      height: 28px;
      border-width: 1.5px;
    }
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
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;

    @media (max-width: 768px) {
      width: 12px;
      height: 12px;
      border-width: 1.5px;
      bottom: -1px;
      right: -1px;
    }
  }

  &__status-text {
    line-height: 1;
    font-size: 10px;
    font-weight: 900;
    color: $muted;
  }

  &__edit-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    z-index: 10;
  }

  &__edit-text {
    color: $orange;
    font-weight: 900;
    font-size: 9px;
    text-align: center;
    line-height: 1.2;
    padding: 0 4px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow, $shadowO;

    .me__avatar-container:hover .me__avatar {
      border-color: rgba($orange, 0.6);
    }

    .me__avatar-container:hover .me__edit-overlay {
      opacity: 1;
      pointer-events: auto;
    }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__name {
    font-weight: 1000;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  &__role {
    font-weight: 900;
    font-size: 11px;
    color: $muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
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

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }
}

.top__ratingsBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.3);
  background: linear-gradient(135deg, rgba($orange, 0.15), rgba($orange2, 0.1));
  color: $orange2;
  cursor: pointer;
  font-weight: 1000;
  font-size: 13px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba($orange, 0.1);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 6px 10px;
    gap: 4px;
    font-size: 11px;
    border-radius: 12px;
  }

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba($orange, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.4s ease, height 0.4s ease;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($orange, 0.5);
    background: linear-gradient(
      135deg,
      rgba($orange, 0.25),
      rgba($orange2, 0.2)
    );
    box-shadow: 0 6px 20px rgba($orange, 0.25);

    &::before {
      width: 200px;
      height: 200px;
    }

    .top__ratingsBtnIcon {
      transform: rotate(15deg) scale(1.1);
    }

    .top__ratingsBtnText {
      color: $orange;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    @include focusRing;
  }
}

.top__ratingsBtnIcon {
  font-size: 16px;
  transition: transform 0.25s ease;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.top__ratingsBtnText {
  position: relative;
  z-index: 1;
  transition: color 0.25s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.top__returnJobBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.3);
  background: linear-gradient(135deg, rgba($orange, 0.15), rgba($orange2, 0.1));
  color: $orange2;
  cursor: pointer;
  font-weight: 1000;
  font-size: 13px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba($orange, 0.1);
  position: relative;
  overflow: hidden;

  // Hide on mobile (will be shown above jobs section)
  @media (max-width: 768px) {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    gap: 4px;
    font-size: 11px;
    border-radius: 12px;
  }

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba($orange, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.4s ease, height 0.4s ease;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($orange, 0.5);
    background: linear-gradient(
      135deg,
      rgba($orange, 0.25),
      rgba($orange2, 0.2)
    );
    box-shadow: 0 6px 20px rgba($orange, 0.25);
    animation: none;

    &::before {
      width: 200px;
      height: 200px;
    }

    .top__returnJobBtnIcon {
      transform: rotate(15deg) scale(1.1);
    }

    .top__returnJobBtnText {
      color: $orange;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    @include focusRing;
  }

  // Red style for handyman
  &.top__returnJobBtn--handyman {
    border: 2px solid rgba(239, 68, 68, 0.5); /* Red border */
    background: linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.2),
      rgba(220, 38, 38, 0.15)
    ); /* Red gradient */
    color: #ef4444; /* Red text */
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); /* Red shadow */

    &::before {
      background: rgba(239, 68, 68, 0.3); /* Red ripple */
    }

    &:hover {
      border-color: rgba(239, 68, 68, 0.7); /* Darker red border on hover */
      background: linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.3),
        rgba(220, 38, 38, 0.25)
      ); /* Darker red gradient on hover */
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35); /* Darker red shadow on hover */

      .top__returnJobBtnText {
        color: #dc2626; /* Darker red text on hover */
      }
    }
  }
}

.top__returnJobBtnIcon {
  font-size: 16px;
  transition: transform 0.25s ease;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.top__returnJobBtnText {
  position: relative;
  z-index: 1;
  transition: color 0.25s ease;
  white-space: nowrap;
  color: $orange2; /* Default orange (for client) */
  font-weight: 1000;

  @media (max-width: 768px) {
    font-size: 10px;
  }

  .top__returnJobBtn--handyman & {
    color: #ef4444; /* Red for handyman */
  }
}
</style>
