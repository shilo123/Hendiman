<template>
  <div class="handyman-modal-overlay" @click.self="onClose">
    <div class="handyman-modal" dir="rtl">
      <!-- Header -->
      <div class="modal-header">
        <button class="btn-close" type="button" @click="onClose">← חזור</button>
      </div>

      <!-- Content -->
      <div class="modal-content" v-if="handymanDetails">
        <!-- Profile Section -->
        <div class="profile-section">
          <div class="profile-image-wrapper">
            <img
              class="profile-image"
              :src="getHandymanImage"
              :alt="handymanDetails.username"
              @error="onImageError"
            />
            <img
              class="profile-logo"
              :src="getHandymanLogo"
              alt="logo"
              @error="onLogoError"
            />
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ handymanDetails.username }}</h1>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-icon">⭐</span>
                <span class="stat-value">{{
                  handymanDetails.rating || 0
                }}</span>
                <span class="stat-label">דירוג</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🔧</span>
                <span class="stat-value">{{
                  handymanDetails.jobsDone || 0
                }}</span>
                <span class="stat-label">עבודות</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Section -->
        <div class="details-section">
          <!-- Contact Info -->
          <div class="detail-card" v-if="handymanDetails.phone">
            <div class="detail-label">📞 טלפון</div>
            <div class="detail-value">{{ handymanDetails.phone }}</div>
          </div>

          <div class="detail-card" v-if="handymanDetails.email">
            <div class="detail-label">✉️ אימייל</div>
            <div class="detail-value">{{ handymanDetails.email }}</div>
          </div>

          <div class="detail-card" v-if="handymanDetails.address">
            <div class="detail-label">📍 כתובת</div>
            <div class="detail-value">{{ handymanDetails.address }}</div>
          </div>

          <div class="detail-card" v-if="handymanDetails.city">
            <div class="detail-label">🏙️ עיר</div>
            <div class="detail-value">{{ handymanDetails.city }}</div>
          </div>

          <!-- Specialties -->
          <div
            class="detail-card specialties-card"
            v-if="specialtiesList.length"
          >
            <div class="detail-label">🛠️ תחומי התמחות</div>
            <div class="specialties-list">
              <div
                v-for="(spec, index) in specialtiesList"
                :key="index"
                class="specialty-item"
              >
                <div class="specialty-name">{{ spec.name || spec }}</div>
                <div
                  class="specialty-details"
                  v-if="spec.price || spec.typeWork"
                >
                  <span v-if="spec.price" class="specialty-price"
                    >{{ spec.price }}₪</span
                  >
                  <span
                    v-if="spec.typeWork"
                    class="specialty-type"
                    :class="{
                      'specialty-type--hourly': spec.typeWork === 'לשעה',
                      'specialty-type--fixed': spec.typeWork === 'קבלנות',
                    }"
                  >
                    {{ spec.typeWork }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button
            class="btn-action btn-action--primary"
            type="button"
            @click="onBookHandyman"
          >
            הזמן הנדימן
          </button>
          <button
            class="btn-action btn-action--ghost"
            type="button"
            @click="onClose"
          >
            סגירה
          </button>
          <button
            class="btn-action btn-action--danger"
            type="button"
            @click="onBlockHandyman"
          >
            חסום הנדימן
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ViewHandymanDetails",
  props: {
    handymanDetails: {
      type: Object,
      default: null,
    },
  },
  computed: {
    specialtiesList() {
      if (!this.handymanDetails || !this.handymanDetails.specialties) {
        return [];
      }
      return Array.isArray(this.handymanDetails.specialties)
        ? this.handymanDetails.specialties
        : [];
    },
    getHandymanImage() {
      const defaultImage = "/img/Hendima-logo.png";

      if (!this.handymanDetails) {
        return defaultImage;
      }

      const imageUrl = this.handymanDetails.imageUrl;

      // בדוק אם אין imageUrl או שהוא ריק
      if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
        return defaultImage;
      }

      // בדוק אם זה URL לא תקין (כמו demo-02.png או demo)
      // גם אם זה URL מלא אבל מכיל demo, נשתמש בברירת מחדל
      if (
        imageUrl.includes("demo-02.png") ||
        imageUrl.includes("/demo") ||
        imageUrl.endsWith("demo-02.png") ||
        (!imageUrl.startsWith("http") && !imageUrl.startsWith("/"))
      ) {
        return defaultImage;
      }

      return imageUrl;
    },
    getHandymanLogo() {
      const defaultLogo = "/img/Hendima-logo.png";

      if (!this.handymanDetails) {
        return defaultLogo;
      }

      const logoUrl = this.handymanDetails.logoUrl;

      // בדוק אם אין logoUrl או שהוא ריק
      if (!logoUrl || typeof logoUrl !== "string" || logoUrl.trim() === "") {
        return defaultLogo;
      }

      // בדוק אם זה URL לא תקין
      if (
        logoUrl.includes("demo") ||
        (!logoUrl.startsWith("http") && !logoUrl.startsWith("/"))
      ) {
        return defaultLogo;
      }

      return logoUrl;
    },
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    onBookHandyman() {
      this.$emit("book", this.handymanDetails);
    },
    onBlockHandyman() {
      this.$emit("block", this.handymanDetails);
    },
    onImageError(event) {
      // אם התמונה נכשלה בטעינה, החלף לתמונת ברירת מחדל
      const defaultImage = "/img/Hendima-logo.png";
      // רק אם זה לא כבר תמונת ברירת המחדל, החלף
      if (
        event.target.src !== defaultImage &&
        !event.target.src.includes("Hendima-logo.png")
      ) {
        event.target.src = defaultImage;
      }
    },
    onLogoError(event) {
      // אם הלוגו נכשל בטעינה, החלף ללוגו ברירת מחדל
      const defaultLogo = "/img/Hendima-logo.png";
      if (
        event.target.src !== defaultLogo &&
        !event.target.src.includes("Hendima-logo.png")
      ) {
        event.target.src = defaultLogo;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
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

.handyman-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 10px;
  }
}

.handyman-modal {
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  border: 1px solid $stroke;
  border-radius: 26px;
  box-shadow: $shadow, $shadowO;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    border-radius: 16px;
    max-height: 95vh;
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    padding: 12px 14px;
  }
}

