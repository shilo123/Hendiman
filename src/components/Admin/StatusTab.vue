<template>
  <div class="status-section">
    <div class="status-section__header">
      <h2 class="status-section__title">סטטוסים</h2>
      <button class="refresh-status-btn" type="button" @click="loadStatus">
        ↻ רענן
      </button>
    </div>

    <div v-if="isLoadingStatus" class="loading-state">טוען נתוני סטטוס...</div>

    <div v-else class="status-grid">
      <div class="status-card">
        <div class="status-card__icon">👷</div>
        <div class="status-card__content">
          <div class="status-card__label">מספר הנדימנים</div>
          <div class="status-card__value">
            {{ status.handymenCount }}
          </div>
        </div>
      </div>

      <div class="status-card">
        <div class="status-card__icon">👥</div>
        <div class="status-card__content">
          <div class="status-card__label">מספר לקוחות</div>
          <div class="status-card__value">
            {{ status.clientsCount }}
          </div>
        </div>
      </div>

      <div class="status-card">
        <div class="status-card__icon">👤</div>
        <div class="status-card__content">
          <div class="status-card__label">מספר משתמשים</div>
          <div class="status-card__value">
            {{ status.totalUsersCount }}
          </div>
        </div>
      </div>

      <div class="status-card status-card--highlight">
        <div class="status-card__icon">💰</div>
        <div class="status-card__content">
          <div class="status-card__label">סכום העסקאות שבוצעו</div>
          <div class="status-card__value">
            ₪{{ formatCurrencySimple(status.totalTransactionsAmount) }}
          </div>
        </div>
      </div>

      <div class="status-card status-card--highlight">
        <div class="status-card__icon">📊</div>
        <div class="status-card__content">
          <div class="status-card__label">כמות העסקאות שבוצעו</div>
          <div class="status-card__value">
            {{ status.completedTransactionsCount }}
          </div>
        </div>
      </div>
    </div>

    <!-- How Did You Hear Section -->
    <div class="how-did-you-hear-section">
      <h3 class="how-did-you-hear-title">
        <span class="title-icon">📊</span>
        מאיפה אנשים הגיעו הכי הרבה
      </h3>
      <div class="how-did-you-hear-grid">
        <div class="how-did-you-hear-item how-did-you-hear-item--instagram">
          <div class="how-did-you-hear-icon">📷</div>
          <div class="how-did-you-hear-content">
            <div class="how-did-you-hear-label">אינסטגרם</div>
            <div class="how-did-you-hear-value">
              {{ status.howDidYouHearStats?.אינסטגרם || 0 }}
            </div>
            <div class="how-did-you-hear-progress">
              <div
                class="how-did-you-hear-progress-bar"
                :style="{
                  width: getHowDidYouHearPercentage('אינסטגרם') + '%',
                }"
              ></div>
            </div>
          </div>
        </div>
        <div class="how-did-you-hear-item how-did-you-hear-item--facebook">
          <div class="how-did-you-hear-icon">👥</div>
          <div class="how-did-you-hear-content">
            <div class="how-did-you-hear-label">פייסבוק</div>
            <div class="how-did-you-hear-value">
              {{ status.howDidYouHearStats?.פייסבוק || 0 }}
            </div>
            <div class="how-did-you-hear-progress">
              <div
                class="how-did-you-hear-progress-bar"
                :style="{
                  width: getHowDidYouHearPercentage('פייסבוק') + '%',
                }"
              ></div>
            </div>
          </div>
        </div>
        <div class="how-did-you-hear-item how-did-you-hear-item--friend">
          <div class="how-did-you-hear-icon">🤝</div>
          <div class="how-did-you-hear-content">
            <div class="how-did-you-hear-label">חבר</div>
            <div class="how-did-you-hear-value">
              {{ status.howDidYouHearStats?.חבר || 0 }}
            </div>
            <div class="how-did-you-hear-progress">
              <div
                class="how-did-you-hear-progress-bar"
                :style="{
                  width: getHowDidYouHearPercentage('חבר') + '%',
                }"
              ></div>
            </div>
          </div>
        </div>
        <div class="how-did-you-hear-item how-did-you-hear-item--google">
          <div class="how-did-you-hear-icon">🔍</div>
          <div class="how-did-you-hear-content">
            <div class="how-did-you-hear-label">גוגל</div>
            <div class="how-did-you-hear-value">
              {{ status.howDidYouHearStats?.גוגל || 0 }}
            </div>
            <div class="how-did-you-hear-progress">
              <div
                class="how-did-you-hear-progress-bar"
                :style="{
                  width: getHowDidYouHearPercentage('גוגל') + '%',
                }"
              ></div>
            </div>
          </div>
        </div>
        <div class="how-did-you-hear-item how-did-you-hear-item--other">
          <div class="how-did-you-hear-icon">📌</div>
          <div class="how-did-you-hear-content">
            <div class="how-did-you-hear-label">אחר</div>
            <div class="how-did-you-hear-value">
              {{ status.howDidYouHearStats?.אחר || 0 }}
            </div>
            <div class="how-did-you-hear-progress">
              <div
                class="how-did-you-hear-progress-bar"
                :style="{
                  width: getHowDidYouHearPercentage('אחר') + '%',
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="status-charts-section">
      <!-- Users Chart -->
      <div class="status-chart-card">
        <h3 class="status-chart-title">
          <span class="chart-icon">👥</span>
          כמות משתמשים לפי תאריכים
        </h3>
        <div class="status-chart-container">
          <canvas ref="usersChartCanvas"></canvas>
        </div>
      </div>

      <!-- Transactions Chart -->
      <div class="status-chart-card">
        <h3 class="status-chart-title">
          <span class="chart-icon">📊</span>
          כמות עסקאות לפי תאריכים
        </h3>
        <div class="status-chart-container">
          <canvas ref="transactionsChartCanvas"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default {
  name: "StatusTab",
  data() {
    return {
      status: {
        handymenCount: 0,
        clientsCount: 0,
        totalUsersCount: 0,
        totalTransactionsAmount: 0,
        completedTransactionsCount: 0,
        howDidYouHearStats: {
          אינסטגרם: 0,
          פייסבוק: 0,
          חבר: 0,
          גוגל: 0,
          אחר: 0,
        },
      },
      isLoadingStatus: false,
      // Charts
      usersChart: null,
      usersChartData: [],
      transactionsChart: null,
      transactionsChartData: [],
      toast: null,
    };
  },
  created() {
    this.toast = useToast();
  },
  mounted() {
    this.loadStatus();
    this.loadUsersChart();
    this.loadTransactionsChart();
  },
  beforeUnmount() {
    if (this.usersChart) {
      this.usersChart.destroy();
      this.usersChart = null;
    }
    if (this.transactionsChart) {
      this.transactionsChart.destroy();
      this.transactionsChart = null;
    }
  },
  methods: {
    formatCurrencySimple(value) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value || 0);
    },
    getHowDidYouHearPercentage(key) {
      if (!this.status.howDidYouHearStats) return 0;
      const total = Object.values(this.status.howDidYouHearStats).reduce(
        (sum, val) => sum + (val || 0),
        0
      );
      if (total === 0) return 0;
      const value = this.status.howDidYouHearStats[key] || 0;
      return Math.round((value / total) * 100);
    },
    async loadStatus() {
      this.isLoadingStatus = true;
      try {
        const response = await axios.get(`${URL}/admin/status`);
        if (response.data.success) {
          this.status = response.data.status || {
            handymenCount: 0,
            clientsCount: 0,
            totalUsersCount: 0,
            totalTransactionsAmount: 0,
            completedTransactionsCount: 0,
            howDidYouHearStats: {
              אינסטגרם: 0,
              פייסבוק: 0,
              חבר: 0,
              גוגל: 0,
              אחר: 0,
            },
          };
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את נתוני הסטטוס");
      } finally {
        this.isLoadingStatus = false;
      }
    },
    async loadUsersChart() {
      try {
        const response = await axios.get(`${URL}/admin/status/users-chart`);
        if (response.data.success) {
          this.usersChartData = response.data.chartData || [];
          this.$nextTick(() => {
            this.renderUsersChart();
          });
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את נתוני גרף המשתמשים");
      }
    },
    async loadTransactionsChart() {
      try {
        const response = await axios.get(
          `${URL}/admin/status/transactions-chart`
        );
        if (response.data.success) {
          this.transactionsChartData = response.data.chartData || [];
          this.$nextTick(() => {
            this.renderTransactionsChart();
          });
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את נתוני גרף העסקאות");
      }
    },
    renderUsersChart() {
      if (!this.$refs.usersChartCanvas) return;

      // Destroy existing chart if exists
      if (this.usersChart) {
        this.usersChart.destroy();
      }

      const ctx = this.$refs.usersChartCanvas.getContext("2d");

      const labels = this.usersChartData
        .map((item) => {
          const date = new Date(item.date);
          return date.toLocaleDateString("he-IL", {
            day: "numeric",
            month: "short",
          });
        })
        .reverse();

      this.usersChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "כמות משתמשים",
              data: this.usersChartData.map((item) => item.count).reverse(),
              borderColor: "#ff8a2b",
              backgroundColor: "rgba(255, 138, 43, 0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: "#ff8a2b",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
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
                stepSize: 1,
              },
            },
          },
        },
      });
    },
    renderTransactionsChart() {
      if (!this.$refs.transactionsChartCanvas) return;

      // Destroy existing chart if exists
      if (this.transactionsChart) {
        this.transactionsChart.destroy();
      }

      const ctx = this.$refs.transactionsChartCanvas.getContext("2d");

      const labels = this.transactionsChartData
        .map((item) => {
          const date = new Date(item.date);
          return date.toLocaleDateString("he-IL", {
            day: "numeric",
            month: "short",
          });
        })
        .reverse();

      this.transactionsChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "כמות עסקאות",
              data: this.transactionsChartData
                .map((item) => item.count)
                .reverse(),
              backgroundColor: "rgba(16, 185, 129, 0.6)",
              borderColor: "#10b981",
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
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
              borderColor: "rgba(16, 185, 129, 0.3)",
              borderWidth: 1,
              titleColor: "#10b981",
              bodyColor: "rgba(255, 255, 255, 0.92)",
              padding: 12,
              displayColors: true,
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
                stepSize: 1,
              },
              beginAtZero: true,
            },
          },
        },
      });
    },
  },
};
</script>

