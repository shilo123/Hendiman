<template>
  <div
    v-if="isOpen"
    class="job-filter-modal-overlay"
    @click="$emit('close')"
  >
    <div 
      class="job-filter-modal" 
      @click.stop
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Drag Handle -->
      <div class="job-filter-modal__handle">
        <div class="job-filter-modal__handle-bar"></div>
      </div>

      <!-- Header -->
      <div class="job-filter-modal__header">
        <div class="job-filter-modal__header-content">
          <div class="job-filter-modal__user-section">
            <div class="job-filter-modal__avatar-wrapper">
              <div class="job-filter-modal__avatar-glow"></div>
              <div class="job-filter-modal__avatar">
                <img 
                  v-if="userAvatar" 
                  :src="userAvatar" 
                  alt=""
                  class="job-filter-modal__avatar-img"
                />
                <div v-else class="job-filter-modal__avatar-placeholder">
                  <span class="material-symbols-outlined">person</span>
                </div>
              </div>
              <div v-if="userPlan" class="job-filter-modal__pro-badge">PRO</div>
            </div>
            <div class="job-filter-modal__user-info">
              <div class="job-filter-modal__user-name">{{ userName || 'משתמש' }}</div>
              <div class="job-filter-modal__user-plan">{{ userPlan || 'לקוח' }}</div>
            </div>
          </div>
          <button
            class="job-filter-modal__close"
            @click="$emit('close')"
            aria-label="סגור"
          >
            <span class="material-symbols-outlined">close</span>
            <div class="job-filter-modal__close-glow"></div>
          </button>
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="job-filter-modal__content">
        <div class="job-filter-modal__title">
          סנן <span class="job-filter-modal__title-accent">עבודות</span>
        </div>

        <!-- Location Filter -->
        <div class="job-filter-section">
          <h3 class="job-filter-section__title">מיקום</h3>
          <div class="job-filter-radio-group">
            <label class="job-filter-radio-item">
              <input
                type="radio"
                name="locationFilter"
                value="myLocation"
                :checked="localFilters.locationType === 'myLocation'"
                @change="updateLocationType('myLocation')"
                class="job-filter-radio-input"
              />
              <div class="job-filter-radio-content">
                <div class="job-filter-radio-icon" :class="{ 'job-filter-radio-icon--checked': localFilters.locationType === 'myLocation' }">
                  <span class="material-symbols-outlined">my_location</span>
                </div>
                <div class="job-filter-radio-text">
                  <span class="job-filter-radio-label">המיקום שלי</span>
                  <span class="job-filter-radio-desc">לפי מיקום GPS נוכחי</span>
                </div>
                <div class="job-filter-radio-check" :class="{ 'job-filter-radio-check--checked': localFilters.locationType === 'myLocation' }">
                  <div class="job-filter-radio-check-inner"></div>
                </div>
              </div>
            </label>
            <label class="job-filter-radio-item">
              <input
                type="radio"
                name="locationFilter"
                value="residence"
                :checked="localFilters.locationType === 'residence'"
                @change="updateLocationType('residence')"
                class="job-filter-radio-input"
              />
              <div class="job-filter-radio-content" :class="{ 'job-filter-radio-content--checked': localFilters.locationType === 'residence' }">
                <div class="job-filter-radio-icon" :class="{ 'job-filter-radio-icon--checked': localFilters.locationType === 'residence' }">
                  <span class="material-symbols-outlined">home_pin</span>
                </div>
                <div class="job-filter-radio-text">
                  <span class="job-filter-radio-label">מקום המגורים שלי</span>
                  <span class="job-filter-radio-desc">{{ userCity || 'מיקום מגורים' }}</span>
                </div>
                <div class="job-filter-radio-check" :class="{ 'job-filter-radio-check--checked': localFilters.locationType === 'residence' }">
                  <div class="job-filter-radio-check-inner"></div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Distance Filter -->
        <div class="job-filter-section">
          <div class="job-filter-section__header">
            <h3 class="job-filter-section__title">מרחק</h3>
            <button
              class="job-filter-reset-btn"
              type="button"
              @click="resetDistance"
            >
              איפוס
            </button>
          </div>
          <div class="job-filter-range-container">
            <div class="job-filter-range-display">
              <div class="job-filter-range-value-large">
                <span class="job-filter-range-number">{{ localFilters.maxKm }}</span>
                <span class="job-filter-range-unit">ק״מ</span>
              </div>
              <span class="job-filter-range-max">מקסימום: 50 ק״מ</span>
            </div>
            <div class="job-filter-range-slider-wrapper">
              <div class="job-filter-range-track">
                <div 
                  class="job-filter-range-track-filled" 
                  :style="{ width: `${(localFilters.maxKm / 50) * 100}%` }"
                ></div>
              </div>
              <input
                class="job-filter-range-input"
                type="range"
                min="1"
                max="50"
                step="1"
                :value="localFilters.maxKm"
                @input="updateMaxKm($event.target.value)"
              />
            </div>
            <div class="job-filter-range-labels">
              <span>1 ק״מ</span>
              <span>50 ק״מ</span>
            </div>
          </div>
        </div>

        <!-- Price Filter -->
        <div class="job-filter-section">
          <div class="job-filter-section__header">
            <h3 class="job-filter-section__title">מחיר מינימלי</h3>
            <button
              class="job-filter-reset-btn"
              type="button"
              @click="resetPrice"
            >
              איפוס
            </button>
          </div>
          <div class="job-filter-range-container">
            <div class="job-filter-range-display">
              <div class="job-filter-range-value-large">
                <span class="job-filter-range-number">{{ localFilters.minPrice || 0 }}</span>
                <span class="job-filter-range-unit">₪</span>
              </div>
              <span class="job-filter-range-max">מקסימום: 1000 ₪</span>
            </div>
            <div class="job-filter-range-slider-wrapper">
              <div class="job-filter-range-track">
                <div 
                  class="job-filter-range-track-filled" 
                  :style="{ width: `${((localFilters.minPrice || 0) / 1000) * 100}%` }"
                ></div>
              </div>
              <input
                class="job-filter-range-input"
                type="range"
                min="0"
                max="1000"
                step="50"
                :value="localFilters.minPrice || 0"
                @input="updateMinPrice($event.target.value)"
              />
            </div>
            <div class="job-filter-range-labels">
              <span>0 ₪</span>
              <span>1000 ₪</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="job-filter-modal__footer">
        <button
          class="job-filter-modal__btn job-filter-modal__btn--cancel"
          @click="$emit('close')"
        >
          ביטול
        </button>
        <button
          class="job-filter-modal__btn job-filter-modal__btn--apply"
          @click="applyFilters"
        >
          <span class="material-symbols-outlined">filter_alt</span>
          <span>סנן תוצאות</span>
          <div class="job-filter-modal__btn-shine"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "JobFilterModal",
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    filters: {
      type: Object,
      required: true,
      default: () => ({
        locationType: "residence",
        maxKm: 25,
        minPrice: 0,
        maxPrice: null,
        workType: "",
      }),
    },
    userName: {
      type: String,
      default: "",
    },
    userPlan: {
      type: String,
      default: "",
    },
    userAvatar: {
      type: String,
      default: "",
    },
    userCity: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      localFilters: { ...this.filters },
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false,
      modalTransform: 0,
    };
  },
  watch: {
    filters: {
      handler(newFilters) {
        this.localFilters = { ...newFilters };
      },
      immediate: true,
      deep: true,
    },
    isOpen(newVal) {
      if (newVal) {
        this.localFilters = { ...this.filters };
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
      } else {
        // Restore body scroll when modal is closed
        document.body.style.overflow = "";
      }
    },
  },
  beforeUnmount() {
    // Restore body scroll if component is destroyed
    document.body.style.overflow = "";
  },
  methods: {
    updateLocationType(type) {
      this.localFilters.locationType = type;
      // Emit the change so Dashboard can get current location if needed
      this.$emit("location-type-change", type);
    },
    updateMaxKm(value) {
      this.localFilters.maxKm = parseInt(value);
    },
    updateMinPrice(value) {
      this.localFilters.minPrice = value ? parseInt(value) : 0;
    },
    updateMaxPrice(value) {
      this.localFilters.maxPrice = value ? parseInt(value) : null;
    },
    resetDistance() {
      this.localFilters.maxKm = 25;
      this.$emit("reset-distance");
    },
    resetPrice() {
      this.localFilters.minPrice = 0;
      this.localFilters.maxPrice = null;
      this.$emit("reset-price");
    },
    applyFilters() {
      this.$emit("apply", { ...this.localFilters });
      this.$emit("close");
    },
    handleTouchStart(e) {
      // Only allow dragging from the handle area or top of modal
      const touch = e.touches[0];
      const touchY = touch.clientY;
      const modalTop = e.currentTarget.getBoundingClientRect().top;
      const handleHeight = 40; // Approximate handle area height
      
      // Allow dragging if touch is in the top handle area
      if (touchY - modalTop < handleHeight + 60) {
        this.touchStartY = touchY;
        this.touchCurrentY = touchY;
        this.isDragging = true;
      }
    },
    handleTouchMove(e) {
      if (!this.isDragging) return;
      
      e.preventDefault();
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;
      
      // Only allow downward dragging (closing)
      if (deltaY > 0) {
        this.modalTransform = deltaY;
        // Add some resistance at the top
        const resistance = deltaY > 100 ? 0.3 : 1;
        e.currentTarget.style.transform = `translateY(${deltaY * resistance}px)`;
        e.currentTarget.style.opacity = `${1 - deltaY / 300}`;
      }
    },
    handleTouchEnd(e) {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      const deltaY = this.touchCurrentY - this.touchStartY;
      const threshold = 150; // Pixels to drag before closing
      
      if (deltaY > threshold) {
        // Close the modal
        this.$emit("close");
      } else {
        // Snap back
        e.currentTarget.style.transform = "";
        e.currentTarget.style.opacity = "";
      }
      
      this.touchStartY = 0;
      this.touchCurrentY = 0;
      this.modalTransform = 0;
    },
  },
};
</script>

