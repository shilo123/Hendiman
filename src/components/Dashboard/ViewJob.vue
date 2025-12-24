<template>
  <Transition name="modal">
    <div class="job-modal-overlay" @click.self="onClose" v-if="jobDetails">
      <div class="job-modal-content">
        <button class="close-button" @click="onClose">✕</button>

        <div v-if="jobDetails" class="job-content">
          <!-- Step Indicator -->
          <div class="step-indicator">
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'open',
                'step-item--completed': [
                  'assigned',
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            >
              <div class="step-circle">
                <span
                  v-if="
                    ['assigned', 'on_the_way', 'in_progress', 'done'].includes(
                      jobDetails.status
                    )
                  "
                  >✓</span
                >
                <span v-else>1</span>
              </div>
              <span class="step-label">פתוחה</span>
            </div>
            <div
              class="step-line"
              :class="{
                'step-line--active': [
                  'assigned',
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'assigned',
                'step-item--completed': [
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            >
              <div class="step-circle">
                <span
                  v-if="
                    ['on_the_way', 'in_progress', 'done'].includes(
                      jobDetails.status
                    )
                  "
                  >✓</span
                >
                <span v-else-if="jobDetails.status === 'assigned'">2</span>
                <span v-else>2</span>
              </div>
              <span class="step-label">שובצה</span>
            </div>
            <div
              class="step-line"
              :class="{
                'step-line--active': [
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'on_the_way',
                'step-item--completed': ['in_progress', 'done'].includes(
                  jobDetails.status
                ),
              }"
            >
              <div class="step-circle">
                <span v-if="['in_progress', 'done'].includes(jobDetails.status)"
                  >✓</span
                >
                <span v-else-if="jobDetails.status === 'on_the_way'">3</span>
                <span v-else>3</span>
              </div>
              <span class="step-label">בדרך</span>
            </div>
            <div
              class="step-line"
              :class="{
                'step-line--active': ['in_progress', 'done'].includes(
                  jobDetails.status
                ),
              }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'in_progress',
                'step-item--completed': jobDetails.status === 'done',
              }"
            >
              <div class="step-circle">
                <span v-if="jobDetails.status === 'done'">✓</span>
                <span v-else-if="jobDetails.status === 'in_progress'">4</span>
                <span v-else>4</span>
              </div>
              <span class="step-label">בביצוע</span>
            </div>
            <div
              class="step-line"
              :class="{ 'step-line--active': jobDetails.status === 'done' }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'done',
                'step-item--cancelled': jobDetails.status === 'cancelled',
              }"
            >
              <div class="step-circle">
                <span v-if="jobDetails.status === 'done'">✓</span>
                <span v-else-if="jobDetails.status === 'cancelled'">✕</span>
                <span v-else>5</span>
              </div>
              <span class="step-label">{{
                jobDetails.status === "cancelled" ? "בוטלה" : "הושלמה"
              }}</span>
            </div>
          </div>

          <!-- Header with image -->
          <div class="job-header">
            <div class="job-header-content">
              <div class="job-image-wrapper">
                <!-- Single image (backward compatibility) -->
                <template v-if="!Array.isArray(jobDetails.imageUrl)">
                  <img
                    class="job-image"
                    :src="jobDetails.imageUrl || '/img/Hendima-logo.png'"
                    :alt="getJobDisplayName()"
                    @error="onImageError"
                  />
                </template>
                <!-- Multiple images grid -->
                <div
                  v-else
                  class="job-images-grid"
                  :class="`job-images-grid--${jobDetails.imageUrl.length}`"
                >
                  <div
                    v-for="(imgUrl, index) in jobDetails.imageUrl"
                    :key="index"
                    class="job-image-item"
                  >
                    <img
                      class="job-image"
                      :src="imgUrl || '/img/Hendima-logo.png'"
                      :alt="`${getJobDisplayName()} - תמונה ${index + 1}`"
                      @error="onImageError"
                    />
                  </div>
                </div>
                <span v-if="jobDetails.urgent" class="urgent-badge">דחוף</span>
              </div>
              <div class="job-header-info">
                <h1 class="job-title">
                  {{ getJobDisplayName() }}
                </h1>
                <div class="job-tags">
                  <span
                    v-if="
                      !Array.isArray(jobDetails.subcategoryInfo) ||
                      jobDetails.subcategoryInfo.length === 1
                    "
                    class="tag"
                    :class="
                      (Array.isArray(jobDetails.subcategoryInfo) &&
                      jobDetails.subcategoryInfo.length === 1
                        ? jobDetails.subcategoryInfo[0].workType
                        : jobDetails.subcategoryInfo?.typeWork ||
                          jobDetails.billingType) === 'לשעה'
                        ? 'tag--hourly'
                        : 'tag--fixed'
                    "
                  >
                    {{
                      Array.isArray(jobDetails.subcategoryInfo) &&
                      jobDetails.subcategoryInfo.length === 1
                        ? jobDetails.subcategoryInfo[0].workType ||
                          jobDetails.billingType ||
                          "קבלנות"
                        : jobDetails.subcategoryInfo?.typeWork ||
                          jobDetails.billingType ||
                          "קבלנות"
                    }}
                  </span>
                  <span
                    v-if="jobDetails.workType"
                    class="tag tag--work-type"
                    :class="{
                      'tag--easy': jobDetails.workType === 'קלה',
                      'tag--medium': jobDetails.workType === 'מורכבת',
                      'tag--hard': jobDetails.workType === 'קשה',
                    }"
                  >
                    {{ jobDetails.workType }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Multiple Jobs Dropdown -->
          <div
            v-if="
              Array.isArray(jobDetails.subcategoryInfo) &&
              jobDetails.subcategoryInfo.length > 1
            "
            class="jobs-dropdown-section"
          >
            <div class="jobs-dropdown">
              <button
                class="jobs-dropdown__toggle"
                :class="{ 'jobs-dropdown__toggle--open': isJobsDropdownOpen }"
                @click="isJobsDropdownOpen = !isJobsDropdownOpen"
              >
                <span>{{ jobDetails.subcategoryInfo.length }} עבודות</span>
                <i
                  class="fas"
                  :class="
                    isJobsDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'
                  "
                ></i>
              </button>
              <div v-if="isJobsDropdownOpen" class="jobs-dropdown__content">
                <div
                  v-for="(subcat, index) in jobDetails.subcategoryInfo"
                  :key="index"
                  class="jobs-dropdown__item"
                >
                  <div class="jobs-dropdown__item-header">
                    <span class="jobs-dropdown__item-name">
                      {{
                        subcat.subcategory ||
                        subcat.category ||
                        `עבודה ${index + 1}`
                      }}
                    </span>
                    <span v-if="subcat.price" class="jobs-dropdown__item-price">
                      {{ subcat.price }} ₪
                    </span>
                  </div>
                  <div class="jobs-dropdown__item-details">
                    <span
                      v-if="subcat.category"
                      class="jobs-dropdown__item-category"
                    >
                      קטגוריה: {{ subcat.category }}
                    </span>
                    <span
                      v-if="subcat.workType"
                      class="jobs-dropdown__item-work-type"
                    >
                      סוג: {{ subcat.workType }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Details Section -->
          <div class="job-details">
            <div class="detail-card">
              <div class="detail-icon">
                <i class="fas fa-user"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">לקוח</span>
                <span class="detail-value">{{ jobDetails.clientName }}</span>
              </div>
            </div>

            <div
              v-if="
                !Array.isArray(jobDetails.subcategoryInfo) ||
                jobDetails.subcategoryInfo.length === 1
              "
              class="detail-card detail-card--price"
            >
              <div class="detail-icon">
                <i class="fas fa-shekel-sign"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">מחיר</span>
                <span class="detail-value detail-value--price">
                  {{
                    Array.isArray(jobDetails.subcategoryInfo) &&
                    jobDetails.subcategoryInfo.length === 1
                      ? jobDetails.subcategoryInfo[0].price || 0
                      : jobDetails.subcategoryInfo?.price ||
                        jobDetails.price ||
                        0
                  }}
                  שקלים
                </span>
              </div>
            </div>
            <div v-else class="detail-card detail-card--price">
              <div class="detail-icon">
                <i class="fas fa-shekel-sign"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">סך הכל</span>
                <span class="detail-value detail-value--price">
                  {{ getTotalPrice() }} שקלים
                </span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">מיקום</span>
                <span class="detail-value">{{ jobDetails.locationText }}</span>
                <button
                  v-if="isHendiman && jobCoordinates"
                  class="btn-link"
                  type="button"
                  @click="openLocation"
                >
                  לחץ כאן למיקום
                </button>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">מתי</span>
                <span class="detail-value">{{
                  jobDetails.when === "asap"
                    ? "כמה שיותר מהר"
                    : jobDetails.whenLabel || jobDetails.when
                }}</span>
              </div>
            </div>

            <div
              v-if="
                !Array.isArray(jobDetails.subcategoryInfo) ||
                jobDetails.subcategoryInfo.length === 1
              "
              class="detail-card"
            >
              <div class="detail-icon">
                <i class="fas fa-folder"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">קטגוריה</span>
                <span class="detail-value">{{
                  Array.isArray(jobDetails.subcategoryInfo) &&
                  jobDetails.subcategoryInfo.length === 1
                    ? jobDetails.subcategoryInfo[0].category || "ללא קטגוריה"
                    : jobDetails.subcategoryInfo?.category || "ללא קטגוריה"
                }}</span>
              </div>
            </div>

            <div
              v-if="
                !Array.isArray(jobDetails.subcategoryInfo) ||
                jobDetails.subcategoryInfo.length === 1
              "
              class="detail-card"
            >
              <div class="detail-icon">
                <i class="fas fa-tools"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">סוג עבודה</span>
                <span class="detail-value">{{
                  Array.isArray(jobDetails.subcategoryInfo) &&
                  jobDetails.subcategoryInfo.length === 1
                    ? jobDetails.subcategoryInfo[0].workType ||
                      jobDetails.billingType ||
                      "קבלנות"
                    : jobDetails.subcategoryInfo?.typeWork ||
                      jobDetails.billingType ||
                      "קבלנות"
                }}</span>
              </div>
            </div>

            <div class="detail-card" v-if="jobDetails.createdAt">
              <div class="detail-icon">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">נוצר ב</span>
                <span class="detail-value">{{
                  formatDate(jobDetails.createdAt)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="job-description" v-if="jobDetails.desc">
            <h3 class="section-title">תיאור העבודה:</h3>
            <p class="description-text">{{ jobDetails.desc }}</p>
          </div>

          <!-- Rating Section (for client, when job is done) -->
          <div
            v-if="!isHendiman && jobDetails.status === 'done' && rating"
            class="job-rating"
          >
            <h3 class="section-title">דירוג:</h3>
            <div class="rating-display">
              <div class="rating-stars">
                <template v-for="i in 5" :key="i">
                  <font-awesome-icon
                    v-if="i <= fullStars"
                    :icon="['fas', 'star']"
                    class="rating-star rating-star--full"
                  />
                  <font-awesome-icon
                    v-else-if="i === fullStars + 1 && hasHalfStar"
                    :icon="['fas', 'star-half-stroke']"
                    class="rating-star rating-star--half"
                  />
                  <font-awesome-icon
                    v-else
                    :icon="['fas', 'star']"
                    class="rating-star rating-star--empty"
                  />
                </template>
              </div>
              <span class="rating-number">{{ rating.rating }}/5</span>
            </div>
            <div v-if="rating.review" class="rating-review">
              <p class="review-text">{{ rating.review }}</p>
            </div>
            <div v-else class="rating-review rating-review--empty">
              <p class="review-text">לא ניתנה ביקורת</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="job-actions">
            <div class="job-actions-left">
              <button
                v-if="isHendiman && jobDetails.status === 'open'"
                class="btn-action btn-action--primary"
                @click="onAccept"
                :disabled="isAccepting"
              >
                <span v-if="isAccepting">מעדכן...</span>
                <span v-else>קבל עבודה</span>
              </button>
              <button class="btn-action btn-action--ghost" @click="onClose">
                סגירה
              </button>
              <button
                v-if="isHendiman && jobDetails.status === 'open'"
                class="btn-action btn-action--ghost btn-action--skip"
                @click="onSkip"
              >
                דלג
              </button>
            </div>
            <div class="map-actions">
              <button
                v-if="isHendiman && jobCoordinates"
                class="btn-action btn-action--map"
                type="button"
                dir="rtl"
                @click="openGoogleMaps"
              >
                <i class="fas fa-map-marked-alt"></i>
                <span>גוגל מפות</span>
              </button>
              <button
                v-if="isHendiman && jobCoordinates"
                class="btn-action btn-action--waze"
                type="button"
                dir="rtl"
                @click="openWaze"
              >
                <i class="fas fa-location-arrow"></i>
                <span>וויז</span>
              </button>
            </div>
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
  },
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

$danger: #ff3b3b;

$shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 44px rgba(255, 106, 0, 0.18);

$r: 18px;
$r2: 26px;

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.job-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001; /* Higher than DashboardTopBar (100000) */
  padding: 20px;
  overflow-y: auto;
  font-family: $font-family;

  @media (max-width: 768px) {
    align-items: flex-start;
    padding: 10px;
    overflow-y: auto;
  }
}

/* Modal Animation */
.modal-enter-active {
  transition: opacity 0.3s ease;
}

.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .job-modal-content,
.modal-leave-active .job-modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}

.modal-enter-from .job-modal-content,
.modal-leave-to .job-modal-content {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-enter-to .job-modal-content {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.job-modal-content {
  background: linear-gradient(180deg, $card2, $card);
  border: 1px solid $stroke;
  border-radius: 16px;
  box-shadow: $shadow;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  padding: 24px;
  position: relative;
  color: $text;
  direction: rtl;
  text-align: right;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-family: $font-family;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 14px;
    max-width: 100%;
    max-height: calc(100vh - 20px);
    margin-top: 0;
    margin-bottom: 10px;
  }
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  left: auto;
  background: none;
  border: none;
  font-size: 20px;
  color: $muted;
  cursor: pointer;
  transition: color 0.2s ease;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    color: $text;
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 768px) {
    font-size: 18px;
    top: 10px;
    right: 10px;
    left: auto;
    width: 28px;
    height: 28px;
  }
}

.job-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  background: linear-gradient(135deg, $orange, $orange2);
  border-color: $orange;
  color: #111;
  box-shadow: 0 3px 10px rgba($orange, 0.4);
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
  background: linear-gradient(90deg, $orange, $orange2);
  box-shadow: 0 0 8px rgba($orange, 0.4);
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
  border: 1px solid rgba($orange, 0.18);
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
  color: $orange3;
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
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
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
    border-color: rgba($orange2, 0.28);
    background: rgba($orange2, 0.14);
  }

  &--fixed {
    border-color: rgba($orange, 0.22);
    background: rgba($orange, 0.12);
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

.job-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px 0;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    padding: 10px 0;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba($orange, 0.2);
  }

  @media (max-width: 768px) {
    padding: 8px;
    gap: 8px;
    border-radius: 8px;
  }
}

