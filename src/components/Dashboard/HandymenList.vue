<template>
  <section class="hc" aria-label="הנדימנים באזורך">
    <div ref="track" class="hc__track" @scroll.passive="onTrackScroll">
      <div v-for="(page, pageIndex) in pages" :key="pageIndex" class="hc__page">
        <article
          v-for="h in page"
          :key="h.id || h._id"
          class="hcCard"
          :class="{ 'hcCard--blocked': h.isBlocked }"
        >
          <div class="hcCard__top">
            <div class="hcCard__who">
              <div class="hcCard__avatar">
                <img
                  class="hcCard__img"
                  :src="getHandymanImage(h)"
                  alt=""
                  @error="onImageError"
                  loading="lazy"
                  decoding="async"
                />
                <span class="hcCard__ring"></span>

                <button
                  class="hcCard__avatarBtn"
                  type="button"
                  aria-label="פרטים"
                  @click="$emit('view-details', h.id || h._id)"
                >
                  <font-awesome-icon :icon="['fas', 'info-circle']" />
                </button>
              </div>

              <div class="hcCard__info">
                <h3 class="hcCard__name" :title="h.username">
                  {{ h.username }}
                </h3>

                <div class="hcCard__meta">
                  <font-awesome-icon
                    :icon="['fas', 'location-dot']"
                    class="hcCard__metaIc"
                  />
                  <span class="hcCard__metaTxt">{{ getCityText(h) }}</span>
                </div>

                <div class="hcCard__travel" v-if="isInSameCity(h)">
                  <font-awesome-icon
                    :icon="['fas', 'location-dot']"
                    class="hcCard__travelIc"
                  />
                  <span class="hcCard__travelTxt">בעיר שלך</span>
                </div>

                <div class="hcCard__travel" v-else-if="hasTravelTime(h)">
                  <font-awesome-icon
                    :icon="['fas', 'car']"
                    class="hcCard__travelIc"
                  />
                  <span class="hcCard__travelTxt">מרחק נסיעה: {{ formatTravelTime(h) }}</span>
                </div>

                <div class="hcCard__rating" v-if="hasRating(h)">
                  <span class="hcCard__ratingNum">{{
                    formatRating(h.rating)
                  }}</span>
                  <font-awesome-icon
                    :icon="['fas', 'star']"
                    class="hcCard__star"
                  />
                  <span class="hcCard__ratingCount"
                    >({{ getRatingCount(h) }})</span
                  >
                </div>
                <div v-else class="hcCard__rating hcCard__rating--empty">
                  אין דירוג
                </div>
              </div>
            </div>

            <span class="hcCard__spacer" aria-hidden="true"></span>

            <button
              class="hcCard__detailsBtn"
              type="button"
              @click="$emit('view-details', h.id || h._id)"
            >
              פרטים
              <span class="hcCard__detailsArrow" aria-hidden="true">›</span>
            </button>
          </div>

          <div
            class="hcCard__cats"
            v-if="getCategories(h).length"
            aria-label="תחומי התמחות"
          >
            <div class="hcCard__catsTrack" role="list">
              <span
                v-for="c in getVisibleCategories(h)"
                :key="c"
                class="hcCard__cat"
                role="listitem"
              >
                {{ c }}
              </span>

              <button
                v-if="getMoreCategoriesCount(h) > 0"
                type="button"
                class="hcCard__cat hcCard__catBtn"
                :class="{
                  'hcCard__catBtn--less': isCategoriesExpanded(h),
                  'hcCard__catBtn--more': !isCategoriesExpanded(h),
                }"
                :aria-label="
                  isCategoriesExpanded(h)
                    ? 'הסתר תחומי התמחות נוספים'
                    : `הצג עוד ${getMoreCategoriesCount(h)} תחומי התמחות`
                "
                @click="toggleCategories(h)"
              >
                {{
                  isCategoriesExpanded(h)
                    ? "פחות"
                    : `${getMoreCategoriesCount(h)}+`
                }}
              </button>
            </div>
          </div>

          <div class="hcCard__actions">
            <button
              class="hcBtn hcBtn--primary"
              type="button"
              @click="$emit('personal-request', h.id || h._id)"
            >
              <font-awesome-icon
                :icon="['fas', 'calendar']"
                class="hcBtn__ic"
              />
              הזמן
            </button>

            <button
              class="hcBtn"
              :class="h.isBlocked ? 'hcBtn--muted' : 'hcBtn--block'"
              type="button"
              @click="$emit('block-handyman', h.id || h._id, h.isBlocked)"
            >
              <font-awesome-icon
                :icon="h.isBlocked ? ['fas', 'unlock'] : ['fas', 'ban']"
                class="hcBtn__ic"
              />
              {{ h.isBlocked ? "בטל" : "חסום" }}
            </button>
          </div>
        </article>
      </div>

      <div class="hc__endSpacer" aria-hidden="true"></div>
    </div>

    <div class="hc__dots" v-if="visibleDotIndexes.length > 1">
      <button
        v-for="idx in visibleDotIndexes"
        :key="idx"
        type="button"
        class="hc__dot"
        :class="{ 'hc__dot--on': idx === activePage }"
        :aria-label="`מעבר לעמוד ${idx + 1}`"
        @click="scrollToPage(idx)"
      ></button>
    </div>

    <div class="hc__loading" v-if="loadingNext" aria-live="polite">
      טוען עוד הנדימנים…
    </div>
  </section>
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
  data() {
    return {
      activePage: 0,
      loadingNext: false,
      expandedCategoriesByKey: {},
    };
  },
  computed: {
    safeHandymen() {
      return Array.isArray(this.filteredHandymen) ? this.filteredHandymen : [];
    },
    pages() {
      const out = [];
      for (let i = 0; i < this.safeHandymen.length; i += 3) {
        out.push(this.safeHandymen.slice(i, i + 3));
      }
      return out;
    },
    visibleDotIndexes() {
      const total = this.pages.length;
      if (total <= 1) return [];
      const windowSize = Math.min(5, total);
      const half = Math.floor(windowSize / 2);
      let start = Math.max(0, this.activePage - half);
      let end = start + windowSize - 1;
      if (end >= total) {
        end = total - 1;
        start = Math.max(0, end - (windowSize - 1));
      }
      const out = [];
      for (let i = start; i <= end; i++) out.push(i);
      return out;
    },
  },
  watch: {
    filteredHandymen() {
      this.loadingNext = false;
      this.$nextTick(() => this.syncActivePage());
    },
    "pagination.currentPage"() {
      this.loadingNext = false;
      this.$nextTick(() => {
        this.activePage = 0;
        this.scrollToPage(0);
      });
    },
    "pagination.page"() {
      this.loadingNext = false;
      this.$nextTick(() => {
        this.activePage = 0;
        this.scrollToPage(0);
      });
    },
  },
  mounted() {
    this.syncActivePage();
  },
  beforeUnmount() {
    // no-op
  },
  methods: {
    getHandymanKey(h) {
      return String(h?.id || h?._id || h?.userId || h?.username || "");
    },
    isCategoriesExpanded(h) {
      const k = this.getHandymanKey(h);
      return !!(k && this.expandedCategoriesByKey[k]);
    },
    toggleCategories(h) {
      const k = this.getHandymanKey(h);
      if (!k) return;
      this.expandedCategoriesByKey[k] = !this.expandedCategoriesByKey[k];
    },
    getMoreCategoriesCount(h) {
      const cats = this.getCategories(h);
      return cats.length > 2 ? cats.length - 2 : 0;
    },
    getVisibleCategories(h) {
      const cats = this.getCategories(h);
      if (cats.length <= 2) return cats;
      return this.isCategoriesExpanded(h) ? cats : cats.slice(0, 2);
    },
    onTrackScroll() {
      this.syncActivePage();
    },
    syncActivePage() {
      const el = this.$refs.track;
      if (!el) return;

      const pageEls = el.querySelectorAll?.(".hc__page") || [];
      if (!pageEls.length) {
        this.activePage = 0;
        return;
      }

      const dir = window.getComputedStyle(el).direction;
      const trackRect = el.getBoundingClientRect();

      let bestIndex = 0;
      let bestDist = Infinity;
      pageEls.forEach((p, idx) => {
        const r = p.getBoundingClientRect();
        const anchor = dir === "rtl" ? r.right : r.left;
        const trackAnchor = dir === "rtl" ? trackRect.right : trackRect.left;
        const dist = Math.abs(anchor - trackAnchor);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = idx;
        }
      });

      this.activePage = Math.max(0, Math.min(this.pages.length - 1, bestIndex));
      this.maybeLoadNext();
    },
    scrollToPage(index) {
      const el = this.$refs.track;
      if (!el) return;
      const pageEls = el.querySelectorAll?.(".hc__page") || [];
      const target = pageEls?.[index];
      if (!target) return;
      const dir = window.getComputedStyle(el).direction;
      target.scrollIntoView({
        behavior: "smooth",
        inline: dir === "rtl" ? "end" : "start",
        block: "nearest",
      });
    },
    maybeLoadNext() {
      const hasNext = !!this.pagination?.hasNext;
      if (!hasNext || this.loadingNext) return;
      if (this.pages.length < 1) return;
      if (this.activePage >= this.pages.length - 1) {
        this.loadingNext = true;
        this.$emit("next-page");
      }
    },
    hasRating(h) {
      const r = Number(h?.rating);
      return Number.isFinite(r) && r > 0;
    },
    formatRating(rating) {
      if (rating === null || rating === undefined) return "0.0";
      const numRating = Number(rating);
      if (isNaN(numRating)) return "0.0";
      return numRating % 1 === 0 ? numRating.toFixed(0) : numRating.toFixed(1);
    },
    getRatingCount(h) {
      const c =
        h?.ratingCount ??
        h?.ratingsCount ??
        h?.reviewsCount ??
        h?.reviewCount ??
        h?.ratings?.length ??
        h?.reviews?.length ??
        0;
      const n = Number(c);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    },
    toText(val) {
      if (val === null || val === undefined) return "";
      if (typeof val === "string") return val.trim();
      if (typeof val === "number") return String(val);
      if (Array.isArray(val)) {
        for (const item of val) {
          const t = this.toText(item);
          if (t) return t;
        }
        return "";
      }
      if (typeof val === "object") {
        // try common keys we use across the app/db
        return (
          this.toText(val.city) ||
          this.toText(val.selectedCity) ||
          this.toText(val.cityName) ||
          this.toText(val.town) ||
          this.toText(val.locality) ||
          this.toText(val.settlement) ||
          this.toText(val.place) ||
          this.toText(val.name) ||
          this.toText(val["שם_ישוב"]) ||
          this.toText(val["שם"]) ||
          this.toText(val.hebrewName) ||
          this.toText(val.nameHe) ||
          this.toText(val.englishName) ||
          this.toText(val.nameEn) ||
          this.toText(val.label) ||
          this.toText(val.value) ||
          ""
        );
      }
      return "";
    },
    getCityText(h) {
      // NOTE: some data uses 'adress' (typo) and sometimes nested address objects
      const direct = this.toText(h?.city);
      if (direct) return direct;

      const addressObj = h?.address ?? h?.adress ?? h?.Adress ?? null;
      const fromAddress =
        this.toText(addressObj?.city) ||
        this.toText(addressObj?.selectedCity) ||
        this.toText(addressObj?.cityName) ||
        this.toText(addressObj?.name) ||
        this.toText(addressObj);
      if (fromAddress) return fromAddress;

      const locationText = this.toText(h?.locationText);
      if (locationText) return locationText;

      const location = this.toText(h?.location);
      if (location) return location;

      return "";
    },
    formatCityTravel(h) {
      const city = this.getCityText(h);
      return city || "לא צוין";
    },
    isInSameCity(h) {
      const mins = Number(
        h?.travelTimeMinutes ?? h?.durationMinutes ?? h?.travelMinutes
      );
      return Number.isFinite(mins) && mins === 0;
    },
    hasTravelTime(h) {
      const mins = Number(
        h?.travelTimeMinutes ?? h?.durationMinutes ?? h?.travelMinutes
      );
      return Number.isFinite(mins) && mins > 0;
    },
    formatTravelTime(h) {
      const mins = Number(
        h?.travelTimeMinutes ?? h?.durationMinutes ?? h?.travelMinutes
      );
      if (Number.isFinite(mins) && mins > 0) {
        return `${mins} דק'`;
      }
      return "";
    },
    getCategories(h) {
      const out = [];

      const full = Array.isArray(h?.fullCategories) ? h.fullCategories : [];
      for (const c of full) {
        const s = String(c || "").trim();
        if (s) out.push(s);
      }

      if (!out.length) {
        const specs = Array.isArray(h?.specialties) ? h.specialties : [];
        for (const sp of specs) {
          const name = typeof sp === "string" ? sp : sp?.name;
          const s = String(name || "").trim();
          if (s) out.push(s);
        }
      }

      // de-dup while preserving order
      const seen = new Set();
      return out.filter((x) => {
        if (seen.has(x)) return false;
        seen.add(x);
        return true;
      });
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
$orange: #f97316;
$orange2: #ea580c;

.hc {
  width: 100%;
}

.hc__track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 0 16px;
  direction: rtl;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.hc__track::-webkit-scrollbar {
  display: none;
}

.hc__page {
  flex: 0 0 calc(100% - 32px);
  scroll-snap-align: start;
  display: grid;
  grid-template-rows: repeat(3, auto);
  gap: 12px;
}

.hc__endSpacer {
  flex: 0 0 20px;
}

.hcCard {
  direction: rtl;
  flex: 0 0 auto;
  width: 100%;
  border-radius: 26px;
  padding: 12px;
  background: linear-gradient(
    165deg,
    rgba(25, 25, 45, 0.7),
    rgba(10, 10, 10, 0.98)
  );
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 10px;
  color: rgba(255, 255, 255, 0.92);
}

.hcCard::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 26px;
  pointer-events: none;
  background: radial-gradient(
    520px 220px at 90% 0%,
    rgba(249, 115, 22, 0.12),
    transparent 60%
  );
}

