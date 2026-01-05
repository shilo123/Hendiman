<template>
  <div
    v-if="isVisible"
    class="incomeDetailModal"
    dir="rtl"
    @click.self="handleClose"
  >
    <div class="incomeDetailModal__content">
      <button
        class="incomeDetailModal__close"
        type="button"
        @click="handleClose"
        aria-label="סגור"
      >
        ✕
      </button>

      <div class="incomeDetailModal__header">
        <div class="incomeDetailModal__icon">💰</div>
        <h2 class="incomeDetailModal__title">התשלום שוחרר בהצלחה!</h2>
        <p class="incomeDetailModal__subtitle">פירוט הכנסה מהעבודה</p>
      </div>

      <div class="incomeDetailModal__body">
        <!-- Job Info -->
        <div class="incomeCard incomeCard--job">
          <div class="incomeCard__icon">🔧</div>
          <div class="incomeCard__content">
            <div class="incomeCard__label">סוג עבודה</div>
            <div class="incomeCard__value">
              {{
                jobInfo?.subcategoryInfo?.[0]?.subcategory ||
                jobInfo?.subcategoryInfo?.name ||
                "עבודה"
              }}
            </div>
          </div>
        </div>

        <!-- Financial Breakdown -->
        <div class="incomeBreakdown">
          <div class="incomeBreakdown__item">
            <div class="incomeBreakdown__label">
              <span class="incomeBreakdown__icon">💵</span>
              סכום העסקה
            </div>
            <div
              class="incomeBreakdown__value incomeBreakdown__value--positive"
            >
              +{{ formatMoney(totalAmount) }} ₪
            </div>
          </div>

          <div class="incomeBreakdown__item">
            <div class="incomeBreakdown__label">
              <span class="incomeBreakdown__icon">📊</span>
              שירות פלטפורמה
            </div>
            <div
              class="incomeBreakdown__value incomeBreakdown__value--negative"
            >
              -{{ formatMoney(commission) }} ₪
            </div>
          </div>

          <div v-if="urgentFee > 0" class="incomeBreakdown__item">
            <div class="incomeBreakdown__label">
              <span class="incomeBreakdown__icon">⚡</span>
              קריאה דחופה
            </div>
            <div
              class="incomeBreakdown__value incomeBreakdown__value--negative"
            >
              -{{ formatMoney(urgentFee) }} ₪
            </div>
          </div>

          <div class="incomeBreakdown__divider"></div>

          <div class="incomeBreakdown__item incomeBreakdown__item--total">
            <div class="incomeBreakdown__label">
              <span class="incomeBreakdown__icon">✅</span>
              סה״כ התקבל
            </div>
            <div class="incomeBreakdown__value incomeBreakdown__value--total">
              {{ formatMoney(totalEarned) }} ₪
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div class="incomeSuccess">
          <div class="incomeSuccess__icon">✨</div>
          <p class="incomeSuccess__text">הכסף הועבר לחשבון שלך בהצלחה!</p>
        </div>
      </div>

      <div class="incomeDetailModal__footer">
        <button
          class="incomeDetailModal__btn"
          type="button"
          @click="handleClose"
        >
          מעולה!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";

