<template>
  <Transition name="modal">
    <div class="job-modal-overlay" @click.self="onClose" v-if="jobDetails">
      <div class="job-modal-content">
        <button class="close-button" @click="onClose">✕</button>

        <div v-if="jobDetails" class="job-content">
          <!-- Step Indicator -->
          <div class="step-indicator">
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'open',
                'step-item--completed': [
                  'assigned',
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            >
              <div class="step-circle">
                <span
                  v-if="
                    ['assigned', 'on_the_way', 'in_progress', 'done'].includes(
                      jobDetails.status
                    )
                  "
                  >✓</span
                >
                <span v-else>1</span>
              </div>
              <span class="step-label">פתוחה</span>
            </div>
            <div
              class="step-line"
              :class="{
                'step-line--active': [
                  'assigned',
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'assigned',
                'step-item--completed': [
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            >
              <div class="step-circle">
                <span
                  v-if="
                    ['on_the_way', 'in_progress', 'done'].includes(
                      jobDetails.status
                    )
                  "
                  >✓</span
                >
                <span v-else-if="jobDetails.status === 'assigned'">2</span>
                <span v-else>2</span>
              </div>
              <span class="step-label">שובצה</span>
            </div>
            <div
              class="step-line"
              :class="{
                'step-line--active': [
                  'on_the_way',
                  'in_progress',
                  'done',
                ].includes(jobDetails.status),
              }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'on_the_way',
                'step-item--completed': ['in_progress', 'done'].includes(
                  jobDetails.status
                ),
              }"
            >
              <div class="step-circle">
                <span v-if="['in_progress', 'done'].includes(jobDetails.status)"
                  >✓</span
                >
                <span v-else-if="jobDetails.status === 'on_the_way'">3</span>
                <span v-else>3</span>
              </div>
              <span class="step-label">בדרך</span>
            </div>
            <div
              class="step-line"
              :class="{
                'step-line--active': ['in_progress', 'done'].includes(
                  jobDetails.status
                ),
              }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'in_progress',
                'step-item--completed': jobDetails.status === 'done',
              }"
            >
              <div class="step-circle">
                <span v-if="jobDetails.status === 'done'">✓</span>
                <span v-else-if="jobDetails.status === 'in_progress'">4</span>
                <span v-else>4</span>
              </div>
              <span class="step-label">בביצוע</span>
            </div>
            <div
              class="step-line"
              :class="{ 'step-line--active': jobDetails.status === 'done' }"
            ></div>
            <div
              class="step-item"
              :class="{
                'step-item--active': jobDetails.status === 'done',
                'step-item--cancelled': jobDetails.status === 'cancelled',
              }"
            >
              <div class="step-circle">
                <span v-if="jobDetails.status === 'done'">✓</span>
                <span v-else-if="jobDetails.status === 'cancelled'">✕</span>
                <span v-else>5</span>
              </div>
              <span class="step-label">{{
                jobDetails.status === "cancelled" ? "בוטלה" : "הושלמה"
              }}</span>
            </div>
          </div>

          <!-- Header with image -->
          <div class="job-header">
            <div class="job-header-content">
              <div class="job-image-wrapper">
                <img
                  class="job-image"
                  :src="jobDetails.imageUrl || '/img/Hendima-logo.png'"
                  :alt="
                    jobDetails.subcategoryInfo?.name ||
                    jobDetails.subcategoryName ||
                    'תמונה'
                  "
                  @error="onImageError"
                />
                <span v-if="jobDetails.urgent" class="urgent-badge">דחוף</span>
              </div>
              <div class="job-header-info">
                <h1 class="job-title">
                  {{
                    jobDetails.subcategoryInfo?.name ||
                    jobDetails.subcategoryName ||
                    "ללא שם"
                  }}
                </h1>
                <div class="job-tags">
                  <span
                    class="tag"
                    :class="
                      (jobDetails.subcategoryInfo?.typeWork ||
                        jobDetails.billingType) === 'לשעה'
                        ? 'tag--hourly'
                        : 'tag--fixed'
                    "
                  >
                    {{
                      jobDetails.subcategoryInfo?.typeWork ||
                      jobDetails.billingType ||
                      "קבלנות"
                    }}
                  </span>
                  <span
                    v-if="jobDetails.workType"
                    class="tag tag--work-type"
                    :class="{
                      'tag--easy': jobDetails.workType === 'קלה',
                      'tag--medium': jobDetails.workType === 'מורכבת',
                      'tag--hard': jobDetails.workType === 'קשה',
                    }"
                  >
                    {{ jobDetails.workType }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Details Section -->
          <div class="job-details">
            <div class="detail-card">
              <div class="detail-icon">
                <i class="fas fa-user"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">לקוח</span>
                <span class="detail-value">{{ jobDetails.clientName }}</span>
              </div>
            </div>

            <div class="detail-card detail-card--price">
              <div class="detail-icon">
                <i class="fas fa-shekel-sign"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">מחיר</span>
                <span class="detail-value detail-value--price">
                  {{
                    jobDetails.subcategoryInfo?.price || jobDetails.price || 0
                  }}
                  שקלים
                </span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">מיקום</span>
                <span class="detail-value">{{ jobDetails.locationText }}</span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">מתי</span>
                <span class="detail-value">{{
                  jobDetails.when === "asap"
                    ? "כמה שיותר מהר"
                    : jobDetails.whenLabel || jobDetails.when
                }}</span>
              </div>
            </div>

            <div
              class="detail-card"
              v-if="jobDetails.subcategoryInfo?.category"
            >
              <div class="detail-icon">
                <i class="fas fa-folder"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">קטגוריה</span>
                <span class="detail-value">{{
                  jobDetails.subcategoryInfo.category || "ללא קטגוריה"
                }}</span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <i class="fas fa-tools"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">סוג עבודה</span>
                <span class="detail-value">{{
                  jobDetails.subcategoryInfo?.typeWork ||
                  jobDetails.billingType ||
                  "קבלנות"
                }}</span>
              </div>
            </div>

            <div class="detail-card" v-if="jobDetails.createdAt">
              <div class="detail-icon">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <div class="detail-content">
                <span class="detail-label">נוצר ב</span>
                <span class="detail-value">{{
                  formatDate(jobDetails.createdAt)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="job-description" v-if="jobDetails.desc">
            <h3 class="section-title">תיאור העבודה:</h3>
            <p class="description-text">{{ jobDetails.desc }}</p>
          </div>

          <!-- Actions -->
          <div class="job-actions">
            <button
              v-if="isHendiman && jobDetails.status === 'open'"
              class="btn-action btn-action--primary"
              @click="onAccept"
            >
              קבל עבודה
            </button>
            <button
              v-if="isHendiman"
              class="btn-action btn-action--ghost"
              @click="onSkip"
            >
              דלג
            </button>
            <button class="btn-action btn-action--ghost" @click="onClose">
              סגירה
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: "ViewJob",
  props: {
    jobDetails: {
      type: Object,
      default: null,
    },
    isHendiman: {
      type: Boolean,
      default: false,
    },
    getStatusLabel: {
      type: Function,
      required: true,
    },
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    onAccept() {
      this.$emit("accept", this.jobDetails);
      this.onClose();
    },
    onSkip() {
      this.$emit("skip", this.jobDetails);
      this.onClose();
    },
    onImageError(event) {
      // אם התמונה נכשלה בטעינה, החלף לתמונת ברירת מחדל
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
      try {
        const dateObj = date.$date ? new Date(date.$date) : new Date(date);
        return new Intl.DateTimeFormat("he-IL", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(dateObj);
      } catch (e) {
        return String(date);
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

$r: 18px;
$r2: 26px;

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.job-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  font-family: $font-family;
}

/* Modal Animation */
.modal-enter-active {
  transition: opacity 0.3s ease;
}

.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .job-modal-content,
.modal-leave-active .job-modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}

.modal-enter-from .job-modal-content,
.modal-leave-to .job-modal-content {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-enter-to .job-modal-content {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.job-modal-content {
  background: linear-gradient(180deg, $card2, $card);
  border: 1px solid $stroke;
  border-radius: 16px;
  box-shadow: $shadow;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  padding: 24px;
  position: relative;
  color: $text;
  direction: rtl;
  text-align: right;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-family: $font-family;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 14px;
    max-width: 95%;
    max-height: 95vh;
  }
}

.close-button {
  position: absolute;
  top: 12px;
  left: 12px;
  background: none;
  border: none;
  font-size: 20px;
  color: $muted;
  cursor: pointer;
  transition: color 0.2s ease;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    color: $text;
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 768px) {
    font-size: 18px;
    top: 10px;
    left: 10px;
    width: 28px;
    height: 28px;
  }
}

.job-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  margin-bottom: 16px;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 12px 16px;

  @media (max-width: 768px) {
    padding: 10px 12px;
    margin-bottom: 12px;
    gap: 2px;
  }
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    gap: 3px;
  }
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 1000;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
}

.step-item--active .step-circle {
  background: linear-gradient(135deg, $orange, $orange2);
  border-color: $orange;
  color: #111;
  box-shadow: 0 3px 10px rgba($orange, 0.4);
  transform: scale(1.08);
}

.step-item--completed .step-circle {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border-color: #4caf50;
  color: #fff;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.step-item--cancelled .step-circle {
  background: linear-gradient(135deg, $danger, #ff5252);
  border-color: $danger;
  color: #fff;
  box-shadow: 0 4px 12px rgba($danger, 0.3);
}

.step-label {
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  transition: color 0.3s ease;
  margin-top: 4px;

  @media (max-width: 768px) {
    font-size: 9px;
    margin-top: 2px;
  }
}

.step-item--active .step-label,
.step-item--completed .step-label,
.step-item--cancelled .step-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 1000;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 6px;
  position: relative;
  top: -16px;
  transition: background 0.3s ease;

  @media (max-width: 768px) {
    margin: 0 3px;
    top: -14px;
  }
}

.step-line--active {
  background: linear-gradient(90deg, $orange, $orange2);
  box-shadow: 0 0 8px rgba($orange, 0.4);
}

.job-header {
  padding-bottom: 12px;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding-bottom: 10px;
    margin-bottom: 0;
  }
}

.job-header-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.job-header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.job-image-wrapper {
  width: 160px;
  height: 160px;
  min-width: 160px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 250px;
    height: 160px;
    min-width: unset;
    align-self: center;
  }
}

.urgent-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, $danger, #ff5252);
  color: #fff;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 1000;
  box-shadow: 0 2px 8px rgba($danger, 0.4);
  z-index: 10;
}

