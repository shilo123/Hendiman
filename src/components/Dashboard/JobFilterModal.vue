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

      <!-- Scrollable Content -->
      <div class="job-filter-modal__content">
        <!-- AI Filter Button -->
        <button 
          class="job-filter-ai-btn"
          @click="handleAIFilter"
        >
          <div class="job-filter-ai-btn__content">
            <div class="job-filter-ai-btn__icon">
              <i class="ph ph-sparkle"></i>
            </div>
            <div class="job-filter-ai-btn__text">
              <div class="job-filter-ai-btn__title">סנן בעזרת AI</div>
              <div class="job-filter-ai-btn__desc">התאמה אישית חכמה</div>
            </div>
          </div>
          <div class="job-filter-ai-btn__pulse">
            <span class="job-filter-ai-btn__pulse-ring"></span>
            <span class="job-filter-ai-btn__pulse-dot"></span>
          </div>
        </button>

        <!-- Search Input -->
        <div class="job-filter-search-wrapper">
          <div class="job-filter-search-glow"></div>
          <div class="job-filter-search-container">
            <input
              v-model="searchQuery"
              class="job-filter-search-input"
              type="text"
              placeholder="לדוגמה: אינסטלטור מומלץ..."
            />
            <button 
              class="job-filter-search-btn"
              @click="handleSearch"
            >
              <i class="ph ph-paper-plane-right"></i>
            </button>
          </div>
        </div>

        <!-- Location Filter -->
        <div class="job-filter-section">
          <div class="job-filter-section__header">
            <label class="job-filter-section__label">מיקום</label>
          </div>
          <div class="job-filter-location-buttons">
            <button
              class="job-filter-location-btn"
              :class="{ 'job-filter-location-btn--active': localFilters.locationType === 'residence' }"
              @click="updateLocationType('residence')"
            >
              מיקום המגורים שלי
            </button>
            <button
              class="job-filter-location-btn"
              :class="{ 'job-filter-location-btn--active': localFilters.locationType === 'myLocation' }"
              @click="updateLocationType('myLocation')"
            >
              המיקום הנוכחי
            </button>
          </div>
        </div>

        <!-- Price Filter -->
        <div class="job-filter-section">
          <div class="job-filter-section__header">
            <label class="job-filter-section__label">מינימום מחיר</label>
            <span class="job-filter-section__value">{{ localFilters.minPrice || 0 }} ₪</span>
          </div>
          <div class="job-filter-slider-container">
            <div class="job-filter-slider-track">
              <div 
                class="job-filter-slider-fill" 
                :style="{ width: `${((localFilters.minPrice || 0) / 1000) * 100}%` }"
              ></div>
            </div>
            <input
              class="job-filter-slider-input"
              type="range"
              min="0"
              max="1000"
              step="50"
              :value="localFilters.minPrice || 0"
              @input="updateMinPrice($event.target.value)"
            />
          </div>
        </div>

        <!-- Distance Filter -->
        <div class="job-filter-section">
          <div class="job-filter-section__header">
            <label class="job-filter-section__label">טווח בקילומטרים</label>
            <span class="job-filter-section__value">{{ localFilters.maxKm }} ק"מ</span>
          </div>
          <div class="job-filter-slider-container">
            <div class="job-filter-slider-track">
              <div 
                class="job-filter-slider-fill" 
                :style="{ width: `${(localFilters.maxKm / 50) * 100}%` }"
              ></div>
            </div>
            <input
              class="job-filter-slider-input"
              type="range"
              min="1"
              max="50"
              step="1"
              :value="localFilters.maxKm"
              @input="updateMaxKm($event.target.value)"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="job-filter-modal__footer">
        <button
          class="job-filter-modal__btn job-filter-modal__btn--back"
          @click="$emit('close')"
        >
          חזור
        </button>
        <button
          class="job-filter-modal__btn job-filter-modal__btn--apply"
          @click="applyFilters"
        >
          <i class="ph ph-faders"></i>
          <span>סנן תוצאות</span>
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
      searchQuery: "",
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
    handleAIFilter() {
      // TODO: Implement AI filter logic
      console.log("AI Filter clicked");
    },
    handleSearch() {
      // TODO: Implement search logic
      console.log("Search:", this.searchQuery);
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
$primary: #FF5F00;
$primary-dim: #CC4C00;
$obsidian: #000000;
$charcoal: #09090B;
$card-bg: #050505;
$glass: rgba(20, 20, 20, 0.6);
$success: #00E055;
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100010;
  direction: rtl;
  padding-bottom: 0;
  animation: fadeIn 0.3s ease-out;
  
  // Grid pattern background
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-size: 40px 40px;
    background-image: 
      linear-gradient(to right, rgba(255, 95, 0, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 95, 0, 0.03) 1px, transparent 1px);
    pointer-events: none;
    z-index: 0;
  }
  
  // Gradient blurs
  &::after {
    content: '';
    position: absolute;
    top: -10%;
    left: -10%;
    width: 50%;
    height: 40%;
    background: rgba(255, 95, 0, 0.05);
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;
  }
  
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
  background: rgba(9, 9, 11, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2.5rem 2.5rem 0 0;
  width: 100%;
  max-width: 448px;
  max-height: calc(92vh - 60px);
  height: calc(92vh - 60px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  z-index: 1;
  
  @media (min-width: 768px) {
    border-radius: 2rem;
    max-height: 85vh;
    height: auto;
    max-width: 448px;
    animation: slideUpCenter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
  width: 48px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  .job-filter-modal__handle:hover & {
    background: rgba(255, 255, 255, 0.3);
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
  gap: 24px;
  
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

// AI Filter Button
.job-filter-ai-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 1rem;
  background: linear-gradient(to right, rgba(255, 95, 0, 0.1), transparent);
  border: 1px solid rgba(255, 95, 0, 0.3);
  color: $text;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;

  &:hover {
    background: linear-gradient(to right, rgba(255, 95, 0, 0.2), transparent);
    border-color: rgba(255, 95, 0, 0.5);
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    box-shadow: 0 4px 12px rgba(255, 95, 0, 0.2);
    
    i {
      font-size: 20px;
    }
  }

  &__text {
    text-align: right;
  }

  &__title {
    font-size: 16px;
    font-weight: 900;
    color: $text;
    margin-bottom: 2px;
  }

  &__desc {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
  }

  &__pulse {
    position: relative;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__pulse-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: $primary;
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    opacity: 0.75;
  }

  &__pulse-dot {
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: $primary;
    z-index: 1;
  }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

// Search Input
.job-filter-search-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.job-filter-search-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(to right, rgba(255, 95, 0, 0.5), rgba(255, 95, 0, 0.1));
  border-radius: 1rem;
  filter: blur(8px);
  opacity: 0.3;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: 0;

  .job-filter-search-wrapper:hover & {
    opacity: 0.6;
  }
}

.job-filter-search-container {
  position: relative;
  background: $card-bg;
  border-radius: 1rem;
  border: 1px solid rgba(255, 95, 0, 0.4);
  display: flex;
  align-items: center;
  padding: 4px;
  z-index: 1;
}

.job-filter-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: $text;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  padding: 12px 16px;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: rgba(113, 113, 122, 1);
  }
}

.job-filter-search-btn {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  background: rgba(255, 95, 0, 0.2);
  color: $primary;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  i {
    font-size: 18px;
  }

  &:hover {
    background: $primary;
    color: #000;
  }
}

.job-filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-filter-section__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.job-filter-section__label {
  font-size: 12px;
  font-weight: 900;
  color: rgba(161, 161, 170, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.job-filter-section__value {
  font-size: 18px;
  font-weight: 900;
  color: $primary;
  font-family: monospace;
}

// Location Buttons
.job-filter-location-buttons {
  background: rgba(0, 0, 0, 0.4);
  padding: 6px;
  border-radius: 1rem;
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

.job-filter-location-btn {
  flex: 1;
  padding: 12px;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  border-radius: 0.75rem;
  background: transparent;
  color: rgba(113, 113, 122, 1);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;

  &:hover {
    color: $text;
    background: rgba(255, 255, 255, 0.05);
  }

  &--active {
    background: rgba(39, 39, 42, 1);
    color: $text;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(39, 39, 42, 1);
  }
}

// Slider Styles
.job-filter-slider-container {
  position: relative;
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.job-filter-slider-track {
  position: absolute;
  width: 100%;
  height: 8px;
  background: rgba(39, 39, 42, 1);
  border-radius: 4px;
  overflow: hidden;
}

.job-filter-slider-fill {
  height: 100%;
  background: $primary;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(255, 95, 0, 0.5);
  transition: width 0.1s ease;
}

.job-filter-slider-input {
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
    background: #000;
    border: 2px solid $primary;
    cursor: pointer;
    box-shadow: 0 0 0 3px rgba(39, 39, 42, 1), 0 4px 12px rgba(0, 0, 0, 0.5);
    transition: all 0.2s ease;
    margin-top: -8px;

    &:hover {
      transform: scale(1.1);
    }
  }

  &::-webkit-slider-runnable-track {
    height: 8px;
    background: transparent;
    border: none;
  }

  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border: 2px solid $primary;
    border-radius: 50%;
    background: #000;
    cursor: pointer;
    box-shadow: 0 0 0 3px rgba(39, 39, 42, 1), 0 4px 12px rgba(0, 0, 0, 0.5);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  &::-moz-range-track {
    width: 100%;
    height: 8px;
    background: transparent;
    border: none;
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
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(9, 9, 11, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
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
  border-radius: 1rem;
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

  i {
    font-size: 18px;
  }

  &--back {
    background: transparent;
    color: rgba(113, 113, 122, 1);
    border: 1px solid rgba(39, 39, 42, 1);
    font-size: 14px;

    &:hover {
      border-color: rgba(39, 39, 42, 0.8);
      color: $text;
      background: rgba(255, 255, 255, 0.05);
    }
  }

  &--apply {
    background: $primary;
    color: #000;
    font-size: 16px;
    font-weight: 900;
    box-shadow: 0 0 25px rgba(255, 95, 0, 0.4);
    
    i {
      font-size: 20px;
    }

    &:hover {
      background: #fff;
      box-shadow: 0 0 35px rgba(255, 95, 0, 0.6);
    }
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


  .job-filter-modal__content {
    padding: 16px;
    gap: 20px;
    padding-bottom: calc(160px + env(safe-area-inset-bottom));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-height: 0;
    overscroll-behavior: contain;
  }

  .job-filter-ai-btn {
    padding: 14px;
    
    &__icon {
      width: 36px;
      height: 36px;
      
      i {
        font-size: 18px;
      }
    }

    &__title {
      font-size: 14px;
    }

    &__desc {
      font-size: 9px;
    }
  }

  .job-filter-search-input {
    font-size: 13px;
    padding: 10px 14px;
  }

  .job-filter-search-btn {
    width: 36px;
    height: 36px;
    
    i {
      font-size: 16px;
    }
  }

  .job-filter-section {
    gap: 12px;
  }

  .job-filter-section__label {
    font-size: 11px;
  }

  .job-filter-section__value {
    font-size: 16px;
  }

  .job-filter-location-btn {
    padding: 10px;
    font-size: 11px;
  }

  .job-filter-slider-container {
    height: 28px;
  }

  .job-filter-slider-input {
    height: 28px;
    
    &::-webkit-slider-thumb {
      width: 20px;
      height: 20px;
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
    }
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
    gap: 18px;
  }

  .job-filter-ai-btn {
    padding: 12px;
    
    &__icon {
      width: 32px;
      height: 32px;
      
      i {
        font-size: 16px;
      }
    }

    &__title {
      font-size: 13px;
    }

    &__desc {
      font-size: 8px;
    }
  }

  .job-filter-section__value {
    font-size: 14px;
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