.hcCard--blocked {
  opacity: 0.78;
}

.hcCard__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.hcCard__who {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.hcCard__avatar {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  position: relative;
  flex: 0 0 auto;
}

.hcCard__ring {
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  border: 2px solid rgba(249, 115, 22, 0.35);
  pointer-events: none;
}

.hcCard__avatarBtn {
  position: absolute;
  bottom: -4px;
  left: -4px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(3, 3, 3, 0.8);
  background: rgba(249, 115, 22, 0.95);
  color: #0b0b0f;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
  cursor: pointer;

  &:active {
    transform: scale(0.92);
  }
}

.hcCard__img {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}

.hcCard__info {
  min-width: 0;
}

.hcCard__nameRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hcCard__vip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 10px;
  background: linear-gradient(135deg, #facc15, $orange);
  color: #0b0b0f;
  font-weight: 1100;
  font-size: 12px;
  line-height: 1;
}

.hcCard__name {
  margin: 0;
  font-weight: 1100;
  font-size: 20px;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hcCard__spacer {
  width: 1px;
}

.hcCard__detailsBtn {
  align-self: flex-start;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 1000;
  font-size: 12px;
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }
}

.hcCard__detailsArrow {
  color: rgba(249, 115, 22, 0.95);
  font-size: 16px;
  line-height: 1;
  margin-top: -1px;
}

.hcCard__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  color: rgba(161, 161, 170, 0.95);
}

