<template>
  <div>
    <div class="handymen-list">
      <div v-for="h in filteredHandymen" :key="h.id || h._id" class="hcard">
        <div class="hcard__left">
          <div class="hcard__images">
            <img
              class="hcard__av"
              :src="getHandymanImage(h)"
              alt="handyman"
              @error="onImageError"
            />
            <img
              class="hcard__logo"
              :src="getHandymanLogo(h)"
              alt="logo"
              @error="onLogoError"
            />
          </div>
          <div class="hcard__meta">
            <div class="hcard__name">{{ h.username }}</div>
            <div
              class="hcard__rating"
              v-if="h.rating !== null && h.rating !== undefined"
            >
              <div class="hcard__rating-stars">
                <template v-for="i in 5" :key="i">
                  <font-awesome-icon
                    v-if="i <= getFullStars(h.rating)"
                    :icon="['fas', 'star']"
                    class="hcard__star hcard__star--full"
                  />
                  <font-awesome-icon
                    v-else-if="
                      i === getFullStars(h.rating) + 1 && hasHalfStar(h.rating)
                    "
                    :icon="['fas', 'star-half-stroke']"
                    class="hcard__star hcard__star--half"
                  />
                  <font-awesome-icon
                    v-else
                    :icon="['fas', 'star']"
                    class="hcard__star hcard__star--empty"
                  />
                </template>
              </div>
              <span class="hcard__rating-number">{{
                formatRating(h.rating)
              }}</span>
            </div>
            <div class="hcard__sub">
              {{ h.jobDone || 0 }} עבודות
              <span
                v-if="
                  h.travelTimeMinutes !== null &&
                  h.travelTimeMinutes !== undefined
                "
                class="hcard__travel-time"
              >
                · <span v-if="h.travelTimeMinutes === 0">📍 בעיר שלך</span>
                <span v-else>🚗 {{ h.travelTimeMinutes }} דק'</span>
              </span>
            </div>
          </div>
        </div>

        <div class="hcard__actions">
          <button
            class="mini mini--ghost"
            type="button"
            @click="$emit('view-details', h.id || h._id)"
          >
            <font-awesome-icon
              :icon="['fas', 'info-circle']"
              class="mini__icon"
            />
            ראה עוד
          </button>
          <button
            class="mini mini--primary"
            type="button"
            @click="$emit('personal-request', h.id || h._id)"
          >
            <font-awesome-icon :icon="['fas', 'calendar']" class="mini__icon" />
            הזמן
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button
        class="btn btn--ghost pagination__btn pagination__btn--prev"
        type="button"
        :disabled="!pagination.hasPrev"
        @click="$emit('prev-page')"
      >
        הקודם ←
      </button>
      <span class="pagination__info">
        עמוד {{ pagination.currentPage || pagination.page }} מתוך
        {{ pagination.totalPages }}
      </span>
      <button
        class="btn btn--ghost pagination__btn pagination__btn--next"
        type="button"
        :disabled="!pagination.hasNext"
        @click="$emit('next-page')"
      >
        → הבא
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "HandymenList",
  props: {
    filteredHandymen: {
      type: Array,
      required: true,
    },
    pagination: {
      type: Object,
      required: true,
    },
  },
  emits: ["view-details", "personal-request", "next-page", "prev-page"],
  methods: {
    formatRating(rating) {
      if (rating === null || rating === undefined) return "0.0";
      const numRating = Number(rating);
      if (isNaN(numRating)) return "0.0";
      // הצג עם ספרה עשרונית אחת אם יש עשרוניות
      return numRating % 1 === 0 ? numRating.toFixed(0) : numRating.toFixed(1);
    },
    getFullStars(rating) {
      if (rating === null || rating === undefined) return 0;
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 0) return 0;
      return Math.floor(numRating);
    },
    hasHalfStar(rating) {
      if (rating === null || rating === undefined) return false;
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 0) return false;
      return numRating % 1 >= 0.5;
    },
    getHandymanImage(handyman) {
      const defaultImage = "/img/Hendima-logo.png";

      if (!handyman || !handyman.imageUrl) {
        return defaultImage;
      }

      const imageUrl = handyman.imageUrl;

      // בדוק אם imageUrl ריק או לא תקין
      if (
        typeof imageUrl !== "string" ||
        imageUrl.trim() === "" ||
        imageUrl.includes("demo-02.png") ||
        imageUrl.includes("/demo") ||
        imageUrl.endsWith("demo-02.png") ||
        (!imageUrl.startsWith("http") && !imageUrl.startsWith("/"))
      ) {
        return defaultImage;
      }

      return imageUrl;
    },
    onImageError(event) {
      // אם התמונה נכשלה בטעינה, החלף לתמונת ברירת מחדל
      const defaultImage = "/img/Hendima-logo.png";
      if (
        event.target.src !== defaultImage &&
        !event.target.src.includes("Hendima-logo.png")
      ) {
        event.target.src = defaultImage;
      }
    },
    getHandymanLogo(handyman) {
      const defaultLogo = "/img/Hendima-logo.png";

      if (!handyman || !handyman.logoUrl) {
        return defaultLogo;
      }

      const logoUrl = handyman.logoUrl;

      // בדוק אם logoUrl ריק או לא תקין
      if (
        typeof logoUrl !== "string" ||
        logoUrl.trim() === "" ||
        logoUrl.includes("demo") ||
        (!logoUrl.startsWith("http") && !logoUrl.startsWith("/"))
      ) {
        return defaultLogo;
      }

      return logoUrl;
    },
    onLogoError(event) {
      // אם הלוגו נכשל בטעינה, החלף ללוגו ברירת מחדל
      const defaultLogo = "/img/Hendima-logo.png";
      if (
        event.target.src !== defaultLogo &&
        !event.target.src.includes("Hendima-logo.png")
      ) {
        event.target.src = defaultLogo;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;

$bg: #0b0b0f;
$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$muted: rgba(255, 255, 255, 0.62);
$text: rgba(255, 255, 255, 0.92);

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.handymen-list {
  font-family: $font-family;
  display: grid;
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 768px) {
    gap: 6px;
  }
}

.hcard {
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
    padding: 8px 6px;
    border-radius: 12px;
    gap: 6px;
    min-height: 60px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
  }

  &__left {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  &__images {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__av {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 2px solid rgba($orange, 0.28);
    object-fit: cover;

    @media (max-width: 768px) {
      width: 32px;
      height: 32px;
      border-width: 1.5px;
    }
  }

  &__logo {
    position: absolute;
    bottom: -2px;
    left: -2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid $bg;
    object-fit: cover;
    background: $bg;

    @media (max-width: 768px) {
      width: 16px;
      height: 16px;
      border-width: 1.5px;
      bottom: -1px;
      left: -1px;
    }
  }

  &__name {
    font-weight: 1100;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__rating {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    margin-bottom: 2px;

    @media (max-width: 768px) {
      gap: 4px;
      margin-top: 2px;
      margin-bottom: 1px;
    }
  }

  &__rating-stars {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-direction: row-reverse;

    @media (max-width: 768px) {
      gap: 2px;
    }
  }

  &__star {
    font-size: 11px;
    line-height: 1;
    display: inline-block;
    transition: opacity 0.2s ease, color 0.2s ease;
    color: #ffd700;

    @media (max-width: 768px) {
      font-size: 9px;
    }

    &--full {
      color: #ffd700;
      opacity: 1;
    }

    &--half {
      color: #ffd700;
      opacity: 1;
    }

    &--empty {
      color: rgba(255, 255, 255, 0.3);
      opacity: 1;
    }
  }

  &__rating-number {
    color: $orange2;
    font-weight: 1000;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      font-size: 9px;
      margin-top: 1px;
      gap: 2px;
    }
  }

  &__travel-time {
    color: $orange2;
    font-weight: 1000;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;

    @media (max-width: 768px) {
      gap: 4px;
      flex-wrap: nowrap;
      flex-shrink: 0;
    }
  }
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.04);

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 6px;
    padding: 8px 10px;
    margin-top: 12px;
  }

  &__info {
    color: $muted;
    font-weight: 900;
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;

    @media (max-width: 768px) {
      font-size: 9px;
      order: 2;
    }
  }

  .btn {
    min-width: 100px;

    @media (max-width: 768px) {
      min-width: auto;
      width: auto;
      padding: 4px 8px;
      font-size: 9px;
      flex: 0 0 auto;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  &__btn {
    @media (max-width: 768px) {
      order: 1;

      &--prev {
        order: 1;
      }

      &--next {
        order: 3;
      }
    }
  }
}

.mini {
  border-radius: 999px;
  padding: 9px 10px;
  font-weight: 1000;
  font-size: 12px;
  border: 1px solid rgba($orange, 0.25);
  background: rgba($orange, 0.12);
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 4px 6px;
    font-size: 9px;
    gap: 3px;
    min-width: auto;
    flex: 0 0 auto;
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
    border-color: rgba($orange, 0.4);
    background: rgba($orange, 0.18);
    box-shadow: 0 6px 16px rgba($orange, 0.2);

    &::before {
      width: 200px;
      height: 200px;
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:focus {
    @include focusRing;
  }

  &__icon {
    font-size: 11px;
    transition: transform 0.2s ease;
    flex-shrink: 0;

    @media (max-width: 768px) {
      font-size: 8px;
    }
  }

  &:hover &__icon {
    transform: scale(1.1);
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    color: $text;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.28);
      box-shadow: 0 6px 16px rgba(255, 255, 255, 0.1);

      &::before {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  &--primary {
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: 0 4px 12px rgba($orange, 0.3);

    &:hover {
      background: linear-gradient(135deg, $orange2, $orange);
      box-shadow: 0 6px 20px rgba($orange, 0.4);
      transform: translateY(-2px);

      &::before {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .mini__icon {
      color: #111;
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
</style>
