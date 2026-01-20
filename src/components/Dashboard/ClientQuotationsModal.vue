<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="client-quotations-modal-overlay"
        @click.self="handleClose"
      >
        <transition name="slide-up">
          <div v-if="visible" class="client-quotations-modal" dir="rtl">
            <!-- Handle -->
            <div 
              class="quotations-modal__handle-area" 
              @touchstart="onTouchStart" 
              @touchmove="onTouchMove" 
              @touchend="onTouchEnd"
            >
              <div class="quotations-modal__handle"></div>
            </div>

            <!-- Header -->
            <div class="client-quotations-modal__header">
              <h2 class="client-quotations-modal__title">
                <span class="title-icon">💰</span>
                התקבלו הצעות מחיר
              </h2>
              <p v-if="quotations.length > 0" class="client-quotations-modal__subtitle">
                יש לך {{ quotations.length }} הצעות חדשות להיום
              </p>
            </div>

            <!-- Job Summary Card -->
            <div class="client-quotations-modal__job-summary">
              <div class="job-summary-card">
                <div class="job-summary-card__icon">
                  <span class="material-symbols-outlined">plumbing</span>
                </div>
                <div class="job-summary-card__content">
                  <span class="job-summary-card__title">{{ getSubcategoryText() }}</span>
                  <div class="job-summary-card__location">
                    <span class="material-symbols-outlined">location_on</span>
                    <span>{{ (job && job.locationText) || "מיקום" }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quotations Carousel -->
            <div class="client-quotations-modal__content">
              <div v-if="quotations.length > 0" class="quotations-carousel-wrapper">
                <div 
                  class="quotations-carousel no-scrollbar" 
                  ref="carouselRef"
                  @scroll="handleCarouselScroll"
                >
                  <div
                    v-for="(quotation, index) in quotations"
                    :key="quotation._id || index"
                    class="quotation-card"
                    :class="{ 
                      'quotation-card--active': activeIndex === index,
                      'quotation-card--ai': quotation.isAI 
                    }"
                  >
                    <!-- AI Badge -->
                    <div v-if="quotation.isAI" class="quotation-card__ai-badge">
                      <span class="material-symbols-outlined ai-badge-icon">auto_awesome</span>
                      <span>התאמת AI</span>
                    </div>

                    <!-- Header: Avatar + Name + Rating + Price -->
                    <div class="quotation-card__header">
                      <div class="quotation-card__handyman-section" @click="showHandymanDetails(quotation)">
                        <div class="handyman-avatar-wrapper">
                          <img 
                            v-if="getHandymanAvatar(quotation)" 
                            :src="getHandymanAvatar(quotation)" 
                            alt=""
                            class="handyman-avatar"
                            @error="handleAvatarError($event)"
                          />
                          <div v-else class="handyman-avatar handyman-avatar--placeholder">
                            <span class="material-symbols-outlined">person</span>
                          </div>
                          <div v-if="quotation.rating > 0" class="handyman-avatar__verified">
                            <span class="material-symbols-outlined">check</span>
                          </div>
                        </div>
                        <div class="handyman-info">
                          <h3 class="handyman-name">{{ quotation.handymanName }}</h3>
                          <div class="handyman-rating" v-if="quotation.rating > 0">
                            <span class="material-symbols-outlined rating-star">star</span>
                            <span class="rating-value">{{ formatRating(quotation.rating) }}</span>
                            <span class="rating-count">({{ quotation.ratingsCount || 0 }})</span>
                          </div>
                        </div>
                      </div>
                      <div class="quotation-card__price-section">
                        <span class="price-value">₪{{ quotation.quotation }}</span>
                      </div>
                    </div>

                    <!-- Description -->
                    <div v-if="quotation.handimanText" class="quotation-card__description">
                      <p class="description-text">{{ quotation.handimanText }}</p>
                    </div>

                    <!-- Actions -->
                    <div class="quotation-card__actions">
                      <button
                        type="button"
                        class="reject-btn"
                        @click.stop="handleRejectQuotation(quotation)"
                        :disabled="isProcessing"
                      >
                        דחה
                      </button>
                      <button
                        type="button"
                        class="accept-btn"
                        @click.stop="handleAcceptQuotation(quotation)"
                        :disabled="isProcessing"
                      >
                        <span v-if="isProcessing && processingQuotationId === quotation._id">
                          מבצע...
                        </span>
                        <template v-else>
                          <span>אשר הצעה</span>
                          <span class="material-symbols-outlined">arrow_back</span>
                        </template>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No Quotations -->
              <div v-else class="client-quotations-modal__empty">
                <div class="empty-state">
                  <div class="empty-state__icon">📭</div>
                  <div class="empty-state__text">אין הצעות מחיר</div>
                </div>
              </div>
            </div>

            <!-- Error Message -->
            <transition name="fade">
              <div v-if="error" class="client-quotations-modal__error">
                <span class="error-icon">⚠️</span>
                {{ error }}
              </div>
            </transition>

            <!-- Bottom safe area -->
            <div class="client-quotations-modal__safe-area"></div>
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
  name: "ClientQuotationsModal",
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
  },
  emits: ["close", "accepted", "rejected", "show-handyman-details"],
  data() {
    return {
      toast: null,
      activeIndex: 0,
      isProcessing: false,
      processingQuotationId: null,
      error: "",
      handymenData: {}, // Cache for handyman data (avatar, rating, etc.)
      // Touch handling for drag-to-close
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false,
    };
  },
  computed: {
    quotations() {
      return (this.job && Array.isArray(this.job.quotations)) ? this.job.quotations : [];
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.activeIndex = 0;
        this.error = "";
        document.body.style.overflow = "hidden";
        // Fetch handyman data
        this.fetchHandymenData();
      } else {
        document.body.style.overflow = "";
      }
    },
    "job.quotations": {
      handler(newVal) {
        if (newVal && Array.isArray(newVal)) {
          // Refresh data when quotations change
          this.fetchHandymenData();
        }
      },
      deep: true,
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
      if (this.isProcessing) return;
      this.$emit("close");
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
    formatRating(rating) {
      const num = Number(rating);
      if (!Number.isFinite(num) || num <= 0) return "0";
      return (Math.round(num * 10) / 10).toFixed(1).replace(/\.0$/, "");
    },
    handleCarouselScroll() {
      const carousel = this.$refs.carouselRef;
      if (!carousel) return;
      
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.offsetWidth * 0.85 + 16; // 85% width + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      
      if (newIndex !== this.activeIndex && newIndex >= 0 && newIndex < this.quotations.length) {
        this.activeIndex = newIndex;
      }
    },
    scrollToQuotation(index) {
      const carousel = this.$refs.carouselRef;
      if (!carousel) return;
      
      const cardWidth = carousel.offsetWidth * 0.85 + 16;
      carousel.scrollTo({
        left: index * cardWidth,
        behavior: "smooth",
      });
      this.activeIndex = index;
    },
    async fetchHandymenData() {
      if (!this.quotations || this.quotations.length === 0) return;

      for (const quotation of this.quotations) {
        if (!quotation.handymanId) continue;
        const handymanId = String(quotation.handymanId);
        
        // Skip if already cached
        if (this.handymenData[handymanId]) continue;

        try {
          const response = await axios.get(`${URL}/user/${handymanId}`);
          if (response.data && response.data.success && response.data.user) {
            const user = response.data.user;
            this.handymenData[handymanId] = {
              avatar: user.imageUrl || null,
              rating: user.rating || 0,
              jobDone: user.jobDone || 0,
              ratingsCount: user.ratingsCount || 0,
            };
            
            // Update quotation object with rating data
            quotation.rating = this.handymenData[handymanId].rating;
            quotation.ratingsCount = this.handymenData[handymanId].ratingsCount;
          }
        } catch (error) {
          // Ignore errors, will show placeholder
          logger.error(`Error fetching handyman ${handymanId}:`, error);
        }
      }
    },
    getHandymanAvatar(quotation) {
      if (!quotation.handymanId) return null;
      const handymanId = String(quotation.handymanId);
      return this.handymenData[handymanId]?.avatar || null;
    },
    handleAvatarError(event) {
      event.target.style.display = "none";
    },
    showHandymanDetails(quotation) {
      this.$emit("show-handyman-details", {
        handymanId: String(quotation.handymanId),
        handymanName: quotation.handymanName,
      });
    },
    async handleAcceptQuotation(quotation) {
      if (this.isProcessing) return;

      // Extract quotationId
      let quotationId = null;
      if (quotation._id) {
        quotationId =
          typeof quotation._id === "string"
            ? quotation._id
            : quotation._id.toString();
      }

      if (!quotationId) {
        this.error = "לא נמצא מזהה להצעת המחיר";
        return;
      }

      this.isProcessing = true;
      this.processingQuotationId = quotationId;
      this.error = "";

      try {
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
        this.isProcessing = false;
        this.processingQuotationId = null;
      }
    },
    async handleRejectQuotation(quotation) {
      if (this.isProcessing) return;

      // Extract quotationId
      let quotationId = null;
      if (quotation._id) {
        quotationId =
          typeof quotation._id === "string"
            ? quotation._id
            : quotation._id.toString();
      }

      if (!quotationId) {
        this.error = "לא נמצא מזהה להצעת המחיר";
        return;
      }

      this.isProcessing = true;
      this.processingQuotationId = quotationId;
      this.error = "";

      try {
        const response = await axios.post(
          `${URL}/api/jobs/${this.job._id}/quotations/${quotationId}/reject`
        );

        if (response.data.success) {
          this.toast?.showSuccess("הצעת המחיר נדחתה");
          this.$emit("rejected", {
            jobId: this.job._id,
            rejectedHandymanId: response.data.rejectedHandymanId,
            rejectedHandymanName: response.data.rejectedHandymanName,
          });
          
          // If this was the last quotation, close the modal
          if (this.quotations.length <= 1) {
            this.handleClose();
          } else {
            // Adjust activeIndex if needed
            if (this.activeIndex >= this.quotations.length - 1) {
              this.activeIndex = Math.max(0, this.quotations.length - 2);
            }
          }
        } else {
          this.error = response.data.message || "שגיאה בדחיית הצעת המחיר";
        }
      } catch (error) {
        logger.error("Error rejecting quotation:", error);
        this.error =
          error.response?.data?.message || "שגיאה בדחיית הצעת המחיר. נסה שוב.";
      } finally {
        this.isProcessing = false;
        this.processingQuotationId = null;
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
$bg: #221910;
$bg-surface: #2c241b;
$bg-card: #362e26;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$muted-dark: rgba(255, 255, 255, 0.4);
$orange: #f27f0d;
$orange-hover: #ff8a2b;
$orange-glow: rgba(242, 127, 13, 0.2);
$success: #00d26a;
$error: #ff3b3b;
$ai-purple: #a855f7;
$yellow: #fbbf24;
$font-family: "Inter", "Noto Sans Hebrew", -apple-system, BlinkMacSystemFont,
  "Segoe UI", Roboto, Arial, sans-serif;

/* Custom scrollbar hiding */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.client-quotations-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 100020;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.client-quotations-modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: $bg;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s ease-out;

  &__handle-area {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 12px;
    padding-bottom: 4px;
    cursor: grab;
    touch-action: none;

    &:active {
      cursor: grabbing;
    }
  }

  &__handle {
    width: 48px;
    height: 6px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.2);
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  &__header {
    padding: 16px 20px;
    text-align: center;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: white;
    font-family: $font-family;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .title-icon {
      font-size: 24px;
    }
  }

  &__subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 400;
    color: $muted-dark;
    font-family: $font-family;
  }

  &__job-summary {
    padding: 0 20px 16px;
  }

  &__content {
    flex: 1;
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__empty {
    padding: 40px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
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
    z-index: 10;

    .error-icon {
      font-size: 18px;
    }
  }

  &__safe-area {
    height: 24px;
    width: 100%;
    background: $bg;
  }
}

.job-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 12px;
  background: $bg-surface;
  border: 1px solid rgba(255, 255, 255, 0.05);

  &__icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba($orange, 0.2);
    color: $orange;
    flex-shrink: 0;

    .material-symbols-outlined {
      font-size: 20px;
    }
  }

  &__content {
    flex: 1;
    margin-right: 12px;
    min-width: 0;
  }

  &__title {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
    font-family: $font-family;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 400;
    color: $muted-dark;
    font-family: $font-family;

    .material-symbols-outlined {
      font-size: 14px;
    }
  }
}

