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
$muted: rgba(255, 255, 255, 0.62);
$muted2: rgba(255, 255, 255, 0.48);

$orange: #ff6a00;
$orange2: #ff8a2b;

$success: #10b981;
$danger: #ef4444;
$blue: #3b82f6;
$violet: #8b5cf6;

$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Arial, sans-serif;

.status-section {
  animation: fadeIn 0.35s ease;
  color: $text;
}

/* ===== Hero Header ===== */
.status-section__header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  gap: 16px;
  flex-wrap: wrap;

  padding: 18px 18px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.25);
  background: radial-gradient(
      1100px 420px at 0% 0%,
      rgba($orange, 0.2),
      transparent 55%
    ),
    radial-gradient(
      900px 420px at 100% 0%,
      rgba($success, 0.18),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.03);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.38);
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.07),
      transparent 45%,
      rgba(255, 255, 255, 0.03)
    );
    pointer-events: none;
  }
}

.status-section__title {
  position: relative;
  z-index: 2;
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  letter-spacing: 0.2px;
  text-shadow: 0 12px 32px rgba($orange, 0.25);
}

.refresh-status-btn {
  position: relative;
  z-index: 2;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.35);
  background: rgba($orange, 0.16);
  color: $orange2;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease, box-shadow 0.18s ease;
  font-family: $font-family;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);

  &:hover {
    background: rgba($orange, 0.28);
    border-color: rgba($orange, 0.58);
    transform: translateY(-1px);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0px) scale(0.99);
  }
}

/* ===== Loading (skeleton vibe while keeping your class) ===== */
.loading-state {
  text-align: center;
  padding: 32px 16px;
  color: $muted;
  font-weight: 1000;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.09),
    rgba(255, 255, 255, 0.05)
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
}

/* ===== Status Grid ===== */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

/* ===== Status Cards (alive AF) ===== */
.status-card {
  position: relative;
  padding: 18px 18px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;

  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.28);
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease, box-shadow 0.18s ease;

  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    background: radial-gradient(
        800px 240px at 20% 0%,
        rgba($orange, 0.2),
        transparent 55%
      ),
      radial-gradient(
        700px 260px at 100% 0%,
        rgba($violet, 0.12),
        transparent 60%
      );
    opacity: 0;
    transition: opacity 0.18s ease;
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    top: -40%;
    left: -55%;
    width: 70%;
    height: 220%;
    transform: rotate(22deg);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.12),
      transparent
    );
    opacity: 0;
    transition: opacity 0.18s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.28);
    box-shadow: 0 22px 58px rgba(0, 0, 0, 0.38);

    &::before {
      opacity: 1;
    }
    &::after {
      opacity: 1;
      animation: shine 1.2s ease-in-out infinite;
    }

    .status-card__icon {
      transform: translateY(-1px) rotate(-4deg) scale(1.06);
      filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
    }

    .status-card__value {
      transform: translateY(-1px);
    }
  }

  &:active {
    transform: translateY(-1px) scale(0.995);
  }

  &--highlight {
    border-color: rgba($orange, 0.35);
    background: rgba($orange, 0.08);

    &::before {
      background: radial-gradient(
          900px 260px at 25% 0%,
          rgba($orange, 0.3),
          transparent 60%
        ),
        radial-gradient(
          700px 280px at 100% 0%,
          rgba($success, 0.16),
          transparent 60%
        );
    }

    &:hover {
      background: rgba($orange, 0.12);
      border-color: rgba($orange, 0.55);
    }

    .status-card__value {
      color: $orange2;
      text-shadow: 0 10px 30px rgba($orange, 0.18);
    }
  }
}

.status-card__icon {
  font-size: 44px;
  line-height: 1;
  flex-shrink: 0;
  transition: transform 0.18s ease, filter 0.18s ease;
}

.status-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.status-card__label {
  font-size: 13px;
  font-weight: 1000;
  color: $muted;
  letter-spacing: 0.2px;
}

.status-card__value {
  font-size: 30px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.92);
  font-family: "Courier New", monospace;
  transition: transform 0.18s ease, color 0.18s ease;
}

/* Make the first 3 cards feel distinct (no template changes needed) */
.status-grid .status-card:nth-child(1) {
  border-color: rgba($blue, 0.2);
  &:hover {
    border-color: rgba($blue, 0.36);
  }
  .status-card__value {
    color: rgba(59, 130, 246, 0.92);
  }
}
.status-grid .status-card:nth-child(2) {
  border-color: rgba($violet, 0.2);
  &:hover {
    border-color: rgba($violet, 0.36);
  }
  .status-card__value {
    color: rgba(167, 139, 250, 0.95);
  }
}
.status-grid .status-card:nth-child(3) {
  border-color: rgba($success, 0.2);
  &:hover {
    border-color: rgba($success, 0.36);
  }
  .status-card__value {
    color: rgba(16, 185, 129, 0.95);
  }
}

/* ===== How Did You Hear (super premium) ===== */
.how-did-you-hear-section {
  margin-top: 22px;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.22);
  background: radial-gradient(
      1100px 420px at 0% 0%,
      rgba($orange, 0.14),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.03);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.32);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.06),
      transparent 45%,
      rgba(255, 255, 255, 0.02)
    );
    pointer-events: none;
  }
}

.how-did-you-hear-title {
  position: relative;
  z-index: 1;
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;

  .title-icon {
    font-size: 22px;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35));
    animation: pulse 2.4s ease-in-out infinite;
  }
}

