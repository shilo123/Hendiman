<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="quotation-modal-overlay"
        @click.self="handleClose"
      >
        <transition name="slide-up">
          <div v-if="visible" class="quotation-modal" dir="rtl">
            <!-- Handle bar for drag -->
            <div class="quotation-modal__handle-area" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
              <div class="quotation-modal__handle"></div>
            </div>

            <!-- Header -->
            <div class="quotation-modal__header">
              <button
                class="quotation-modal__close"
                type="button"
                @click="handleClose"
                aria-label="סגור"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
              <span class="quotation-modal__title">הצעת מחיר</span>
              <div class="quotation-modal__icon">
                <span class="material-symbols-outlined">receipt_long</span>
              </div>
            </div>

            <!-- Job Info -->
            <div class="quotation-modal__job-info">
              <div class="job-info-card">
                <div class="job-info-card__content">
                  <div class="job-info-card__details">
                    <p class="job-info-card__label">פרטי עבודה</p>
                    <h3 class="job-info-card__title">{{ getSubcategoryText() }}</h3>
                    <div class="job-info-card__location">
                      <span class="material-symbols-outlined">location_on</span>
                      <span>{{ job?.locationText || "מיקום לא צוין" }}</span>
                    </div>
                  </div>
                  <div v-if="job?.imageUrl && job.imageUrl.length > 0" class="job-info-card__image" :style="{ backgroundImage: `url(${job.imageUrl[0]})` }"></div>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="quotation-modal__content">
              <!-- Manual Input Mode -->
              <div v-if="inputMode === 'manual'" class="input-section">
                <!-- Text Input - First -->
                <div class="input-group">
                  <div class="text-input-header">
                    <label class="input-label">פירוט ההצעה</label>
                    <div class="edit-hint">
                      <span class="material-symbols-outlined">edit</span>
                      <span>עריכה</span>
                    </div>
                  </div>
                  <div class="textarea-wrapper">
                    <textarea
                      v-model="handimanText"
                      class="text-input"
                      placeholder="שלום, ראיתי את פנייתך. ההצעה שלי כוללת ביקור, איתור התקלה ותיקון..."
                      rows="6"
                      maxlength="500"
                    ></textarea>
                    <div class="textarea-icon">
                      <span class="material-symbols-outlined">format_quote</span>
                    </div>
                  </div>
                </div>

                <!-- Price Input - Second -->
                <div class="input-group">
                  <label class="input-label">המחיר שלך (כולל מע״מ)</label>
                  <div class="price-input-wrapper">
                    <input
                      v-model.number="price"
                      type="number"
                      class="price-input"
                      placeholder="0"
                      min="1"
                      @input="validatePrice"
                    />
                    <span class="price-currency">₪</span>
                  </div>
                </div>

                <!-- AI Button - Third -->
                <div class="ai-button-wrapper">
                  <button
                    type="button"
                    class="ai-suggest-btn"
                    @click="requestAISuggestion"
                    :disabled="isLoadingAI"
                  >
                    <span class="material-symbols-outlined ai-suggest-btn__icon">auto_awesome</span>
                    <span>צור הצעה עם AI</span>
                  </button>
                </div>
              </div>

              <!-- AI Writing Mode -->
              <div v-else-if="inputMode === 'ai'" class="ai-section">
                <div class="ai-writing-container">
                  <div class="ai-header">
                    <div class="ai-avatar">
                      <span class="material-symbols-outlined">auto_awesome</span>
                      <span class="ai-pulse"></span>
                    </div>
                    <div class="ai-title">
                      <span v-if="isLoadingAI">AI כותב את ההצעה...</span>
                      <span v-else>הצעת מחיר מ-AI</span>
                    </div>
                    <span v-if="!isLoadingAI" class="ai-badge">AI</span>
                  </div>

                  <!-- AI Generated Text - First -->
                  <div class="ai-text-display">
                    <div class="ai-text-label">הסבר:</div>
                    <div class="ai-text-content" ref="aiTextContainer">
                      <span v-if="isLoadingAI && !aiText" class="ai-typing-indicator">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                      </span>
                      <span v-else class="ai-text-stream">{{ aiText || '...' }}</span>
                    </div>
                  </div>

                  <!-- Price Input for AI Mode - Second -->
                  <div class="input-group">
                    <label class="input-label">המחיר שלך (כולל מע״מ)</label>
                    <div class="price-input-wrapper">
                      <input
                        v-model.number="price"
                        type="number"
                        class="price-input"
                        placeholder="0"
                        min="1"
                        @input="validatePrice"
                      />
                      <span class="price-currency">₪</span>
                    </div>
                  </div>

                  <!-- AI Generated Price Range (Reference Only) - Third -->
                  <div class="ai-price-display">
                    <span class="ai-price-label">טווח מחיר מוצע (המלצה בלבד):</span>
                    <div class="ai-price-range">
                      <span class="ai-price-value">
                        {{ aiPriceMin || '---' }}
                        <span v-if="aiPriceMin" class="ai-price-currency">₪</span>
                      </span>
                      <span v-if="aiPriceMin && aiPriceMax" class="ai-price-separator">-</span>
                      <span class="ai-price-value">
                        {{ aiPriceMax || '---' }}
                        <span v-if="aiPriceMax" class="ai-price-currency">₪</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- AI Mode Buttons -->
                <div class="ai-actions">
                  <button
                    type="button"
                    class="ai-action-btn ai-action-btn--secondary"
                    @click="switchToManual"
                    :disabled="isLoadingAI"
                  >
                    <span class="material-symbols-outlined">edit</span>
                    כתוב ידנית
                  </button>
                  <button
                    type="button"
                    class="ai-action-btn ai-action-btn--secondary"
                    @click="requestAISuggestion"
                    :disabled="isLoadingAI"
                  >
                    <span class="material-symbols-outlined">refresh</span>
                    הצעה אחרת
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="quotation-modal__footer">
              <button
                type="button"
                class="cancel-btn"
                @click="handleClose"
                :disabled="isSubmitting"
              >
                ביטול
              </button>
              <button
                type="button"
                class="submit-btn"
                @click="submitQuotation"
                :disabled="!canSubmit || isSubmitting"
              >
                <span v-if="isSubmitting" class="submit-btn__loader"></span>
                <span v-else class="submit-btn__content">
                  <span class="material-symbols-outlined submit-btn__icon">arrow_back</span>
                  <span>שליחת הצעה</span>
                </span>
              </button>
            </div>

            <!-- Error Message -->
            <transition name="fade">
              <div v-if="error" class="quotation-modal__error">
                <span class="error-icon">⚠️</span>
                {{ error }}
              </div>
            </transition>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
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
      required: false,
      default: null,
    },
    handymanId: {
      type: String,
      required: false,
      default: "",
    },
    handymanName: {
      type: String,
      required: false,
      default: "",
    },
  },
  emits: ["close", "submitted"],
  data() {
    return {
      toast: null,
      inputMode: "manual", // 'manual' or 'ai'
      price: null,
      handimanText: "",
      aiPriceMin: null,
      aiPriceMax: null,
      aiText: "",
      isLoadingAI: false,
      isSubmitting: false,
      error: "",
      // Touch handling for drag-to-close
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false,
    };
  },
  computed: {
    canSubmit() {
      // Don't allow submission if already submitted
      if (this.hasAlreadySubmitted) {
        return false;
      }
      if (this.inputMode === "manual") {
        return this.price && this.price > 0 && this.handimanText && this.handimanText.trim().length > 0;
      } else {
        // In AI mode, need both price and text
        return this.price && this.price > 0 && this.aiText && this.aiText.trim().length > 0 && !this.isLoadingAI;
      }
    },
    existingQuotationsCount() {
      if (this.job && Array.isArray(this.job.quotations)) {
        return this.job.quotations.length;
      }
      return 0;
    },
    finalPrice() {
      // In AI mode, use the price from input (user entered it)
      // In manual mode, use the price from input
      return this.price;
    },
    finalText() {
      return this.inputMode === "ai" ? this.aiText : this.handimanText;
    },
    hasAlreadySubmitted() {
      // Check if handyman has already submitted a quotation for this job
      if (!this.job || !this.handymanId || !Array.isArray(this.job.quotations)) {
        return false;
      }
      return this.job.quotations.some(
        (q) => String(q.handymanId) === String(this.handymanId)
      );
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
        // Check if already submitted and show error
        if (this.hasAlreadySubmitted) {
          this.error = "כבר שלחת הצעת מחיר לעבודה זו";
        }
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    },
    // Auto-scroll when AI text is being written
    aiText() {
      if (this.inputMode === "ai" && this.$refs.aiTextContainer) {
        this.$nextTick(() => {
          const container = this.$refs.aiTextContainer;
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          }
        });
      }
    },
  },
  mounted() {
    this.toast = useToast();
  },
  beforeUnmount() {
    document.body.style.overflow = "";
  },
  methods: {
    handleClose() {
      if (this.isSubmitting || this.isLoadingAI) return;
      this.$emit("close");
    },
    resetForm() {
      this.inputMode = "manual";
      this.price = null;
      this.handimanText = "";
      this.aiPriceMin = null;
      this.aiPriceMax = null;
      this.aiText = "";
      this.isLoadingAI = false;
      this.isSubmitting = false;
      this.error = "";
    },
    validatePrice() {
      if (this.price && this.price < 0) {
        this.price = 0;
      }
    },
    truncateDesc(desc) {
      if (!desc) return "";
      return desc.length > 100 ? desc.slice(0, 100) + "..." : desc;
    },
    getSubcategoryText() {
      if (
        this.job &&
        this.job.subcategoryInfo &&
        Array.isArray(this.job.subcategoryInfo) &&
        this.job.subcategoryInfo.length > 0
      ) {
        const quotedSub = this.job.subcategoryInfo.find(
          (sub) => sub.price === "bid"
        );
        if (quotedSub) {
          return quotedSub.subcategory || quotedSub.category || "עבודה כללית";
        }
        return (
          this.job.subcategoryInfo[0].subcategory ||
          this.job.subcategoryInfo[0].category ||
          "עבודה כללית"
        );
      }
      return "עבודה כללית";
    },
    switchToManual() {
      this.inputMode = "manual";
      // Copy AI text to manual field
      if (this.aiText) {
        this.handimanText = this.aiText;
      }
      // Price is already set by user in AI mode, so keep it
    },
    async requestAISuggestion() {
      this.isLoadingAI = true;
      this.inputMode = "ai";
      this.aiText = "";
      this.aiPriceMin = null;
      this.aiPriceMax = null;
      this.error = "";

      try {
        const response = await fetch(`${URL}/api/quotations/ai-suggest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: this.job?._id || this.job?.id,
            desc: this.job?.desc || "",
            subcategoryInfo: this.job?.subcategoryInfo || [],
            locationText: this.job?.locationText || "",
            imageUrls: this.job?.imageUrl || [],
            clientName: this.job?.clientName || "",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get AI suggestion");
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let priceRangeSet = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Parse SSE events
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                this.isLoadingAI = false;
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                // Handle price range
                if (parsed.priceMin && parsed.priceMax && !priceRangeSet) {
                  this.aiPriceMin = parsed.priceMin;
                  this.aiPriceMax = parsed.priceMax;
                  priceRangeSet = true;
                } else if (parsed.priceRange && !priceRangeSet) {
                  // Alternative format: { priceRange: { min: X, max: Y } }
                  this.aiPriceMin = parsed.priceRange.min;
                  this.aiPriceMax = parsed.priceRange.max;
                  priceRangeSet = true;
                }
                // Handle streaming text
                if (parsed.text) {
                  this.aiText += parsed.text;
                  // Auto-scroll to bottom with smooth scrolling
                  this.$nextTick(() => {
                    if (this.$refs.aiTextContainer) {
                      const container = this.$refs.aiTextContainer;
                      // Smooth scroll to bottom
                      container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  });
                }
                if (parsed.error) {
                  this.error = parsed.error;
                  this.isLoadingAI = false;
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }

        this.isLoadingAI = false;
      } catch (error) {
        logger.error("Error getting AI suggestion:", error);
        this.error = "שגיאה בקבלת הצעה מ-AI. נסה שוב.";
        this.isLoadingAI = false;
        this.inputMode = "manual";
      }
    },
    async submitQuotation() {
      if (!this.canSubmit || this.isSubmitting) return;

      this.isSubmitting = true;
      this.error = "";

      try {
        const jobId = this.job?._id || this.job?.id;
        if (!jobId) {
          throw new Error("לא נמצא מזהה עבודה");
        }

        const response = await axios.post(`${URL}/api/jobs/${jobId}/quotations`, {
          handymanId: this.handymanId,
          handymanName: this.handymanName,
          quotation: this.finalPrice,
          handimanText: this.finalText,
          isAI: this.inputMode === "ai",
        });

        if (response.data.success) {
          this.toast?.showSuccess("הצעת המחיר נשלחה בהצלחה!");
          this.$emit("submitted", {
            jobId,
            quotation: this.finalPrice,
            handimanText: this.finalText,
            isAI: this.inputMode === "ai",
          });
          this.$emit("close");
        } else {
          this.error = response.data.message || "שגיאה בשליחת הצעת המחיר";
        }
      } catch (error) {
        logger.error("Error submitting quotation:", error);
        this.error =
          error.response?.data?.message || "שגיאה בשליחת הצעת המחיר. נסה שוב.";
      } finally {
        this.isSubmitting = false;
      }
    },
    // Touch handlers for drag-to-close
    onTouchStart(e) {
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = true;
    },
    onTouchMove(e) {
      if (!this.isDragging) return;
      this.touchCurrentY = e.touches[0].clientY;
    },
    onTouchEnd() {
      if (!this.isDragging) return;
      const diff = this.touchCurrentY - this.touchStartY;
      if (diff > 100) {
        this.handleClose();
      }
      this.isDragging = false;
      this.touchStartY = 0;
      this.touchCurrentY = 0;
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #121212;
$bg-card: #1c1c1e;
$bg-input: #18181a;
$text: rgba(255, 255, 255, 0.9);
$muted: rgba(255, 255, 255, 0.4);
$primary: #ec6d13;
$primary-dark: #d15605;
$orange: #ec6d13;
$orange2: #ff7d21;
$orange-glow: rgba(236, 109, 19, 0.4);
$success: #00d26a;
$error: #ff3b3b;
$ai-purple: #a855f7;
$ai-purple-glow: rgba(168, 85, 247, 0.3);
$font-family: "Inter", "Noto Sans Hebrew", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;

.quotation-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 100020;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.quotation-modal {
  width: 100%;
  max-width: 500px;
  height: 95dvh;
  background: $bg;
  border-radius: 2.5rem 2.5rem 0 0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &__handle-area {
    padding: 12px 0 8px;
    display: flex;
    justify-content: center;
    cursor: grab;
    touch-action: none;
    background: $bg;
    flex-shrink: 0;
    z-index: 10;

    &:active {
      cursor: grabbing;
    }
  }

  &__handle {
    width: 48px;
    height: 6px;
    background: #3f3f46;
    border-radius: 9999px;
    transition: background 0.2s;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px;
    flex-shrink: 0;
    z-index: 10;
    background: $bg;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: $text;
    font-family: $font-family;
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(63, 63, 70, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.05);

    .material-symbols-outlined {
      font-size: 20px;
      color: $muted;
    }
  }

  &__close {
    padding: 8px;
    margin-right: -8px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: $muted;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    .material-symbols-outlined {
      font-size: 24px;
    }

    &:hover {
      color: $text;
      background: rgba(255, 255, 255, 0.05);
    }
  }

  &__job-info {
    padding: 16px 20px;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px 128px;
    min-height: 0;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    padding-bottom: calc(32px + env(safe-area-inset-bottom));
    background: rgba($bg, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    z-index: 20;
  }

  &__error {
    position: absolute;
    bottom: 100px;
    left: 20px;
    right: 20px;
    padding: 12px 16px;
    background: rgba($error, 0.15);
    border: 1px solid rgba($error, 0.4);
    border-radius: 12px;
    color: $error;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;

    .error-icon {
      font-size: 18px;
    }
  }
}

.job-info-card {
  margin-top: 16px;
  margin-bottom: 32px;

  &__content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    border-radius: 1rem;
    background: $bg-card;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &__details {
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: 12px;
    font-weight: 700;
    color: $primary;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: $text;
    margin-bottom: 4px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #71717a;
    margin-top: 4px;

    .material-symbols-outlined {
      font-size: 14px;
    }
  }

  &__image {
    width: 64px;
    height: 64px;
    border-radius: 0.75rem;
    background-size: cover;
    background-position: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
  }
}

.quotations-count-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba($ai-purple, 0.15);
  border: 1px solid rgba($ai-purple, 0.3);
  color: $ai-purple;
  font-size: 12px;
  font-weight: 700;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 12px;
  font-weight: 700;
  color: $muted;
  margin-bottom: 12px;
  padding-right: 4px;
  letter-spacing: 0.5px;
}

.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.price-input {
  width: 100%;
  padding: 32px 32px 32px 64px;
  border-radius: 1.5rem;
  border: 2px solid rgba($primary, 0.6);
  background: $bg-input;
  color: $text;
  font-size: 5rem;
  font-weight: 700;
  font-family: $font-family;
  transition: all 0.2s;
  text-align: center;
  box-shadow: 0 4px 20px -4px rgba(236, 109, 19, 0.1);

  &::placeholder {
    color: #3f3f46;
    font-weight: 300;
  }

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 4px 20px -4px rgba(236, 109, 19, 0.2);
  }

  /* Hide number input spinners */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
  appearance: textfield;
}

.price-currency {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 3rem;
  font-weight: 300;
  color: #71717a;
}

.text-input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.edit-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba($primary, 0.8);
  font-size: 10px;
  font-weight: 500;

  .material-symbols-outlined {
    font-size: 16px;
  }
}

.textarea-wrapper {
  position: relative;
}

.text-input {
  width: 100%;
  max-width: 100%;
  padding: 16px;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: $bg-card;
  color: $text;
  font-size: 14px;
  font-weight: 400;
  font-family: $font-family;
  resize: none;
  transition: all 0.2s;
  line-height: 1.75;
  min-height: 160px;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-wrap: break-word;

  &::placeholder {
    color: #71717a;
  }

  &:focus {
    outline: none;
    border-color: rgba($primary, 0.4);
  }
}

.textarea-icon {
  position: absolute;
  bottom: 16px;
  left: 16px;
  pointer-events: none;
  opacity: 0.5;

  .material-symbols-outlined {
    font-size: 18px;
    color: #71717a;
  }
}

.ai-button-wrapper {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
  margin: 16px 0;
}

.ai-suggest-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  border-radius: 9999px;
  background: rgba(42, 23, 14, 0.8);
  backdrop-filter: blur(4px);
  border: 1px solid rgba($primary, 0.3);
  color: $primary;
  font-size: 14px;
  font-weight: 600;
  font-family: $font-family;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s;
  }

  &:hover:not(:disabled) {
    background: $primary;
    color: white;
    border-color: $primary;

    &::before {
      border-color: transparent;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon {
    font-size: 18px;
    font-variation-settings: 'FILL' 1;
  }
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

.ai-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Price input in AI mode
.ai-section .input-group {
  margin-top: 0;
}

.ai-section .price-input-wrapper {
  margin-top: 0;
}

.ai-section .price-input {
  font-size: 3rem; // Smaller than manual mode but still prominent
  padding: 24px 24px 24px 56px;
  
  @media (max-width: 640px) {
    font-size: 2.5rem;
    padding: 20px 20px 20px 48px;
  }
}

.ai-section .price-currency {
  font-size: 2.5rem;
  left: 24px;
  
  @media (max-width: 640px) {
    font-size: 2rem;
    left: 20px;
  }
}

.ai-writing-container {
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba($ai-purple, 0.1), rgba($ai-purple, 0.05));
  border: 1px solid rgba($ai-purple, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, $ai-purple, $orange, $ai-purple);
    background-size: 200% 100%;
    animation: gradient-flow 2s linear infinite;
  }
}

@keyframes gradient-flow {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, $ai-purple, darken($ai-purple, 15%));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  position: relative;
}

.ai-pulse {
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  border: 2px solid $ai-purple;
  animation: pulse 1.5s ease-out infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

.ai-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: $text;
}

.ai-badge {
  padding: 4px 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, $ai-purple, darken($ai-purple, 10%));
  color: white;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.ai-price-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba($ai-purple, 0.15);
  margin-bottom: 16px;
}

.ai-price-label {
  font-size: 12px;
  font-weight: 600;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ai-price-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-price-value {
  font-size: 28px;
  font-weight: 900;
  color: $ai-purple;
}

.ai-price-separator {
  font-size: 20px;
  font-weight: 600;
  color: $muted;
}

.ai-price-currency {
  font-size: 18px;
  font-weight: 700;
  margin-right: 2px;
}

.ai-text-display {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.ai-text-label {
  font-size: 12px;
  font-weight: 700;
  color: $muted;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ai-text-content {
  font-size: 15px;
  font-weight: 500;
  color: $text;
  line-height: 1.7;
  max-height: 150px;
  overflow-y: auto;
  scroll-behavior: smooth;
  
  // Hide scrollbar but keep functionality
  scrollbar-width: thin;
  scrollbar-color: rgba($ai-purple, 0.3) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba($ai-purple, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba($ai-purple, 0.5);
    }
  }
}

.ai-text-stream {
  white-space: pre-wrap;
}

.ai-typing-indicator {
  display: inline-flex;
  gap: 4px;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $ai-purple;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.ai-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ai-action-btn {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  font-family: $font-family;
  cursor: pointer;
  transition: all 0.2s;

  &--secondary {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
    color: $text;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.cancel-btn {
  min-width: 80px;
  padding: 16px;
  border-radius: 0;
  border: none;
  background: transparent;
  color: #71717a;
  font-size: 14px;
  font-weight: 500;
  font-family: $font-family;
  cursor: pointer;
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: $text;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.submit-btn {
  flex: 1;
  padding: 16px;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(to right, $primary, $orange2);
  color: white;
  font-size: 16px;
  font-weight: 700;
  font-family: $font-family;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 25px -8px rgba(236, 109, 19, 0.4);

  &:hover:not(:disabled) {
    background: linear-gradient(to right, $primary, $primary);
    transform: scale(0.98);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-direction: row-reverse;
  }

  &__icon {
    font-size: 20px;
    transition: transform 0.2s;
  }

  &:hover:not(:disabled) &__icon {
    transform: translateX(4px);
  }

  &__loader {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Mobile Responsiveness */
@media (max-width: 420px) {
  .quotation-modal {
    max-height: 95vh;
    border-radius: 20px 20px 0 0;

    &__header {
      padding: 6px 16px 12px;
    }

    &__title {
      font-size: 18px;

      &-icon {
        font-size: 20px;
      }
    }

    &__close {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }

    &__job-info {
      padding: 12px 16px;
    }

    &__content {
      padding: 16px;
    }

    &__footer {
      padding: 12px 16px;
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
      gap: 10px;
    }
  }

  .job-info-card {
    padding: 12px;

    &__icon {
      width: 38px;
      height: 38px;
      font-size: 18px;
    }

    &__title {
      font-size: 15px;
    }

    &__location {
      font-size: 12px;
    }

    &__desc {
      font-size: 12px;
    }
  }

  .input-label {
    font-size: 13px;
  }

  .price-input {
    padding: 14px 44px 14px 14px;
    font-size: 18px;
  }

  .price-currency {
    font-size: 18px;
  }

  .text-input {
    padding: 12px 14px;
    font-size: 14px;
  }

  .ai-suggest-btn {
    padding: 14px;
    font-size: 14px;
  }

  .ai-writing-container {
    padding: 16px;
  }

  .ai-avatar {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .ai-title {
    font-size: 14px;
  }

  .ai-price-value {
    font-size: 24px;
  }

  .ai-text-content {
    font-size: 14px;
    max-height: 120px;
  }

  .ai-action-btn {
    padding: 10px 12px;
    font-size: 13px;
  }

  .cancel-btn,
  .submit-btn {
    padding: 14px;
    font-size: 14px;
  }
}
</style>


