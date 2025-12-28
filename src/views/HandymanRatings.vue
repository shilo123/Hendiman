<template>
  <div class="handymanRatings" dir="rtl">
    <div class="handymanRatings__container">
      <div class="handymanRatings__header">
        <button
          class="handymanRatings__back"
          type="button"
          @click="$router.push(`/Dashboard/${userId}`)"
        >
          ← חזור
        </button>
        <h1 class="handymanRatings__title">הדירוגים והביקורות שלי</h1>
      </div>

      <div v-if="isLoading" class="handymanRatings__loading">
        <p>טוען נתונים...</p>
      </div>

      <div v-else class="handymanRatings__content">
        <!-- Statistics -->
        <div class="statsCard">
          <h2 class="statsCard__title">סטטיסטיקות</h2>
          <div class="statsCard__grid">
            <div class="statItem">
              <div class="statItem__label">הרווח החודש</div>
              <div class="statItem__value money">{{ monthlyEarnings }} ₪</div>
            </div>
            <div class="statItem">
              <div class="statItem__label">הרווח הכולל</div>
              <div class="statItem__value money">{{ totalEarnings }} ₪</div>
            </div>
            <div class="statItem">
              <div class="statItem__label">דירוג ממוצע</div>
              <div class="statItem__value rating">
                <span>{{ averageRating.toFixed(1) }}</span>
                <div class="statItem__stars">
                  <template v-for="i in 5" :key="i">
                    <font-awesome-icon
                      v-if="i <= fullStars"
                      :icon="['fas', 'star']"
                      class="statItem__star statItem__star--full"
                    />
                    <font-awesome-icon
                      v-else-if="i === fullStars + 1 && hasHalfStar"
                      :icon="['fas', 'star-half-stroke']"
                      class="statItem__star statItem__star--half"
                    />
                    <font-awesome-icon
                      v-else
                      :icon="['fas', 'star']"
                      class="statItem__star statItem__star--empty"
                    />
                  </template>
                </div>
              </div>
            </div>
            <div class="statItem">
              <div class="statItem__label">סה״כ ביקורות</div>
              <div class="statItem__value">{{ ratings.length }}</div>
            </div>
            <div class="statItem">
              <div class="statItem__label">עבודות שבוצעו</div>
              <div class="statItem__value">{{ jobDone }}</div>
            </div>
          </div>
        </div>

        <!-- Ratings List -->
        <div class="ratingsList">
          <h2 class="ratingsList__title">ביקורות</h2>
          <div v-if="ratings.length === 0" class="ratingsList__empty">
            <p>עדיין אין ביקורות</p>
          </div>
          <div v-else class="ratingsList__items">
            <div v-for="rating in ratings" :key="rating._id" class="ratingItem">
              <div class="ratingItem__header">
                <div class="ratingItem__stars">
                  <template v-for="i in 5" :key="i">
                    <font-awesome-icon
                      v-if="i <= Math.floor(rating.rating)"
                      :icon="['fas', 'star']"
                      class="ratingItem__star ratingItem__star--full"
                    />
                    <font-awesome-icon
                      v-else
                      :icon="['fas', 'star']"
                      class="ratingItem__star ratingItem__star--empty"
                    />
                  </template>
                </div>
                <span class="ratingItem__date">{{
                  formatDate(rating.createdAt)
                }}</span>
              </div>
              <div v-if="rating.review" class="ratingItem__review">
                {{ rating.review }}
              </div>
              <div v-else class="ratingItem__review ratingItem__review--empty">
                אין ביקורת טקסטואלית
              </div>
              <div class="ratingItem__footer">
                <div v-if="rating.jobName" class="ratingItem__job">
                  עבודה: {{ rating.jobName }}
                </div>
                <div v-if="rating.customerName" class="ratingItem__customer">
                  מלקוח: {{ rating.customerName }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Earnings Chart -->
        <div class="earningsChart">
          <h2 class="earningsChart__title">גרף הכנסות</h2>
          <div class="chart-period-selector">
            <button
              class="period-btn"
              :class="{ 'period-btn--active': chartPeriod === 'daily' }"
              @click="loadChartData('daily')"
            >
              יומי
            </button>
            <button
              class="period-btn"
              :class="{ 'period-btn--active': chartPeriod === 'weekly' }"
              @click="loadChartData('weekly')"
            >
              שבועי
            </button>
            <button
              class="period-btn"
              :class="{ 'period-btn--active': chartPeriod === 'monthly' }"
              @click="loadChartData('monthly')"
            >
              חודשי
            </button>
          </div>
          <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>

        <!-- Back Button at Bottom -->
        <div class="handymanRatings__footer">
          <button
            class="handymanRatings__backBottom"
            type="button"
            @click="$router.push(`/Dashboard/${userId}`)"
          >
            ← חזור לדשבורד
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
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default {
  name: "HandymanRatings",
  data() {
    return {
      store: null,
      ratings: [],
      isLoading: true,
      monthlyEarnings: 0,
      totalEarnings: 0,
      jobDone: 0,
      chart: null,
      chartPeriod: "daily",
      chartData: [],
    };
  },
  computed: {
    userId() {
      return this.store?.user?._id || this.$route.params.id;
    },
    averageRating() {
      if (this.ratings.length === 0) return 0;
      const sum = this.ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
      return sum / this.ratings.length;
    },
    fullStars() {
      return Math.floor(this.averageRating);
    },
    hasHalfStar() {
      return this.averageRating % 1 >= 0.5;
    },
  },
  async mounted() {
    this.store = useMainStore();
    await this.loadRatings();
    await this.loadChartData("daily");
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  },
  methods: {
    async loadRatings() {
      try {
        const response = await axios.get(
          `${URL}/ratings/handyman/${this.userId}`
        );
        if (response.data.success) {
          this.ratings = response.data.ratings || [];
          this.monthlyEarnings = response.data.monthlyEarnings || 0;
          this.totalEarnings = response.data.totalEarnings || 0;
          this.jobDone = response.data.jobDone || 0;
        }
      } catch (error) {
      } finally {
        this.isLoading = false;
      }
    },
    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    async loadChartData(period = "daily") {
      this.chartPeriod = period;
      try {
        const response = await axios.get(
          `${URL}/handyman/${this.userId}/earnings/chart?period=${period}`
        );
        if (response.data.success) {
          this.chartData = response.data.chartData || [];
          this.renderChart();
        }
      } catch (error) {
        console.error("Error loading chart data:", error);
      }
    },
    renderChart() {
      if (!this.$refs.chartCanvas) return;

      // Destroy existing chart if exists
      if (this.chart) {
        this.chart.destroy();
      }

      const ctx = this.$refs.chartCanvas.getContext("2d");

      // Format labels based on period
      const labels = this.chartData.map((item) => {
        const date = new Date(item.date);
        switch (this.chartPeriod) {
          case "weekly":
            return `שבוע ${item.dateLabel.split("-")[1]}, ${
              item.dateLabel.split("-")[0]
            }`;
          case "monthly":
            const monthNames = [
              "ינואר",
              "פברואר",
              "מרץ",
              "אפריל",
              "מאי",
              "יוני",
              "יולי",
              "אוגוסט",
              "ספטמבר",
              "אוקטובר",
              "נובמבר",
              "דצמבר",
            ];
            const [year, month] = item.dateLabel.split("-");
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          default: // daily
            return date.toLocaleDateString("he-IL", {
              day: "numeric",
              month: "short",
            });
        }
      });

      this.chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels.reverse(), // Reverse for RTL
          datasets: [
            {
              label: "הכנסות",
              data: this.chartData.map((item) => item.earnings).reverse(),
              borderColor: "#ff8a2b",
              backgroundColor: "rgba(255, 138, 43, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                color: "rgba(255, 255, 255, 0.92)",
                font: {
                  family: "Heebo",
                  size: 12,
                  weight: "bold",
                },
                padding: 15,
              },
            },
            tooltip: {
              backgroundColor: "rgba(11, 11, 15, 0.95)",
              borderColor: "rgba(255, 138, 43, 0.3)",
              borderWidth: 1,
              titleColor: "#ff8a2b",
              bodyColor: "rgba(255, 255, 255, 0.92)",
              padding: 12,
              displayColors: true,
              callbacks: {
                label: function (context) {
                  return `הכנסות: ${context.parsed.y.toFixed(2)} ₪`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
              ticks: {
                color: "rgba(255, 255, 255, 0.62)",
                font: {
                  family: "Heebo",
                  size: 11,
                  weight: "bold",
                },
              },
            },
            y: {
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
              ticks: {
                color: "rgba(255, 255, 255, 0.62)",
                font: {
                  family: "Heebo",
                  size: 11,
                  weight: "bold",
                },
                callback: function (value) {
                  return value.toFixed(0) + " ₪";
                },
              },
            },
          },
        },
      });
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

.handymanRatings {
  min-height: 100vh;
  background: $bg;
  padding: 20px;
}

.handymanRatings__container {
  max-width: 900px;
  margin: 0 auto;
}

.handymanRatings__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.handymanRatings__back {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 900;
  transition: all 0.2s ease;
}

.handymanRatings__back:hover {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.5);
}

.handymanRatings__title {
  font-size: 24px;
  font-weight: 1100;
  color: $text;
}

.handymanRatings__loading {
  text-align: center;
  padding: 40px;
  color: $muted;
}

.handymanRatings__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.statsCard {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.statsCard__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 20px;
}

.statsCard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

@media (max-width: 400px) {
  .handymanRatings {
    padding: 12px;
  }

  .handymanRatings__title {
    font-size: 20px;
  }

  .statsCard,
  .ratingsList {
    padding: 16px;
  }

  .statsCard__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .statItem__value {
    font-size: 18px;
  }

  .statItem__label {
    font-size: 12px;
  }

  .ratingItem {
    padding: 12px;
  }

  .ratingItem__review {
    font-size: 14px;
  }
}

.statItem {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.statItem__label {
  color: $muted;
  font-size: 14px;
  font-weight: 800;
}

.statItem__value {
  color: $text;
  font-size: 24px;
  font-weight: 1000;
}

.statItem__value.money {
  color: $orange2;
}

.statItem__value.rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.statItem__stars {
  display: flex;
  gap: 4px;
  flex-direction: row-reverse;
}

.statItem__star {
  font-size: 16px;
  color: #ffd700;
}

.statItem__star--empty {
  color: rgba(255, 255, 255, 0.3);
}

.ratingsList {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.ratingsList__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 20px;
}

.ratingsList__empty {
  text-align: center;
  padding: 40px;
  color: $muted;
}

.ratingsList__items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ratingItem {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.ratingItem__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ratingItem__stars {
  display: flex;
  gap: 4px;
  flex-direction: row-reverse;
}

.ratingItem__star {
  font-size: 16px;
  color: #ffd700;
}

.ratingItem__star--empty {
  color: rgba(255, 255, 255, 0.3);
}

.ratingItem__date {
  color: $muted;
  font-size: 12px;
  font-weight: 800;
}

.ratingItem__review {
  color: $text;
  line-height: 1.6;
  margin-bottom: 8px;
}

.ratingItem__review--empty {
  color: $muted;
  font-style: italic;
}

.ratingItem__footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.ratingItem__job {
  color: $orange2;
  font-size: 12px;
  font-weight: 900;
}

.ratingItem__customer {
  color: $muted;
  font-size: 12px;
  font-weight: 800;
}

.handymanRatings__footer {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.handymanRatings__backBottom {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  font-size: 14px;
  transition: all 0.2s ease;
}

.handymanRatings__backBottom:hover {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.5);
  transform: translateY(-1px);
}

/* Earnings Chart */
.earningsChart {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.earningsChart__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 20px;
}

.chart-period-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.period-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $muted;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.5);
  }

  &--active {
    background: rgba($orange, 0.15);
    color: $orange2;
    border-color: rgba($orange, 0.5);
  }
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;

  @media (max-width: 400px) {
    height: 250px;
  }
}
</style>
