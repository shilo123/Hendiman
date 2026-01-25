<template>
  <div class="job-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="job-view__loading">
      <div class="job-view__loader"></div>
      <p class="job-view__loading-text">טוען פרטי עבודה...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="job-view__error">
      <div class="job-view__error-icon">
        <i class="ph-bold ph-warning"></i>
      </div>
      <h2 class="job-view__error-title">שגיאה</h2>
      <p class="job-view__error-text">{{ error }}</p>
      <button class="job-view__btn job-view__btn--secondary" @click="goToDashboard">
        <i class="ph-bold ph-house"></i>
        חזרה לדשבורד
      </button>
    </div>

    <!-- Job Details -->
    <div v-else-if="job" class="job-view__content">
      <!-- Header -->
      <div class="job-view__header">
        <button class="job-view__back-btn" @click="goToDashboard">
          <i class="ph-bold ph-arrow-right"></i>
        </button>
        <h1 class="job-view__title">פרטי עבודה</h1>
        <div class="job-view__status-badge" :class="getStatusClass(job.status)">
          {{ getStatusLabel(job.status) }}
        </div>
      </div>

      <!-- Job Image -->
      <div class="job-view__image-section">
        <div
          class="job-view__image"
          :style="getImageStyle()"
        >
          <div class="job-view__image-overlay"></div>
          <div v-if="job.urgent || job.isUrgent" class="job-view__urgent-badge">
            <i class="ph-fill ph-warning"></i>
            דחוף
          </div>
        </div>
      </div>

      <!-- Job Info -->
      <div class="job-view__info">
        <h2 class="job-view__job-title">{{ getJobDisplayName() }}</h2>
        
        <div v-if="!hasBidPrice()" class="job-view__price">
          <span class="job-view__price-amount">₪{{ getDisplayPrice() }}</span>
        </div>
        <div v-else class="job-view__quoted-badge">
          <i class="ph-fill ph-currency-circle-dollar"></i>
          עבודה בהצעת מחיר
        </div>

        <!-- Location -->
        <div class="job-view__detail-card">
          <div class="job-view__detail-icon">
            <i class="ph-fill ph-map-pin"></i>
          </div>
          <div class="job-view__detail-content">
            <span class="job-view__detail-label">מיקום</span>
            <span class="job-view__detail-value">{{ job.locationText || job.city || 'לא צוין' }}</span>
          </div>
        </div>

        <!-- Category -->
        <div class="job-view__detail-card">
          <div class="job-view__detail-icon">
            <i class="ph-fill ph-tag"></i>
          </div>
          <div class="job-view__detail-content">
            <span class="job-view__detail-label">קטגוריה</span>
            <span class="job-view__detail-value">{{ getCategoryName() }}</span>
          </div>
        </div>

        <!-- Date -->
        <div class="job-view__detail-card">
          <div class="job-view__detail-icon">
            <i class="ph-fill ph-calendar"></i>
          </div>
          <div class="job-view__detail-content">
            <span class="job-view__detail-label">תאריך יצירה</span>
            <span class="job-view__detail-value">{{ formatDate(job.createdAt) }}</span>
          </div>
        </div>

        <!-- Description -->
        <div v-if="job.desc" class="job-view__description">
          <h3 class="job-view__section-title">תיאור</h3>
          <p class="job-view__description-text">{{ job.desc }}</p>
        </div>

        <!-- Client Info (for handyman) -->
        <div v-if="isHendiman && job.clientName" class="job-view__client-card">
          <div class="job-view__client-avatar" :style="getClientAvatarStyle()">
            <i v-if="!job.clientImage" class="ph-fill ph-user"></i>
          </div>
          <div class="job-view__client-info">
            <span class="job-view__client-label">לקוח</span>
            <span class="job-view__client-name">{{ job.clientName }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="job-view__actions">
        <!-- Accept Button (only for handyman with open job) -->
        <button
          v-if="isHendiman && job.status === 'open'"
          class="job-view__btn job-view__btn--primary"
          @click="acceptJob"
          :disabled="isAccepting"
        >
          <i v-if="!isAccepting" class="ph-bold ph-check-circle"></i>
          <div v-else class="job-view__btn-loader"></div>
          <span>{{ isAccepting ? 'מקבל...' : 'קבל עבודה' }}</span>
        </button>

        <!-- Submit Quote Button (for quoted jobs) -->
        <button
          v-if="isHendiman && job.status === 'quoted'"
          class="job-view__btn job-view__btn--quote"
          @click="submitQuote"
        >
          <i class="ph-bold ph-currency-circle-dollar"></i>
          <span>הגש הצעת מחיר</span>
        </button>

        <!-- View All Jobs Button -->
        <button
          class="job-view__btn job-view__btn--secondary"
          @click="goToDashboard"
        >
          <i class="ph-bold ph-list-bullets"></i>
          <span>ראה את שאר העבודות</span>
        </button>

        <!-- Skip Button -->
        <button
          v-if="isHendiman && (job.status === 'open' || job.status === 'quoted')"
          class="job-view__btn job-view__btn--ghost"
          @click="skipJob"
        >
          <i class="ph-bold ph-skip-forward"></i>
          <span>דלג</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useMainStore } from "@/store";