.detail-card--price {
  border-color: rgba($orange, 0.2);
  background: rgba($orange, 0.05);

  &:hover {
    background: rgba($orange, 0.08);
    border-color: rgba($orange, 0.3);
  }
}

.detail-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 8px;
  color: $orange3;
  font-size: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    font-size: 11px;
    border-radius: 6px;
  }
}

.detail-card--price .detail-icon {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.3);
  color: $orange;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 2px;
  }
}

.detail-label {
  font-weight: 900;
  color: $muted;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 8px;
  }
}

.detail-value {
  font-weight: 1000;
  color: $text;
  font-size: 11px;
  line-height: 1.2;
  word-break: break-word;

  @media (max-width: 768px) {
    font-size: 10px;
  }

  &--price {
    color: $orange3;
    font-weight: 1100;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 11px;
    }
  }
}

.btn-link {
  background: none;
  border: none;
  color: $orange3;
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  margin-top: 4px;
  align-self: flex-start;
  text-decoration: underline;

  &:hover {
    color: lighten($orange3, 8%);
  }

  @media (max-width: 768px) {
    font-size: 11px;
  }
}

.job-description {
  padding: 12px 0;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding: 10px 0;
  }
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 1000;
  color: $orange;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 6px;
  }
}

.description-text {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: $text;
  line-height: 1.5;
  white-space: pre-wrap;

  @media (max-width: 768px) {
    font-size: 12px;
    line-height: 1.4;
  }
}

