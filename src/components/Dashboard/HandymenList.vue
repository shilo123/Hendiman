<template>
  <section class="nearby">
    <!-- Wrapper header (clean + premium) -->
    <!-- <header class="nearby__header">
      <div class="nearby__titleWrap">
        <h2 class="nearby__title">הנדימנים באזורך</h2>
        <p class="nearby__hint">לחץ על כפתור לפעולה</p>
      </div>

      <div class="nearby__pill" v-if="filteredHandymen?.length">
        <span class="nearby__pillNum">{{ filteredHandymen.length }}</span>
        <span class="nearby__pillTxt">תוצאות</span>
      </div>
    </header> -->

    <div class="handymen-list" role="list" aria-label="הנדימנים באזורך">
      <article
        v-for="h in filteredHandymen"
        :key="h.id || h._id"
        class="hcard"
        :class="{ 'hcard--blocked': h.isBlocked }"
        role="listitem"
      >
        <!-- Row 1: avatar + name + rating -->
        <div class="hcard__row1">
          <div class="hcard__avatar">
            <img
              class="hcard__av"
              :src="getHandymanImage(h)"
              alt=""
              @error="onImageError"
              loading="lazy"
              decoding="async"
            />
            <img
              class="hcard__logo"
              :src="getHandymanLogo(h)"
              alt=""
              @error="onLogoError"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div class="hcard__main">
            <div class="hcard__nameLine">
              <div class="hcard__name" :title="h.username">
                {{ h.username }}
              </div>
              <span v-if="h.isBlocked" class="tag tag--danger">חסום</span>
            </div>

            <div class="hcard__ratingLine">
              <template
                v-if="
                  h.rating !== null && h.rating !== undefined && h.rating > 0
                "
              >
                <div class="stars" aria-label="דירוג">
                  <template v-for="i in 5" :key="i">
                    <font-awesome-icon
                      v-if="i <= getFullStars(h.rating)"
                      :icon="['fas', 'star']"
                      class="star star--full"
                    />
                    <font-awesome-icon
                      v-else-if="
                        i === getFullStars(h.rating) + 1 &&
                        hasHalfStar(h.rating)
                      "
                      :icon="['fas', 'star-half-stroke']"
                      class="star star--half"
                    />
                    <font-awesome-icon
                      v-else
                      :icon="['fas', 'star']"
                      class="star star--empty"
                    />
                  </template>
                </div>

                <span class="hcard__score">{{ formatRating(h.rating) }}</span>
              </template>

              <span v-else class="hcard__noRating">אין דירוג</span>
            </div>
          </div>

          <!-- micro info button (kept) -->
          <button
            class="iconBtn"
            type="button"
            @click="$emit('view-details', h.id || h._id)"
            title="פרטים"
            aria-label="פרטים"
          >
            <font-awesome-icon :icon="['fas', 'info-circle']" />
          </button>
        </div>

        <!-- Row 2: compact chips (only 2) -->
        <div class="hcard__row2" aria-label="מידע קצר">
          <span class="chip">🧰 {{ h.jobDone || 0 }} עבודות</span>

          <span
            v-if="
              h.travelTimeMinutes !== null && h.travelTimeMinutes !== undefined
            "
            class="chip"
            :class="h.travelTimeMinutes === 0 ? 'chip--good' : 'chip--travel'"
          >
            <template v-if="h.travelTimeMinutes === 0">📍 בעיר שלך</template>
            <template v-else>🚗 {{ h.travelTimeMinutes }} דק'</template>
          </span>
        </div>

        <!-- Row 3: THREE buttons in ONE row (small, equal width) -->
        <div class="hcard__row3" aria-label="פעולות">
          <!-- <button
            class="miniBtn miniBtn--ghost"
            type="button"
            @click="$emit('view-details', h.id || h._id)"
            title="ראה עוד"
          >
            <font-awesome-icon
              :icon="['fas', 'info-circle']"
              class="miniBtn__ic"
            />
            ראה עוד
          </button> -->

          <button
            class="miniBtn miniBtn--primary"
            type="button"
            @click="$emit('personal-request', h.id || h._id)"
            title="הזמן"
          >
            <font-awesome-icon
              :icon="['fas', 'calendar']"
              class="miniBtn__ic"
            />
            הזמן
          </button>

          <button
            class="miniBtn"
            :class="h.isBlocked ? 'miniBtn--ok' : 'miniBtn--danger'"
            type="button"
            @click="$emit('block-handyman', h.id || h._id, h.isBlocked)"
            :title="h.isBlocked ? 'בטל חסימת הנדימן' : 'חסום הנדימן'"
          >
            <font-awesome-icon
              :icon="h.isBlocked ? ['fas', 'unlock'] : ['fas', 'ban']"
              class="miniBtn__ic"
            />
            {{ h.isBlocked ? "בטל" : "חסום" }}
          </button>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button
        class="pbtn"
        type="button"
        :disabled="!pagination.hasPrev"
        @click="$emit('prev-page')"
      >
        הקודם
      </button>

      <span class="pagination__info">
        {{ pagination.currentPage || pagination.page }} /
        {{ pagination.totalPages }}
      </span>

      <button
        class="pbtn"
        type="button"
        :disabled="!pagination.hasNext"
        @click="$emit('next-page')"
      >
        הבא
      </button>
    </div>
  </section>
  <!-- . -->