.quotations-carousel-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.quotations-carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  padding: 8px 20px 16px;
  -webkit-overflow-scrolling: touch;
  flex: 1;
}

.quotation-card {
  flex: 0 0 85%;
  min-width: 280px;
  scroll-snap-align: center;
  background: $bg-surface;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;

  &--active {
    border-color: rgba($orange, 0.3);
    box-shadow: 0 8px 24px rgba($orange, 0.15);
  }


  &__ai-badge {
    position: absolute;
    top: -12px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 9999px;
    background: linear-gradient(135deg, $orange, #fb923c);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    color: white;
    font-size: 12px;
    font-weight: 700;
    font-family: $font-family;
    z-index: 5;

    .ai-badge-icon {
      font-size: 14px;
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 8px;
  }

  &__handyman-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  &__price-section {
    margin-right: auto;
    text-align: right;
  }
}

.handyman-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.handyman-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid $bg-surface;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($orange, 0.2);
    color: $orange;

    .material-symbols-outlined {
      font-size: 24px;
    }
  }

  &__verified {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: $success;
    color: white;
    box-shadow: 0 0 0 2px $bg-surface;
    font-size: 10px;

    .material-symbols-outlined {
      font-size: 12px;
      font-weight: bold;
    }
  }
}

.handyman-info {
  flex: 1;
  min-width: 0;
}