import { useToast } from "@/composables/useToast";

export default {
  name: "JobView",
  props: {
    jobId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      job: null,
      isLoading: true,
      error: null,
      isAccepting: false,
      toast: null,
    };
  },
  setup() {
    const store = useMainStore();
    return { store };
  },
  created() {
    this.toast = useToast();
    this.loadJob();
  },
  computed: {
    isHendiman() {
      return this.store.user?.isHandyman === true;
    },
    currentUserId() {
      return this.store.user?._id || this.$route.params.id;
    },
  },
  methods: {
    async loadJob() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.get(`${URL}/jobs/${this.jobId}`);
        
        if (response.data.success && response.data.job) {
          this.job = response.data.job;
        } else {
          this.error = response.data.message || "העבודה לא נמצאה";
        }
      } catch (err) {
        console.error("[JobView] Error loading job:", err);
        this.error = err.response?.data?.message || "שגיאה בטעינת העבודה";
      } finally {
        this.isLoading = false;
      }
    },

    getJobDisplayName() {
      if (!this.job) return "עבודה";
      if (
        Array.isArray(this.job.subcategoryInfo) &&
        this.job.subcategoryInfo.length > 0
      ) {
        if (this.job.subcategoryInfo.length === 1) {
          return (
            this.job.subcategoryInfo[0].subcategory ||
            this.job.subcategoryInfo[0].category ||
            "עבודה"
          );
        }
        return `${this.job.subcategoryInfo.length} עבודות`;
      }
      return this.job.desc || "עבודה";
    },

    getDisplayPrice() {
      if (!this.job) return 0;
      if (Array.isArray(this.job.subcategoryInfo)) {
        return this.job.subcategoryInfo.reduce((total, sub) => {
          const price = sub.price;
          if (price === "bid" || price === "quoted") return total;
          return total + (parseFloat(price) || 0);
        }, 0);
      }
      const price = this.job.subcategoryInfo?.price || this.job.price;
      if (price === "bid" || price === "quoted") return 0;
      return parseFloat(price) || 0;
    },

    hasBidPrice() {
      if (!this.job) return false;
      if (Array.isArray(this.job.subcategoryInfo)) {
        return this.job.subcategoryInfo.some(
          (sub) => sub.price === "bid" || sub.price === "quoted"
        );
      }
      return (
        this.job.subcategoryInfo?.price === "bid" ||
        this.job.status === "quoted"
      );
    },

    getCategoryName() {
      if (!this.job) return "ללא קטגוריה";
      if (
        Array.isArray(this.job.subcategoryInfo) &&
        this.job.subcategoryInfo.length > 0
      ) {
        return this.job.subcategoryInfo[0].category || "ללא קטגוריה";
      }
      return this.job.subcategoryInfo?.category || "ללא קטגוריה";
    },

    getImageStyle() {
      if (!this.job) return {};
      const imageUrl = Array.isArray(this.job.imageUrl)
        ? this.job.imageUrl[0]
        : this.job.imageUrl;
      return {
        backgroundImage: `url(${imageUrl || "/img/Hendima-logo.png"})`,
      };
    },

    getClientAvatarStyle() {
      if (!this.job?.clientImage) return {};
      return {
        backgroundImage: `url(${this.job.clientImage})`,
      };
    },

    getStatusLabel(status) {
      const labels = {
        open: "פתוחה",
        quoted: "הצעת מחיר",
        assigned: "שובצה",
        on_the_way: "בדרך",
        in_progress: "בביצוע",
        done: "הושלמה",
        cancelled: "בוטלה",
      };
      return labels[status] || status;
    },

    getStatusClass(status) {
      return `job-view__status-badge--${status}`;
    },

    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      return new Intl.DateTimeFormat("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d);
    },

    async acceptJob() {
      if (this.isAccepting) return;
      this.isAccepting = true;

      try {
        const response = await axios.patch(`${URL}/jobs/${this.jobId}/assign`, {
          handymanId: this.currentUserId,
        });

        if (response.data.success) {
          this.toast?.showSuccess("✅ העבודה התקבלה בהצלחה!");
          // Navigate to dashboard
          this.$router.push({
            name: "Dashboard",
            params: { id: this.currentUserId },
          });
        } else {
          this.toast?.showError(response.data.message || "שגיאה בקבלת העבודה");
        }
      } catch (err) {
        console.error("[JobView] Error accepting job:", err);
        this.toast?.showError(err.response?.data?.message || "שגיאה בקבלת העבודה");
      } finally {
        this.isAccepting = false;
      }
    },

    submitQuote() {
      // Navigate to dashboard with quote modal open
      this.$router.push({
        name: "Dashboard",
        params: { id: this.currentUserId },
        query: { action: "quote", jobId: this.jobId },
      });
    },

    skipJob() {
      this.toast?.showInfo("⏭️ העבודה נדחתה");
      this.goToDashboard();
    },

    goToDashboard() {
      if (this.currentUserId) {
        this.$router.push({
          name: "Dashboard",
          params: { id: this.currentUserId },
        });
      } else {
        this.$router.push({ name: "login" });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #0a0a0b;
$bg-card: #18181b;
$text: #ffffff;
$muted: #71717a;
$primary: #ff7b00;
$primary-dark: #e06c00;
$success: #10b981;
$error: #ef4444;
$warning: #f59e0b;

.job-view {
  min-height: 100vh;
  background: $bg;
  color: $text;
  font-family: "Heebo", sans-serif;
  direction: rtl;
}

.job-view__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
}

.job-view__loader {
  width: 48px;
  height: 48px;
  border: 4px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.job-view__loading-text {
  color: $muted;
  font-size: 16px;
}

.job-view__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  text-align: center;
  gap: 16px;
}

.job-view__error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba($error, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $error;
  font-size: 40px;
}

.job-view__error-title {
  font-size: 24px;
  font-weight: 800;
  color: $text;
}

.job-view__error-text {
  color: $muted;
  font-size: 16px;
}

.job-view__content {
  padding-bottom: calc(180px + env(safe-area-inset-bottom, 24px));
}

.job-view__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.job-view__back-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: $text;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.job-view__title {
  flex: 1;
  font-size: 20px;
  font-weight: 800;
}

.job-view__status-badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &--open {
    background: rgba($primary, 0.15);
    border-color: rgba($primary, 0.3);
    color: $primary;
  }

  &--quoted {
    background: rgba($warning, 0.15);
    border-color: rgba($warning, 0.3);
    color: $warning;
  }

  &--assigned, &--on_the_way, &--in_progress {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }

  &--done {
    background: rgba($success, 0.15);
    border-color: rgba($success, 0.3);
    color: $success;
  }

  &--cancelled {
    background: rgba($error, 0.15);
    border-color: rgba($error, 0.3);
    color: $error;
  }
}

