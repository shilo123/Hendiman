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
                <i class="ph ph-x"></i>
              </button>
              <span class="quotation-modal__title">הצעת מחיר</span>
              
              <button
                v-if="inputMode === 'manual'"
                type="button"
                class="header-ai-btn"
                @click="requestAISuggestion"
                :disabled="isLoadingAI"
              >
                <i class="ph-fill ph-sparkle"></i>
                <span>AI</span>
              </button>
              <div v-else class="quotation-modal__icon">
                <i class="ph ph-receipt"></i>
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
                      <i class="ph ph-map-pin"></i>
                      <span>{{ job?.locationText || "מיקום לא צוין" }}</span>
                    </div>
                    <p v-if="job?.desc" class="job-info-card__desc">
                      {{ job.desc }}
                    </p>
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
                      <i class="ph ph-pencil-simple"></i>
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
                      <i class="ph ph-quotes"></i>
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
              </div>

              <!-- AI Writing Mode -->
              <div v-else-if="inputMode === 'ai'" class="ai-section">
                <div class="ai-writing-container">
                  <div class="ai-header">
                    <div class="ai-avatar">
                      <i class="ph-fill ph-sparkle"></i>
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
                    <i class="ph ph-pencil-simple"></i>
                    כתוב ידנית
                  </button>
                  <button
                    type="button"
                    class="ai-action-btn ai-action-btn--secondary"
                    @click="requestAISuggestion"
                    :disabled="isLoadingAI"
                  >
                    <i class="ph ph-arrows-clockwise"></i>
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
                <div v-if="isSubmitting" class="submit-btn__loader"></div>
                <div v-else class="submit-btn__content">
                  <i class="ph-bold ph-paper-plane-right"></i>
                  <span>שליחת הצעה</span>
                </div>
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
$bg: #0f0f10;
$bg-card: #18181b;
$bg-input: #09090b;
$text: #ffffff;
$muted: #a1a1aa;
$primary: #ff7b00;
$primary-dark: #e06c00;
$orange: #ff7b00;
$orange-glow: rgba(255, 123, 0, 0.2);
$success: #10b981;
$error: #ef4444;
$ai-purple: #8b5cf6;
$ai-gradient: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
$font-family: "Heebo", "Inter", sans-serif;

.quotation-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 100020;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.quotation-modal {
  width: 100%;
  max-width: 500px;
  height: 92dvh;
  background: $bg;
  border-radius: 2.5rem 2.5rem 0 0;
  box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: $font-family;

  @media (min-width: 640px) {
    height: auto;
    max-height: 90vh;
    border-radius: 2.5rem;
    margin-bottom: 20px;
  }

  &__handle-area {
    padding: 12px 0 4px;
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
    width: 40px;
    height: 4px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 999px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    flex-shrink: 0;
    z-index: 10;
    background: $bg;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
    color: $text;
    letter-spacing: -0.01em;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.08);

    i {
      font-size: 20px;
      color: $muted;
    }
  }

  &__close {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: $muted;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 20px;
    }

    &:hover {
      color: $text;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
  }

  &__job-info {
    padding: 16px 20px 0;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px 140px;
    min-height: 0;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }
  }

  &__footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 24px));
    background: rgba($bg, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 20;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.3);
  }

  &__error {
    position: absolute;
    bottom: 110px;
    left: 20px;
    right: 20px;
    padding: 12px 16px;
    background: rgba($error, 0.1);
    border: 1px solid rgba($error, 0.2);
    border-radius: 12px;
    color: $error;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 25;
    animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
}

.header-ai-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  background: $ai-gradient;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

  i {
    font-size: 16px;
    }

  &:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.45);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.job-info-card {
  margin-bottom: 20px;

  &__content {
    display: flex;
    gap: 16px;
    padding: 16px;
    border-radius: 1.25rem;
    background: $bg-card;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &__details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 11px;
    font-weight: 800;
    color: $primary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__title {
    font-size: 17px;
    font-weight: 800;
    color: $text;
    line-height: 1.2;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $muted;
    margin-top: 2px;

    i {
      font-size: 16px;
      color: $primary;
    }
  }

  &__desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    margin-top: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.03);
    padding: 8px 12px;
    border-radius: 8px;
    border-right: 2px solid rgba($primary, 0.3);
  }

  &__image {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }
}

.input-group {
  margin-bottom: 24px;
}

.input-label {
  font-size: 14px;
  font-weight: 800;
  color: $text;
  margin-bottom: 12px;
  display: block;
  opacity: 0.9;
}

.price-input-wrapper {
  position: relative;
  width: 100%;
}

.price-input {
  width: 100%;
  height: 80px;
  padding: 0 24px 0 60px;
  border-radius: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.08);
  background: $bg-input;
  color: $primary;
  font-size: 42px;
  font-weight: 900;
  text-align: center;
  transition: all 0.2s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
    border-color: $primary;
    background: rgba($primary, 0.03);
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }
}

.price-currency {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  font-weight: 800;
  color: $muted;
}

.text-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.edit-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: $primary;
  font-size: 12px;
  font-weight: 700;
  opacity: 0.8;
}

.textarea-wrapper {
  position: relative;
}

.text-input {
  width: 100%;
  padding: 16px 16px 16px 40px;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: $bg-card;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  min-height: 140px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba($primary, 0.4);
    background: rgba(255, 255, 255, 0.04);
  }
}

.textarea-icon {
  position: absolute;
  left: 16px;
  bottom: 16px;
  color: rgba(255, 255, 255, 0.15);
  font-size: 20px;
}

.ai-writing-container {
  padding: 24px;
  border-radius: 1.5rem;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  position: relative;
  overflow: hidden;
}

.ai-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: $ai-gradient;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  position: relative;
  z-index: 2;
}

.ai-badge {
  background: $ai-gradient;
  padding: 4px 10px;
  border-radius: 8px;
  color: white;
  font-weight: 900;
  font-size: 11px;
}

.ai-text-display {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.ai-price-display {
  background: rgba(139, 92, 246, 0.1);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.ai-price-value {
  color: #a78bfa;
  font-size: 32px;
  font-weight: 900;
}

.ai-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}

.ai-action-btn {
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &--secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

.cancel-btn {
  height: 56px;
  padding: 0 24px;
  background: transparent;
  border: none;
  color: $muted;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
}

.submit-btn {
  flex: 1;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FF8F00 0%, #FF5F00 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 800;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(255, 95, 0, 0.3);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &__content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  i {
    font-size: 20px;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 12px 32px rgba(255, 95, 0, 0.45);
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.submit-btn__loader {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

@media (max-width: 420px) {
  .quotation-modal {
    &__title { font-size: 16px; }
    &__content { padding: 16px 16px 140px; }
    &__footer { padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 24px)); }
  }

  .job-info-card {
    &__title { font-size: 15px; }
    &__image { width: 60px; height: 60px; }
  }

  .price-input { height: 70px; font-size: 32px; }
}
</style>