.job-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.job-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 1000;
  color: $orange3;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 6px;
  }
}

.job-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.tag {
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 1000;
  font-size: 11px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  color: $text;

  @media (max-width: 768px) {
    padding: 3px 8px;
    font-size: 9px;
  }

  &--urgent {
    border-color: rgba($danger, 0.45);
    background: rgba($danger, 0.12);
    color: #ffd4d4;
  }

  &--status {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.84);
  }

  &--hourly {
    border-color: rgba($orange2, 0.28);
    background: rgba($orange2, 0.14);
  }

  &--fixed {
    border-color: rgba($orange, 0.22);
    background: rgba($orange, 0.12);
  }

  &--work-type {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.84);

    &.tag--easy {
      border-color: rgba(76, 175, 80, 0.3);
      background: rgba(76, 175, 80, 0.12);
      color: #a5d6a7;
    }

    &.tag--medium {
      border-color: rgba(255, 193, 7, 0.3);
      background: rgba(255, 193, 7, 0.12);
      color: #ffe082;
    }

    &.tag--hard {
      border-color: rgba($danger, 0.3);
      background: rgba($danger, 0.12);
      color: #ffcdd2;
    }
  }
}

.job-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px 0;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px 0;
  }
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
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
}

.detail-card--price {
  border-color: rgba($orange, 0.2);
  background: rgba($orange, 0.05);

  &:hover {
    background: rgba($orange, 0.08);
    border-color: rgba($orange, 0.3);
  }
}

.detail-icon {
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
}

.detail-card--price .detail-icon {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.3);
  color: $orange;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 3px;
  }
}

.detail-label {
  font-weight: 900;
  color: $muted;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.detail-value {
  font-weight: 1000;
  color: $text;
  font-size: 14px;
  line-height: 1.3;
  word-break: break-word;

  @media (max-width: 768px) {
    font-size: 13px;
  }

  &--price {
    color: $orange3;
    font-weight: 1100;
    font-size: 16px;

    @media (max-width: 768px) {
      font-size: 15px;
    }
  }
}

.job-description {
  padding: 12px 0;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding: 10px 0;
  }
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 1000;
  color: $orange;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 6px;
  }
}

.description-text {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: $text;
  line-height: 1.5;
  white-space: pre-wrap;

  @media (max-width: 768px) {
    font-size: 12px;
    line-height: 1.4;
  }
}

.job-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  padding-top: 12px;
  margin-top: 0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    padding-top: 10px;
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

  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 12px;
    width: 100%;
    min-width: unset;
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
}
</style>
