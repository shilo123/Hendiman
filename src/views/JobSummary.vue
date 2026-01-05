<template>
  <div class="jobSummary" dir="rtl">
    <div class="jobSummary__bg" aria-hidden="true"></div>

    <div class="jobSummary__container">
      <!-- Header -->
      <header class="jobSummary__header">
        <div class="jobSummary__headerContent">
          <h1 class="jobSummary__title">סיכום עבודה</h1>
          <button
            class="jobSummary__close"
            type="button"
            @click="goToDashboard"
            aria-label="סגור"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <!-- Content -->
      <div class="jobSummary__content">
        <!-- Loading State -->
        <div v-if="isLoading" class="jobSummary__loading">
          <div class="loadingSpinner"></div>
          <p>טוען פרטים...</p>
        </div>

        <!-- Content Cards -->
        <template v-else>
          <!-- Job Info Card -->
          <div class="summaryCard summaryCard--job">
            <div class="summaryCard__header">
              <div class="summaryCard__icon">🔧</div>
              <h2 class="summaryCard__title">פרטי העבודה</h2>
            </div>
            <div class="summaryCard__body">
              <div class="infoItem">
                <div class="infoItem__icon">📋</div>
                <div class="infoItem__content">
                  <span class="infoItem__label">סוג עבודה</span>
                  <span class="infoItem__value">{{
                    jobInfo?.subcategoryInfo?.[0]?.subcategory ||
                    jobInfo?.subcategoryInfo?.name ||
                    "עבודה"
                  }}</span>
                </div>
              </div>
              <div v-if="jobInfo?.locationText" class="infoItem">
                <div class="infoItem__icon">📍</div>
                <div class="infoItem__content">
                  <span class="infoItem__label">מיקום</span>
                  <span class="infoItem__value">{{
                    jobInfo.locationText
                  }}</span>
                </div>
              </div>
              <div
                v-if="jobInfo?.description"
                class="infoItem infoItem--description"
              >
                <div class="infoItem__icon">📝</div>
                <div class="infoItem__content">
                  <span class="infoItem__label">תיאור</span>
                  <p class="infoItem__value infoItem__value--text">
                    {{ jobInfo.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Rating & Review Card -->
          <div class="summaryCard summaryCard--rating">
            <div class="summaryCard__header">
              <div class="summaryCard__icon">⭐</div>
              <h2 class="summaryCard__title">דירוג וביקורת</h2>
            </div>
            <div class="summaryCard__body">
              <div class="ratingCard">
                <div class="ratingCard__stars">
                  <template v-for="i in 5" :key="i">
                    <div
                      class="star"
                      :class="{
                        'star--full': i <= fullStars,
                        'star--half': i === fullStars + 1 && hasHalfStar,
                        'star--empty': i > fullStars + (hasHalfStar ? 1 : 0),
                      }"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                      </svg>
                    </div>
                  </template>
                </div>
                <div class="ratingCard__number">{{ rating || 0 }}/5</div>
              </div>
              <div v-if="review" class="reviewCard">
                <p class="reviewCard__text">{{ review }}</p>
              </div>
              <div v-else class="reviewCard reviewCard--empty">
                <p>לא ניתנה ביקורת</p>
              </div>
            </div>
          </div>

          <!-- Financial Info Card (Handyman) -->
          <div v-if="isHandyman" class="summaryCard summaryCard--financial">
            <div class="summaryCard__header">
              <div class="summaryCard__icon">💰</div>
              <h2 class="summaryCard__title">פרטים כספיים</h2>
            </div>
            <div class="summaryCard__body">
              <div class="financialBreakdown">
                <div class="financialItem">
                  <div class="financialItem__label">
                    <span class="financialItem__icon">💵</span>
                    סכום העסקה
                  </div>
                  <div
                    class="financialItem__value financialItem__value--positive"
                  >
                    +{{ formatMoney(jobInfo?.price || 0) }} ₪
                  </div>
                </div>
                <div class="financialItem">
                  <div class="financialItem__label">
                    <span class="financialItem__icon">📊</span>
                    שירות פלטפורמה
                  </div>
                  <div
                    class="financialItem__value financialItem__value--negative"
                  >
                    -{{ formatMoney(commission) }} ₪
                  </div>
                </div>
                <div v-if="urgentFee > 0" class="financialItem">
                  <div class="financialItem__label">
                    <span class="financialItem__icon">⚡</span>
                    קריאה דחופה
                  </div>
                  <div
                    class="financialItem__value financialItem__value--negative"
                  >
                    -{{ formatMoney(urgentFee) }} ₪
                  </div>
                </div>
                <div class="financialDivider"></div>
                <div class="financialItem financialItem--total">
                  <div class="financialItem__label">
                    <span class="financialItem__icon">✅</span>
                    סה״כ התקבל
                  </div>
                  <div class="financialItem__value financialItem__value--total">
                    {{ formatMoney(totalEarned) }} ₪
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial Info Card (Client) -->
          <div v-else class="summaryCard summaryCard--financial">
            <div class="summaryCard__header">
              <div class="summaryCard__icon">💳</div>
              <h2 class="summaryCard__title">פרטים כספיים</h2>
            </div>
            <div class="summaryCard__body">
              <div class="financialItem financialItem--client">
                <div class="financialItem__label">
                  <span class="financialItem__icon">💵</span>
                  סכום שנגבה
                </div>
                <div class="financialItem__value financialItem__value--client">
                  {{
                    paymentInfo?.amountWithVAT ||
                    paymentInfo?.totalAmount ||
                    jobInfo?.price ||
                    0
                  }}
                  ₪
                </div>
              </div>
              <div class="receiptInfo">
                <div class="receiptInfo__icon">📧</div>
                <p class="receiptInfo__text">חשבונית נשלחה למייל שלך</p>
              </div>
            </div>
          </div>

          <!-- Share Button -->
          <div class="summaryCard summaryCard--share">
            <button class="shareBtn" type="button" @click="shareJob">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span class="shareBtn__text">שתף עבודה</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useMainStore } from "@/store/index";

