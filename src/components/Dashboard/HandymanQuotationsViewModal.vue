<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="handyman-quotations-view-modal-overlay"
        @click.self="handleClose"
      >
        <transition name="slide-up">
          <div v-if="visible" class="handyman-quotations-view-modal" dir="rtl">
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
            <div class="handyman-quotations-view-modal__header">
              <button
                class="handyman-quotations-view-modal__close"
                type="button"
                @click="handleClose"
                aria-label="סגור"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
              <h2 class="handyman-quotations-view-modal__title">
                <span class="material-symbols-outlined title-icon">receipt_long</span>
                הצעות שהצעת
              </h2>
            </div>

            <!-- Content -->
            <div class="handyman-quotations-view-modal__content">
              <div v-if="myQuotations.length === 0" class="empty-state">
                <span class="material-symbols-outlined empty-icon">inbox</span>
                <p class="empty-text">אין הצעות להצגה</p>
              </div>

              <div v-else class="quotations-list">
                <div
                  v-for="(quotation, index) in myQuotations"
                  :key="quotation._id || index"
                  class="quotation-view-card"
                >
                  <!-- Job Info -->
                  <div class="quotation-view-card__job-info">
                    <div class="job-info__icon">
                      <span class="material-symbols-outlined">work</span>
                    </div>
                    <div class="job-info__content">
                      <h3 class="job-info__title">{{ getJobTitle(quotation.jobId) }}</h3>
                      <div class="job-info__location">
                        <span class="material-symbols-outlined">location_on</span>
                        <span>{{ getJobLocation(quotation.jobId) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Quotation Details -->
                  <div class="quotation-view-card__details">
                    <!-- Price -->
                    <div class="quotation-detail quotation-detail--price">
                      <span class="material-symbols-outlined detail-icon">attach_money</span>
                      <div class="detail-content">
                        <span class="detail-label">מחיר</span>
                        <span class="detail-value price-value">₪{{ quotation.quotation }}</span>
                      </div>
                    </div>

                    <!-- Text -->
                    <div class="quotation-detail quotation-detail--text">
                      <span class="material-symbols-outlined detail-icon">description</span>
                      <div class="detail-content">
                        <span class="detail-label">פירוט ההצעה</span>
                        <p class="detail-value text-value">{{ quotation.handimanText || 'ללא פירוט' }}</p>
                      </div>
                    </div>

                    <!-- Time -->
                    <div class="quotation-detail quotation-detail--time">
                      <span class="material-symbols-outlined detail-icon">schedule</span>
                      <div class="detail-content">
                        <span class="detail-label">תאריך ושעה</span>
                        <span class="detail-value time-value">{{ formatDate(quotation.createdAt) }}</span>
                      </div>
                    </div>

                    <!-- AI Badge -->
                    <div v-if="quotation.isAI" class="quotation-detail quotation-detail--ai">
                      <span class="material-symbols-outlined detail-icon ai-icon">auto_awesome</span>
                      <div class="detail-content">
                        <span class="detail-label">נוצר עם AI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom safe area -->
            <div class="handyman-quotations-view-modal__safe-area"></div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script>
export default {
  name: "HandymanQuotationsViewModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    jobs: {
      type: Array,
      default: () => [],
    },
    handymanId: {
      type: String,
      required: false,
      default: "",
    },
  },
  emits: ["close"],
  data() {
    return {
      // Touch handling for drag-to-close
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false,
    };
  },
  computed: {
    myQuotations() {
      if (!this.handymanId || !this.jobs || this.jobs.length === 0) {
        return [];
      }
      
      const handymanIdStr = String(this.handymanId);
      const quotations = [];
      
      this.jobs.forEach((job) => {
        if (job.quotations && Array.isArray(job.quotations)) {
          job.quotations.forEach((quotation) => {
            if (String(quotation.handymanId) === handymanIdStr) {
              quotations.push({
                ...quotation,
                jobId: job._id || job.id,
                job: job,
              });
            }
          });
        }
      });
      
      // Sort by date (newest first)
      return quotations.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.submittedAt || 0);
        const dateB = new Date(b.createdAt || b.submittedAt || 0);
        return dateB - dateA;
      });
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    },
  },
  beforeUnmount() {
    document.body.style.overflow = "";
  },
  methods: {
    handleClose() {
      this.$emit("close");
    },
    getJobTitle(jobId) {
      const job = this.jobs.find((j) => String(j._id || j.id) === String(jobId));
      if (!job) return "עבודה";
      
      if (Array.isArray(job.subcategoryInfo) && job.subcategoryInfo.length > 0) {
        return job.subcategoryInfo[0].subcategory || job.subcategoryInfo[0].originalText || "עבודה";
      }
      return job.subcategoryInfo?.subcategory || job.subcategoryInfo?.originalText || job.desc || "עבודה";
    },
    getJobLocation(jobId) {
      const job = this.jobs.find((j) => String(j._id || j.id) === String(jobId));
      return job?.locationText || "מיקום לא צוין";
    },
    formatDate(date) {
      if (!date) return "תאריך לא זמין";
      
      try {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return "לפני רגע";
        if (diffMins < 60) return `לפני ${diffMins} דקות`;
        if (diffHours < 24) return `לפני ${diffHours} שעות`;
        if (diffDays === 1) return "אתמול";
        if (diffDays < 7) return `לפני ${diffDays} ימים`;
        
        // Format full date
        return d.toLocaleDateString("he-IL", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return "תאריך לא זמין";
      }
    },
    // Touch handling for drag-to-close
    onTouchStart(e) {
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = false;
    },
    onTouchMove(e) {
      if (!this.touchStartY) return;
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;
      
      if (deltaY > 10) {
        this.isDragging = true;
      }
    },
    onTouchEnd() {
      if (this.isDragging && this.touchCurrentY - this.touchStartY > 100) {
        this.handleClose();
      }
      this.touchStartY = 0;
      this.touchCurrentY = 0;
      this.isDragging = false;
    },
  },
};
</script>