.job-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  margin-top: 0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 6px;
    padding-top: 10px;
    flex-wrap: nowrap;
  }
}

.job-actions-left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
}

.map-actions {
  display: flex;
  gap: 10px;
  margin-inline-start: auto; /* ב-RTL יידחף שמאלה */
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 4px;
    margin-inline-start: 0;
    flex-shrink: 0;
  }
}

.btn-action {
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 1000;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 120px;
  flex-shrink: 0;
  margin-inline-end: 20px;

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 10px;
    min-width: unset;
    margin-inline-end: 0;
    border-radius: 8px;
    white-space: nowrap;
    width: auto;
  }

  &.btn-action--skip {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &--primary {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: $shadowO;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadowO, 0 8px 20px rgba($orange, 0.3);
    }
  }

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: $text;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  &--map {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #1a1f2e, #23324b);
    border: 1px solid rgba($orange, 0.18);
    color: $orange3;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);

    i {
      font-size: 14px;
    }

    @media (max-width: 768px) {
      padding: 6px 10px;
      gap: 6px;
      min-width: auto;
      width: auto;
      height: auto;

      i {
        font-size: 11px;
      }

      span {
        font-size: 9px;
      }
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba($orange, 0.12);
    }
  }

  &--waze {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0c2c3a, #134a62);
    border: 1px solid rgba(73, 196, 255, 0.25);
    color: #c7ecff;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);

    i {
      font-size: 14px;
    }

    @media (max-width: 768px) {
      padding: 6px 10px;
      gap: 6px;
      min-width: auto;
      width: auto;
      height: auto;

      i {
        font-size: 11px;
      }

      span {
        font-size: 9px;
      }
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4),
        0 0 0 4px rgba(73, 196, 255, 0.14);
    }
  }
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
  color: $muted;
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
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 12px;
  color: $orange3;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 13px;
  }

  &:hover {
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.3);
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
  border: 1px solid rgba($orange, 0.2);
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
    border-color: rgba($orange, 0.2);
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
  color: $orange3;
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
  color: $muted;
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
  background: rgba($orange, 0.3);
  border-radius: 3px;

  &:hover {
    background: rgba($orange, 0.5);
  }
}
</style>
