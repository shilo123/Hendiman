<template>
  <div class="jobSummary" dir="rtl">
    <div class="jobSummary__container">
      <div class="jobSummary__header">
        <h1 class="jobSummary__title">סיכום עבודה</h1>
        <button class="jobSummary__close" type="button" @click="goToDashboard">
          ✕
        </button>
      </div>

      <div class="jobSummary__content">
        <!-- Job Info -->
        <div class="summaryCard">
          <h2 class="summaryCard__title">פרטי העבודה</h2>
          <div class="summaryCard__body">
            <div class="infoRow">
              <span class="infoRow__label">סוג עבודה:</span>
              <span class="infoRow__value">{{
                jobInfo?.subcategoryInfo?.name || "עבודה"
              }}</span>
            </div>
            <div class="infoRow" v-if="jobInfo?.locationText">
              <span class="infoRow__label">מיקום:</span>
              <span class="infoRow__value">{{ jobInfo.locationText }}</span>
            </div>
            <div class="infoRow" v-if="jobInfo?.description">
              <span class="infoRow__label">תיאור:</span>
              <span class="infoRow__value">{{ jobInfo.description }}</span>
            </div>
          </div>
        </div>

        <!-- Rating & Review -->
        <div class="summaryCard">
          <h2 class="summaryCard__title">דירוג וביקורת</h2>
          <div class="summaryCard__body">
            <div class="ratingDisplay">
              <div class="ratingDisplay__stars">
                <template v-for="i in 5" :key="i">
                  <font-awesome-icon
                    v-if="i <= fullStars"
                    :icon="['fas', 'star']"
                    class="ratingDisplay__star ratingDisplay__star--full"
                  />
                  <font-awesome-icon
                    v-else-if="i === fullStars + 1 && hasHalfStar"
                    :icon="['fas', 'star-half-stroke']"
                    class="ratingDisplay__star ratingDisplay__star--half"
                  />
                  <font-awesome-icon
                    v-else
                    :icon="['fas', 'star']"
                    class="ratingDisplay__star ratingDisplay__star--empty"
                  />
                </template>
              </div>
              <span class="ratingDisplay__number">{{ rating || 0 }}/5</span>
            </div>
            <div v-if="review" class="reviewDisplay">
              <p class="reviewDisplay__text">{{ review }}</p>
            </div>
            <div v-else class="reviewDisplay reviewDisplay--empty">
              <p>לא ניתנה ביקורת</p>
            </div>
          </div>
        </div>

        <!-- Financial Info (Handyman) -->
        <div v-if="isHandyman" class="summaryCard">
          <h2 class="summaryCard__title">פרטים כספיים</h2>
          <div class="summaryCard__body">
            <div class="infoRow">
              <span class="infoRow__label">סכום העסקה:</span>
              <span class="infoRow__value money"
                >{{ jobInfo?.price || 0 }} ₪</span
              >
            </div>
            <div class="infoRow">
              <span class="infoRow__label">עמלה (10%):</span>
              <span class="infoRow__value money">{{ commission }} ₪</span>
            </div>
            <div v-if="urgentFee > 0" class="infoRow">
              <span class="infoRow__label">קריאה דחופה:</span>
              <span class="infoRow__value money">{{ urgentFee }} ₪</span>
            </div>
            <div class="infoRow infoRow--total">
              <span class="infoRow__label">סה״כ התקבל:</span>
              <span class="infoRow__value money money--total"
                >{{ totalEarned }} ₪</span
              >
            </div>
          </div>
        </div>

        <!-- Financial Info (Client) -->
        <div v-else class="summaryCard">
          <h2 class="summaryCard__title">פרטים כספיים</h2>
          <div class="summaryCard__body">
            <div class="infoRow">
              <span class="infoRow__label">סכום שנגבה:</span>
              <span class="infoRow__value money"
                >{{
                  paymentInfo?.amountWithVAT ||
                  paymentInfo?.totalAmount ||
                  jobInfo?.price ||
                  0
                }}
                ₪</span
              >
            </div>
            <div class="infoRow infoRow--total">
              <span class="infoRow__label">חשבונית במייל</span>
              <span
                class="infoRow__value"
                style="color: rgba(255, 255, 255, 0.7); font-size: 14px"
              >
                נשלחה למייל שלך
              </span>
            </div>
          </div>
        </div>

        <!-- Share Button -->
        <div class="summaryCard summaryCard--share">
          <button class="shareBtn" type="button" @click="shareJob">
            <font-awesome-icon
              :icon="['fas', 'share']"
              class="shareBtn__icon"
            />
            <span class="shareBtn__text">שתף עבודה</span>
          </button>
        </div>
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
    };
  },
  computed: {
    userId() {
      // Try to get userId from jobInfo.clientId if available, otherwise from route/store
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
      const price = this.paymentInfo?.totalAmount || this.jobInfo?.price || 0; // Total amount client paid (includes urgent fee if any)
      return Math.round(price * 0.1 * 100) / 100; // Commission is 10% of total amount
    },
    totalEarned() {
      // אם יש payment info, נשתמש בו (זה יותר מדויק)
      if (this.paymentInfo && this.paymentInfo.spacious_H !== undefined) {
        return this.paymentInfo.spacious_H;
      }
      // אחרת נחשב מה-job info
      const price = this.jobInfo?.price || 0; // Total amount client paid
      // הנדימן מקבל: סכום העסקה פחות עמלה (10%) פחות קריאה דחופה (אם יש)
      return price - this.commission - this.urgentFee;
    },
  },
  async mounted() {
    this.store = useMainStore();
    await this.loadJobSummary();
  },
  methods: {
    async loadJobSummary() {
      try {
        this.isLoading = true;

        // Load job info
        const jobResponse = await axios.get(`${URL}/jobs/${this.jobId}`);
        if (jobResponse.data.success && jobResponse.data.job) {
          this.jobInfo = jobResponse.data.job;
        } else {
        }

        // Load payment info if available
        try {
          const paymentResponse = await axios.get(
            `${URL}/payment/${this.jobId}`
          );
          if (paymentResponse.data.success && paymentResponse.data.payment) {
            this.paymentInfo = paymentResponse.data.payment;
          }
        } catch (paymentError) {
          // Payment might not exist yet, that's ok
        }

        // Load rating
        const ratingResponse = await axios.get(
          `${URL}/ratings/job/${this.jobId}`
        );
        if (ratingResponse.data.success && ratingResponse.data.rating) {
          this.rating = ratingResponse.data.rating.rating;
          this.review = ratingResponse.data.rating.review || "";
        } else {
          // No rating yet
          this.rating = null;
          this.review = "";
        }
      } catch (error) {
        // Show error to user
        if (this.store?.toast) {
          this.store.toast.showError("לא הצלחנו לטעון את סיכום העבודה");
        }
      } finally {
        this.isLoading = false;
      }
    },

    goToDashboard() {
      // Get userId from jobInfo if available, otherwise from route/store
      const userId =
        this.jobInfo?.clientId?.toString() ||
        this.jobInfo?.clientId ||
        this.store?.user?._id ||
        this.$route.params.id;
      if (userId) {
        // Pass query parameter to indicate we're coming from JobSummary after rating
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
            this.jobInfo?.subcategoryInfo?.name || "עבודה"
          }`,
          text: this.getShareText(),
          url: window.location.href,
        };

        // Try Web Share API first (mobile browsers)
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(
            `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
          );
          // Show success message (you might want to use a toast here)
          alert("הקישור הועתק ללוח");
        }
      } catch (error) {
        // User cancelled share or error occurred
        if (error.name !== "AbortError") {
          // Fallback to clipboard
          try {
            const shareText = `${this.getShareText()}\n\n${
              window.location.href
            }`;
            await navigator.clipboard.writeText(shareText);
            alert("הקישור הועתק ללוח");
          } catch (clipboardError) {}
        }
      }
    },

    getShareText() {
      let text = `סיכום עבודה:\n`;
      text += `סוג עבודה: ${this.jobInfo?.subcategoryInfo?.name || "עבודה"}\n`;
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
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
$bg: #0b0b0f;
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

.jobSummary {
  min-height: 100vh;
  background: $bg;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.jobSummary__container {
  max-width: 600px;
  width: 100%;
}

.jobSummary__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.jobSummary__title {
  font-size: 24px;
  font-weight: 1100;
  color: $text;
}

.jobSummary__close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.jobSummary__close:hover {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.5);
}

.jobSummary__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summaryCard {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 20px;
}

.summaryCard__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 16px;
}

