<template>
  <div class="client-dashboard-new" dir="rtl">
    <!-- Recommended Handymen Section -->
    <div class="client-dashboard-new__section">
      <div class="client-dashboard-new__section-header">
        <h2 class="client-dashboard-new__section-title">
          <span class="client-dashboard-new__title-accent"></span>
          מומלצים עבורך
        </h2>
        <button
          type="button"
          class="client-dashboard-new__filter-btn"
          aria-label="סינון"
        >
          סינון
          <i class="ph ph-sliders-horizontal"></i>
        </button>
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
                <div class="client-dashboard-new__avatar-wrapper">
                  <div
                    class="client-dashboard-new__avatar-border"
                    :class="{
                      'client-dashboard-new__avatar-border--pro': index === 0,
                      'client-dashboard-new__avatar-border--hover': index > 0
                    }"
                  >
                    <img
                      :src="getHandymanImage(handyman)"
                      :alt="handyman.username"
                      class="client-dashboard-new__avatar-img"
                      :class="{
                        'client-dashboard-new__avatar-img--grayscale': index === 2,
                        'client-dashboard-new__avatar-img--sepia': index === 3
                      }"
                      @error="onHandymanImageError"
                    />
                  </div>
                  <div class="client-dashboard-new__rating-badge">
                    <span class="client-dashboard-new__rating-value">{{
                      formatHandymanRating(handyman)
                    }}</span>
                    <i class="ph-fill ph-star client-dashboard-new__rating-star"></i>
                  </div>
                </div>
                <div class="client-dashboard-new__card-info">
                  <h3 class="client-dashboard-new__card-name">
                    {{ handyman.username }}
                  </h3>
                  <div class="client-dashboard-new__card-location">
                    <i class="ph-fill ph-map-pin"></i>
                    <span>{{ getCityText(handyman) }}</span>
                    <span class="client-dashboard-new__location-separator">•</span>
                    <span>{{ formatDistance(handyman) }}</span>
                  </div>
                  <div class="client-dashboard-new__card-status">
                    <div class="client-dashboard-new__status-dot"></div>
                    <span class="client-dashboard-new__status-text">
                      {{ getStatusText(handyman) }}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  class="client-dashboard-new__details-btn"
                  @click="$emit('view-details', handyman.id || handyman._id)"
                >
                  פרטים
                  <i class="ph-bold ph-caret-left"></i>
                </button>
              </div>
              <div
                v-if="getCategories(handyman).length"
                class="client-dashboard-new__card-categories"
              >
                <span
                  v-for="category in getVisibleCategories(handyman, 2)"
                  :key="category"
                  class="client-dashboard-new__category-tag"
                >
                  {{ category }}
                </span>
              </div>
            </div>
            <div class="client-dashboard-new__card-actions">
              <button
                type="button"
                class="client-dashboard-new__action-btn client-dashboard-new__action-btn--primary"
                @click="$emit('personal-request', handyman.id || handyman._id)"
              >
                שלח קריאה
                <i class="ph-fill ph-paper-plane-left"></i>
              </button>
              <button
                type="button"
                class="client-dashboard-new__action-btn client-dashboard-new__action-btn--block"
                @click="$emit('block-handyman', handyman.id || handyman._id, handyman.isBlocked)"
              >
                <i class="ph-bold ph-prohibit"></i>
                חסום
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

    <!-- Recent Activity Section -->
    <div class="client-dashboard-new__section">
      <h2 class="client-dashboard-new__section-title-small">
        <span class="client-dashboard-new__title-accent-small"></span>
        פעילות אחרונה
      </h2>
      <div class="client-dashboard-new__activity-list">
        <div
          v-for="job in recentJobs"
          :key="job.id || job._id"
          class="client-dashboard-new__activity-item"
          :class="getActivityItemClass(job)"
          @click="$emit('view-job', job.id || job._id)"
        >
          <div class="client-dashboard-new__activity-status">
            <span class="client-dashboard-new__activity-status-text">{{
              getJobStatusText(job)
            }}</span>
            <i :class="getJobStatusIcon(job)"></i>
          </div>
          <div class="client-dashboard-new__activity-content">
            <h4 class="client-dashboard-new__activity-title">
              {{ getJobTitle(job) }}
            </h4>
            <p class="client-dashboard-new__activity-time">
              {{ formatJobTime(job) }}
            </p>
          </div>
          <div class="client-dashboard-new__activity-icon">
            <i :class="getJobIcon(job)"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HandymenList",
  props: {
    filteredHandymen: { type: Array, required: true },
    recentJobs: { type: Array, default: () => [] },
  },
  emits: ["view-details", "personal-request", "block-handyman", "view-job"],
  data() {
    return {
      _currentCarouselPage: 0,
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
    getActivityItemClass(job) {
      if (job.status === "done") return "client-dashboard-new__activity-item--success";
      if (job.status === "in_progress" || job.status === "assigned") return "client-dashboard-new__activity-item--primary";
      return "";
    },
    getJobStatusText(job) {
      if (job.status === "done") return "הושלם";
      if (job.status === "in_progress" || job.status === "assigned") return "בביצוע";
      return "פתוח";
    },
    getJobStatusIcon(job) {
      if (job.status === "done") return "ph-fill ph-check-circle";
      if (job.status === "in_progress" || job.status === "assigned") return "ph-fill ph-spinner";
      return "ph-fill ph-clock";
    },
    getJobTitle(job) {
      if (job.subcategoryInfo && job.subcategoryInfo.length > 0) {
        return job.subcategoryInfo.map(s => s.subcategory || s.category).join(", ");
      }
      return job.desc || "עבודה";
    },
    formatJobTime(job) {
      if (!job.createdAt && !job.updatedAt) return "";
      const date = job.updatedAt || job.createdAt;
      const jobDate = new Date(date);
      const now = new Date();
      const diffMs = now - jobDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const hours = jobDate.getHours();
      const minutes = String(jobDate.getMinutes()).padStart(2, '0');
      
      if (diffDays === 0) {
        return `היום • ${hours}:${minutes}`;
      } else if (diffDays === 1) {
        return `אתמול • ${hours}:${minutes}`;
      } else if (diffDays < 7) {
        return `לפני ${diffDays} ימים • ${hours}:${minutes}`;
      }
      return jobDate.toLocaleDateString('he-IL');
    },
    getJobIcon(job) {
      // Return icon based on job category
      if (job.subcategoryInfo && job.subcategoryInfo.length > 0) {
        const category = job.subcategoryInfo[0].category || job.subcategoryInfo[0].subcategory || "";
        if (category.includes("נזילה") || category.includes("אינסטלציה")) return "ph-fill ph-drop";
        if (category.includes("חשמל") || category.includes("תאורה")) return "ph-fill ph-lamp";
        if (category.includes("צבע")) return "ph-fill ph-paint-brush";
      }
      return "ph-fill ph-wrench";
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
  font-weight: 900;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  direction: rtl;
}

.client-dashboard-new__title-accent {
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #FF5F00 0%, #FF8F00 100%);
  border-radius: 2px;
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
  flex: 0 0 calc(100% - 24px);
  min-width: calc(100% - 24px);
  max-width: calc(100% - 24px);
  scroll-snap-align: start;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 20px;
  transition: all 0.3s;
  direction: rtl;
  text-align: right;
  box-sizing: border-box;
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
  align-items: flex-start;
  gap: 12px;
}

.client-dashboard-new__avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.client-dashboard-new__avatar-border {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 3px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.client-dashboard-new__avatar-border--pro {
  background: linear-gradient(135deg, #FF5F00 0%, #FF8F00 100%);
  box-shadow: 0 0 20px rgba(255, 95, 0, 0.4);
}

.client-dashboard-new__avatar-border--hover:hover {
  background: rgba(255, 95, 0, 0.2);
}

.client-dashboard-new__avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #09090B;
}

.client-dashboard-new__avatar-img--grayscale {
  filter: grayscale(100%);
  opacity: 0.7;
}

.client-dashboard-new__avatar-img--sepia {
  filter: sepia(100%);
  opacity: 0.8;
}

.client-dashboard-new__rating-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px 8px;
  z-index: 2;
}

.client-dashboard-new__rating-value {
  font-size: 11px;
  font-weight: 900;
  color: #FFD700;
}

.client-dashboard-new__rating-star {
  font-size: 12px;
  color: #FFD700;
}

.client-dashboard-new__card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.client-dashboard-new__card-name {
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}

.client-dashboard-new__card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.client-dashboard-new__card-location i {
  font-size: 14px;
  color: rgba(255, 95, 0, 0.6);
}

.client-dashboard-new__location-separator {
  margin: 0 4px;
  color: rgba(255, 255, 255, 0.3);
}

.client-dashboard-new__card-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.client-dashboard-new__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00E055;
  box-shadow: 0 0 8px rgba(0, 224, 85, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.client-dashboard-new__status-text {
  font-size: 11px;
  font-weight: 700;
  color: #00E055;
}

.client-dashboard-new__details-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.client-dashboard-new__details-btn:hover {
  background: rgba(255, 95, 0, 0.1);
  border-color: rgba(255, 95, 0, 0.3);
  color: #FF5F00;
}

.client-dashboard-new__details-btn i {
  font-size: 14px;
}

.client-dashboard-new__card-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.client-dashboard-new__category-tag {
  padding: 4px 10px;
  background: rgba(255, 95, 0, 0.1);
  border: 1px solid rgba(255, 95, 0, 0.2);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #FF5F00;
}

.client-dashboard-new__card-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.client-dashboard-new__action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.client-dashboard-new__action-btn--block {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.client-dashboard-new__action-btn--block:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.client-dashboard-new__action-btn--primary {
  flex: 2;
  background: linear-gradient(135deg, #FF5F00 0%, #FF8F00 100%);
  color: #000;
  box-shadow: 0 4px 12px rgba(255, 95, 0, 0.3);
}

.client-dashboard-new__action-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 95, 0, 0.4);
}

.client-dashboard-new__action-btn i {
  font-size: 16px;
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

/* Recent Activity */
.client-dashboard-new__activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  direction: rtl;
  align-items: stretch;
  width: 100%;
}

.client-dashboard-new__activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s;
  cursor: pointer;
  direction: rtl;
  text-align: right;
}

.client-dashboard-new__activity-item:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.client-dashboard-new__activity-item--active {
  border-color: rgba(255, 95, 0, 0.3);
  background: rgba(255, 95, 0, 0.05);
}

.client-dashboard-new__activity-item--success {
  border-color: rgba(0, 224, 85, 0.3);
  background: rgba(0, 224, 85, 0.05);
}

.client-dashboard-new__activity-item--primary {
  border-color: rgba(255, 95, 0, 0.3);
  background: rgba(255, 95, 0, 0.05);
}

.client-dashboard-new__activity-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-shrink: 0;
}

.client-dashboard-new__activity-status-text {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
}

.client-dashboard-new__activity-status i {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.client-dashboard-new__activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
  direction: rtl;
}

.client-dashboard-new__activity-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.client-dashboard-new__activity-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.client-dashboard-new__activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 95, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF5F00;
  font-size: 20px;
  flex-shrink: 0;
}
</style>