.hcCard__cats {
  margin-top: -4px;
  max-width: 100%;
  overflow: hidden;
}

.hcCard__catsTrack {
  display: flex;
  direction: rtl;
  flex-wrap: wrap;
  gap: 8px;
  row-gap: 8px;
  max-width: 100%;
  width: 100%;
  padding: 4px 2px 0;
  overflow: hidden;
}

.hcCard__cat {
  flex: 0 0 auto;
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hcCard__catBtn {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  line-height: 1;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.hcCard__catBtn--less {
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.25);
  color: rgba(249, 115, 22, 0.95);
}

.hcCard__catBtn--more {
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.25);
  color: rgba(249, 115, 22, 0.95);
}

.hc__loading {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  color: rgba(249, 115, 22, 0.95);
}

.hcCard__metaIc {
  font-size: 12px;
  opacity: 0.9;
}

.hcCard__metaTxt {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hcCard__travel {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  color: rgba(249, 115, 22, 0.9);
}

.hcCard__travelIc {
  font-size: 11px;
  opacity: 0.9;
}

.hcCard__travelTxt {
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hcCard__rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-weight: 1000;
}

.hcCard__rating--empty {
  color: rgba(161, 161, 170, 0.9);
  font-weight: 800;
}

.hcCard__ratingNum {
  color: rgba(255, 255, 255, 0.95);
}

.hcCard__star {
  color: rgba(249, 115, 22, 0.95);
}

.hcCard__ratingCount {
  color: rgba(113, 113, 122, 0.95);
  font-weight: 800;
  font-size: 12px;
}

.hcCard__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  width: fit-content;
}

.hcCard__pillIc {
  color: $orange;
  font-size: 14px;
}

.hcCard__pillTxt {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.4px;
}

.hcCard__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: end;
}

.hcBtn {
  border-radius: 14px;
  padding: 14px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 1100;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 120ms ease;

  &:active {
    transform: scale(0.98);
  }
}

.hcBtn__ic {
  font-size: 15px;
}

.hcBtn--primary {
  background: linear-gradient(135deg, #fb923c, $orange2);
  border: none;
  color: #0b0b0f;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);
}

.hcBtn--block {
  background: rgba(255, 50, 50, 0.03);
  border: 1px solid rgba(255, 50, 50, 0.2);
  color: rgba(255, 160, 160, 0.92);
}

.hcBtn--muted {
  opacity: 0.85;
}

.hc__dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 0 0;
}

.hc__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  transition: width 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.hc__dot--on {
  width: 26px;
  background: rgba(34, 197, 94, 0.92);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.45);
}

@media (max-width: 420px) {
  .hcCard {
    width: 78vw;
    padding: 14px;
  }
  .hcCard__name {
    font-size: 18px;
  }
  .hcBtn {
    padding: 12px 10px;
    font-size: 12px;
  }
}
</style>

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