</template>

<script>
export default {
  name: "HandymenList",
  props: {
    filteredHandymen: { type: Array, required: true },
    pagination: { type: Object, required: true },
  },
  emits: [
    "view-details",
    "personal-request",
    "next-page",
    "prev-page",
    "block-handyman",
  ],
  methods: {
    formatRating(rating) {
      if (rating === null || rating === undefined) return "0.0";
      const numRating = Number(rating);
      if (isNaN(numRating)) return "0.0";
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
      if (!handyman || !handyman.imageUrl) return defaultImage;

      const imageUrl = handyman.imageUrl;
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
      if (!handyman || !handyman.logoUrl) return defaultLogo;

      const logoUrl = handyman.logoUrl;
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
  Arial, sans-serif;

$bg: #0b0b0f;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

$orange: #ff6a00;
$orange2: #ff8a2b;

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 4px rgba($orange, 0.22);
}

.nearby {
  font-family: $font-family;
}

/* Wrapper header: premium but light */
.nearby__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.16);
  background: radial-gradient(
      260px 120px at 10% 0%,
      rgba($orange, 0.16),
      transparent 60%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.035)
    );
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.32);
  margin: 8px 0 10px;
}

.nearby__title {
  margin: 0;
  font-size: 15px;
  font-weight: 1100;
  color: $orange2;
  line-height: 1.1;
}

.nearby__hint {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.55);
}

.nearby__pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
}

.nearby__pillNum {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
  font-weight: 1100;
}

.nearby__pillTxt {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 1000;
  font-size: 12px;
}

/* List */
.handymen-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

/* Card: compact, readable */
.hcard {
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.14);
  background: radial-gradient(
      220px 120px at 12% 0%,
      rgba($orange, 0.12),
      transparent 62%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.065),
      rgba(255, 255, 255, 0.04)
    );
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.42);

  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  transition: transform 140ms ease, box-shadow 140ms ease,
    border-color 140ms ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($orange, 0.24);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.52);
  }

  &:focus-within {
    border-color: rgba($orange, 0.3);
  }
}

/* Row 1 */
.hcard__row1 {
  display: grid;
  grid-template-columns: 52px 1fr 36px;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.hcard__avatar {
  width: 52px;
  height: 52px;
  position: relative;
}

.hcard__av {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  border: 2px solid rgba($orange, 0.32);
  object-fit: cover;
  background: $bg;
}

.hcard__logo {
  position: absolute;
  bottom: -2px;
  left: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid $bg;
  object-fit: cover;
  background: $bg;
}

.hcard__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hcard__nameLine {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.hcard__name {
  color: $text;
  font-weight: 1100;
  font-size: 14px;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag {
  flex: 0 0 auto;
  padding: 5px 10px;
  border-radius: 999px;
  font-weight: 1100;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
}
.tag--danger {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.12);
  color: rgba(239, 68, 68, 0.95);
}

.hcard__ratingLine {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stars {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-direction: row-reverse;
}

.star {
  font-size: 12px;
  line-height: 1;

  &--full,
  &--half {
    color: #ffd700;
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
  }
  &--empty {
    color: rgba(255, 255, 255, 0.22);
  }
}

.hcard__score {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.16);
  background: rgba($orange, 0.08);
  color: $orange2;
  font-weight: 1100;
  font-size: 12px;
}

.hcard__noRating {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  font-size: 12px;
  font-style: italic;
}

/* Micro icon button */
.iconBtn {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 140ms ease, background 140ms ease,
    border-color 140ms ease;
  position: relative;
  bottom: 22%;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.18);
  }

  &:focus-visible {
    @include focusRing;
  }
}