.btn-close {
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 8px 16px;
  color: $text;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.3);
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
}

.modal-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.profile-section {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}

.profile-image-wrapper {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid rgba($orange, 0.35);
  object-fit: cover;
  box-shadow: $shadowO;

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }
}

.profile-logo {
  position: absolute;
  bottom: 4px;
  left: 4px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid $bg;
  object-fit: cover;
  background: $bg;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    border-width: 2px;
    bottom: 2px;
    left: 2px;
  }
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 1100;
  color: $text;

  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 10px;
  }
}

.profile-stats {
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    justify-content: center;
    gap: 16px;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  padding: 8px 12px;

  @media (max-width: 768px) {
    padding: 6px 10px;
  }
}

.stat-icon {
  font-size: 18px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.stat-value {
  font-size: 18px;
  font-weight: 1100;
  color: $orange3;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.stat-label {
  font-size: 14px;
  font-weight: 900;
  color: $muted;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.details-section {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;

  @media (max-width: 768px) {
    padding: 12px;
    border-radius: 12px;
  }
}

.detail-label {
  font-size: 12px;
  font-weight: 900;
  color: $muted;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 11px;
    margin-bottom: 6px;
  }
}

.detail-value {
  font-size: 16px;
  font-weight: 1000;
  color: $text;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.specialties-card {
  .detail-label {
    margin-bottom: 12px;
  }
}

.specialties-list {
  display: grid;
  gap: 12px;
}

.specialty-item {
  background: rgba($orange, 0.08);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px;
    gap: 8px;
  }
}

.specialty-name {
  font-size: 15px;
  font-weight: 1000;
  color: $text;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.specialty-details {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.specialty-price {
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.25);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 1100;
  color: $orange3;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 3px 8px;
  }
}

.specialty-type {
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid;

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 3px 8px;
  }

  &--hourly {
    color: $orange2;
    background: rgba($orange2, 0.15);
    border-color: rgba($orange2, 0.25);
  }

  &--fixed {
    color: $orange;
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.25);
  }
}

.modal-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
}

.btn-action {
  border-radius: 14px;
  padding: 14px 24px;
  font-weight: 1000;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 140px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
    width: 100%;
    min-width: auto;
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

  &--danger {
    background: rgba($danger, 0.15);
    border: 1px solid rgba($danger, 0.35);
    color: #ffd4d4;

    &:hover {
      background: rgba($danger, 0.25);
      border-color: rgba($danger, 0.5);
    }
  }
}
</style>
