<template>
  <div
    v-if="visible"
    class="handyman-quotation-modal-overlay"
    @click.self="handleClose"
  >
    <div class="handyman-quotation-modal" dir="rtl">
      <!-- Header -->
      <div class="handyman-quotation-modal__header">
        <h2 class="handyman-quotation-modal__title">הצעת מחיר</h2>
        <button
          class="handyman-quotation-modal__close"
          @click="handleClose"
          aria-label="סגור"
        >
          ×
        </button>
      </div>

      <!-- Job Details -->
      <div class="handyman-quotation-modal__job-details">
        <!-- Images Gallery -->
        <div v-if="job.imageUrl && job.imageUrl.length > 0" class="job-images">
          <div class="job-images__grid">
            <div
              v-for="(image, index) in job.imageUrl"
              :key="index"
              class="job-images__item"
              @click="openImageModal(image)"
            >
              <img :src="image" :alt="`תמונה ${index + 1}`" />
            </div>
          </div>
        </div>

        <!-- Job Info -->
        <div class="job-info">
          <div class="job-info__item">
            <span class="job-info__label">תיאור:</span>
            <span class="job-info__value">{{ job.desc || "אין תיאור" }}</span>
          </div>

          <div class="job-info__item">
            <span class="job-info__label">תחום:</span>
            <span class="job-info__value">{{
              getSubcategoryText()
            }}</span>
          </div>

          <div class="job-info__item">
            <span class="job-info__label">מיקום:</span>
            <span class="job-info__value">{{ job.locationText || "מיקום" }}</span>
          </div>

          <div class="job-info__item">
            <span class="job-info__label">דחיפות:</span>
            <span
              class="job-info__value"
              :class="{ 'job-info__value--urgent': job.urgent }"
            >
              {{ job.urgent ? "דחוף" : "רגיל" }}
            </span>
          </div>

          <div class="job-info__item">
            <span class="job-info__label">מועד:</span>
            <span class="job-info__value">{{
              job.when === "asap" ? "בהקדם האפשרי" : job.when
            }}</span>
          </div>

          <!-- Countdown Timer -->
          <div v-if="quotedUntil" class="job-info__countdown">
            <span class="job-info__countdown-icon">⏰</span>
            <span class="job-info__countdown-text">
              זמן שנותר: {{ timeRemaining }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quotation Form -->
      <div class="handyman-quotation-modal__form">
        <!-- AI Text Generation Button -->
        <button
          type="button"
          class="ai-text-btn"
          @click="generateAIText"
          :disabled="isGeneratingAIText"
        >
          <span v-if="isGeneratingAIText" class="ai-text-btn__spinner"></span>
          <span v-else class="ai-text-btn__icon">🤖</span>
          <span>{{
            isGeneratingAIText ? "מייצר טקסט..." : "הצעת מחיר בעזרת AI"
          }}</span>
        </button>

        <!-- AI Generated Text (Streaming) -->
        <div v-if="aiGeneratedText" class="ai-text-display">
          <div class="ai-text-display__content">{{ aiGeneratedText }}</div>
          <button
            type="button"
            class="ai-text-display__use-btn"
            @click="useAIGeneratedText"
          >
            השתמש בטקסט זה
          </button>
        </div>

        <!-- Handyman Text -->
        <div class="form-field">
          <label class="form-field__label">הסבר להצעת המחיר</label>
          <textarea
            v-model="handymanText"
            class="form-field__textarea"
            rows="4"
            placeholder="תאר בקצרה את העבודה, מה תכלול, וכל מידע רלוונטי..."
            maxlength="500"
          ></textarea>
          <div class="form-field__hint">
            {{ handymanText.length }}/500 תווים
          </div>
        </div>

        <!-- Quotation Amount -->
        <div class="form-field">
          <label class="form-field__label">סכום הצעת המחיר (₪)</label>
          <input
            v-model.number="quotation"
            type="number"
            class="form-field__input"
            placeholder="הזן סכום"
            min="1"
            step="1"
          />
          <div v-if="quotationError" class="form-field__error">
            {{ quotationError }}
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="submitError" class="form-error">
          {{ submitError }}
        </div>

        <!-- Submit Button -->
        <button
          type="button"
          class="submit-btn"
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
        >
          <span v-if="isSubmitting">שולח...</span>
          <span v-else>שלח הצעת מחיר</span>
        </button>

        <!-- Already Submitted Message -->
        <div v-if="hasExistingQuote" class="already-submitted">
          <span class="already-submitted__icon">✓</span>
          <span class="already-submitted__text">כבר הצעת מחיר לעבודה זו</span>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div
      v-if="selectedImage"
      class="image-modal-overlay"
      @click.self="selectedImage = null"
    >
      <div class="image-modal">
        <button
          class="image-modal__close"
          @click="selectedImage = null"
          aria-label="סגור"
        >
          ×
        </button>
        <img :src="selectedImage" alt="תמונה" />
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
  name: "HandymanQuotationModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    job: {
      type: Object,
      required: true,
    },
    handymanId: {
      type: String,
      required: true,
    },
    handymanName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      toast: null,
      handymanText: "",
      quotation: null,
      quotationError: "",
      submitError: "",
      isSubmitting: false,
      isGeneratingAIText: false,
      aiGeneratedText: "",
      selectedImage: null,
      hasExistingQuote: false,
      timeRemaining: "",
      countdownInterval: null,
    };
  },
  computed: {
    isFormValid() {
      return (
        this.quotation &&
        typeof this.quotation === "number" &&
        this.quotation > 0 &&
        !this.hasExistingQuote
      );
    },
    quotedUntil() {
      return this.job.quotedUntil ? new Date(this.job.quotedUntil) : null;
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.checkExistingQuote();
        this.startCountdown();
      } else {
        this.stopCountdown();
        this.resetForm();
      }
    },
    quotation(newVal) {
      if (newVal && newVal < 1) {
        this.quotationError = "הסכום חייב להיות גדול מ-0";
      } else {
        this.quotationError = "";
      }
    },
  },
  mounted() {
    this.toast = useToast();
  },
  beforeUnmount() {
    this.stopCountdown();
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
    checkExistingQuote() {
      const quotations = Array.isArray(this.job.quotations)
        ? this.job.quotations
        : [];
      this.hasExistingQuote = quotations.some(
        (q) => String(q.handymanId) === String(this.handymanId)
      );
    },
    startCountdown() {
      if (!this.quotedUntil) return;

      this.updateCountdown();
      this.countdownInterval = setInterval(() => {
        this.updateCountdown();
      }, 1000);
    },
    stopCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },
    updateCountdown() {
      if (!this.quotedUntil) {
        this.timeRemaining = "";
        return;
      }

      const now = new Date();
      const diff = this.quotedUntil - now;

      if (diff <= 0) {
        this.timeRemaining = "פג תוקף";
        this.stopCountdown();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        this.timeRemaining = `${minutes} דקות ${seconds} שניות`;
      } else {
        this.timeRemaining = `${seconds} שניות`;
      }
    },
    resetForm() {
      this.handymanText = "";
      this.quotation = null;
      this.quotationError = "";
      this.submitError = "";
      this.aiGeneratedText = "";
      this.selectedImage = null;
    },
    openImageModal(image) {
      this.selectedImage = image;
    },
    async generateAIText() {
      if (!this.job._id || !this.handymanId) {
        this.toast?.showError("חסרים פרטים ליצירת טקסט");
        return;
      }

      this.isGeneratingAIText = true;
      this.aiGeneratedText = "";

      try {
        const response = await fetch(`${URL}/api/ai/quotation-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: this.job._id,
            handymanId: this.handymanId,
          }),
        });

        if (!response.ok) {
          throw new Error("שגיאה ביצירת טקסט");
        }

        // Read streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  this.aiGeneratedText += data.content;
                }
                if (data.done) {
                  break;
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        logger.error("Error generating AI text:", error);
        this.toast?.showError("שגיאה ביצירת טקסט. נסה שוב.");
      } finally {
        this.isGeneratingAIText = false;
      }
    },
    useAIGeneratedText() {
      this.handymanText = this.aiGeneratedText;
    },
    async handleSubmit() {
      if (!this.isFormValid) {
        this.submitError = "יש למלא את כל השדות";
        return;
      }

      if (this.hasExistingQuote) {
        this.submitError = "כבר הצעת מחיר לעבודה זו";
        return;
      }

      this.isSubmitting = true;
      this.submitError = "";

      try {
        const response = await axios.post(
          `${URL}/api/jobs/${this.job._id}/quotations`,
          {
            handymanId: this.handymanId,
            handymanName: this.handymanName,
            quotation: this.quotation,
            handymanText: this.handymanText,
          }
        );

        if (response.data.success) {
          this.toast?.showSuccess("הצעת המחיר נשלחה בהצלחה!");
          this.$emit("submitted", response.data.quotation);
          this.handleClose();
        } else {
          this.submitError =
            response.data.message || "שגיאה בשליחת הצעת המחיר";
        }
      } catch (error) {
        logger.error("Error submitting quotation:", error);
        this.submitError =
          error.response?.data?.message ||
          "שגיאה בשליחת הצעת המחיר. נסה שוב.";
      } finally {
        this.isSubmitting = false;
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

.handyman-quotation-modal-overlay {
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

.handyman-quotation-modal {
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

  &__job-details {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
  }

  &__form {
    padding: 20px 24px;
    border-top: 1px solid rgba($orange, 0.2);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.job-images {
  margin-bottom: 20px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }

  &__item {
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid rgba($orange, 0.3);
    transition: all 0.2s ease;

    &:hover {
      border-color: $orange;
      transform: scale(1.05);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.job-info {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__item {
    display: flex;
    gap: 8px;
    font-size: 14px;
  }

  &__label {
    font-weight: 1000;
    color: $orange2;
    min-width: 80px;
  }

  &__value {
    color: $text;
    font-weight: 700;
    flex: 1;

    &--urgent {
      color: #ff3b3b;
    }
  }

  &__countdown {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba($orange, 0.15);
    border: 1px solid rgba($orange, 0.3);
    margin-top: 8px;
  }

  &__countdown-icon {
    font-size: 18px;
  }

  &__countdown-text {
    font-size: 13px;
    font-weight: 1000;
    color: $orange2;
  }
}

.ai-text-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.1);
  color: $orange2;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: $font-family;

  &:hover:not(:disabled) {
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba($orange, 0.3);
    border-top-color: $orange;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__icon {
    font-size: 18px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-text-display {
  padding: 14px;
  border-radius: 12px;
  background: rgba($orange, 0.08);
  border: 1px solid rgba($orange, 0.2);

  &__content {
    font-size: 14px;
    font-weight: 700;
    color: $text;
    line-height: 1.6;
    margin-bottom: 10px;
    white-space: pre-wrap;
  }

  &__use-btn {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba($orange, 0.4);
    background: rgba($orange, 0.15);
    color: $orange2;
    font-size: 12px;
    font-weight: 1000;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($orange, 0.2);
      border-color: rgba($orange, 0.6);
    }
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: 13px;
    font-weight: 1000;
    color: $text;
  }

  &__textarea,
  &__input {
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba($orange, 0.3);
    background: rgba(255, 255, 255, 0.06);
    color: $text;
    font-size: 14px;
    font-weight: 700;
    font-family: $font-family;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: $orange;
      box-shadow: 0 0 0 3px rgba($orange, 0.15);
      background: rgba(255, 255, 255, 0.08);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  &__textarea {
    resize: vertical;
    min-height: 100px;
  }

  &__hint {
    font-size: 11px;
    font-weight: 700;
    color: $muted;
    text-align: left;
  }

  &__error {
    font-size: 11px;
    font-weight: 700;
    color: #ff3b3b;
  }
}

.form-error {
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 59, 59, 0.1);
  border: 1px solid rgba(255, 59, 59, 0.3);
  color: #ff3b3b;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 14px;
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

.already-submitted {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(25, 210, 124, 0.1);
  border: 1px solid rgba(25, 210, 124, 0.3);
  color: #19d27c;
  font-size: 13px;
  font-weight: 1000;

  &__icon {
    font-size: 18px;
  }
}

.image-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.image-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;

  img {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 12px;
  }

  &__close {
    position: absolute;
    top: -40px;
    left: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 24px;
    font-weight: 1000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

@media (max-width: 420px) {
  .handyman-quotation-modal-overlay {
    padding: 8px;
  }

  .handyman-quotation-modal {
    max-height: 95vh;
    border-radius: 16px;
    max-width: 100%;

    &__header {
      padding: 14px 16px;
    }

    &__title {
      font-size: 18px;
    }

    &__job-details,
    &__form {
      padding: 14px 16px;
    }
  }

  .job-images__grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 6px;
  }

  .job-info {
    &__item {
      font-size: 13px;
      flex-direction: column;
      gap: 4px;
    }

    &__label {
      min-width: auto;
      font-size: 12px;
    }

    &__value {
      font-size: 13px;
    }

    &__countdown {
      padding: 8px 12px;
      font-size: 12px;
    }
  }

  .form-field {
    &__label {
      font-size: 12px;
    }

    &__textarea,
    &__input {
      padding: 10px 12px;
      font-size: 13px;
    }
  }

  .ai-text-btn {
    padding: 10px 14px;
    font-size: 13px;
  }

  .submit-btn {
    padding: 12px;
    font-size: 15px;
  }
}

@media (max-width: 420px) and (orientation: landscape) {
  .handyman-quotation-modal {
    max-height: 98vh;
  }

  .handyman-quotation-modal__job-details {
    max-height: 40vh;
    overflow-y: auto;
  }
}
</style>