/* Row 2: only 2 chips */
.hcard__row2 {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.chip {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 1000;
  font-size: 12px;
  white-space: nowrap;
}

.chip--travel {
  border-color: rgba($orange, 0.16);
  background: rgba($orange, 0.08);
}

.chip--good {
  border-color: rgba(16, 185, 129, 0.22);
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
}

/* Row 3: three equal small buttons in one row */
.hcard__row3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.miniBtn {
  min-height: 40px;
  border-radius: 14px;
  padding: 8px 8px;
  font-weight: 1100;
  font-size: 12px;

  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.09);
  color: $text;

  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease,
    border-color 140ms ease;

  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28);

  &:hover {
    transform: translateY(-1px);
    border-color: rgba($orange, 0.3);
    background: rgba($orange, 0.13);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.38);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }

  &:focus-visible {
    @include focusRing;
  }
}

.miniBtn__ic {
  font-size: 13px;
  line-height: 1;
}

.miniBtn--primary {
  border: none;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
  box-shadow: 0 14px 26px rgba($orange, 0.18);

  &:hover {
    background: linear-gradient(135deg, $orange2, $orange);
    box-shadow: 0 18px 34px rgba($orange, 0.26);
  }

  .miniBtn__ic {
    color: #111;
  }
}

.miniBtn--ghost {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.18);
  }
}

.miniBtn--danger {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.14);
  color: rgba(239, 68, 68, 0.95);

  &:hover {
    border-color: rgba(239, 68, 68, 0.46);
    background: rgba(239, 68, 68, 0.22);
    box-shadow: 0 16px 30px rgba(239, 68, 68, 0.12);
  }
}

.miniBtn--ok {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.14);
  color: rgba(34, 197, 94, 0.95);

  &:hover {
    border-color: rgba(34, 197, 94, 0.46);
    background: rgba(34, 197, 94, 0.22);
    box-shadow: 0 16px 30px rgba(34, 197, 94, 0.12);
  }
}

/* Blocked state */
.hcard--blocked {
  opacity: 0.62;
  filter: grayscale(0.18);

  &:hover {
    opacity: 0.75;
    filter: grayscale(0.1);
  }
}

/* Pagination */
.pagination {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.04);

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
}

.pagination__info {
  text-align: center;
  color: $muted;
  font-weight: 1100;
  font-size: 12px;
}

.pbtn {
  min-height: 40px;
  border-radius: 14px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.18);
  color: $text;
  cursor: pointer;
  font-weight: 1100;
  transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 14px 26px rgba(0, 0, 0, 0.28);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    @include focusRing;
  }
}

/* === MAX 420px: super tight, super clean === */
@media (max-width: 420px) {
  .nearby__header {
    padding: 10px 10px;
    border-radius: 14px;
  }

  .nearby__title {
    font-size: 14px;
  }

  .nearby__hint {
    font-size: 11px;
    margin-top: 5px;
  }

  .hcard {
    padding: 11px;
    border-radius: 16px;
    gap: 9px;
  }

  .hcard__row1 {
    grid-template-columns: 48px 1fr 34px;
    gap: 9px;
  }

  .hcard__avatar {
    width: 48px;
    height: 48px;
  }

  .hcard__av {
    width: 48px;
    height: 48px;
  }

  .hcard__name {
    font-size: 13px;
  }

  .chip {
    padding: 6px 10px;
    font-size: 11px;
  }

  .hcard__row3 {
    gap: 6px;
  }

  .miniBtn {
    min-height: 38px;
    font-size: 11px;
    padding: 7px 6px;
    border-radius: 12px;
    gap: 5px;
  }

  .miniBtn__ic {
    font-size: 12px;
  }

  .pagination {
    grid-template-columns: 1fr auto 1fr;
    padding: 10px 10px;
    border-radius: 14px;
  }

  .pbtn {
    min-height: 38px;
    font-size: 12px;
    border-radius: 12px;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
