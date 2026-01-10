<template>
  <div
    v-if="visible"
    class="client-quotations-modal-overlay"
    @click.self="handleClose"
  >
    <div class="client-quotations-modal" dir="rtl">
      <!-- Header -->
      <div class="client-quotations-modal__header">
        <h2 class="client-quotations-modal__title">התקבלו הצעות מחיר</h2>
        <button
          class="client-quotations-modal__close"
          @click="handleClose"
          aria-label="סגור"
        >
          ×
        </button>
      </div>

      <!-- Job Info -->
      <div class="client-quotations-modal__job-info">
        <div class="job-info-card">
          <div class="job-info-card__title">{{ getSubcategoryText() }}</div>
          <div class="job-info-card__location">
            📍 {{ job.locationText || "מיקום" }}
          </div>
        </div>
      </div>

      <!-- Tabs (by handyman) -->
      <div class="client-quotations-modal__tabs">
        <button
          v-for="(quotation, index) in quotations"
          :key="quotation._id || index"
          class="quotation-tab"
          :class="{ 'quotation-tab--active': activeTabIndex === index }"
          @click="activeTabIndex = index"
        >
          <span class="quotation-tab__name">{{ quotation.handymanName }}</span>
          <span class="quotation-tab__price">{{ quotation.quotation }} ₪</span>
        </button>
      </div>

      <!-- Active Quotation Content -->
      <div v-if="activeQuotation" class="client-quotations-modal__content">
        <div class="quotation-details">
          <!-- Handyman Name -->
          <div class="quotation-details__header">
            <h3 class="quotation-details__handyman-name">
              {{ activeQuotation.handymanName }}
            </h3>
            <div class="quotation-details__price">
              {{ activeQuotation.quotation }} ₪
            </div>
          </div>

          <!-- Handyman Text -->
          <div
            v-if="activeQuotation.handymanText"
            class="quotation-details__text"
          >
            <div class="quotation-details__text-label">הסבר מההנדימן:</div>
            <div class="quotation-details__text-content">
              {{ activeQuotation.handymanText }}
            </div>
          </div>

          <!-- Submit Date -->
          <div class="quotation-details__date">
            נשלח: {{ formatDate(activeQuotation.createdAt) }}
          </div>
        </div>

        <!-- Accept Button -->
        <button
          type="button"
          class="accept-btn"
          @click="handleAcceptQuotation"
          :disabled="isAccepting"
        >
          <span v-if="isAccepting">מבצע...</span>
          <span v-else>בחר הצעה זו</span>
        </button>
      </div>

      <!-- No Quotations -->
      <div v-else class="client-quotations-modal__empty">
        <div class="empty-state">
          <div class="empty-state__icon">📭</div>
          <div class="empty-state__text">אין הצעות מחיר</div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="client-quotations-modal__error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import logger from "@/utils/logger";