export default {
  name: "IncomeDetailModal",
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    jobInfo: {
      type: Object,
      default: null,
    },
    paymentInfo: {
      type: Object,
      default: null,
    },
  },
  emits: ["close"],
  data() {
    return {
      platformFeePercent: null, // Will be loaded dynamically from API
    };
  },
  computed: {
    totalAmount() {
      return this.paymentInfo?.totalAmount || this.jobInfo?.price || 0;
    },
    commission() {
      if (this.platformFeePercent === null) return 0; // Wait for API call
      const feeRate = this.platformFeePercent / 100;
      return Math.round(this.totalAmount * feeRate * 100) / 100;
    },
    urgentFee() {
      return this.jobInfo?.urgent ? 10 : 0;
    },
    totalEarned() {
      if (this.paymentInfo && this.paymentInfo.spacious_H !== undefined) {
        return this.paymentInfo.spacious_H;
      }
      return this.totalAmount - this.commission - this.urgentFee;
    },
  },
  async mounted() {
    await this.loadPlatformFee();
  },
  methods: {
    async loadPlatformFee() {
      try {
        const response = await axios.get(`${URL}/api/platform/fee`);
        if (response.data.success && response.data.fee !== undefined) {
          this.platformFeePercent = response.data.fee;
        } else {
          console.error(
            "Failed to load platform fee: Invalid response",
            response.data
          );
        }
      } catch (error) {
        console.error("Error loading platform fee from API:", error);
        // Try to reload after a delay
        setTimeout(() => this.loadPlatformFee(), 2000);
      }
    },
    handleClose() {
      this.$emit("close");
    },
    formatMoney(amount) {
      return Number(amount).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: rgba(0, 0, 0, 0.9);
$panel: rgba(255, 255, 255, 0.08);
$orange: #ff6a00;
$orange2: #ff8a2b;
$green: #10b981;
$red: #ef4444;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$border: rgba(255, 255, 255, 0.1);

.incomeDetailModal {
  position: fixed;
  inset: 0;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
  backdrop-filter: blur(12px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.incomeDetailModal__content {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  border: 1px solid rgba($orange, 0.3);
  border-radius: 24px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  position: relative;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.incomeDetailModal__close {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.incomeDetailModal__close:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.incomeDetailModal__header {
  text-align: center;
  margin-bottom: 32px;
}

.incomeDetailModal__icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.incomeDetailModal__title {
  font-size: 28px;
  font-weight: 1100;
  color: $text;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, $orange, $orange2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.incomeDetailModal__subtitle {
  color: $muted;
  font-size: 16px;
  margin: 0;
}

.incomeDetailModal__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.incomeCard {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid $border;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.incomeCard:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba($orange, 0.3);
}

.incomeCard__icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($orange, 0.15);
  border-radius: 12px;
}

.incomeCard__content {
  flex: 1;
}

.incomeCard__label {
  color: $muted;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 4px;
}

.incomeCard__value {
  color: $text;
  font-size: 18px;
  font-weight: 1000;
}

.incomeBreakdown {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid $border;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.incomeBreakdown__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.incomeBreakdown__item--total {
  padding-top: 20px;
  border-top: 2px solid rgba($orange, 0.3);
  margin-top: 4px;
}

.incomeBreakdown__label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: $text;
  font-size: 16px;
  font-weight: 900;
}

.incomeBreakdown__icon {
  font-size: 20px;
}

.incomeBreakdown__value {
  font-size: 18px;
  font-weight: 1000;
}

.incomeBreakdown__value--positive {
  color: $green;
}

.incomeBreakdown__value--negative {
  color: $red;
}

.incomeBreakdown__value--total {
  font-size: 24px;
  color: $orange;
  font-weight: 1100;
}

.incomeBreakdown__divider {
  height: 1px;
  background: $border;
  margin: 4px 0;
}

.incomeSuccess {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba($green, 0.1);
  border: 1px solid rgba($green, 0.3);
  border-radius: 12px;
  text-align: right;
}

.incomeSuccess__icon {
  font-size: 24px;
}

.incomeSuccess__text {
  color: $text;
  font-size: 15px;
  font-weight: 800;
  margin: 0;
}

.incomeDetailModal__footer {
  display: flex;
  justify-content: center;
}

.incomeDetailModal__btn {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, $orange, $orange2);
  color: white;
  font-weight: 1000;
  font-size: 17px;
  box-shadow: 0 12px 30px rgba($orange, 0.3);
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.incomeDetailModal__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba($orange, 0.4);
}

.incomeDetailModal__btn:active {
  transform: translateY(0);
}

@media (max-width: 520px) {
  .incomeDetailModal__content {
    padding: 24px;
    max-width: 100%;
  }

  .incomeDetailModal__title {
    font-size: 24px;
  }

  .incomeDetailModal__icon {
    font-size: 56px;
  }
}
</style>
