<template>
  <div class="handyman-modal-overlay" @click.self="onClose">
    <div class="handyman-modal" dir="rtl">
      <!-- Header -->
      <div class="modal-header">
        <button class="btn-close" type="button" @click="onClose">← חזור</button>
      </div>

      <!-- Content -->
      <div class="modal-content" v-if="handymanDetails">
        <!-- Profile Section -->
        <div class="profile-section">
          <div class="profile-image-wrapper">
            <!-- Loading placeholder -->
            <div v-if="imageLoading" class="profile-image-loading"></div>
            <img
              v-show="!imageLoading"
              class="profile-image"
              :src="getHandymanImage"
              :alt="handymanDetails.username"
              @error="onImageError"
              @load="onImageLoad"
            />
            <img
              class="profile-logo"
              :src="getHandymanLogo"
              alt="logo"
              @error="onLogoError"
            />
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ handymanDetails.username }}</h1>
            <div class="profile-stats">
              <div class="stat-item">
                <div class="stat-icon-wrapper">
                  <i class="fas fa-star"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{
                    handymanDetails.rating || 0
                  }}</span>
                  <span class="stat-label">דירוג</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon-wrapper">
                  <i class="fas fa-briefcase"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{
                    handymanDetails.jobDone || 0
                  }}</span>
                  <span class="stat-label">עבודות שסיים</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Section (Compact) -->
        <div class="details-section details-section--compact">
          <!-- Contact Info -->
          <div
            class="detail-card detail-card--compact"
            v-if="handymanDetails.phone"
          >
            <div class="detail-icon-wrapper detail-icon-wrapper--compact">
              <i class="fas fa-phone"></i>
            </div>
            <div class="detail-content-wrapper">
              <div class="detail-label detail-label--compact">טלפון</div>
              <div class="detail-value detail-value--compact">
                {{ handymanDetails.phone }}
              </div>
            </div>
          </div>

          <div
            class="detail-card detail-card--compact"
            v-if="handymanDetails.email"
          >
            <div class="detail-icon-wrapper detail-icon-wrapper--compact">
              <i class="fas fa-envelope"></i>
            </div>
            <div class="detail-content-wrapper">
              <div class="detail-label detail-label--compact">אימייל</div>
              <div class="detail-value detail-value--compact">
                {{ handymanDetails.email }}
              </div>
            </div>
          </div>

          <div
            class="detail-card detail-card--compact"
            v-if="handymanDetails.address"
          >
            <div class="detail-icon-wrapper detail-icon-wrapper--compact">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="detail-content-wrapper">
              <div class="detail-label detail-label--compact">כתובת</div>
              <div class="detail-value detail-value--compact">
                {{ handymanDetails.address }}
              </div>
            </div>
          </div>

          <div
            class="detail-card detail-card--compact"
            v-if="handymanDetails.city"
          >
            <div class="detail-icon-wrapper detail-icon-wrapper--compact">
              <i class="fas fa-city"></i>
            </div>
            <div class="detail-content-wrapper">
              <div class="detail-label detail-label--compact">עיר</div>
              <div class="detail-value detail-value--compact">
                {{ handymanDetails.city }}
              </div>
            </div>
          </div>
        </div>

        <!-- Specialties (Full Width) -->
        <div
          class="detail-card specialties-card specialties-card--compact"
          v-if="specialtiesList.length"
          :class="{ 'specialties-card--expanded': showSpecialties }"
        >
          <div
            class="specialties-header specialties-header--clickable"
            @click="toggleSpecialties"
          >
            <div class="specialties-header-left">
              <div class="detail-icon-wrapper detail-icon-wrapper--compact">
                <i class="fas fa-tools"></i>
              </div>
              <div class="detail-label detail-label--compact">תחומי התמחות</div>
              <span class="specialties-count"
                >({{ specialtiesList.length }})</span
              >
            </div>
            <i
              class="fas specialties-toggle-icon"
              :class="showSpecialties ? 'fa-chevron-up' : 'fa-chevron-down'"
            ></i>
          </div>
          <transition name="specialties-slide">
            <div class="specialties-list" v-show="showSpecialties">
              <div
                v-for="(spec, index) in specialtiesList"
                :key="index"
                class="specialty-item specialty-item--compact"
              >
                <div class="specialty-main">
                  <i class="fas fa-check-circle specialty-check"></i>
                  <div class="specialty-name specialty-name--compact">
                    {{ spec.name || spec }}
                    <span
                      v-if="spec.type === 'Category'"
                      class="specialty-full-category"
                    >
                      (תחום שלם)
                    </span>
                  </div>
                </div>
                <div
                  class="specialty-details"
                  v-if="spec.price || spec.typeWork"
                >
                  <span
                    v-if="spec.price"
                    class="specialty-price specialty-price--compact"
                    ><i class="fas fa-shekel-sign"></i> {{ spec.price }}</span
                  >
                  <span
                    v-if="spec.typeWork"
                    class="specialty-type specialty-type--compact"
                    :class="{
                      'specialty-type--hourly': spec.typeWork === 'לשעה',
                      'specialty-type--fixed': spec.typeWork === 'קבלנות',
                    }"
                  >
                    <i
                      :class="
                        spec.typeWork === 'לשעה'
                          ? 'fas fa-clock'
                          : 'fas fa-file-contract'
                      "
                    ></i>
                    {{ spec.typeWork }}
                  </span>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Divider -->
        <div class="section-divider"></div>

        <!-- Reviews Section -->
        <div class="reviews-section">
          <h2 class="reviews-title">ביקורות</h2>
          <RatingsCarousel
            v-if="handymanDetails && handymanDetails._id"
            :handymanId="handymanDetails._id"
          />
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button
            class="btn-action btn-action--primary"
            type="button"
            @click="onBookHandyman"
          >
            <i class="fas fa-calendar-check"></i>
            הזמן הנדימן
          </button>
          <button
            class="btn-action btn-action--ghost"
            type="button"
            @click="onClose"
          >
            <i class="fas fa-times"></i>
            סגירה
          </button>
          <button
            class="btn-action btn-action--danger"
            type="button"
            @click="onBlockHandyman"
          >
            <i class="fas fa-ban"></i>
            חסום הנדימן
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import RatingsCarousel from "./RatingsCarousel.vue";