.job-view__image-section {
  position: relative;
  width: 100%;
  height: 240px;
}

.job-view__image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}

.job-view__image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, $bg 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
}

.job-view__urgent-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba($error, 0.9);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 13px;
  font-weight: 800;
  border-radius: 999px;
  z-index: 10;
}

.job-view__info {
  padding: 0 20px;
  margin-top: -20px;
  position: relative;
  z-index: 10;
}

.job-view__job-title {
  font-size: 28px;
  font-weight: 900;
  margin-bottom: 16px;
  line-height: 1.2;
}

.job-view__price {
  display: inline-block;
  background: rgba($primary, 0.1);
  border: 1px solid rgba($primary, 0.2);
  padding: 8px 20px;
  border-radius: 999px;
  margin-bottom: 24px;
}

.job-view__price-amount {
  font-size: 28px;
  font-weight: 900;
  color: $primary;
}

.job-view__quoted-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba($warning, 0.1);
  border: 1px solid rgba($warning, 0.2);
  padding: 8px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  color: $warning;
  font-weight: 700;
  font-size: 14px;
}

.job-view__detail-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: $bg-card;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
}

.job-view__detail-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba($primary, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 22px;
  flex-shrink: 0;
}

.job-view__detail-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.job-view__detail-label {
  font-size: 12px;
  font-weight: 700;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.job-view__detail-value {
  font-size: 16px;
  font-weight: 700;
  color: $text;
}

.job-view__section-title {
  font-size: 16px;
  font-weight: 800;
  color: $text;
  margin: 24px 0 12px;
}

.job-view__description {
  margin-top: 20px;
}

.job-view__description-text {
  background: $bg-card;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.job-view__client-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: $bg-card;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-right: 4px solid $primary;
  margin-top: 20px;
}

.job-view__client-avatar {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $muted;
  font-size: 24px;
  flex-shrink: 0;
}

.job-view__client-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.job-view__client-label {
  font-size: 12px;
  font-weight: 700;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.job-view__client-name {
  font-size: 17px;
  font-weight: 800;
  color: $text;
}

.job-view__actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 24px));
  background: rgba($bg, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.job-view__btn {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  font-weight: 800;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;

  i {
    font-size: 22px;
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.job-view__btn--primary {
  background: linear-gradient(135deg, #FF8F00 0%, #FF5F00 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(255, 95, 0, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 12px 32px rgba(255, 95, 0, 0.4);
    transform: translateY(-2px);
  }
}

.job-view__btn--quote {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
}

.job-view__btn--secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: $text;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.job-view__btn--ghost {
  background: transparent;
  border: none;
  color: $muted;
  height: 44px;
  font-size: 15px;

  &:hover {
    color: $text;
  }
}

.job-view__btn-loader {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>