export default {
  name: "JobSummary",
  props: {
    id: {
      type: String,
      required: true,
    },
    jobId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      store: null,
      jobInfo: null,
      paymentInfo: null,
      rating: null,
      review: "",
      isLoading: true,
      platformFeePercent: null, // Will be loaded dynamically from API
    };
  },
  computed: {
    userId() {
      if (this.jobInfo?.clientId) {
        return this.jobInfo.clientId.toString();
      }
      return this.store?.user?._id || this.$route.params.id;
    },
    isHandyman() {
      return this.store?.user?.isHandyman || false;
    },
    fullStars() {
      if (!this.rating) return 0;
      return Math.floor(this.rating);
    },
    hasHalfStar() {
      if (!this.rating) return false;
      return this.rating % 1 >= 0.5;
    },
    urgentFee() {
      return this.jobInfo?.urgent ? 10 : 0;
    },
    commission() {
      if (this.platformFeePercent === null) return 0; // Wait for API call
      const price = this.paymentInfo?.totalAmount || this.jobInfo?.price || 0;
      const feeRate = this.platformFeePercent / 100;
      return Math.round(price * feeRate * 100) / 100;
    },
    totalEarned() {
      if (this.paymentInfo && this.paymentInfo.spacious_H !== undefined) {
        return this.paymentInfo.spacious_H;
      }
      const price = this.jobInfo?.price || 0;
      return price - this.commission - this.urgentFee;
    },
  },
  async mounted() {
    this.store = useMainStore();
    await this.loadPlatformFee();
    await this.loadJobSummary();
  },
  methods: {
    formatMoney(amount) {
      return Number(amount).toFixed(2);
    },
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
    async loadJobSummary() {
      try {
        this.isLoading = true;

        const jobResponse = await axios.get(`${URL}/jobs/${this.jobId}`);
        if (jobResponse.data.success && jobResponse.data.job) {
          this.jobInfo = jobResponse.data.job;
        }

        try {
          const paymentResponse = await axios.get(
            `${URL}/payment/${this.jobId}`
          );
          if (paymentResponse.data.success && paymentResponse.data.payment) {
            this.paymentInfo = paymentResponse.data.payment;
          }
        } catch (paymentError) {
          // Payment might not exist yet
        }

        const ratingResponse = await axios.get(
          `${URL}/ratings/job/${this.jobId}`
        );
        if (ratingResponse.data.success && ratingResponse.data.rating) {
          this.rating = ratingResponse.data.rating.rating;
          this.review = ratingResponse.data.rating.review || "";
        } else {
          this.rating = null;
          this.review = "";
        }
      } catch (error) {
        if (this.store?.toast) {
          this.store.toast.showError("לא הצלחנו לטעון את סיכום העבודה");
        }
      } finally {
        this.isLoading = false;
      }
    },
    goToDashboard() {
      const userId =
        this.jobInfo?.clientId?.toString() ||
        this.jobInfo?.clientId ||
        this.store?.user?._id ||
        this.$route.params.id;
      if (userId) {
        this.$router.push(
          `/Dashboard/${userId}?fromJobSummary=true&jobId=${this.jobId}`
        );
      } else {
        this.$router.push("/");
      }
    },
    async shareJob() {
      try {
        const shareData = {
          title: `סיכום עבודה - ${
            this.jobInfo?.subcategoryInfo?.[0]?.subcategory ||
            this.jobInfo?.subcategoryInfo?.name ||
            "עבודה"
          }`,
          text: this.getShareText(),
          url: window.location.href,
        };

        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(
            `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
          );
          if (this.store?.toast) {
            this.store.toast.showSuccess("הקישור הועתק ללוח");
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          try {
            const shareText = `${this.getShareText()}\n\n${
              window.location.href
            }`;
            await navigator.clipboard.writeText(shareText);
            if (this.store?.toast) {
              this.store.toast.showSuccess("הקישור הועתק ללוח");
            }
          } catch (clipboardError) {}
        }
      }
    },
    getShareText() {
      let text = `סיכום עבודה:\n`;
      text += `סוג עבודה: ${
        this.jobInfo?.subcategoryInfo?.[0]?.subcategory ||
        this.jobInfo?.subcategoryInfo?.name ||
        "עבודה"
      }\n`;
      if (this.jobInfo?.locationText) {
        text += `מיקום: ${this.jobInfo.locationText}\n`;
      }
      if (this.rating) {
        text += `דירוג: ${this.rating}/5\n`;
      }
      if (this.review) {
        text += `ביקורת: ${this.review}\n`;
      }
      if (this.isHandyman) {
        text += `סה"כ התקבל: ${this.totalEarned} ₪`;
      } else {
        text += `סה"כ שולם: ${this.jobInfo?.price || 0} ₪`;
      }
      return text;
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #07070a;
$panel: rgba(255, 255, 255, 0.06);
$stroke: rgba(255, 106, 0, 0.22);
$stroke2: rgba(255, 106, 0, 0.35);
$orange: #ff6a00;
$orange2: #ff8a2b;
$green: #10b981;
$red: #ef4444;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

.jobSummary {
  min-height: 100vh;
  background: $bg;
  padding: 14px 12px calc(18px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: grid;
  place-items: start center;
  overflow: hidden;
  position: relative;
}

.jobSummary__bg {
  position: absolute;
  inset: -40%;
  background: radial-gradient(
      700px 450px at 15% 10%,
      rgba($orange, 0.22),
      transparent 55%
    ),
    radial-gradient(
      650px 420px at 90% 30%,
      rgba($orange2, 0.12),
      transparent 60%
    ),
    radial-gradient(
      520px 360px at 50% 100%,
      rgba(255, 255, 255, 0.06),
      transparent 55%
    );
  filter: blur(18px);
  opacity: 0.9;
  pointer-events: none;
}

.jobSummary__container {
  width: min(760px, 100%);
  position: relative;
  z-index: 1;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.03)
  );
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.jobSummary__header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba($orange, 0.1), transparent 55%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06), transparent);
}

