<template>
  <div class="client-dashboard-new" dir="rtl">
    <!-- Recommended Handymen Section -->
    <div class="client-dashboard-new__section">
      <div class="client-dashboard-new__section-header">
        <h2 class="client-dashboard-new__section-title">
          מומלצים עבורך
        </h2>
        <a
          href="#"
          class="client-dashboard-new__view-all"
        >
          הצג הכל
        </a>
      </div>

      <!-- Handymen Carousel -->
      <div
        ref="handymanCarousel"
        class="client-dashboard-new__carousel"
        @scroll="onCarouselScroll"
      >
        <div
          v-for="(handyman, index) in filteredHandymen"
          :key="handyman.id || handyman._id"
          class="client-dashboard-new__card"
          :class="{ 'client-dashboard-new__card--blocked': handyman.isBlocked }"
        >
          <div class="client-dashboard-new__card-content">
            <div class="client-dashboard-new__card-top">
              <div class="client-dashboard-new__card-header">
                <div class="client-dashboard-new__header-main">
                  <div class="client-dashboard-new__avatar-wrapper">
                    <img
                      :src="getHandymanImage(handyman)"
                      :alt="handyman.username"
                      class="client-dashboard-new__avatar-img"
                      @error="onHandymanImageError"
                    />
                  </div>
                  <div class="client-dashboard-new__card-info">
                    <h3 class="client-dashboard-new__card-name">
                      {{ handyman.username }}
                    </h3>
                    <div class="client-dashboard-new__card-location">
                      <span class="material-icons-round client-dashboard-new__meta-ic">schedule</span>
                      <span>{{ formatTravelTime(handyman) }}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="client-dashboard-new__details-btn"
                  @click="$emit('view-details', handyman.id || handyman._id)"
                  aria-label="פרטים"
                >
                  <span>פרטים</span>
                  <span class="material-icons-round client-dashboard-new__details-ic">chevron_left</span>
                </button>
              </div>
              <div class="client-dashboard-new__card-status-row">
                <span
                  v-if="getStatusText(handyman) === 'זמין עכשיו'"
                  class="client-dashboard-new__status-badge"
                >
                  <span class="client-dashboard-new__status-dot"></span>
                  זמין עכשיו
                </span>
                <span
                  v-for="category in getDisplayCategories(handyman)"
                  :key="category"
                  class="client-dashboard-new__category-tag"
                >
                  {{ category }}
                </span>
                <button
                  v-if="getRemainingCategoriesCount(handyman) > 0 && !isCategoriesExpanded(handyman)"
                  type="button"
                  class="client-dashboard-new__more-tag"
                  @click.stop="toggleCategories(handyman)"
                >
                  +{{ getRemainingCategoriesCount(handyman) }}
                </button>
                <button
                  v-if="isCategoriesExpanded(handyman) && getAllCategories(handyman).length > 2"
                  type="button"
                  class="client-dashboard-new__more-tag client-dashboard-new__more-tag--collapse"
                  @click.stop="toggleCategories(handyman)"
                >
                  פחות
                </button>
              </div>
            </div>

            <div class="client-dashboard-new__card-footer">
              <div class="client-dashboard-new__rating" aria-label="דירוג">
                <span class="client-dashboard-new__rating-stars" aria-hidden="true">
                  <span
                    v-for="n in 5"
                    :key="n"
                    class="material-icons-round client-dashboard-new__star"
                    :class="{ 'client-dashboard-new__star--on': n <= getRatingStars(handyman) }"
                  >star</span>
                </span>
                <span class="client-dashboard-new__rating-number">{{
                  formatHandymanRating(handyman)
                }}</span>
              </div>
            </div>

            <div class="client-dashboard-new__card-actions">
              <button
                type="button"
                class="client-dashboard-new__action-btn client-dashboard-new__action-btn--block"
                @click="$emit('block-handyman', handyman.id || handyman._id, handyman.isBlocked)"
              >
                חסום
              </button>
              <button
                type="button"
                class="client-dashboard-new__action-btn client-dashboard-new__action-btn--primary"
                @click="$emit('personal-request', handyman.id || handyman._id)"
              >
                שלח קריאה
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Carousel Pagination Dots -->
      <div class="client-dashboard-new__pagination">
        <div
          v-for="(dot, index) in carouselPages"
          :key="index"
          class="client-dashboard-new__pagination-dot"
          :class="{ 'client-dashboard-new__pagination-dot--active': index === currentCarouselPage }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HandymenList",
  props: {
    filteredHandymen: { type: Array, required: true },
  },
  emits: ["view-details", "personal-request", "block-handyman"],
  data() {
    return {
      _currentCarouselPage: 0,
      expandedCategories: {},
    };
  },
  computed: {
    carouselPages() {
      const total = this.filteredHandymen?.length || 0;
      const itemsPerPage = 1;
      return Math.ceil(total / itemsPerPage);
    },
    currentCarouselPage: {
      get() {
        return this._currentCarouselPage || 0;
      },
      set(value) {
        this._currentCarouselPage = value;
      },
    },
  },
  methods: {
    getHandymanKey(handyman) {
      return (handyman && (handyman.id || handyman._id)) || "";
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
    onHandymanImageError(event) {
      event.target.src = "/img/Hendima-logo.png";
    },
    getCityText(handyman) {
      // Check direct city field
      if (handyman?.city) {
        const city = String(handyman.city).trim();
        if (city) return city;
      }
      
      // Check address object (can be string or object)
      const addressObj = handyman?.address ?? handyman?.adress ?? handyman?.Adress ?? null;
      if (addressObj) {
        // If address is a string, use it directly
        if (typeof addressObj === 'string') {
          const addr = addressObj.trim();
          if (addr) return addr;
        }
        // If address is an object, check various city fields
        if (typeof addressObj === 'object') {
          const city = addressObj?.city || 
                      addressObj?.selectedCity || 
                      addressObj?.cityName || 
                      addressObj?.name;
          if (city) {
            const cityStr = String(city).trim();
            if (cityStr) return cityStr;
          }
        }
      }
      
      // Check locationText
      if (handyman?.locationText) {
        const loc = String(handyman.locationText).trim();
        if (loc) return loc;
      }
      
      // Check location as string
      if (handyman?.location && typeof handyman.location === 'string') {
        const loc = handyman.location.trim();
        if (loc) return loc;
      }
      
      // Try to get from location.formatted_address if available
      if (handyman?.location?.formatted_address) {
        const addr = handyman.location.formatted_address;
        const parts = addr.split(',');
        if (parts.length > 0) {
          const city = parts[0].trim();
          if (city) return city;
        }
      }
      
      return "מיקום לא זמין";
    },
    formatHandymanRating(handyman) {
      const rating = Number(handyman?.rating);
      if (!Number.isFinite(rating) || rating <= 0) return "0.0";
      return rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);
    },
    getRatingStars(handyman) {
      const rating = Number(handyman?.rating);
      if (!Number.isFinite(rating) || rating <= 0) return 0;
      // Show 0..5 full stars; rounding to nearest looks best for UI
      return Math.max(0, Math.min(5, Math.round(rating)));
    },
    formatTravelTime(handyman) {
      // Show travel time from MapBox if available
      if (handyman?.travelTimeMinutes !== null && handyman?.travelTimeMinutes !== undefined) {
        const time = Number(handyman.travelTimeMinutes);
        if (Number.isFinite(time) && time >= 0) {
          if (time === 0) return "באותו מקום";
          if (time < 60) return `${time} דק' נסיעה`;
          const hours = Math.floor(time / 60);
          const minutes = time % 60;
          if (minutes === 0) return `${hours} ש' נסיעה`;
          return `${hours} ש' ${minutes} דק' נסיעה`;
        }
      }
      // Fallback to distance if travel time not available
      if (handyman?.distance) {
        const dist = Number(handyman.distance);
        if (Number.isFinite(dist) && dist > 0) {
          if (dist < 1) return `${Math.round(dist * 1000)} מ' נסיעה`;
          return `${dist.toFixed(1)} ק"מ נסיעה`;
        }
      }
      return "זמן נסיעה לא זמין";
    },
    formatDistance(handyman) {
      // Show travel time from MapBox if available
      if (handyman?.travelTimeMinutes !== null && handyman?.travelTimeMinutes !== undefined) {
        const time = Number(handyman.travelTimeMinutes);
        if (Number.isFinite(time) && time >= 0) {
          if (time === 0) return "באותו מקום";
          if (time < 60) return `${time} דק'`;
          const hours = Math.floor(time / 60);
          const minutes = time % 60;
          if (minutes === 0) return `${hours} ש'`;
          return `${hours} ש' ${minutes} דק'`;
        }
      }
      // Fallback to distance if travel time not available
      if (handyman?.distance) {
        const dist = Number(handyman.distance);
        if (Number.isFinite(dist) && dist > 0) {
          if (dist < 1) return `${Math.round(dist * 1000)} מ'`;
          return `${dist.toFixed(1)} ק"מ`;
        }
      }
      return "מרחק לא זמין";
    },
    getStatusText(handyman) {
      // Check if handyman is available
      if (handyman?.isAvailable !== false) {
        return "זמין עכשיו";
      }
      return "לא זמין";
    },
    getCategories(handyman) {
      const out = [];
      const full = Array.isArray(handyman?.fullCategories) ? handyman.fullCategories : [];
      for (const c of full) {
        const s = String(c || "").trim();
        if (s) out.push(s);
      }
      if (!out.length) {
        const specs = Array.isArray(handyman?.specialties) ? handyman.specialties : [];
        for (const sp of specs) {
          const name = typeof sp === "string" ? sp : sp?.name;
          const s = String(name || "").trim();
          if (s) out.push(s);
        }
      }
      const seen = new Set();
      return out.filter((x) => {
        if (seen.has(x)) return false;
        seen.add(x);
        return true;
      });
    },
    getVisibleCategories(handyman, max = 2) {
      const cats = this.getCategories(handyman);
      return cats.slice(0, max);
    },
    getAllCategories(handyman) {
      return this.getCategories(handyman);
    },
    isCategoriesExpanded(handyman) {
      const key = this.getHandymanKey(handyman);
      return !!this.expandedCategories[key];
    },
    toggleCategories(handyman) {
      const key = this.getHandymanKey(handyman);
      if (!key) return;
      const next = !this.expandedCategories[key];
      // Vue 2 reactivity-safe
      if (typeof this.$set === "function") this.$set(this.expandedCategories, key, next);
      else this.expandedCategories[key] = next;
    },
    getDisplayCategories(handyman) {
      const all = this.getAllCategories(handyman);
      if (this.isCategoriesExpanded(handyman)) return all;
      return all.slice(0, 2);
    },
    getRemainingCategoriesCount(handyman) {
      const all = this.getAllCategories(handyman);
      const remaining = all.length - 2;
      return remaining > 0 ? remaining : 0;
    },
    onCarouselScroll() {
      // Update current carousel page based on scroll position
      const carousel = this.$refs.handymanCarousel;
      if (!carousel) return;
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.querySelector('.client-dashboard-new__card')?.offsetWidth || 0;
      if (cardWidth > 0) {
        this.currentCarouselPage = Math.round(scrollLeft / cardWidth);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
/* Client Dashboard New */
.client-dashboard-new {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  padding-top: 0;
  padding-bottom: 100px;
  direction: rtl;
  text-align: right;
}

.client-dashboard-new__section {
  margin-bottom: 32px;
  padding: 0 20px;
  direction: rtl;
  text-align: right;
  width: 100%;
  box-sizing: border-box;
}

.client-dashboard-new__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  width: 100%;
  direction: rtl;
}

.client-dashboard-new__section-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  margin: 0;
  direction: rtl;
  border-right: 4px solid #ff6a00;
  padding-right: 12px;
}

.client-dashboard-new__view-all {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  transition: color 0.2s;
  
  &:hover {
    color: #ff6a00;
  }
}

.client-dashboard-new__section-title-small {
  font-size: 16px;
  font-weight: 900;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  direction: rtl;
}

.client-dashboard-new__title-accent-small {
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, #FF5F00 0%, #FF8F00 100%);
  border-radius: 2px;
}

.client-dashboard-new__filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.client-dashboard-new__filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 95, 0, 0.3);
  color: #FF5F00;
}

