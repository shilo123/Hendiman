<template>
  <Transition name="bottom-sheet">
    <div
      v-if="jobDetails"
      class="job-bottom-sheet-overlay"
      @click.self="onClose"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div
        class="job-bottom-sheet"
        :class="{ 'job-bottom-sheet--expanded': isExpanded }"
        :style="{ transform: `translateY(${sheetOffset}px)` }"
      >
        <!-- Drag Handle -->
        <div class="job-bottom-sheet__handle" @mousedown="handleDragStart">
          <div class="job-bottom-sheet__handle-bar"></div>
        </div>

        <!-- Step Indicator -->
        <div class="job-bottom-sheet__header">
          <div class="job-bottom-sheet__step-indicator">
            <div
              v-for="(step, index) in statusSteps"
              :key="index"
              class="step-indicator-item"
              :class="{
                'step-indicator-item--active': step.isActive,
                'step-indicator-item--completed': step.isCompleted,
              }"
            >
              <div class="step-indicator-dot"></div>
              <div
                v-if="index < statusSteps.length - 1"
                class="step-indicator-line"
                :class="{ 'step-indicator-line--active': step.isCompleted }"
              ></div>
            </div>
          </div>
          <p class="job-bottom-sheet__status-text">{{ getStatusText() }}</p>
        </div>

        <!-- Scrollable Content -->
        <div class="job-bottom-sheet__content" ref="sheetContent">
          <!-- Image Section -->
          <div class="job-image-section">
            <div
              class="job-image-container"
              :style="getImageStyle()"
            >
              <div class="job-image-overlay"></div>
              
              <!-- Urgent Badge -->
              <div v-if="jobDetails.urgent || jobDetails.isUrgent" class="job-urgent-badge">
                <span class="material-symbols-outlined">priority_high</span>
                דחוף
              </div>

              <!-- Multiple Images Thumbnails -->
              <div v-if="Array.isArray(jobDetails.imageUrl) && jobDetails.imageUrl.length > 1" class="job-images-thumbnails">
                <div
                  v-for="(imgUrl, index) in jobDetails.imageUrl.slice(0, 3)"
                  :key="index"
                  class="job-thumbnail"
                  :style="{ backgroundImage: `url(${imgUrl || '/img/Hendima-logo.png'})` }"
                >
                  <div v-if="index === 2 && jobDetails.imageUrl.length > 3" class="job-thumbnail-overlay">
                    <span>+{{ jobDetails.imageUrl.length - 3 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Title and Price Section -->
          <div class="job-title-section">
            <h1 class="job-title">{{ getJobDisplayName() }}</h1>
            <div class="job-price-badge">
              <span class="job-price-amount">₪{{ getDisplayPrice() }}</span>
            </div>
            <div class="job-tags-row">
              <span
                v-if="getBillingType()"
                class="job-tag"
              >
                {{ getBillingType() }}
              </span>
              <span
                v-if="jobDetails.workType"
                class="job-tag"
              >
                {{ jobDetails.workType }}
              </span>
            </div>
          </div>

          <!-- Details Cards -->
          <div class="job-details-section">
            <!-- Client Card (only for handyman) -->
            <div v-if="isHendiman" class="job-detail-card job-detail-card--client">
              <div class="job-detail-card__content">
                <div class="job-detail-card__left">
                  <div
                    class="job-detail-card__avatar"
                    :style="getClientAvatarStyle()"
                  ></div>
                  <div class="job-detail-card__info">
                    <span class="job-detail-card__label">לקוח</span>
                    <span class="job-detail-card__value">{{
                      jobDetails.clientName || "ללא שם"
                    }}</span>
                  </div>
                </div>
                <div v-if="getClientRating()" class="job-detail-card__rating">
                  <span class="material-symbols-outlined">star</span>
                  <span>{{ getClientRating() }}</span>
                </div>
              </div>
            </div>

            <!-- Location Card -->
            <div class="job-detail-card">
              <div class="job-detail-card__icon">
                <span class="material-symbols-outlined">location_on</span>
              </div>
              <div class="job-detail-card__content job-detail-card__content--location">
                <div class="job-detail-card__info">
                  <span class="job-detail-card__label">כתובת</span>
                  <span class="job-detail-card__value">{{
                    jobDetails.locationText || "לא צוין"
                  }}</span>
                  <a
                    v-if="isHendiman && jobCoordinates"
                    href="#"
                    class="job-detail-card__link"
                    @click.prevent="openLocation"
                  >
                    לחץ למפה
                  </a>
                </div>
                <div
                  v-if="isHendiman && jobCoordinates"
                  class="job-detail-card__map-preview"
                  :style="getMapPreviewStyle()"
                >
                  <span class="material-symbols-outlined">location_on</span>
                </div>
              </div>
            </div>

            <!-- Category Card -->
            <div class="job-detail-card">
              <div class="job-detail-card__icon">
                <span class="material-symbols-outlined">category</span>
              </div>
              <div class="job-detail-card__info">
                <span class="job-detail-card__label">קטגוריה</span>
                <span class="job-detail-card__value">{{
                  getCategoryName() || "ללא קטגוריה"
                }}</span>
              </div>
            </div>

            <!-- Created Date Card -->
            <div v-if="jobDetails.createdAt" class="job-detail-card">
              <div class="job-detail-card__icon">
                <span class="material-symbols-outlined">calendar_today</span>
              </div>
              <div class="job-detail-card__info">
                <span class="job-detail-card__label">תאריך יצירה</span>
                <span class="job-detail-card__value">{{
                  formatDateShort(jobDetails.createdAt)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="jobDetails.desc" class="job-description-section">
            <h3 class="job-description-title">תיאור</h3>
            <p class="job-description-text">{{ jobDetails.desc }}</p>
          </div>

          <!-- Rating Section (for client, when job is done) -->
          <div
            v-if="!isHendiman && jobDetails.status === 'done' && rating"
            class="job-rating-section"
          >
            <h3 class="job-description-title">דירוג:</h3>
            <div class="job-rating-display">
              <div class="job-rating-stars">
                <template v-for="i in 5" :key="i">
                  <font-awesome-icon
                    v-if="i <= fullStars"
                    :icon="['fas', 'star']"
                    class="job-rating-star job-rating-star--full"
                  />
                  <font-awesome-icon
                    v-else-if="i === fullStars + 1 && hasHalfStar"
                    :icon="['fas', 'star-half-stroke']"
                    class="job-rating-star job-rating-star--half"
                  />
                  <font-awesome-icon
                    v-else
                    :icon="['fas', 'star']"
                    class="job-rating-star job-rating-star--empty"
                  />
                </template>
              </div>
              <span class="job-rating-number">{{ rating.rating }}/5</span>
            </div>
            <div v-if="rating.review" class="job-rating-review">
              <p class="job-rating-review-text">{{ rating.review }}</p>
            </div>
            <div v-else class="job-rating-review job-rating-review--empty">
              <p class="job-rating-review-text">לא ניתנה ביקורת</p>
            </div>
          </div>
        </div>

        <!-- Fixed Bottom Actions -->
        <div class="job-bottom-sheet__actions">
          <button
            v-if="isHendiman && jobDetails.status === 'open'"
            class="job-action-btn job-action-btn--primary"
            @click="onAccept"
            :disabled="isAccepting"
          >
            <span class="material-symbols-outlined">check_circle</span>
            <span v-if="isAccepting">מעדכן...</span>
            <span v-else>קבל עבודה</span>
          </button>
          <div class="job-action-buttons-row">
            <button
              class="job-action-btn job-action-btn--secondary"
              @click="onClose"
            >
              <span class="material-symbols-outlined">close</span>
              סגור
            </button>
            <button
              v-if="isHendiman && jobDetails.status === 'open'"
              class="job-action-btn job-action-btn--secondary"
              @click="onSkip"
            >
              <span class="material-symbols-outlined">skip_next</span>
              דלג
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";

export default {
  name: "ViewJob",
  props: {
    jobDetails: {
      type: Object,
      default: null,
    },
    isHendiman: {
      type: Boolean,
      default: false,
    },
    getStatusLabel: {
      type: Function,
      required: true,
    },
    acceptingJobId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      rating: null,
      isLoadingRating: false,
      isJobsDropdownOpen: false,
      isExpanded: false,
      sheetOffset: 0,
      dragStartY: 0,
      dragStartOffset: 0,
      isDragging: false,
      touchStartY: 0,
      touchStartOffset: 0,
    };
  },
  watch: {
    jobDetails: {
      immediate: true,
      handler(newJob) {
        if (
          newJob &&
          !this.isHendiman &&
          newJob.status === "done" &&
          newJob._id
        ) {
          this.loadRating(newJob._id);
        }
      },
    },
  },
  computed: {
    isAccepting() {
      if (!this.acceptingJobId || !this.jobDetails) return false;
      const jobId = this.jobDetails._id || this.jobDetails.id;
      return String(this.acceptingJobId) === String(jobId);
    },
    fullStars() {
      if (!this.rating || !this.rating.rating) return 0;
      return Math.floor(this.rating.rating);
    },
    hasHalfStar() {
      if (!this.rating || !this.rating.rating) return false;
      return this.rating.rating % 1 >= 0.5;
    },
    jobCoordinates() {
      const coords = this.jobDetails?.coordinates;
      if (coords && coords.lat !== undefined && coords.lng !== undefined) {
        return { lat: coords.lat, lng: coords.lng };
      }
      const locArray = this.jobDetails?.location?.coordinates;
      if (
        Array.isArray(locArray) &&
        locArray.length >= 2 &&
        typeof locArray[1] === "number" &&
        typeof locArray[0] === "number"
      ) {
        return { lat: locArray[1], lng: locArray[0] };
      }
      return null;
    },
    statusSteps() {
      if (!this.jobDetails) return [];
      const status = this.jobDetails.status;
      const steps = [
        { status: 'open', label: 'פתוחה', isActive: status === 'open', isCompleted: ['assigned', 'on_the_way', 'in_progress', 'done'].includes(status) },
        { status: 'assigned', label: 'שובצה', isActive: status === 'assigned', isCompleted: ['on_the_way', 'in_progress', 'done'].includes(status) },
        { status: 'on_the_way', label: 'בדרך', isActive: status === 'on_the_way', isCompleted: ['in_progress', 'done'].includes(status) },
        { status: 'in_progress', label: 'בביצוע', isActive: status === 'in_progress', isCompleted: status === 'done' },
        { status: 'done', label: 'הושלמה', isActive: status === 'done', isCompleted: false },
      ];
      return steps;
    },
  },
  methods: {
    getJobDisplayName() {
      if (!this.jobDetails) return "ללא שם";
      // Handle subcategoryInfo as array
      if (
        Array.isArray(this.jobDetails.subcategoryInfo) &&
        this.jobDetails.subcategoryInfo.length > 0
      ) {
        if (this.jobDetails.subcategoryInfo.length === 1) {
          // Single job - show name
          return (
            this.jobDetails.subcategoryInfo[0].subcategory ||
            this.jobDetails.subcategoryInfo[0].category ||
            this.jobDetails.subcategoryName ||
            "ללא שם"
          );
        } else {
          // Multiple jobs - show count
          return `${this.jobDetails.subcategoryInfo.length} עבודות`;
        }
      }
      // Fallback for old format (object) or no subcategoryInfo
      return (
        this.jobDetails.subcategoryInfo?.name ||
        this.jobDetails.subcategoryInfo?.subcategory ||
        this.jobDetails.subcategoryName ||
        "ללא שם"
      );
    },
    getTotalPrice() {
      if (!Array.isArray(this.jobDetails.subcategoryInfo)) {
        return (
          this.jobDetails.subcategoryInfo?.price || this.jobDetails.price || 0
        );
      }
      return this.jobDetails.subcategoryInfo.reduce((total, subcat) => {
        const price = subcat.price || 0;
        return total + price;
      }, 0);
    },
    async loadRating(jobId) {
      if (this.isLoadingRating) return;
      this.isLoadingRating = true;
      try {
        const response = await axios.get(`${URL}/ratings/job/${jobId}`);
        if (response.data.success && response.data.rating) {
          this.rating = response.data.rating;
        } else {
          this.rating = null;
        }
      } catch (error) {
        this.rating = null;
      } finally {
        this.isLoadingRating = false;
      }
    },
    onClose() {
      this.$emit("close");
    },
    onAccept() {
      this.$emit("accept", this.jobDetails);
      this.onClose();
    },
    onSkip() {
      this.$emit("skip", this.jobDetails);
      this.onClose();
    },
    openGoogleMaps() {
      const coords = this.jobCoordinates;
      if (!coords) return;
      const { lat, lng } = coords;
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, "_blank", "noopener");
    },
    openWaze() {
      const coords = this.jobCoordinates;
      if (!coords) return;
      const { lat, lng } = coords;
      const url = `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;
      window.open(url, "_blank", "noopener");
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
    formatDate(date) {
      if (!date) return "";
      try {
        const dateObj = date.$date ? new Date(date.$date) : new Date(date);
        return new Intl.DateTimeFormat("he-IL", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(dateObj);
      } catch (e) {
        return String(date);
      }
    },
    formatDateShort(date) {
      if (!date) return "";
      try {
        const dateObj = date.$date ? new Date(date.$date) : new Date(date);
        return new Intl.DateTimeFormat("he-IL", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(dateObj);
      } catch (e) {
        return String(date);
      }
    },
    getStatusText() {
      if (!this.jobDetails) return "";
      const statusLabels = {
        open: "פתוחה",
        assigned: "שובצה",
        on_the_way: "בדרך ליעד",
        in_progress: "בביצוע",
        done: "הושלמה",
        cancelled: "בוטלה",
      };
      return statusLabels[this.jobDetails.status] || this.jobDetails.status;
    },
    getImageStyle() {
      if (!this.jobDetails) return {};
      const imageUrl = Array.isArray(this.jobDetails.imageUrl)
        ? this.jobDetails.imageUrl[0]
        : this.jobDetails.imageUrl;
      return {
        backgroundImage: `url(${imageUrl || '/img/Hendima-logo.png'})`,
      };
    },
    getDisplayPrice() {
      if (!this.jobDetails) return 0;
      if (
        Array.isArray(this.jobDetails.subcategoryInfo) &&
        this.jobDetails.subcategoryInfo.length > 1
      ) {
        return this.getTotalPrice();
      }
      return (
        (Array.isArray(this.jobDetails.subcategoryInfo) &&
        this.jobDetails.subcategoryInfo.length === 1
          ? this.jobDetails.subcategoryInfo[0].price
          : this.jobDetails.subcategoryInfo?.price || this.jobDetails.price) || 0
      );
    },
    getBillingType() {
      if (!this.jobDetails) return null;
      if (
        Array.isArray(this.jobDetails.subcategoryInfo) &&
        this.jobDetails.subcategoryInfo.length === 1
      ) {
        return (
          this.jobDetails.subcategoryInfo[0].workType ||
          this.jobDetails.billingType ||
          null
        );
      }
      return (
        this.jobDetails.subcategoryInfo?.typeWork ||
        this.jobDetails.billingType ||
        null
      );
    },
    getClientAvatarStyle() {
      if (!this.jobDetails || !this.jobDetails.clientImage) return {};
      return {
        backgroundImage: `url(${this.jobDetails.clientImage})`,
      };
    },
    getClientRating() {
      if (!this.jobDetails || !this.jobDetails.clientRating) return null;
      return this.jobDetails.clientRating;
    },
    getCategoryName() {
      if (!this.jobDetails) return null;
      if (
        Array.isArray(this.jobDetails.subcategoryInfo) &&
        this.jobDetails.subcategoryInfo.length === 1
      ) {
        return this.jobDetails.subcategoryInfo[0].category;
      }
      return this.jobDetails.subcategoryInfo?.category;
    },
    getMapPreviewStyle() {
      if (!this.jobCoordinates) return {};
      const { lat, lng } = this.jobCoordinates;
      return {
        backgroundImage: `url(https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff7b00(${lng},${lat})/${lng},${lat},15,0/300x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw)`,
      };
    },
    openLocation() {
      if (this.jobCoordinates) {
        this.openGoogleMaps();
      }
    },
    // Drag handlers
    handleDragStart(e) {
      this.isDragging = true;
      this.dragStartY = e.clientY || e.touches?.[0]?.clientY;
      this.dragStartOffset = this.sheetOffset;
      document.addEventListener("mousemove", this.handleDragMove);
      document.addEventListener("mouseup", this.handleDragEnd);
      document.addEventListener("touchmove", this.handleDragMove);
      document.addEventListener("touchend", this.handleDragEnd);
    },
    handleDragMove(e) {
      if (!this.isDragging) return;
      const currentY = e.clientY || e.touches?.[0]?.clientY;
      const deltaY = currentY - this.dragStartY;
      const newOffset = this.dragStartOffset + deltaY;
      const maxOffset = 0;
      const minOffset = window.innerHeight * 0.3;
      this.sheetOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
    },
    handleDragEnd() {
      if (!this.isDragging) return;
      this.isDragging = false;
      const threshold = window.innerHeight * 0.15;
      if (this.sheetOffset > threshold) {
        this.onClose();
      } else {
        this.sheetOffset = 0;
      }
      document.removeEventListener("mousemove", this.handleDragMove);
      document.removeEventListener("mouseup", this.handleDragEnd);
      document.removeEventListener("touchmove", this.handleDragMove);
      document.removeEventListener("touchend", this.handleDragEnd);
    },
    handleTouchStart(e) {
      if (e.target.closest('.job-bottom-sheet__content')) return;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartOffset = this.sheetOffset;
    },
    handleTouchMove(e) {
      if (e.target.closest('.job-bottom-sheet__content')) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - this.touchStartY;
      const newOffset = this.touchStartOffset + deltaY;
      const maxOffset = 0;
      const minOffset = window.innerHeight * 0.3;
      this.sheetOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
    },
    handleTouchEnd(e) {
      if (e.target.closest('.job-bottom-sheet__content')) return;
      const threshold = window.innerHeight * 0.15;
      if (this.sheetOffset > threshold) {
        this.onClose();
      } else {
        this.sheetOffset = 0;
      }
    },
  },
  mounted() {
    // Reset sheet position when opened
    this.sheetOffset = 0;
  },
  watch: {
    jobDetails: {
      handler() {
        // Reset sheet position when job changes
        this.sheetOffset = 0;
        this.isExpanded = false;
      },
    },
  },
};
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

$primary: #ff7b00;
$primary-dark: #e06c00;
$background-dark: #1a1a1a;
$card-dark: #262626;
$text: rgba(255, 255, 255, 0.92);
$text-secondary: rgba(161, 161, 170, 1);
$danger: #ff3b3b;

.material-symbols-outlined {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

// Bottom Sheet Overlay
.job-bottom-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100001;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  direction: rtl;
  font-family: 'Inter', sans-serif;

  @media (min-width: 640px) {
    align-items: center;
    justify-content: center;
  }
}

// Bottom Sheet Animation
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: opacity 0.3s ease;
}

.bottom-sheet-enter-active .job-bottom-sheet,
.bottom-sheet-leave-active .job-bottom-sheet {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}

.bottom-sheet-enter-from .job-bottom-sheet,
.bottom-sheet-leave-to .job-bottom-sheet {
  transform: translateY(100%);
}

// Bottom Sheet Container
.job-bottom-sheet {
  position: relative;
  width: 100%;
  max-width: 448px;
  height: 90vh;
  max-height: 90vh;
  background: $background-dark;
  border-radius: 2rem 2rem 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  @media (min-width: 640px) {
    border-radius: 2rem;
    height: auto;
    max-height: 90vh;
  }
}

.job-bottom-sheet__handle {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 8px;
  background: $background-dark;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: grab;
  user-select: none;
  z-index: 10;

  &:active {
    cursor: grabbing;
  }
}

.job-bottom-sheet__handle-bar {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(209, 213, 219, 0.3);

  @media (prefers-color-scheme: dark) {
    background: rgba(255, 255, 255, 0.2);
  }
}

.job-bottom-sheet__header {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 32px 8px;
  background: $background-dark;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
}

.job-bottom-sheet__step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
}

.step-indicator-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  position: relative;
}

.step-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(107, 114, 128, 1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;

  &--active {
    width: 12px;
    height: 12px;
    background: $primary;
    box-shadow: 0 0 10px rgba(255, 123, 0, 0.8);
    animation: pulse 2s ease-in-out infinite;
  }

  &--completed {
    background: $primary;
  }
}

.step-indicator-item--active .step-indicator-dot {
  width: 12px;
  height: 12px;
  background: $primary;
  box-shadow: 0 0 10px rgba(255, 123, 0, 0.8);
  animation: pulse 2s ease-in-out infinite;
}

.step-indicator-item--completed .step-indicator-dot {
  background: $primary;
}

.step-indicator-line {
  position: absolute;
  top: 4px;
  left: 50%;
  right: -50%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 1;
}

.step-indicator-line--active {
  background: $primary;
}

.job-bottom-sheet__status-text {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $primary;
  margin: 4px 0 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// Scrollable Content
.job-bottom-sheet__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 128px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

// Image Section
.job-image-section {
  position: relative;
  width: 100%;
  height: 224px;
  margin-top: 0;
}

.job-image-container {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}

.job-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, $background-dark, transparent, rgba(0, 0, 0, 0.3));
}

.job-urgent-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(220, 38, 38, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(220, 38, 38, 0.5);
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;

  .material-symbols-outlined {
    font-size: 14px;
  }
}

.job-images-thumbnails {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
}

.job-thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  background-size: cover;
  background-position: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  position: relative;
}

.job-thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: white;
  font-size: 11px;
  font-weight: 700;
}

// Title Section
.job-title-section {
  padding: 16px 24px 24px;
  text-align: center;
  margin-top: -24px;
  position: relative;
  z-index: 10;
}

.job-title {
  margin: 0 0 8px;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  line-height: 1.4;

  @media (max-width: 640px) {
    font-size: 24px;
  }
}

.job-price-badge {
  display: inline-block;
  background: rgba(255, 123, 0, 0.1);
  padding: 4px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 123, 0, 0.2);
  margin-bottom: 16px;
}

.job-price-amount {
  font-size: 24px;
  font-weight: 700;
  color: $primary;
}

.job-tags-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.job-tag {
  background: $card-dark;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(209, 213, 219, 1);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 0.375rem;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  margin-bottom: 16px;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 12px 16px;

  @media (max-width: 768px) {
    padding: 10px 12px;
    margin-bottom: 12px;
    gap: 2px;
  }
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    gap: 3px;
  }
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 1000;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
}

.step-item--active .step-circle {
  background: linear-gradient(135deg, $primary, $primary-dark);
  border-color: $primary;
  color: #111;
  box-shadow: 0 3px 10px rgba($primary, 0.4);
  transform: scale(1.08);
}

.step-item--completed .step-circle {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border-color: #4caf50;
  color: #fff;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.step-item--cancelled .step-circle {
  background: linear-gradient(135deg, $danger, #ff5252);
  border-color: $danger;
  color: #fff;
  box-shadow: 0 4px 12px rgba($danger, 0.3);
}

.step-label {
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  transition: color 0.3s ease;
  margin-top: 4px;

  @media (max-width: 768px) {
    font-size: 9px;
    margin-top: 2px;
  }
}

.step-item--active .step-label,
.step-item--completed .step-label,
.step-item--cancelled .step-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 1000;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 6px;
  position: relative;
  top: -16px;
  transition: background 0.3s ease;

  @media (max-width: 768px) {
    margin: 0 3px;
    top: -14px;
  }
}

.step-line--active {
  background: linear-gradient(90deg, $primary, $primary-dark);
  box-shadow: 0 0 8px rgba($primary, 0.4);
}

.job-header {
  padding-bottom: 12px;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding-bottom: 10px;
    margin-bottom: 0;
  }
}

.job-header-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.job-header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.job-image-wrapper {
  width: 160px;
  height: 160px;
  min-width: 160px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba($primary, 0.18);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 250px;
    height: 160px;
    min-width: unset;
    align-self: center;
  }
}

.job-images-grid {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 2px;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);

  &.job-images-grid--1 {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  &.job-images-grid--2 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr;
  }

  &.job-images-grid--3 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);

    .job-image-item:first-child {
      grid-column: 1 / -1;
    }
  }

  &.job-images-grid--4 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

.job-image-item {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;

  .job-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.urgent-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, $danger, #ff5252);
  color: #fff;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 1000;
  box-shadow: 0 2px 8px rgba($danger, 0.4);
  z-index: 10;
}

.job-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.job-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 1000;
  color: $primary;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 6px;
  }
}

.job-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.tag {
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 1000;
  font-size: 11px;
  border: 1px solid rgba($primary, 0.18);
  background: rgba($primary, 0.12);
  color: $text;

  @media (max-width: 768px) {
    padding: 3px 8px;
    font-size: 9px;
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
    border-color: rgba($primary-dark, 0.28);
    background: rgba($primary-dark, 0.14);
  }

  &--fixed {
    border-color: rgba($primary, 0.22);
    background: rgba($primary, 0.12);
  }

  &--work-type {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.84);

    &.tag--easy {
      border-color: rgba(76, 175, 80, 0.3);
      background: rgba(76, 175, 80, 0.12);
      color: #a5d6a7;
    }

    &.tag--medium {
      border-color: rgba(255, 193, 7, 0.3);
      background: rgba(255, 193, 7, 0.12);
      color: #ffe082;
    }

    &.tag--hard {
      border-color: rgba($danger, 0.3);
      background: rgba($danger, 0.12);
      color: #ffcdd2;
    }
  }
}

// Details Section
.job-details-section {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.job-detail-card {
  background: $card-dark;
  padding: 16px;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.job-detail-card--client {
  border-right: 4px solid $primary;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.job-detail-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.job-detail-card__content--location {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.job-detail-card__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.job-detail-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background-size: cover;
  background-position: center;
  background-color: rgba(107, 114, 128, 1);
  border: 2px solid rgba(255, 123, 0, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.job-detail-card__info {
  display: flex;
  flex-direction: column;
  text-align: right;
  flex: 1;
  min-width: 0;
}

.job-detail-card__label {
  font-size: 10px;
  color: rgba(156, 163, 175, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.job-detail-card__value {
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.job-detail-card__rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fbbf24;
  font-size: 14px;
  font-weight: 700;

  .material-symbols-outlined {
    font-size: 16px;
    color: #fbbf24;
  }
}

.job-detail-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 123, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 18px;
  }
}

.job-detail-card__link {
  font-size: 12px;
  color: $primary;
  text-decoration: underline;
  margin-top: 4px;
  display: inline-block;
  cursor: pointer;
}

.job-detail-card__map-preview {
  width: 100%;
  height: 80px;
  border-radius: 0.5rem;
  background: #1a1a1a;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  filter: grayscale(100%) brightness(0.7) contrast(1.2);
  display: flex;
  align-items: center;
  justify-content: center;

  .material-symbols-outlined {
    font-size: 48px;
    color: $primary;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
}

// Description Section
.job-description-section {
  padding: 16px 20px 8px;
}

.job-description-title {
  font-size: 14px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px;
}

.job-description-text {
  background: $card-dark;
  padding: 16px;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(156, 163, 175, 1);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}

// Rating Section
.job-rating-section {
  padding: 16px 20px 8px;
}

.job-rating-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.job-rating-stars {
  display: flex;
  gap: 4px;
  direction: ltr;
}

.job-rating-star {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.2);
  transition: color 0.2s ease;

  &--full {
    color: #fbbf24;
  }

  &--half {
    color: #fbbf24;
  }

  &--empty {
    color: rgba(255, 255, 255, 0.2);
  }
}

.job-rating-number {
  font-weight: 700;
  font-size: 16px;
  color: white;
}

.job-rating-review {
  margin-top: 8px;
}

.job-rating-review-text {
  margin: 0;
  font-size: 14px;
  color: rgba(156, 163, 175, 1);
  line-height: 1.6;
}

.job-rating-review--empty .job-rating-review-text {
  font-style: italic;
}

// Bottom Actions
.job-bottom-sheet__actions {
  flex: none;
  width: 100%;
  background: rgba(24, 20, 17, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
  z-index: 30;
}

.job-action-btn {
  width: 100%;
  padding: 16px;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.job-action-btn--primary {
  background: linear-gradient(135deg, #ff9100 0%, #ff7b00 100%);
  box-shadow: 0 4px 15px rgba(255, 123, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);

  .material-symbols-outlined {
    font-size: 20px;
  }
}

.job-action-btn--secondary {
  background: rgba(42, 42, 42, 1);
  border: 1px solid rgba(255, 123, 0, 0.3);
  color: rgba(209, 213, 219, 1);

  &:hover {
    background: rgba(51, 51, 51, 1);
    border-color: rgba(255, 123, 0, 0.6);
  }

  .material-symbols-outlined {
    font-size: 18px;
    color: $primary;
  }
}

.job-action-buttons-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.job-rating {
  padding: 12px 0;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding: 10px 0;
  }
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rating-stars {
  display: flex;
  gap: 4px;
  direction: ltr;
}

.rating-star {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.2);
  transition: color 0.2s ease;

  @media (max-width: 768px) {
    font-size: 16px;
  }

  &--full {
    color: #ffb300;
  }

  &--half {
    color: #ffb300;
  }

  &--empty {
    color: rgba(255, 255, 255, 0.2);
  }
}

.rating-number {
  font-weight: 1000;
  font-size: 16px;
  color: $text;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.rating-review {
  margin-top: 8px;
}

.review-text {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: $text;
  line-height: 1.5;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 10px;
  }
}

.rating-review--empty .review-text {
  color: $text-secondary;
  font-style: italic;
}

/* Jobs Dropdown */
.jobs-dropdown-section {
  margin: 16px 0;
  padding: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    margin: 12px 0;
  }
}

.jobs-dropdown {
  position: relative;
  width: 100%;
}

.jobs-dropdown__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba($primary, 0.1);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 12px;
  color: $primary;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 13px;
  }

  &:hover {
    background: rgba($primary, 0.15);
    border-color: rgba($primary, 0.3);
  }

  &--open {
    border-radius: 12px 12px 0 0;
    border-bottom: none;
  }

  i {
    font-size: 12px;
    transition: transform 0.2s ease;
  }

  &--open i {
    transform: rotate(180deg);
  }
}

.jobs-dropdown__content {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba($primary, 0.2);
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 8px;
  max-height: 400px;
  overflow-y: auto;

  @media (max-width: 768px) {
    max-height: 300px;
    padding: 6px;
  }
}

.jobs-dropdown__item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 10px;
    margin-bottom: 6px;
  }

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba($primary, 0.2);
  }
}

.jobs-dropdown__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    margin-bottom: 6px;
    gap: 8px;
  }
}

.jobs-dropdown__item-name {
  font-weight: 1000;
  font-size: 14px;
  color: $text;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 13px;
  }
}

.jobs-dropdown__item-price {
  font-weight: 1000;
  font-size: 14px;
  color: $primary;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 13px;
  }
}

.jobs-dropdown__item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 6px;
  }
}

.jobs-dropdown__item-category,
.jobs-dropdown__item-work-type {
  font-weight: 800;
  font-size: 11px;
  color: $text-secondary;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 3px 6px;
  }
}

/* Custom scrollbar for dropdown */
.jobs-dropdown__content::-webkit-scrollbar {
  width: 6px;
}

.jobs-dropdown__content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.jobs-dropdown__content::-webkit-scrollbar-thumb {
  background: rgba($primary, 0.3);
  border-radius: 3px;

  &:hover {
    background: rgba($primary, 0.5);
  }
}
</style>