export default {
  name: "ViewHandymanDetails",
  components: {
    RatingsCarousel,
  },
  props: {
    handymanDetails: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      showSpecialties: false,
      imageLoading: true,
    };
  },
  computed: {
    specialtiesList() {
      if (!this.handymanDetails || !this.handymanDetails.specialties) {
        return [];
      }
      return Array.isArray(this.handymanDetails.specialties)
        ? this.handymanDetails.specialties
        : [];
    },
    getHandymanImage() {
      const defaultImage = "/img/Hendima-logo.png";

      if (!this.handymanDetails) {
        return defaultImage;
      }

      const imageUrl = this.handymanDetails.imageUrl;

      // בדוק אם אין imageUrl או שהוא ריק
      if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
        return defaultImage;
      }

      // בדוק אם זה URL לא תקין (כמו demo-02.png או demo)
      // גם אם זה URL מלא אבל מכיל demo, נשתמש בברירת מחדל
      if (
        imageUrl.includes("demo-02.png") ||
        imageUrl.includes("/demo") ||
        imageUrl.endsWith("demo-02.png") ||
        (!imageUrl.startsWith("http") && !imageUrl.startsWith("/"))
      ) {
        return defaultImage;
      }

      return imageUrl;
    },
    getHandymanLogo() {
      const defaultLogo = "/img/Hendima-logo.png";

      if (!this.handymanDetails) {
        return defaultLogo;
      }

      const logoUrl = this.handymanDetails.logoUrl;

      // בדוק אם אין logoUrl או שהוא ריק
      if (!logoUrl || typeof logoUrl !== "string" || logoUrl.trim() === "") {
        return defaultLogo;
      }

      // בדוק אם זה URL לא תקין
      if (
        logoUrl.includes("demo") ||
        (!logoUrl.startsWith("http") && !logoUrl.startsWith("/"))
      ) {
        return defaultLogo;
      }

      return logoUrl;
    },
  },
  methods: {
    toggleSpecialties() {
      this.showSpecialties = !this.showSpecialties;
    },
    getCustomerImage(rating) {
      const defaultImage = "/img/Hendima-logo.png";
      if (!rating || !rating.customerImage) {
        return defaultImage;
      }
      const imageUrl = rating.customerImage;
      if (
        !imageUrl ||
        typeof imageUrl !== "string" ||
        imageUrl.trim() === "" ||
        imageUrl.includes("demo") ||
        (!imageUrl.startsWith("http") && !imageUrl.startsWith("/"))
      ) {
        return defaultImage;
      }
      return imageUrl;
    },
    onCustomerImageError(event) {
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

      // Handle MongoDB $date format: { $date: "2025-12-19T07:54:12.104Z" }
      let dateValue = date;
      if (date && typeof date === "object" && date.$date) {
        dateValue = date.$date;
      }

      const d = new Date(dateValue);
      if (isNaN(d.getTime())) {
        return "";
      }

      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    },
    onClose() {
      this.$emit("close");
    },
    onBookHandyman() {
      this.$emit("book", this.handymanDetails);
    },
    onBlockHandyman() {
      this.$emit("block", this.handymanDetails);
    },
    onImageLoad() {
      // התמונה נטענה בהצלחה - הסר את ה-loading state
      this.imageLoading = false;
    },
    onImageError(event) {
      // אם התמונה נכשלה בטעינה, החלף לתמונת ברירת מחדל
      this.imageLoading = false;
      const defaultImage = "/img/Hendima-logo.png";
      // רק אם זה לא כבר תמונת ברירת המחדל, החלף
      if (
        event.target.src !== defaultImage &&
        !event.target.src.includes("Hendima-logo.png")
      ) {
        event.target.src = defaultImage;
      }
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

.handyman-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001; /* Higher than DashboardTopBar (100000) */
  padding: 20px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 10px;
  }
}