.jobSummary__headerContent {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.jobSummary__title {
  margin: 0;
  color: $text;
  font-weight: 1100;
  letter-spacing: -0.3px;
  line-height: 1.15;
  font-size: clamp(22px, 4.8vw, 28px);
}

.jobSummary__close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.jobSummary__close:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba($orange, 0.3);
  transform: rotate(90deg);
}

.jobSummary__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.jobSummary__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: $muted;
}

.loadingSpinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba($orange, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.summaryCard {
  background: #242424;
  border: 1px solid $stroke;
  border-radius: 16px;
  padding: 18px;
  transition: all 0.2s ease;
}

.summaryCard:hover {
  border-color: $stroke2;
  background: rgba(255, 255, 255, 0.08);
}

.summaryCard__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.summaryCard__icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($orange, 0.15);
  border-radius: 10px;
}

.summaryCard__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.summaryCard__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.infoItem {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.infoItem--description {
  align-items: flex-start;
}

.infoItem__icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.infoItem__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.infoItem__label {
  color: $muted;
  font-size: 13px;
  font-weight: 800;
}

.infoItem__value {
  color: $text;
  font-size: 16px;
  font-weight: 900;
}

.infoItem__value--text {
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.ratingCard {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.ratingCard__stars {
  display: flex;
  gap: 4px;
  flex-direction: row-reverse;
}

.star {
  width: 28px;
  height: 28px;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.star svg {
  width: 100%;
  height: 100%;
}

.star--full {
  color: #ffd700;
}

.star--half {
  color: #ffd700;
  opacity: 0.5;
}

.star--empty {
  color: rgba(255, 255, 255, 0.3);
}

.ratingCard__number {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.reviewCard {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 8px;
}

.reviewCard--empty {
  color: $muted;
  font-style: italic;
  text-align: center;
}

.reviewCard__text {
  color: $text;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.financialBreakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.financialItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.financialItem--total {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.3);
  padding-top: 18px;
  margin-top: 4px;
  border-top: 2px solid rgba($orange, 0.3);
}

.financialItem--client {
  background: rgba($green, 0.1);
  border-color: rgba($green, 0.3);
}

.financialItem__label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: $text;
  font-size: 15px;
  font-weight: 900;
}

.financialItem__icon {
  font-size: 18px;
}

.financialItem__value {
  font-size: 17px;
  font-weight: 1000;
}

.financialItem__value--positive {
  color: $green;
}

.financialItem__value--negative {
  color: $red;
}

.financialItem__value--total {
  font-size: 24px;
  color: $orange;
  font-weight: 1100;
}

.financialItem__value--client {
  font-size: 22px;
  color: $green;
  font-weight: 1100;
}

.financialDivider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}

.receiptInfo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba($green, 0.1);
  border: 1px solid rgba($green, 0.3);
  border-radius: 12px;
  margin-top: 8px;
}

.receiptInfo__icon {
  font-size: 20px;
}

.receiptInfo__text {
  color: $text;
  font-size: 14px;
  font-weight: 800;
  margin: 0;
}

.summaryCard--share {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
}

.shareBtn {
  cursor: pointer;
  padding: 14px 28px;
  font-size: 16px;
  color: white;
  background: linear-gradient(135deg, $orange, $orange2);
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba($orange, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 900;
  -webkit-tap-highlight-color: transparent;
}

.shareBtn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba($orange, 0.4);
}

.shareBtn:active {
  transform: translateY(0);
}

.shareBtn__text {
  font-size: 15px;
}

@media (max-width: 520px) {
  .jobSummary__content {
    padding: 12px;
    gap: 12px;
  }

  .summaryCard {
    padding: 16px;
  }

  .summaryCard__title {
    font-size: 16px;
  }
}
</style>