export default {
  name: "ClientQuotationsModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    job: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      toast: null,
      activeTabIndex: 0,
      isAccepting: false,
      error: "",
    };
  },
  computed: {
    quotations() {
      return Array.isArray(this.job.quotations) ? this.job.quotations : [];
    },
    activeQuotation() {
      return this.quotations[this.activeTabIndex] || null;
    },
  },
  watch: {
    visible(newVal) {
      if (newVal && this.quotations.length > 0) {
        this.activeTabIndex = 0;
      }
    },
  },
  mounted() {
    this.toast = useToast();
  },
  methods: {
    handleClose() {
      this.$emit("close");
    },
    getSubcategoryText() {
      if (
        this.job.subcategoryInfo &&
        Array.isArray(this.job.subcategoryInfo) &&
        this.job.subcategoryInfo.length > 0
      ) {
        const quotedSub = this.job.subcategoryInfo.find(
          (sub) => sub.price === "bid"
        );
        if (quotedSub) {
          return quotedSub.subcategory || "עבודה כללית";
        }
        return (
          this.job.subcategoryInfo[0].subcategory ||
          this.job.subcategoryInfo[0].category ||
          "עבודה כללית"
        );
      }
      return "עבודה כללית";
    },
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    },
    async handleAcceptQuotation() {
      if (!this.activeQuotation) {
        this.error = "לא נבחרה הצעה";
        return;
      }

      this.isAccepting = true;
      this.error = "";

      try {
        // Extract quotationId - handle both ObjectId and string
        let quotationId = null;
        if (this.activeQuotation._id) {
          quotationId =
            typeof this.activeQuotation._id === "string"
              ? this.activeQuotation._id
              : this.activeQuotation._id.toString();
        }

        if (!quotationId) {
          throw new Error("לא נמצא מזהה להצעת המחיר");
        }

        const response = await axios.post(
          `${URL}/api/jobs/${this.job._id}/quotations/${quotationId}/accept`
        );

        if (response.data.success) {
          this.toast?.showSuccess("הצעת המחיר נבחרה בהצלחה!");
          this.$emit("accepted", {
            jobId: this.job._id,
            handymanId: response.data.handymanId,
            handymanName: response.data.handymanName,
            quotation: response.data.quotation,
          });
          this.handleClose();
        } else {
          this.error = response.data.message || "שגיאה בבחירת הצעת המחיר";
        }
      } catch (error) {
        logger.error("Error accepting quotation:", error);
        this.error =
          error.response?.data?.message || "שגיאה בבחירת הצעת המחיר. נסה שוב.";
      } finally {
        this.isAccepting = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #0b0b0f;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Arial, sans-serif;

.client-quotations-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.client-quotations-modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: $bg;
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.3);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba($orange, 0.2);
  }

  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 1000;
    color: $orange2;
    font-family: $font-family;
  }

  &__close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: $text;
    font-size: 24px;
    font-weight: 1000;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba($orange, 0.4);
    }
  }

  &__job-info {
    padding: 16px 24px;
    border-bottom: 1px solid rgba($orange, 0.2);
  }

  &__tabs {
    display: flex;
    gap: 8px;
    padding: 16px 24px;
    border-bottom: 1px solid rgba($orange, 0.2);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__content {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__empty {
    padding: 40px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__error {
    padding: 12px 24px;
    background: rgba(255, 59, 59, 0.1);
    border-top: 1px solid rgba(255, 59, 59, 0.3);
    color: #ff3b3b;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
  }
}

.job-info-card {
  padding: 14px;
  border-radius: 12px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.3);

  &__title {
    font-size: 16px;
    font-weight: 1000;
    color: $orange2;
    margin-bottom: 6px;
  }

  &__location {
    font-size: 13px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
  }
}

.quotation-tab {
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 13px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.5);
  }

  &--active {
    background: rgba($orange, 0.2);
    border-color: $orange;
    color: $orange2;
  }

  &__name {
    font-size: 14px;
    font-weight: 1000;
  }

  &__price {
    font-size: 16px;
    font-weight: 1200;
    color: $orange2;
  }
}

.quotation-details {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba($orange, 0.2);
  }

  &__handyman-name {
    margin: 0;
    font-size: 18px;
    font-weight: 1000;
    color: $orange2;
  }

  &__price {
    font-size: 24px;
    font-weight: 1200;
    color: $orange2;
  }

  &__text {
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba($orange, 0.2);
  }

  &__text-label {
    font-size: 12px;
    font-weight: 1000;
    color: $muted;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__text-content {
    font-size: 14px;
    font-weight: 700;
    color: $text;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  &__date {
    font-size: 12px;
    font-weight: 700;
    color: $muted;
    text-align: left;
  }
}

.accept-btn {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
  font-size: 16px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  box-shadow: 0 8px 24px rgba($orange, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba($orange, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.empty-state {
  text-align: center;

  &__icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  &__text {
    font-size: 16px;
    font-weight: 1000;
    color: $muted;
  }
}

@media (max-width: 420px) {
  .client-quotations-modal-overlay {
    padding: 8px;
  }

  .client-quotations-modal {
    max-height: 95vh;
    border-radius: 16px;
    max-width: 100%;

    &__header {
      padding: 14px 16px;
    }

    &__title {
      font-size: 18px;
    }

    &__job-info,
    &__tabs,
    &__content {
      padding: 14px 16px;
    }
  }

  .job-info-card {
    padding: 12px;

    &__title {
      font-size: 15px;
    }

    &__location {
      font-size: 12px;
    }
  }

  .quotation-tab {
    min-width: 90px;
    padding: 8px 10px;
    font-size: 12px;

    &__name {
      font-size: 13px;
    }

    &__price {
      font-size: 14px;
    }
  }

  .quotation-details {
    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    &__handyman-name {
      font-size: 16px;
    }

    &__price {
      font-size: 20px;
    }

    &__text {
      padding: 12px;
    }

    &__text-label {
      font-size: 11px;
    }

    &__text-content {
      font-size: 13px;
    }
  }

  .accept-btn {
    padding: 14px;
    font-size: 15px;
  }
}

@media (max-width: 420px) and (orientation: landscape) {
  .client-quotations-modal {
    max-height: 98vh;
  }

  .client-quotations-modal__content {
    max-height: 50vh;
    overflow-y: auto;
  }
}
</style>