.how-did-you-hear-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.how-did-you-hear-item {
  padding: 16px;
  border-radius: 18px;
  transition: transform 0.18s ease, box-shadow 0.18s ease,
    border-color 0.18s ease, background 0.18s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(11, 11, 15, 0.35);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.26);

  &::after {
    content: "";
    position: absolute;
    top: -40%;
    left: -55%;
    width: 70%;
    height: 220%;
    transform: rotate(22deg);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.14),
      transparent
    );
    opacity: 0;
    transition: opacity 0.18s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 52px rgba(0, 0, 0, 0.36);

    &::after {
      opacity: 1;
      animation: shine 1.2s ease-in-out infinite;
    }

    .how-did-you-hear-icon {
      transform: scale(1.1) rotate(4deg);
    }
    .how-did-you-hear-progress-bar {
      filter: saturate(1.2);
    }
  }

  &:active {
    transform: translateY(-1px) scale(0.995);
  }
}

.how-did-you-hear-icon {
  font-size: 38px;
  line-height: 1;
  flex-shrink: 0;
  transition: transform 0.18s ease;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.3));
}

.how-did-you-hear-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.how-did-you-hear-label {
  font-size: 13px;
  font-weight: 1000;
  color: $text;
  letter-spacing: 0.2px;
}

.how-did-you-hear-value {
  font-size: 26px;
  font-weight: 1000;
  font-family: "Courier New", monospace;
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}

.how-did-you-hear-progress {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-top: 6px;
}

.how-did-you-hear-progress-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.85s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.28) 50%,
      transparent 100%
    );
    animation: shimmerProgress 2s ease-in-out infinite;
  }
}

/* Color themes for items (your existing modifiers) */
.how-did-you-hear-item--instagram {
  border-color: rgba(225, 48, 108, 0.35);
  .how-did-you-hear-value {
    color: rgba(225, 48, 108, 0.95);
  }
  .how-did-you-hear-progress-bar {
    background: linear-gradient(90deg, #e1306c 0%, #fd1d1d 55%, #fcb045 100%);
    box-shadow: 0 0 26px rgba(225, 48, 108, 0.3);
  }
}
.how-did-you-hear-item--facebook {
  border-color: rgba(24, 119, 242, 0.35);
  .how-did-you-hear-value {
    color: rgba(24, 119, 242, 0.95);
  }
  .how-did-you-hear-progress-bar {
    background: linear-gradient(90deg, #1877f2 0%, #42a5f5 100%);
    box-shadow: 0 0 26px rgba(24, 119, 242, 0.3);
  }
}
.how-did-you-hear-item--friend {
  border-color: rgba(16, 185, 129, 0.35);
  .how-did-you-hear-value {
    color: rgba(16, 185, 129, 0.95);
  }
  .how-did-you-hear-progress-bar {
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
    box-shadow: 0 0 26px rgba(16, 185, 129, 0.3);
  }
}
.how-did-you-hear-item--google {
  border-color: rgba(234, 67, 53, 0.35);
  .how-did-you-hear-value {
    color: rgba(234, 67, 53, 0.95);
  }
  .how-did-you-hear-progress-bar {
    background: linear-gradient(90deg, #ea4335 0%, #fbbc04 100%);
    box-shadow: 0 0 26px rgba(234, 67, 53, 0.3);
  }
}
.how-did-you-hear-item--other {
  border-color: rgba(139, 92, 246, 0.35);
  .how-did-you-hear-value {
    color: rgba(139, 92, 246, 0.95);
  }
  .how-did-you-hear-progress-bar {
    background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
    box-shadow: 0 0 26px rgba(139, 92, 246, 0.3);
  }
}

/* ===== Charts Section ===== */
.status-charts-section {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.status-chart-card {
  position: relative;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.22);
  background: radial-gradient(
      1100px 420px at 0% 0%,
      rgba($orange, 0.14),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.03);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.32);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease,
    background 0.18s ease;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.06),
      transparent 45%,
      rgba(255, 255, 255, 0.02)
    );
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($orange, 0.34);
    background: rgba(255, 255, 255, 0.04);
  }
}

.status-chart-title {
  position: relative;
  z-index: 1;
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 10px;

  .chart-icon {
    font-size: 20px;
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
  }
}

.status-chart-container {
  position: relative;
  height: 360px;
  width: 100%;
  z-index: 1;

  @media (max-width: 768px) {
    height: 300px;
  }
}

/* ===== Animations ===== */
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
@keyframes shimmer {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 0%;
  }
}
@keyframes shimmerProgress {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}
@keyframes shine {
  0% {
    transform: translateX(-20%) rotate(22deg);
  }
  100% {
    transform: translateX(220%) rotate(22deg);
  }
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

/* Mobile Responsive - max-width 500px */
@media (max-width: 500px) {
  .status-section__header {
    padding: 14px;
    border-radius: 12px;
  }

  .status-section__title {
    font-size: 18px;
  }

  .refresh-status-btn {
    width: 100%;
    justify-content: center;
    padding: 10px;
  }

  .status-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .status-card {
    padding: 14px;
    border-radius: 12px;
  }

  .status-card__icon {
    font-size: 36px;
  }

  .status-card__value {
    font-size: 24px;
  }

  .status-card__label {
    font-size: 12px;
  }

  .how-did-you-hear-section {
    padding: 16px;
    border-radius: 12px;
    margin-top: 16px;
  }

  .how-did-you-hear-title {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .how-did-you-hear-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .how-did-you-hear-item {
    padding: 12px;
    border-radius: 12px;
  }

  .how-did-you-hear-icon {
    font-size: 32px;
  }

  .how-did-you-hear-label {
    font-size: 12px;
  }

  .how-did-you-hear-value {
    font-size: 22px;
  }

  .status-charts-section {
    margin-top: 16px;
    gap: 12px;
  }

  .status-chart-card {
    padding: 14px;
    border-radius: 12px;
  }

  .status-chart-title {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .status-chart-container {
    height: 280px;
  }
}

/* ===== Reduced motion ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