.client-dashboard-new__filter-btn i {
  font-size: 14px;
}

/* Handymen Carousel */
.client-dashboard-new__carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 8px 0;
  direction: rtl;
  text-align: right;
  width: calc(100% + 40px);
  margin-right: -20px;
  margin-left: -20px;
  padding-right: 20px;
  padding-left: 20px;
}

.client-dashboard-new__carousel::-webkit-scrollbar {
  display: none;
}

.client-dashboard-new__card {
  flex: 0 0 288px;
  min-width: 288px;
  max-width: 288px;
  scroll-snap-align: start;
  background: rgba(21, 21, 23, 1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;
  padding: 16px;
  transition: all 0.3s;
  direction: rtl;
  text-align: right;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.client-dashboard-new__card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, #ff6a00, rgba(255, 106, 0, 0.3));
}

.client-dashboard-new__card--blocked {
  opacity: 0.5;
  filter: grayscale(100%);
}

.client-dashboard-new__card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.client-dashboard-new__card-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.client-dashboard-new__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.client-dashboard-new__header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.client-dashboard-new__avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.client-dashboard-new__avatar-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 106, 0, 0.5);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
}

.client-dashboard-new__meta-ic {
  font-size: 16px;
  opacity: 0.7;
  color: rgba(255, 255, 255, 0.75);
}