.handyman-modal {
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  border: 1px solid $stroke;
  border-radius: 20px;
  box-shadow: $shadow, $shadowO;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-family: $font-family;

  @media (max-width: 768px) {
    border-radius: 16px;
    max-height: 95vh;
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    padding: 12px 14px;
  }
}

.btn-close {
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 8px 16px;
  color: $text;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.3);
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
}

.modal-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  display: block !important;
  width: 100% !important;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.profile-section {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    margin-bottom: 10px;
    padding-bottom: 10px;
  }
}

.profile-image-wrapper {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-image-loading {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #94a3b8; /* bg-slate-400 equivalent */

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
  }
}

.profile-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid rgba($orange, 0.35);
  object-fit: cover;
  box-shadow: $shadowO;

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
  }
}

.profile-logo {
  position: absolute;
  bottom: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid $bg;
  object-fit: cover;
  background: $bg;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
    border-width: 2px;
    bottom: 1px;
    left: 1px;
  }
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 1000;
  color: $orange3;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 6px;
  }
}

.profile-stats {
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    justify-content: center;
    gap: 10px;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba($orange, 0.08);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  padding: 10px 14px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.12);
    border-color: rgba($orange, 0.25);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    gap: 8px;
  }
}

.stat-icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($orange, 0.15);
  border-radius: 10px;
  color: $orange3;
  font-size: 14px;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 12px;
    border-radius: 8px;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 1100;
  color: $orange3;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.stat-label {
  font-size: 11px;
  font-weight: 900;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.details-section {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    gap: 6px;
    margin-bottom: 12px;
  }

  &--compact {
    gap: 6px;
    margin-bottom: 12px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));

    @media (min-width: 500px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 800px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 499px) {
      grid-template-columns: 1fr;
    }
  }
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba($orange, 0.2);
  }

  @media (max-width: 768px) {
    padding: 10px;
    gap: 10px;
    border-radius: 10px;
  }

  &--compact {
    padding: 6px 10px;
    gap: 8px;
    border-radius: 8px;

    @media (max-width: 768px) {
      padding: 5px 8px;
      gap: 6px;
      border-radius: 6px;
    }
  }
}