.summaryCard__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.infoRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.infoRow:last-child {
  border-bottom: none;
}

.infoRow--total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 2px solid rgba($orange, 0.3);
  border-bottom: none;
  font-size: 18px;
  font-weight: 1000;
}

.infoRow__label {
  color: $muted;
  font-weight: 800;
}

.infoRow__value {
  color: $text;
  font-weight: 900;
}

.money {
  color: $orange2;
  font-weight: 1000;
}

.money--total {
  font-size: 20px;
  color: $orange;
}

.ratingDisplay {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ratingDisplay__stars {
  display: flex;
  gap: 4px;
  flex-direction: row-reverse;
}

.ratingDisplay__star {
  font-size: 20px;
  color: #ffd700;
}

.ratingDisplay__star--empty {
  color: rgba(255, 255, 255, 0.3);
}

.ratingDisplay__number {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
}

.reviewDisplay {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
}

.reviewDisplay--empty {
  color: $muted;
  font-style: italic;
}

.reviewDisplay__text {
  color: $text;
  line-height: 1.6;
  margin: 0;
}

.summaryCard--share {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.shareBtn {
  cursor: pointer;
  padding: 1em;
  font-size: 1em;
  width: 7em;
  aspect-ratio: 1/0.25;
  color: white;
  background: #212121;
  background-size: cover;
  background-blend-mode: overlay;
  border-radius: 0.5em;
  outline: 0.1em solid #353535;
  border: 0;
  box-shadow: 0 0 1em 1em rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: $font-family;
  font-weight: 600;
}

.shareBtn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 1em 0.45em rgba(0, 0, 0, 0.1);
  background: linear-gradient(45deg, #ff6a00, #ff8a2b);
  background: radial-gradient(
    circle at bottom,
    rgba(255, 138, 43, 0.5) 10%,
    #ff6a00 70%
  );
  outline: 0;
}

.shareBtn__icon {
  color: white;
  font-size: 1.1em;
}

.shareBtn__text {
  font-size: 0.95em;
}

.shareBtn:active {
  transform: scale(1.05);
}
</style>