.handyman-name {
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
  font-family: $font-family;
  line-height: 1.3;
}

.handyman-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  font-family: $font-family;

  .rating-star {
    font-size: 14px;
    color: $yellow;
    fill: $yellow;
  }

  .rating-value {
    color: white;
    font-weight: 500;
  }

  .rating-count {
    color: $muted-dark;
  }
}

.price-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: white;
  font-family: $font-family;
  line-height: 1;
}

.quotation-card__description {
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  flex: 1;
}

.description-text {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: $font-family;
}

.quotation-card__actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 8px;
}

.reject-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
  font-family: $font-family;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.accept-btn {
  flex: 2;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: $orange;
  color: white;
  font-size: 14px;
  font-weight: 700;
  font-family: $font-family;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px $orange-glow;

  &:hover:not(:disabled) {
    background: $orange-hover;
    box-shadow: 0 6px 16px rgba($orange, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .material-symbols-outlined {
    font-size: 18px;
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
    font-weight: 700;
    color: $muted;
    font-family: $font-family;
  }
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
  .client-quotations-modal {
    max-height: 95vh;
    border-radius: 20px 20px 0 0;

    &__header {
      padding: 12px 16px;
    }

    &__title {
      font-size: 18px;
    }

    &__subtitle {
      font-size: 13px;
    }

    &__job-summary {
      padding: 0 16px 12px;
    }

    &__content {
      padding: 0;
    }
  }

  .job-summary-card {
    padding: 10px;

    &__icon {
      width: 36px;
      height: 36px;

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    &__title {
      font-size: 13px;
    }

    &__location {
      font-size: 11px;
    }
  }

  .quotations-carousel {
    padding: 8px 16px 12px;
    gap: 12px;
  }

  .quotation-card {
    flex: 0 0 90%;
    min-width: 260px;
    padding: 14px;
    gap: 12px;

    &__ai-badge {
      top: -10px;
      right: 12px;
      padding: 4px 10px;
      font-size: 11px;
    }

    &__header {
      margin-top: 4px;
      gap: 10px;
    }
  }

  .handyman-avatar {
    width: 44px;
    height: 44px;
  }

  .handyman-name {
    font-size: 15px;
  }

  .price-value {
    font-size: 22px;
  }

  .description-text {
    font-size: 13px;
  }

  .reject-btn,
  .accept-btn {
    padding: 10px;
    font-size: 13px;
  }

  .client-quotations-modal__safe-area {
    height: 20px;
  }
}

@media (max-width: 420px) and (orientation: landscape) {
  .client-quotations-modal {
    max-height: 98vh;
  }

  .quotations-carousel {
    max-height: 50vh;
  }
}
</style>