<style scoped lang="scss">
$bg: #0b0b0f;
$panel: #0f1016;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;
$font-family: "Heebo", sans-serif;

.status-section {
  animation: fadeIn 0.3s ease;
}

.status-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.status-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.refresh-status-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.status-card {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &--highlight {
    border-color: rgba($orange, 0.4);
    background: rgba($orange, 0.1);

    &:hover {
      background: rgba($orange, 0.15);
      border-color: rgba($orange, 0.5);
    }
  }
}

.status-card__icon {
  font-size: 48px;
  line-height: 1;
  flex-shrink: 0;
}

.status-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-card__label {
  font-size: 14px;
  font-weight: 900;
  color: $muted;
}

.status-card__value {
  font-size: 32px;
  font-weight: 1000;
  color: $orange2;
  font-family: "Courier New", monospace;
}

/* How Did You Hear Section */
.how-did-you-hear-section {
  margin-top: 32px;
  padding: 28px;
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.25);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ff6a00 0%, #ff8a2b 50%, #ff6a00 100%);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }
}

@keyframes shimmer {
  0%,
  100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 0%;
  }
}

.how-did-you-hear-title {
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;

  .title-icon {
    font-size: 28px;
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.how-did-you-hear-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.how-did-you-hear-item {
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 16px;
  }

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);

    &::before {
      opacity: 1;
    }

    .how-did-you-hear-icon {
      transform: scale(1.15) rotate(5deg);
    }

    .how-did-you-hear-progress-bar {
      animation: progressGlow 1.5s ease-in-out infinite;
    }
  }

  // Instagram
  &--instagram {
    background: linear-gradient(
      135deg,
      rgba(225, 48, 108, 0.15) 0%,
      rgba(225, 48, 108, 0.08) 100%
    );
    border: 2px solid rgba(225, 48, 108, 0.4);
    box-shadow: 0 4px 20px rgba(225, 48, 108, 0.2);

    &::before {
      background: linear-gradient(
        135deg,
        rgba(225, 48, 108, 0.2) 0%,
        rgba(225, 48, 108, 0.1) 100%
      );
    }

    .how-did-you-hear-icon {
      background: linear-gradient(
        135deg,
        #e1306c 0%,
        #fd1d1d 50%,
        #fcb045 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .how-did-you-hear-value {
      color: #e1306c;
    }

    .how-did-you-hear-progress-bar {
      background: linear-gradient(90deg, #e1306c 0%, #fd1d1d 50%, #fcb045 100%);
      box-shadow: 0 0 20px rgba(225, 48, 108, 0.5);
    }
  }

  // Facebook
  &--facebook {
    background: linear-gradient(
      135deg,
      rgba(24, 119, 242, 0.15) 0%,
      rgba(24, 119, 242, 0.08) 100%
    );
    border: 2px solid rgba(24, 119, 242, 0.4);
    box-shadow: 0 4px 20px rgba(24, 119, 242, 0.2);

    &::before {
      background: linear-gradient(
        135deg,
        rgba(24, 119, 242, 0.2) 0%,
        rgba(24, 119, 242, 0.1) 100%
      );
    }

    .how-did-you-hear-icon {
      color: #1877f2;
      filter: drop-shadow(0 2px 8px rgba(24, 119, 242, 0.4));
    }

    .how-did-you-hear-value {
      color: #1877f2;
    }

    .how-did-you-hear-progress-bar {
      background: linear-gradient(90deg, #1877f2 0%, #42a5f5 100%);
      box-shadow: 0 0 20px rgba(24, 119, 242, 0.5);
    }
  }

  // Friend
  &--friend {
    background: linear-gradient(
      135deg,
      rgba(16, 185, 129, 0.15) 0%,
      rgba(16, 185, 129, 0.08) 100%
    );
    border: 2px solid rgba(16, 185, 129, 0.4);
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);

    &::before {
      background: linear-gradient(
        135deg,
        rgba(16, 185, 129, 0.2) 0%,
        rgba(16, 185, 129, 0.1) 100%
      );
    }

    .how-did-you-hear-icon {
      color: #10b981;
      filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4));
    }

    .how-did-you-hear-value {
      color: #10b981;
    }

    .how-did-you-hear-progress-bar {
      background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    }
  }

  // Google
  &--google {
    background: linear-gradient(
      135deg,
      rgba(234, 67, 53, 0.15) 0%,
      rgba(234, 67, 53, 0.08) 100%
    );
    border: 2px solid rgba(234, 67, 53, 0.4);
    box-shadow: 0 4px 20px rgba(234, 67, 53, 0.2);

    &::before {
      background: linear-gradient(
        135deg,
        rgba(234, 67, 53, 0.2) 0%,
        rgba(234, 67, 53, 0.1) 100%
      );
    }

    .how-did-you-hear-icon {
      color: #ea4335;
      filter: drop-shadow(0 2px 8px rgba(234, 67, 53, 0.4));
    }

    .how-did-you-hear-value {
      color: #ea4335;
    }

    .how-did-you-hear-progress-bar {
      background: linear-gradient(90deg, #ea4335 0%, #fbbc04 100%);
      box-shadow: 0 0 20px rgba(234, 67, 53, 0.5);
    }
  }

  // Other
  &--other {
    background: linear-gradient(
      135deg,
      rgba(139, 92, 246, 0.15) 0%,
      rgba(139, 92, 246, 0.08) 100%
    );
    border: 2px solid rgba(139, 92, 246, 0.4);
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.2);

    &::before {
      background: linear-gradient(
        135deg,
        rgba(139, 92, 246, 0.2) 0%,
        rgba(139, 92, 246, 0.1) 100%
      );
    }

    .how-did-you-hear-icon {
      color: #8b5cf6;
      filter: drop-shadow(0 2px 8px rgba(139, 92, 246, 0.4));
    }

    .how-did-you-hear-value {
      color: #8b5cf6;
    }

    .how-did-you-hear-progress-bar {
      background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
    }
  }
}

.how-did-you-hear-icon {
  font-size: 48px;
  line-height: 1;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.how-did-you-hear-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.how-did-you-hear-label {
  font-size: 15px;
  font-weight: 900;
  color: $text;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.how-did-you-hear-value {
  font-size: 36px;
  font-weight: 1000;
  font-family: "Courier New", monospace;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.how-did-you-hear-progress {
  width: 100%;
  height: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-top: 8px;
  position: relative;
}

.how-did-you-hear-progress-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    animation: shimmerProgress 2s ease-in-out infinite;
  }
}

@keyframes shimmerProgress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes progressGlow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
  }
}

/* Status Charts Section */
.status-charts-section {
  margin-top: 32px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 20px;
  }
}

.status-chart-card {
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.25);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ff6a00 0%, #ff8a2b 50%, #ff6a00 100%);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }
}

.status-chart-title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 12px;

  .chart-icon {
    font-size: 24px;
  }
}

.status-chart-container {
  position: relative;
  height: 350px;
  width: 100%;

  @media (max-width: 768px) {
    height: 300px;
  }
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-weight: 900;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