.client-dashboard-new__details-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(35, 35, 37, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
}

.client-dashboard-new__details-btn:hover {
  background: rgba(55, 55, 57, 1);
  border-color: rgba(255, 106, 0, 0.25);
  color: #fff;
}

.client-dashboard-new__details-ic {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
}

.client-dashboard-new__card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.client-dashboard-new__card-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-dashboard-new__card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.client-dashboard-new__card-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.client-dashboard-new__status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: 4px 8px;
  border-radius: 0.375rem;
}

.client-dashboard-new__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}

.client-dashboard-new__category-tag {
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  padding: 4px 8px;
  border-radius: 0.375rem;
}

.client-dashboard-new__more-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.client-dashboard-new__more-tag:hover {
  background: rgba(35, 35, 37, 1);
  border-color: rgba(255, 106, 0, 0.25);
  color: #fff;
}

.client-dashboard-new__more-tag--collapse {
  color: rgba(255, 255, 255, 0.6);
}

.client-dashboard-new__card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* bottom-right in RTL */
  margin-top: -4px;
}

.client-dashboard-new__rating {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.client-dashboard-new__rating-stars {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.client-dashboard-new__star {
  font-size: 18px;
  color: rgba(250, 204, 21, 0.25);
}

.client-dashboard-new__star--on {
  color: #facc15;
  text-shadow: 0 0 10px rgba(250, 204, 21, 0.25);
}

.client-dashboard-new__rating-number {
  font-size: 13px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
}

.client-dashboard-new__card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

.client-dashboard-new__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 0.75rem;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.client-dashboard-new__action-btn--block {
  flex: 1;
  background: rgba(35, 35, 37, 1);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
}

.client-dashboard-new__action-btn--block:hover {
  background: rgba(55, 55, 57, 1);
  color: #fff;
}

.client-dashboard-new__action-btn--primary {
  flex: 2;
  background: #ff6a00;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 106, 0, 0.3);
}

.client-dashboard-new__action-btn--primary:hover {
  background: #cc5500;
}

/* Carousel Pagination */
.client-dashboard-new__pagination {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  direction: rtl;
}

.client-dashboard-new__pagination-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
  cursor: pointer;
}

.client-dashboard-new__pagination-dot--active {
  width: 24px;
  border-radius: 4px;
  background: #FF5F00;
  box-shadow: 0 0 8px rgba(255, 95, 0, 0.6);
}

</style>