<style scoped lang="scss">
$primary: #F27C0E;
$orange2: #F97316;
$bg-card: #1a1a1a;
$bg-overlay: rgba(0, 0, 0, 0.7);
$text: rgba(255, 255, 255, 0.92);
$text-muted: rgba(255, 255, 255, 0.6);
$text-secondary: rgba(255, 255, 255, 0.4);
$border-color: rgba(255, 255, 255, 0.1);
$font-family: "Heebo", "Noto Sans Hebrew", sans-serif;

.handyman-quotations-view-modal-overlay {
  position: fixed;
  inset: 0;
  background: $bg-overlay;
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.handyman-quotations-view-modal {
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: $bg-card;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.quotations-modal__handle-area {
  padding: 12px 0 8px;
  display: flex;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  
  &:active {
    cursor: grabbing;
  }
}

.quotations-modal__handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.handyman-quotations-view-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid $border-color;
  position: relative;
}

.handyman-quotations-view-modal__close {
  position: absolute;
  left: 24px;
  background: transparent;
  border: none;
  color: $text-muted;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text;
  }
  
  .material-symbols-outlined {
    font-size: 24px;
  }
}

.handyman-quotations-view-modal__title {
  flex: 1;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: $text;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  .title-icon {
    font-size: 24px;
    color: $primary;
  }
}

.handyman-quotations-view-modal__content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  
  .empty-icon {
    font-size: 64px;
    color: $text-secondary;
    margin-bottom: 16px;
  }
  
  .empty-text {
    color: $text-muted;
    font-size: 16px;
    margin: 0;
  }
}

.quotations-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quotation-view-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $border-color;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba($primary, 0.3);
  }
}

.quotation-view-card__job-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid $border-color;
  margin-bottom: 16px;
}

.job-info__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba($primary, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  .material-symbols-outlined {
    font-size: 24px;
    color: $primary;
  }
}

.job-info__content {
  flex: 1;
  min-width: 0;
}

.job-info__title {
  font-size: 16px;
  font-weight: 700;
  color: $text;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-info__location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: $text-muted;
  
  .material-symbols-outlined {
    font-size: 18px;
  }
}

.quotation-view-card__details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quotation-detail {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-icon {
  font-size: 20px;
  color: $primary;
  flex-shrink: 0;
  margin-top: 2px;
  
  &.ai-icon {
    color: #8B5CF6;
  }
}

.detail-content {
  flex: 1;
  min-width: 0;
}

.detail-label {
  display: block;
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 4px;
  font-weight: 500;
}

.detail-value {
  display: block;
  font-size: 14px;
  color: $text;
  
  &.price-value {
    font-size: 20px;
    font-weight: 700;
    color: $primary;
  }
  
  &.text-value {
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  &.time-value {
    color: $text-muted;
  }
}

.handyman-quotations-view-modal__safe-area {
  height: env(safe-area-inset-bottom);
  min-height: 8px;
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
@media (max-width: 640px) {
  .handyman-quotations-view-modal {
    max-height: 95vh;
    border-radius: 20px 20px 0 0;
  }
  
  .handyman-quotations-view-modal__header {
    padding: 12px 20px;
  }
  
  .handyman-quotations-view-modal__content {
    padding: 20px;
  }
  
  .quotation-view-card {
    padding: 16px;
  }
}
</style>