.detail-icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 10px;
  color: $orange3;
  font-size: 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
    border-radius: 8px;
  }

  &--compact {
    width: 24px;
    height: 24px;
    font-size: 12px;
    border-radius: 6px;

    @media (max-width: 768px) {
      width: 20px;
      height: 20px;
      font-size: 10px;
      border-radius: 5px;
    }
  }
}

.detail-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.detail-label {
  font-size: 11px;
  font-weight: 900;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    font-size: 10px;
  }

  &--compact {
    font-size: 9px;
    letter-spacing: 0.3px;

    @media (max-width: 768px) {
      font-size: 8px;
    }
  }
}

.detail-value {
  font-size: 14px;
  font-weight: 1000;
  color: $text;
  line-height: 1.4;
  word-break: break-word;

  @media (max-width: 768px) {
    font-size: 13px;
  }

  &--compact {
    font-size: 11px;
    line-height: 1.3;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }
}

.specialties-card {
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  grid-column: 1 / -1; // Full width in grid

  @media (max-width: 768px) {
    padding: 12px;
    gap: 12px;
  }

  &--compact {
    gap: 10px;
    padding: 10px;

    @media (max-width: 768px) {
      padding: 8px;
      gap: 8px;
    }
  }
}

.specialties-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;

  .detail-icon-wrapper {
    margin: 0;
  }

  .detail-label {
    margin: 0;
    font-size: 13px;
  }

  &--clickable {
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }
}

.specialties-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.specialties-count {
  font-size: 11px;
  font-weight: 700;
  color: $muted;
  margin-right: 4px;
}

.specialties-toggle-icon {
  font-size: 12px;
  color: $orange3;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.specialties-card--expanded .specialties-toggle-icon {
  transform: rotate(0deg);
}

.specialties-list {
  display: grid;
  gap: 10px;
  width: 100%;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
  }
}

// Transition for specialties dropdown
.specialties-slide-enter-active,
.specialties-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.specialties-slide-enter-from,
.specialties-slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
}

.specialties-slide-enter-to,
.specialties-slide-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.specialty-item {
  background: rgba($orange, 0.06);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.25);
    transform: translateX(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px;
    gap: 8px;
  }

  &--compact {
    padding: 6px 10px;
    gap: 8px;
    border-radius: 8px;

    @media (max-width: 768px) {
      padding: 5px 8px;
      gap: 6px;
    }
  }
}

.specialty-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.specialty-check {
  color: #4caf50;
  font-size: 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.specialty-name {
  font-size: 14px;
  font-weight: 1000;
  color: $text;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 13px;
  }

  &--compact {
    font-size: 11px;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }
}

.specialty-full-category {
  font-size: 0.85em;
  font-weight: 700;
  color: $muted;
  margin-right: 4px;
  font-style: italic;
}

.specialty-details {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
}

.specialty-price {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba($orange, 0.12);
  border: 1px solid rgba($orange, 0.25);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 1100;
  color: $orange3;

  i {
    font-size: 10px;
  }

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 4px 8px;
  }

  &--compact {
    padding: 3px 6px;
    font-size: 10px;

    i {
      font-size: 8px;
    }

    @media (max-width: 768px) {
      font-size: 9px;
      padding: 2px 5px;
    }
  }
}