<style scoped lang="scss">
$primary: #FF6B00;
$primary-400: #fdba74;
$primary-500: #f97316;
$primary-600: #ea580c;
$primary-700: #c2410c;
$bg: #0a0a0a;
$bg-800: rgba(10, 10, 10, 0.95);
$bg-700: #121212;
$bg-900: #050505;
$bg-card: #18181b;
$surface: #27272a;
$text: #ffffff;
$text-muted: rgba(255, 255, 255, 0.4);
$border: rgba(255, 255, 255, 0.1);
$border-light: rgba(255, 255, 255, 0.05);

.job-filter-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100010;
  direction: rtl;
  padding-bottom: 0;
  animation: fadeIn 0.3s ease-out;
  
  @media (min-width: 768px) {
    align-items: center;
    padding: 20px;
    padding-bottom: 20px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.job-filter-modal {
  background: $bg-800;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid $border-light;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 448px;
  max-height: calc(92vh - 60px);
  height: calc(92vh - 60px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  
  @media (min-width: 768px) {
    border-radius: 2rem;
    max-height: 85vh;
    height: auto;
    max-width: 448px;
    animation: slideUpCenter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  // Ensure it's above DashboardTopBar (z-index: 100000)
  z-index: 100001;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideUpCenter {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.job-filter-modal__handle {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 8px;
  cursor: grab;
  user-select: none;
  position: relative;
  z-index: 10;
  touch-action: pan-y;
  
  &:active {
    cursor: grabbing;
  }
  
  @media (min-width: 768px) {
    display: none;
  }
}

.job-filter-modal__handle-bar {
  width: 64px;
  height: 6px;
  border-radius: 999px;
  background: $primary-600;
  box-shadow: 0 0 10px rgba(234, 88, 12, 0.5);
  transition: all 0.2s ease;
  
  .job-filter-modal__handle:hover & {
    background: $primary-500;
    box-shadow: 0 0 15px rgba(234, 88, 12, 0.7);
  }
}

.job-filter-modal__header {
  position: relative;
  z-index: 1;
  padding: 24px 24px 16px;
  border-bottom: 1px solid $border-light;
  flex-shrink: 0;
}

.job-filter-modal__header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.job-filter-modal__user-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.job-filter-modal__avatar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.job-filter-modal__avatar-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, $primary-500, #fbbf24);
  border-radius: 50%;
  opacity: 0.4;
  filter: blur(4px);
  transition: opacity 0.2s ease;
  
  .job-filter-modal__avatar-wrapper:hover & {
    opacity: 0.75;
  }
}

.job-filter-modal__avatar {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #27272a, #050505);
  overflow: hidden;
  z-index: 1;
}

.job-filter-modal__avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.job-filter-modal__avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  
  .material-symbols-outlined {
    font-size: 28px;
  }
}

.job-filter-modal__pro-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: linear-gradient(135deg, $primary-500, #fbbf24);
  color: #000;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.5);
  letter-spacing: 0.05em;
  z-index: 2;
}

.job-filter-modal__user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.job-filter-modal__user-name {
  font-size: 20px;
  font-weight: 900;
  color: $text;
  line-height: 1.2;
}

.job-filter-modal__user-plan {
  font-size: 12px;
  color: rgba(161, 161, 170, 1);
  font-weight: 500;
  letter-spacing: 0.025em;
}

.job-filter-modal__close {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid $border-light;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(161, 161, 170, 1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  overflow: hidden;

  .material-symbols-outlined {
    font-size: 20px;
    transition: color 0.2s ease;
    position: relative;
    z-index: 1;
  }
  
  .job-filter-modal__close-glow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba($primary-500, 0);
    transition: all 0.5s ease;
    transform: scale(1.1);
    opacity: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    
    .material-symbols-outlined {
      color: $text;
    }
    
    .job-filter-modal__close-glow {
      border-color: rgba($primary-500, 0.3);
      opacity: 1;
      transform: scale(1);
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.job-filter-modal__content {
  position: relative;
  z-index: 1;
  padding: 24px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 32px;
  
  // Hide scrollbar
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  // Add padding for safe area on mobile - enough to see footer buttons
  @media (max-width: 768px) {
    padding-bottom: calc(160px + env(safe-area-inset-bottom));
  }
}

.job-filter-modal__title {
  font-size: 30px;
  font-weight: 900;
  color: $text;
  letter-spacing: -0.02em;
  line-height: 1.2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.job-filter-modal__title-accent {
  background: linear-gradient(135deg, $primary, $primary-600);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.job-filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-filter-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.job-filter-section__title {
  font-size: 13px;
  font-weight: 900;
  color: rgba(161, 161, 170, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.job-filter-reset-btn {
  font-size: 12px;
  font-weight: 500;
  color: $primary-500;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: $primary-400;
    background: rgba(249, 115, 22, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

.job-filter-radio-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.job-filter-radio-item {
  position: relative;
  cursor: pointer;
}

.job-filter-radio-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.job-filter-radio-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid $border-light;
  transition: all 0.3s ease;

  &--checked {
    background: rgba(249, 115, 22, 0.1);
    border-color: rgba(249, 115, 22, 0.5);
  }

  .job-filter-radio-item:hover & {
    background: rgba(255, 255, 255, 0.1);
  }

  .job-filter-radio-item:hover &--checked {
    background: rgba(249, 115, 22, 0.15);
  }
}

.job-filter-radio-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: $bg-900;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(161, 161, 170, 1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  margin-left: 16px;

  .material-symbols-outlined {
    font-size: 20px;
  }

  &--checked {
    color: $primary-500;
  }
}

.job-filter-radio-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.job-filter-radio-label {
  font-size: 16px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.3s ease;

  .job-filter-radio-item:hover & {
    color: $text;
  }
}

.job-filter-radio-desc {
  font-size: 12px;
  color: rgba(113, 113, 122, 1);
}

.job-filter-radio-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(113, 113, 122, 1);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &--checked {
    border-color: $primary-500;
    background: $primary-500;
    box-shadow: 0 0 15px rgba(249, 115, 22, 0.5);
  }
}

.job-filter-radio-check-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  opacity: 0;
  transition: opacity 0.3s ease;

  .job-filter-radio-check--checked & {
    opacity: 1;
  }
}

.job-filter-range-container {
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent);
  border: 1px solid $border-light;
}

.job-filter-range-display {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.job-filter-range-value-large {
  text-align: center;
}

.job-filter-range-number {
  display: block;
  font-size: 36px;
  font-weight: 900;
  color: $text;
  letter-spacing: -0.02em;
  line-height: 1;
}

.job-filter-range-unit {
  display: block;
  font-size: 12px;
  color: rgba(113, 113, 122, 1);
  font-weight: 500;
  margin-top: 4px;
}

.job-filter-range-max {
  color: rgba(113, 113, 122, 1);
  font-size: 12px;
  margin-bottom: 2px;
}

.job-filter-range-slider-wrapper {
  position: relative;
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.job-filter-range-track {
  position: absolute;
  width: 100%;
  height: 4px;
  background: $surface;
  border-radius: 2px;
  overflow: hidden;
}

.job-filter-range-track-filled {
  height: 100%;
  background: linear-gradient(to right, $primary-700, $primary-500);
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
  border-radius: 2px;
  transition: width 0.1s ease;
}

.job-filter-range-input {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 32px;
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $primary;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 0 3px $bg-900, 0 0 15px rgba(255, 107, 0, 0.6);
    transition: all 0.2s ease;
    margin-top: -10px;

    &:hover {
      box-shadow: 0 0 0 3px $bg-900, 0 0 20px rgba(255, 107, 0, 0.8);
    }
  }

  &::-webkit-slider-runnable-track {
    height: 4px;
    background: transparent;
    border: none;
  }

  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border: 2px solid white;
    border-radius: 50%;
    background: $primary;
    cursor: pointer;
    box-shadow: 0 0 0 3px $bg-900, 0 0 15px rgba(255, 107, 0, 0.6);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 3px $bg-900, 0 0 20px rgba(255, 107, 0, 0.8);
    }
  }

  &::-moz-range-track {
    width: 100%;
    height: 4px;
    background: transparent;
    border: none;
  }
}

.job-filter-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 900;
  color: rgba(113, 113, 122, 1);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 4px;
}

.job-filter-price-range {
  display: flex;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.job-filter-price-input-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.job-filter-price-label {
  display: block;
  font-size: 10px;
  font-weight: 900;
  color: rgba(113, 113, 122, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  margin-right: 4px;
}

.job-filter-price-input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease;

  &:focus-within {
    transform: scale(1.02);
  }
}

.job-filter-price-symbol {
  font-weight: 900;
  color: $primary-500;
  font-size: 16px;
  flex-shrink: 0;
  margin-right: 4px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.job-filter-price-input {
  width: 100%;
  box-sizing: border-box;
  background: $bg-900;
  border: 1px solid $border-light;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 900;
  color: $text;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  text-align: right;
  direction: rtl;

  &::placeholder {
    color: rgba(113, 113, 122, 1);
  }

  &:focus {
    border-color: $primary-500;
    box-shadow: 0 0 15px rgba(249, 115, 22, 0.15);
    background: rgba(5, 5, 5, 0.9);
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 13px;
  }
}

.job-filter-modal__footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  padding: 24px;
  border-top: 1px solid $border-light;
  background: rgba(10, 10, 10, 0.98);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  flex-shrink: 0;
  margin-top: auto;
  
  @media (max-width: 768px) {
    padding: 16px;
    gap: 12px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
}

.job-filter-modal__btn {
  padding: 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.98);
  }

  &--cancel {
    background: transparent;
    color: $text;
    border: 1px solid $border-light;
    font-size: 14px;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  &--apply {
    background: linear-gradient(135deg, $primary, $primary-600);
    color: #000;
    font-size: 16px;
    font-weight: 900;
    box-shadow: 0 0 20px rgba(234, 88, 12, 0.4);
    
    .material-symbols-outlined {
      font-size: 20px;
    }

    &:hover {
      box-shadow: 0 0 30px rgba(234, 88, 12, 0.6);
      filter: brightness(1.1);
    }
  }
}

.job-filter-modal__btn-shine {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(100%);
  transition: transform 0.3s ease;

  .job-filter-modal__btn--apply:hover & {
    transform: translateY(0);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .job-filter-modal {
    max-height: calc(92vh - 60px);
    height: calc(92vh - 60px);
    border-radius: 24px 24px 0 0;
    width: 100%;
    max-width: 100%;
  }

  .job-filter-modal-overlay {
    padding-bottom: 0;
    align-items: flex-end;
  }

  .job-filter-modal__header {
    padding: 12px 16px 12px;
  }

  .job-filter-modal__header-content {
    gap: 12px;
  }

  .job-filter-modal__avatar {
    width: 48px;
    height: 48px;
  }

  .job-filter-modal__user-name {
    font-size: 18px;
  }

  .job-filter-modal__user-plan {
    font-size: 11px;
  }

  .job-filter-modal__close {
    width: 36px;
    height: 36px;
    
    .material-symbols-outlined {
      font-size: 18px;
    }
  }

  .job-filter-modal__content {
    padding: 16px;
    gap: 24px;
    padding-bottom: calc(160px + env(safe-area-inset-bottom));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-height: 0;
    overscroll-behavior: contain;
  }
  

  .job-filter-modal__title {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .job-filter-section {
    gap: 12px;
  }

  .job-filter-section__title {
    font-size: 12px;
  }

  .job-filter-radio-content {
    padding: 14px;
  }

  .job-filter-radio-icon {
    width: 36px;
    height: 36px;
    margin-left: 12px;
    
    .material-symbols-outlined {
      font-size: 18px;
    }
  }

  .job-filter-radio-label {
    font-size: 15px;
  }

  .job-filter-radio-desc {
    font-size: 11px;
  }

  .job-filter-range-container {
    padding: 16px;
  }

  .job-filter-range-number {
    font-size: 32px;
  }

  .job-filter-range-unit {
    font-size: 11px;
  }

  .job-filter-range-max {
    font-size: 11px;
  }

  .job-filter-price-range {
    gap: 12px;
  }

  .job-filter-price-input {
    padding: 12px 14px 12px 36px;
    font-size: 15px;
  }

  .job-filter-modal__footer {
    padding: 16px;
    gap: 12px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    position: sticky;
    bottom: 0;
    background: rgba(10, 10, 10, 0.98);
    border-top: 1px solid $border-light;
  }

  .job-filter-modal__btn {
    padding: 14px 16px;
    font-size: 14px;
    border-radius: 14px;
    
    &--apply {
      font-size: 15px;
    }
    
    .material-symbols-outlined {
      font-size: 18px;
    }
  }
}

@media (max-width: 480px) {
  .job-filter-modal__content {
    padding: 14px;
    gap: 20px;
  }

  .job-filter-modal__title {
    font-size: 22px;
  }

  .job-filter-range-number {
    font-size: 28px;
  }

  .job-filter-modal__footer {
    padding: 14px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
  }
}

// Prevent body scroll when modal is open
body:has(.job-filter-modal-overlay) {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}
</style>