.specialty-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid;

  i {
    font-size: 11px;
  }

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 4px 8px;
  }

  &--compact {
    padding: 3px 6px;
    font-size: 10px;

    i {
      font-size: 8px;
    }

    @media (max-width: 768px) {
      font-size: 9px;
      padding: 2px 5px;
    }
  }

  &--hourly {
    color: $orange2;
    background: rgba($orange2, 0.12);
    border-color: rgba($orange2, 0.25);
  }

  &--fixed {
    color: $orange;
    background: rgba($orange, 0.12);
    border-color: rgba($orange, 0.25);
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 6px;
    padding-top: 12px;
    flex-wrap: nowrap;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 10px;
    min-width: auto;
    width: auto;
    flex: 1;
    white-space: nowrap;
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

  &--danger {
    background: rgba($danger, 0.15);
    border: 1px solid rgba($danger, 0.35);
    color: #ffd4d4;

    &:hover {
      background: rgba($danger, 0.25);
      border-color: rgba($danger, 0.5);
    }
  }
}

// Section Divider
.section-divider {
  height: 1px;
  background: linear-gradient(
    to left,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  margin: 20px 0;
  width: 100%;

  @media (max-width: 768px) {
    margin: 16px 0;
  }
}

// Reviews Section
.reviews-section {
  margin-top: 24px;
  display: block !important;
  width: 100% !important;

  @media (max-width: 768px) {
    margin-top: 20px;
  }
}

.reviews-title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange3;
  margin: 0 0 16px;
  text-align: right;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 12px;
  }
}

.reviews-loading,
.reviews-empty {
  text-align: center;
  color: $muted;
  padding: 20px;
  font-size: 14px;
}

.reviews-list {
  display: grid;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 6px;

  // Custom scrollbar styling
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($orange, 0.4);
    border-radius: 10px;

    &:hover {
      background: rgba($orange, 0.6);
    }
  }

  @media (max-width: 768px) {
    gap: 5px;
    max-height: 180px;
  }
}

.review-card {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transform: translateY(0);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba($orange, 0.1);
    border-color: rgba($orange, 0.3);
  }

  @media (max-width: 768px) {
    border-radius: 6px;
  }
}

.review-card__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba($orange, 0.05), rgba($orange, 0.02));
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  filter: blur(20px);
}

.review-card:hover .review-card__gradient {
  opacity: 0.3;
}

.review-card__content {
  position: relative;
  z-index: 10;
  padding: 8px;

  @media (max-width: 768px) {
    padding: 6px;
  }
}

.review-customer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    gap: 6px;
    margin-bottom: 6px;
    padding-bottom: 6px;
  }
}

.review-customer__image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba($orange, 0.3);
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
}

.review-customer__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.review-customer__name {
  font-size: 11px;
  font-weight: 1000;
  color: $text;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.review-job-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba($orange, 0.12);
  border: 1px solid rgba($orange, 0.25);
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 9px;
  font-weight: 900;
  color: $orange3;
  white-space: nowrap;
  flex-shrink: 0;

  i {
    font-size: 8px;
  }

  @media (max-width: 768px) {
    padding: 2px 5px;
    font-size: 8px;
    gap: 3px;

    i {
      font-size: 7px;
    }
  }
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 6px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 4px;
  }
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.review-stars {
  display: flex;
  gap: 1px;
  flex-direction: row-reverse;
}

.review-star {
  width: 10px;
  height: 10px;
  fill: rgba(255, 255, 255, 0.2);
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 0.5;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 9px;
    height: 9px;
  }

  &--filled {
    fill: $orange;
    stroke: $orange;
  }
}

.review-rating-value {
  font-size: 9px;
  font-weight: 1000;
  color: $orange3;

  @media (max-width: 768px) {
    font-size: 8px;
  }
}

.review-date {
  font-size: 8px;
  font-weight: 700;
  color: $muted;

  @media (max-width: 768px) {
    font-size: 7px;
  }
}

.review-text {
  font-size: 10px;
  font-weight: 500;
  color: $text;
  line-height: 1.4;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 9px;
    line-height: 1.3;
  }

  &--empty {
    color: $muted;
    font-style: italic;
  }
}
</style>
