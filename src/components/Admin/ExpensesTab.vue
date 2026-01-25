<template>
  <div class="financials-section">
    <!-- HERO HEADER -->
    <div class="financials-hero">
      <div class="financials-header">
        <div class="header-left">
          <h2 class="financials-title">פירוט הוצאות והכנסות</h2>
          <div class="header-sub">
            <span class="chip chip--muted">Live</span>
            <span class="dot" aria-hidden="true"></span>
            <span class="muted"> עדכון אחרון: {{ lastUpdatedText }} </span>
          </div>
        </div>

        <div class="header-right">
          <div
            class="hero-net"
            :class="netProfit >= 0 ? 'hero-net--profit' : 'hero-net--loss'"
          >
            <div class="hero-net__label">נטו</div>
            <div class="hero-net__value">
              ₪{{ formatCurrency(Math.abs(netProfit)) }}
              <span class="hero-net__tag">{{
                netProfit >= 0 ? "רווח" : "הפסד"
              }}</span>
            </div>
          </div>

          <button
            class="refresh-financials-btn"
            type="button"
            @click="loadFinancials"
          >
            ↻ רענן
          </button>
        </div>
      </div>

      <!-- QUICK INSIGHTS ROW -->
      <div class="insights-row">
        <div class="insight-card insight-card--rev">
          <div class="insight-card__icon">💵</div>
          <div class="insight-card__meta">
            <div class="insight-card__label">סה״כ הכנסות</div>
            <div class="insight-card__value">
              ₪{{ formatCurrency(totalRevenue) }}
            </div>
          </div>
        </div>

        <div class="insight-card insight-card--exp">
          <div class="insight-card__icon">💰</div>
          <div class="insight-card__meta">
            <div class="insight-card__label">סה״כ הוצאות</div>
            <div class="insight-card__value">
              ₪{{ formatCurrency(totalExpenses) }}
            </div>
          </div>
        </div>

        <div class="insight-card insight-card--rate">
          <div class="insight-card__icon">💱</div>
          <div class="insight-card__meta">
            <div class="insight-card__label">USD → ILS</div>
            <div class="insight-card__value">{{ usdToIlsRate.toFixed(4) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="isLoadingFinancials" class="loading-state">
      <div class="skeleton-wrap">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton-grid">
          <div class="skeleton skeleton--card"></div>
          <div class="skeleton skeleton--card"></div>
        </div>
        <div class="skeleton skeleton--wide"></div>
      </div>
      <div class="loading-text">טוען נתונים פיננסיים…</div>
    </div>

    <div v-else class="financials-content">
      <!-- LEFT COLUMN: EXPENSES -->
      <div class="financials-card financials-card--expenses">
        <div class="financials-card__header">
          <div class="card-title-row">
            <h3 class="financials-card__title">💰 הוצאות</h3>
            <span class="chip chip--danger">
              ₪{{ formatCurrency(totalExpenses) }}
            </span>
          </div>
          <div class="card-sub muted">פילוח הוצאות לפי קטגוריות</div>
        </div>

        <div class="financials-card__body">
          <div class="financial-item">
            <div class="financial-item__label">הוצאות AI</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--expense">
                {{ getCurrencySymbol("expenses.AI expenses")
                }}{{
                  formatCurrency(
                    getDisplayValue(
                      "expenses.AI expenses",
                      financials.expenses["AI expenses"]
                    )
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--expense"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'expenses.AI expenses',
                          financials.expenses['AI expenses']
                        ),
                        totalExpenses
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'expenses.AI expenses',
                    financials.expenses['AI expenses']
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item">
            <div class="financial-item__label">הוצאות DB</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--expense">
                {{ getCurrencySymbol("expenses.DB expenses")
                }}{{
                  formatCurrency(
                    getDisplayValue(
                      "expenses.DB expenses",
                      financials.expenses["DB expenses"]
                    )
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--expense"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'expenses.DB expenses',
                          financials.expenses['DB expenses']
                        ),
                        totalExpenses
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'expenses.DB expenses',
                    financials.expenses['DB expenses']
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item">
            <div class="financial-item__label">הוצאות API</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--expense">
                {{ getCurrencySymbol("expenses.API expenses")
                }}{{
                  formatCurrency(
                    getDisplayValue(
                      "expenses.API expenses",
                      financials.expenses["API expenses"]
                    )
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--expense"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'expenses.API expenses',
                          financials.expenses['API expenses']
                        ),
                        totalExpenses
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'expenses.API expenses',
                    financials.expenses['API expenses']
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item">
            <div class="financial-item__label">הוצאות שיווק</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--expense">
                {{ getCurrencySymbol("expenses.Marketing expenses")
                }}{{
                  formatCurrency(
                    getDisplayValue(
                      "expenses.Marketing expenses",
                      financials.expenses["Marketing expenses"]
                    )
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--expense"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'expenses.Marketing expenses',
                          financials.expenses['Marketing expenses']
                        ),
                        totalExpenses
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'expenses.Marketing expenses',
                    financials.expenses['Marketing expenses']
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item">
            <div class="financial-item__label">עמלת סליקה</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--expense">
                {{ getCurrencySymbol("expenses.clearing fee")
                }}{{
                  formatCurrency(
                    getDisplayValue(
                      "expenses.clearing fee",
                      financials.expenses["clearing fee"]
                    )
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--expense"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'expenses.clearing fee',
                          financials.expenses['clearing fee']
                        ),
                        totalExpenses
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'expenses.clearing fee',
                    financials.expenses['clearing fee']
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item financial-item--total">
            <div class="financial-item__label">סה"כ הוצאות</div>
            <div
              class="financial-item__value financial-item__value--total-expense"
            >
              ₪{{ formatCurrency(totalExpenses) }}
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: REVENUE -->
      <div class="financials-card financials-card--revenue">
        <div class="financials-card__header">
          <div class="card-title-row">
            <h3 class="financials-card__title">💵 הכנסות</h3>
            <span class="chip chip--success">
              ₪{{ formatCurrency(totalRevenue) }}
            </span>
          </div>
          <div class="card-sub muted">פילוח הכנסות לפי מקור</div>
        </div>

        <div class="financials-card__body">
          <div class="financial-item">
            <div class="financial-item__label">עמלות</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--revenue">
                {{ getCurrencySymbol("Revenue.Fees")
                }}{{
                  formatCurrency(
                    getDisplayValue("Revenue.Fees", financials.Revenue.Fees)
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--revenue"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'Revenue.Fees',
                          financials.Revenue.Fees
                        ),
                        totalRevenue
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'Revenue.Fees',
                    financials.Revenue.Fees
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item">
            <div class="financial-item__label">רישומים</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--revenue">
                {{ getCurrencySymbol("Revenue.Drawings")
                }}{{
                  formatCurrency(
                    getDisplayValue(
                      "Revenue.Drawings",
                      financials.Revenue.Drawings
                    )
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--revenue"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'Revenue.Drawings',
                          financials.Revenue.Drawings
                        ),
                        totalRevenue
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'Revenue.Drawings',
                    financials.Revenue.Drawings
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item">
            <div class="financial-item__label">קריאת חירום</div>

            <div class="financial-item__mid">
              <div class="financial-item__value financial-item__value--revenue">
                {{ getCurrencySymbol("Revenue.Urgent call")
                }}{{
                  formatCurrency(
                    getDisplayValue(
                      "Revenue.Urgent call",
                      financials.Revenue["Urgent call"]
                    )
                  )
                }}
              </div>
              <div class="bar">
                <div
                  class="bar__fill bar__fill--revenue"
                  :style="{
                    width:
                      getPct(
                        getDisplayValue(
                          'Revenue.Urgent call',
                          financials.Revenue['Urgent call']
                        ),
                        totalRevenue
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="financial-item__actions">
              <button
                class="financial-action-btn financial-action-btn--add"
                @click="
                  openEditFinancialModal(
                    'Revenue.Urgent call',
                    financials.Revenue['Urgent call']
                  )
                "
              >
                ✏️
              </button>
            </div>
          </div>

          <div class="financial-item financial-item--total">
            <div class="financial-item__label">סה"כ הכנסות</div>
            <div
              class="financial-item__value financial-item__value--total-revenue"
            >
              ₪{{ formatCurrency(totalRevenue) }}
            </div>
          </div>
        </div>
      </div>

      <!-- PIE / DONUT SECTION -->
      <div class="financials-pies">
        <div class="pie-card pie-card--main">
          <div class="pie-header">
            <div>
              <h3 class="pie-title">פילוח נטו</h3>
              <div class="muted">הכנסות מול הוצאות</div>
            </div>
            <span
              class="chip"
              :class="netProfit >= 0 ? 'chip--success' : 'chip--danger'"
            >
              ₪{{ formatCurrency(Math.abs(netProfit)) }}
              {{ netProfit >= 0 ? "רווח" : "הפסד" }}
            </span>
          </div>
          <div class="pie-body">
            <canvas ref="netPieCanvas"></canvas>
          </div>
        </div>

        <div class="pie-card">
          <div class="pie-header">
            <div>
              <h3 class="pie-title">פילוח הוצאות</h3>
              <div class="muted">לפי קטגוריות</div>
            </div>
          </div>
          <div class="pie-body pie-body--small">
            <canvas ref="expensesPieCanvas"></canvas>
          </div>
        </div>

        <div class="pie-card">
          <div class="pie-header">
            <div>
              <h3 class="pie-title">פילוח הכנסות</h3>
              <div class="muted">לפי מקור</div>
            </div>
          </div>
          <div class="pie-body pie-body--small">
            <canvas ref="revenuePieCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- SUMMARY (kept) -->
      <div class="financials-summary">
        <div class="summary-card">
          <div class="summary-card__label">רווח/הפסד נטו</div>
          <div
            class="summary-card__value"
            :class="{
              'summary-card__value--profit': netProfit >= 0,
              'summary-card__value--loss': netProfit < 0,
            }"
          >
            ₪{{ formatCurrency(Math.abs(netProfit)) }}
            <span class="summary-card__indicator">{{
              netProfit >= 0 ? "רווח" : "הפסד"
            }}</span>
          </div>
        </div>
      </div>

      <!-- LINE CHART (kept) -->
      <div class="financials-chart">
        <div class="chart-header">
          <h3 class="chart-title">גרף רווח/הפסד</h3>
          <div class="chart-period-selector">
            <button
              class="period-btn"
              :class="{ 'period-btn--active': chartPeriod === 'hourly' }"
              @click="loadChartData('hourly')"
            >
              שעתי
            </button>
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
        </div>
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Edit Financial Modal -->
    <div
      v-if="showEditFinancialModal"
      class="modal-overlay"
      @click="closeEditFinancialModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h3 class="modal-title">עריכת סכום</h3>
            <span class="chip chip--muted">{{ editFinancialFieldLabel }}</span>
          </div>
          <button class="modal-close" @click="closeEditFinancialModal">
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">ערך נוכחי</label>
            <div class="current-value">
              ₪{{
                formatCurrency(
                  getDisplayValue(editFinancialField, editFinancialCurrentValue)
                )
              }}
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">סכום לשינוי (₪)</label>
            <input
              v-model.number="editFinancialAmount"
              type="number"
              step="0.01"
              class="form-input"
              placeholder="הכנס סכום"
              min="0"
            />
            <div class="hint muted">טיפ: Enter מאשר, Esc סוגר</div>
          </div>

          <div class="financial-edit-buttons">
            <button class="btn btn--primary" @click="updateFinancial('add')">
              ➕ הוסף
            </button>
            <button
              class="btn btn--danger"
              @click="updateFinancial('subtract')"
            >
              ➖ הורד
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn--ghost" @click="closeEditFinancialModal">
            ביטול
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Chart, registerables } from "chart.js";
import { URL } from "@/Url/url";

Chart.register(...registerables);

export default {
  name: "ExpensesTab",
  data() {
    return {
      financials: {
        expenses: {
          "AI expenses": 0,
          "DB expenses": 0,
          "API expenses": 0,
          "Marketing expenses": 0,
          "clearing fee": 0,
        },
        Revenue: {
          Fees: 0,
          Drawings: 0,
          "Urgent call": 0,
        },
      },
      isLoadingFinancials: false,
      usdToIlsRate: 1,
      showEditFinancialModal: false,
      editFinancialField: "",
      editFinancialCurrentValue: 0,
      editFinancialAmount: 0,
      chart: null,
      chartPeriod: "daily",
      chartData: [],
      toast: null,

      // NEW (UI-only state)
      lastUpdatedAt: null,
      netPie: null,
      expensesPie: null,
      revenuePie: null,
    };
  },
  computed: {
    totalRevenue() {
      return (
        this.getDisplayValue("Revenue.Fees", this.financials.Revenue.Fees) +
        this.getDisplayValue(
          "Revenue.Drawings",
          this.financials.Revenue.Drawings
        ) +
        this.getDisplayValue(
          "Revenue.Urgent call",
          this.financials.Revenue["Urgent call"]
        )
      );
    },
    totalExpenses() {
      return (
        this.getDisplayValue(
          "expenses.AI expenses",
          this.financials.expenses["AI expenses"]
        ) +
        this.getDisplayValue(
          "expenses.DB expenses",
          this.financials.expenses["DB expenses"]
        ) +
        this.getDisplayValue(
          "expenses.API expenses",
          this.financials.expenses["API expenses"]
        ) +
        this.getDisplayValue(
          "expenses.Marketing expenses",
          this.financials.expenses["Marketing expenses"]
        ) +
        this.getDisplayValue(
          "expenses.clearing fee",
          this.financials.expenses["clearing fee"]
        )
      );
    },
    netProfit() {
      return this.totalRevenue - this.totalExpenses;
    },
    editFinancialFieldLabel() {
      const fieldMap = {
        "expenses.AI expenses": "הוצאות AI",
        "expenses.DB expenses": "הוצאות DB",
        "expenses.API expenses": "הוצאות API",
        "expenses.Marketing expenses": "הוצאות שיווק",
        "expenses.clearing fee": "עמלת סליקה",
        "Revenue.Fees": "עמלות",
        "Revenue.Drawings": "רישומים",
        "Revenue.Urgent call": "קריאת חירום",
      };
      return fieldMap[this.editFinancialField] || this.editFinancialField;
    },
    lastUpdatedText() {
      if (!this.lastUpdatedAt) return "—";
      try {
        return new Date(this.lastUpdatedAt).toLocaleString("he-IL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "—";
      }
    },
  },
  async mounted() {
    window.addEventListener("keydown", this.onKeydown);
    await this.loadExchangeRate();
    await this.loadFinancials();
    await this.$nextTick();
    await this.loadChartData(this.chartPeriod || "daily");
    this.renderPies();
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.destroyPies();
  },
  methods: {
    onKeydown(e) {
      if (!this.showEditFinancialModal) return;
      if (e.key === "Escape") this.closeEditFinancialModal();
      if (e.key === "Enter") this.updateFinancial("add");
    },

    async loadExchangeRate() {
      try {
        const response = await axios.get(
          "https://api.frankfurter.app/latest?from=USD&to=ILS"
        );
        if (response.data && response.data.rates && response.data.rates.ILS) {
          this.usdToIlsRate = response.data.rates.ILS;
        }
      } catch (error) {
        this.usdToIlsRate = 1;
      }
    },
    isAlreadyInILS(field) {
      const fieldsInILS = [
        "Revenue.Drawings",
        "Revenue.Fees",
        "expenses.clearing fee",
      ];
      return fieldsInILS.includes(field);
    },
    getDisplayValue(field, value) {
      if (this.isAlreadyInILS(field)) return value;
      return value * this.usdToIlsRate;
    },
    getCurrencySymbol() {
      return "₪";
    },
    formatCurrency(value) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
      }).format(value || 0);
    },

    // UI helper: percentage
    getPct(value, total) {
      const t = Number(total) || 0;
      const v = Number(value) || 0;
      if (t <= 0) return 0;
      const pct = (v / t) * 100;
      return Math.max(0, Math.min(100, pct));
    },

    async loadFinancials() {
      this.isLoadingFinancials = true;
      try {
        const response = await axios.get(`${URL}/admin/financials`);
        if (response.data.success) {
          this.financials = response.data.financials || {
            expenses: {
              "AI expenses": 0,
              "DB expenses": 0,
              "API expenses": 0,
              "Marketing expenses": 0,
              "clearing fee": 0,
            },
            Revenue: {
              Fees: 0,
              Drawings: 0,
              "Urgent call": 0,
            },
          };
          this.lastUpdatedAt = Date.now();
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את הנתונים הפיננסיים");
      } finally {
        this.isLoadingFinancials = false;
        await this.$nextTick();
        this.renderPies();
      }
    },

    openEditFinancialModal(field, currentValue) {
      this.editFinancialField = field;
      this.editFinancialCurrentValue = currentValue || 0;
      this.editFinancialAmount = 0;
      this.showEditFinancialModal = true;
    },
    closeEditFinancialModal() {
      this.showEditFinancialModal = false;
      this.editFinancialField = "";
      this.editFinancialCurrentValue = 0;
      this.editFinancialAmount = 0;
    },
    async updateFinancial(operation) {
      if (!this.editFinancialAmount || this.editFinancialAmount <= 0) {
        this.toast?.showError("יש להזין סכום תקין");
        return;
      }

      try {
        await axios.post(`${URL}/admin/financials/update`, {
          field: this.editFinancialField,
          amount: this.editFinancialAmount,
          operation: operation,
        });

        this.toast?.showSuccess(
          `הסכום ${operation === "add" ? "נוסף" : "הוסר"} בהצלחה`
        );
        await this.loadFinancials();
        this.closeEditFinancialModal();
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו לעדכן את הסכום"
        );
      }
    },

    async loadChartData(period = "daily") {
      this.chartPeriod = period;
      try {
        const response = await axios.get(
          `${URL}/admin/financials/chart?period=${period}`
        );
        if (response.data.success) {
          this.chartData = response.data.chartData || [];
          await this.$nextTick();
          this.renderChart();
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את נתוני הגרף");
      }
    },

    renderChart() {
      if (!this.$refs.chartCanvas) return;

      if (this.chart) this.chart.destroy();

      const ctx = this.$refs.chartCanvas.getContext("2d");

      const labels = this.chartData.map((item) => {
        const date = new Date(item.date);
        switch (this.chartPeriod) {
          case "hourly":
            return date.toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
              day: "numeric",
              month: "short",
            });
          case "weekly":
            return `שבוע ${item.dateLabel.split("-")[1]}, ${
              item.dateLabel.split("-")[0]
            }`;
          case "monthly": {
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
          }
          default:
            return date.toLocaleDateString("he-IL", {
              day: "numeric",
              month: "short",
            });
        }
      });

      this.chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels.reverse(),
          datasets: [
            {
              label: "רווח/הפסד",
              data: this.chartData
                .map((item) => (item.profit || 0) * this.usdToIlsRate)
                .reverse(),
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              tension: 0.42,
              fill: true,
              pointRadius: 2,
              pointHoverRadius: 5,
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
                font: { family: "Heebo", size: 12, weight: "bold" },
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
              callbacks: {
                label: function (context) {
                  const profit = context.parsed.y;
                  const profitLabel = profit >= 0 ? "רווח" : "הפסד";
                  return `${profitLabel}: ₪${Math.abs(profit).toFixed(2)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(255, 255, 255, 0.1)" },
              ticks: {
                color: "rgba(255, 255, 255, 0.62)",
                font: { family: "Heebo", size: 11, weight: "bold" },
              },
            },
            y: {
              grid: { color: "rgba(255, 255, 255, 0.1)" },
              ticks: {
                color: "rgba(255, 255, 255, 0.62)",
                font: { family: "Heebo", size: 11, weight: "bold" },
                callback: function (value) {
                  return "₪" + Number(value).toFixed(2);
                },
              },
            },
          },
        },
      });
    },

    // ===== PIE / DONUT CHARTS (UI only) =====
    destroyPies() {
      try {
        if (this.netPie) this.netPie.destroy();
        if (this.expensesPie) this.expensesPie.destroy();
        if (this.revenuePie) this.revenuePie.destroy();
      } catch {}
      this.netPie = null;
      this.expensesPie = null;
      this.revenuePie = null;
    },

    renderPies() {
      // safe guards
      if (
        !this.$refs.netPieCanvas ||
        !this.$refs.expensesPieCanvas ||
        !this.$refs.revenuePieCanvas
      )
        return;

      this.destroyPies();

      const baseOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "rgba(255, 255, 255, 0.78)",
              font: { family: "Heebo", size: 11, weight: "bold" },
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
            },
          },
          tooltip: {
            backgroundColor: "rgba(11, 11, 15, 0.95)",
            borderColor: "rgba(255, 106, 0, 0.25)",
            borderWidth: 1,
            titleColor: "rgba(255,255,255,0.92)",
            bodyColor: "rgba(255,255,255,0.92)",
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.parsed) || 0;
                return `${ctx.label}: ₪${v.toFixed(2)}`;
              },
            },
          },
          title: {
            display: false,
            text: title,
          },
        },
      });

      // NET PIE (Revenue vs Expenses)
      const netCtx = this.$refs.netPieCanvas.getContext("2d");
      this.netPie = new Chart(netCtx, {
        type: "doughnut",
        data: {
          labels: ["הכנסות", "הוצאות"],
          datasets: [
            {
              data: [this.totalRevenue, this.totalExpenses],
              backgroundColor: [
                "rgba(16,185,129,0.75)",
                "rgba(239,68,68,0.75)",
              ],
              borderColor: ["rgba(16,185,129,0.95)", "rgba(239,68,68,0.95)"],
              borderWidth: 1,
              hoverOffset: 8,
            },
          ],
        },
        options: baseOptions("פילוח נטו"),
      });

      // EXPENSES PIE
      const expCtx = this.$refs.expensesPieCanvas.getContext("2d");
      const expData = [
        this.getDisplayValue(
          "expenses.AI expenses",
          this.financials.expenses["AI expenses"]
        ),
        this.getDisplayValue(
          "expenses.DB expenses",
          this.financials.expenses["DB expenses"]
        ),
        this.getDisplayValue(
          "expenses.API expenses",
          this.financials.expenses["API expenses"]
        ),
        this.getDisplayValue(
          "expenses.Marketing expenses",
          this.financials.expenses["Marketing expenses"]
        ),
        this.getDisplayValue(
          "expenses.clearing fee",
          this.financials.expenses["clearing fee"]
        ),
      ];

      this.expensesPie = new Chart(expCtx, {
        type: "doughnut",
        data: {
          labels: ["AI", "DB", "API", "שיווק", "סליקה"],
          datasets: [
            {
              data: expData,
              backgroundColor: [
                "rgba(255,106,0,0.75)",
                "rgba(255,138,43,0.72)",
                "rgba(249,115,22,0.72)",
                "rgba(244,63,94,0.68)",
                "rgba(239,68,68,0.70)",
              ],
              borderColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              hoverOffset: 8,
            },
          ],
        },
        options: baseOptions("פילוח הוצאות"),
      });

      // REVENUE PIE
      const revCtx = this.$refs.revenuePieCanvas.getContext("2d");
      const revData = [
        this.getDisplayValue("Revenue.Fees", this.financials.Revenue.Fees),
        this.getDisplayValue(
          "Revenue.Drawings",
          this.financials.Revenue.Drawings
        ),
        this.getDisplayValue(
          "Revenue.Urgent call",
          this.financials.Revenue["Urgent call"]
        ),
      ];

      this.revenuePie = new Chart(revCtx, {
        type: "doughnut",
        data: {
          labels: ["עמלות", "רישומים", "חירום"],
          datasets: [
            {
              data: revData,
              backgroundColor: [
                "rgba(16,185,129,0.75)",
                "rgba(34,197,94,0.70)",
                "rgba(59,130,246,0.65)",
              ],
              borderColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              hoverOffset: 8,
            },
          ],
        },
        options: baseOptions("פילוח הכנסות"),
      });
    },
  },
};
</script>
<style lang="scss" scoped>
// ===== Design system =====
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$muted2: rgba(255, 255, 255, 0.48);
$bg-secondary: #0f1016;

$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Arial, sans-serif;

.financials-section {
  animation: fadeIn 0.35s ease;
  color: $text;
}

/* ===== Helpers ===== */
.muted {
  color: $muted;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.9);
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.12);
  display: inline-block;
}
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-family: $font-family;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.2px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.86);

  &--muted {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.72);
    border-color: rgba(255, 255, 255, 0.1);
  }
  &--success {
    background: rgba(16, 185, 129, 0.16);
    border-color: rgba(16, 185, 129, 0.34);
    color: rgba(16, 185, 129, 0.98);
  }
  &--danger {
    background: rgba(239, 68, 68, 0.16);
    border-color: rgba(239, 68, 68, 0.34);
    color: rgba(239, 68, 68, 0.98);
  }
}

/* ===== HERO ===== */
.financials-hero {
  position: relative;
  margin-bottom: 22px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.25);
  background: radial-gradient(
      1200px 420px at 0% 0%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    radial-gradient(
      900px 420px at 100% 0%,
      rgba(16, 185, 129, 0.16),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.03);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
  overflow: hidden;

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
}

.financials-header {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px 12px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 240px;
}

.financials-title {
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  letter-spacing: 0.2px;
  text-shadow: 0 10px 30px rgba($orange, 0.25);
}

.header-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
  font-weight: 900;
  color: $muted;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-net {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(11, 11, 15, 0.35);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 210px;

  &__label {
    font-size: 12px;
    font-weight: 900;
    color: $muted;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-family: "Courier New", monospace;
    font-size: 18px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.92);
  }

  &__tag {
    font-family: $font-family;
    font-size: 12px;
    font-weight: 1000;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.8);
  }

  &--profit {
    border-color: rgba(16, 185, 129, 0.35);
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.08) inset;
    .hero-net__tag {
      background: rgba(16, 185, 129, 0.16);
      border-color: rgba(16, 185, 129, 0.35);
      color: rgba(16, 185, 129, 0.98);
    }
  }

  &--loss {
    border-color: rgba(239, 68, 68, 0.35);
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.08) inset;
    .hero-net__tag {
      background: rgba(239, 68, 68, 0.16);
      border-color: rgba(239, 68, 68, 0.35);
      color: rgba(239, 68, 68, 0.98);
    }
  }
}

/* ===== Refresh Button (upgrade but compatible) ===== */
.refresh-financials-btn {
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
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);

  &:hover {
    background: rgba($orange, 0.26);
    border-color: rgba($orange, 0.55);
    transform: translateY(-1px);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);
  }

  &:active {
    transform: translateY(0px) scale(0.99);
  }
}

/* ===== Insights ===== */
.insights-row {
  position: relative;
  z-index: 2;
  padding: 0 18px 18px;
  display: grid;
  grid-template-columns: 1fr 1fr 0.9fr;
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.insight-card {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(11, 11, 15, 0.35);
  backdrop-filter: blur(10px);
  padding: 14px 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  transition: transform 0.18s ease, border-color 0.18s ease,
    background 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(11, 11, 15, 0.42);
    border-color: rgba(255, 255, 255, 0.16);
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 20px;
    flex-shrink: 0;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__label {
    font-size: 12px;
    font-weight: 1000;
    color: $muted;
  }

  &__value {
    font-family: "Courier New", monospace;
    font-size: 16px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.92);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--rev {
    border-color: rgba(16, 185, 129, 0.25);
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.06) inset;
  }
  &--exp {
    border-color: rgba(239, 68, 68, 0.25);
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.06) inset;
  }
  &--rate {
    border-color: rgba($orange, 0.25);
    box-shadow: 0 0 0 1px rgba($orange, 0.06) inset;
  }
}

/* ===== Loading Skeleton ===== */
.loading-state {
  text-align: center;
  padding: 22px 10px;
  color: $muted;
  font-size: 16px;
  font-weight: 900;
}
.loading-text {
  margin-top: 14px;
  color: $muted;
  font-weight: 1000;
}
.skeleton-wrap {
  max-width: 980px;
  margin: 0 auto;
}
.skeleton {
  border-radius: 14px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.06)
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.skeleton--title {
  height: 58px;
  margin-bottom: 14px;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
.skeleton--card {
  height: 240px;
}
.skeleton--wide {
  height: 140px;
  margin-top: 14px;
}

/* ===== Main grid ===== */
.financials-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* ===== Cards ===== */
.financials-card {
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.3);
    box-shadow: 0 22px 50px rgba(0, 0, 0, 0.35);
  }

  &--expenses {
    border-color: rgba(239, 68, 68, 0.28);
    background: rgba(239, 68, 68, 0.05);

    &:hover {
      border-color: rgba(239, 68, 68, 0.38);
    }
  }

  &--revenue {
    border-color: rgba(16, 185, 129, 0.28);
    background: rgba(16, 185, 129, 0.05);

    &:hover {
      border-color: rgba(16, 185, 129, 0.38);
    }
  }
}

.financials-card__header {
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.financials-card__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  margin: 0;
}
.card-sub {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 900;
  color: $muted2;
}

.financials-card__body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== Row items ===== */
.financial-item {
  display: grid;
  grid-template-columns: 1fr minmax(180px, 1.4fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    border-bottom: none;
  }

  &--total {
    padding-top: 16px;
    margin-top: 8px;
    border-top: 2px solid rgba(255, 255, 255, 0.12);
    border-bottom: none;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "label actions"
      "mid mid";
    .financial-item__label {
      grid-area: label;
    }
    .financial-item__mid {
      grid-area: mid;
    }
    .financial-item__actions {
      grid-area: actions;
    }
  }
}

.financial-item__label {
  font-size: 14px;
  font-weight: 1000;
  color: $muted;
}
.financial-item__mid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.financial-item__value {
  font-size: 16px;
  font-weight: 1000;
  font-family: "Courier New", monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--expense {
    color: #ef4444;
  }
  &--revenue {
    color: #10b981;
  }
  &--total-expense {
    font-size: 20px;
    color: #ef4444;
  }
  &--total-revenue {
    font-size: 20px;
    color: #10b981;
  }
}

/* ===== Mini progress bar per row ===== */
.bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.bar__fill {
  height: 100%;
  border-radius: 999px;
  width: 0%;
  transition: width 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2) inset;

  &--expense {
    background: linear-gradient(
      90deg,
      rgba(239, 68, 68, 0.85),
      rgba(255, 106, 0, 0.7)
    );
  }
  &--revenue {
    background: linear-gradient(
      90deg,
      rgba(16, 185, 129, 0.85),
      rgba(34, 197, 94, 0.65)
    );
  }
}

/* ===== Actions ===== */
.financial-item__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.financial-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease, box-shadow 0.18s ease;
  font-size: 16px;
  background: rgba($orange, 0.14);
  color: $orange2;
  border: 1px solid rgba($orange, 0.28);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);

  &:hover {
    background: rgba($orange, 0.24);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
  }
  &:active {
    transform: translateY(0px) scale(0.98);
  }
}

/* ===== Summary (kept + slightly polished) ===== */
.financials-summary {
  grid-column: 1 / -1;
}
.summary-card {
  padding: 22px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.28);
  background: rgba(255, 255, 255, 0.06);
  text-align: center;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.3);
}
.summary-card__label {
  font-size: 14px;
  font-weight: 1000;
  color: $muted;
  margin-bottom: 12px;
}
.summary-card__value {
  font-size: 32px;
  font-weight: 1000;
  font-family: "Courier New", monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;

  &--profit {
    color: #10b981;
  }
  &--loss {
    color: #ef4444;
  }
}
.summary-card__indicator {
  font-size: 14px;
  font-weight: 1000;
  padding: 6px 12px;
  border-radius: 999px;
  font-family: $font-family;
}
.summary-card__value--profit .summary-card__indicator {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
}
.summary-card__value--loss .summary-card__indicator {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

/* ===== Pie section ===== */
.financials-pies {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 16px;
  margin-top: 6px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
}

.pie-card {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease,
    background 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.16);
  }

  &--main {
    border-color: rgba($orange, 0.22);
  }
}

.pie-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.pie-title {
  margin: 0;
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
}
.pie-body {
  position: relative;
  height: 320px;
  padding: 14px;

  &--small {
    height: 260px;
  }
}

/* ===== Chart section ===== */
.financials-chart {
  grid-column: 1 / -1;
  margin-top: 18px;
  padding: 22px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  gap: 16px;
  flex-wrap: wrap;
}
.chart-title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}
.chart-period-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.period-btn {
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.28);
  background: rgba(255, 255, 255, 0.06);
  color: $muted;
  font-size: 13px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &--active {
    background: rgba($orange, 0.16);
    color: $orange2;
    border-color: rgba($orange, 0.55);
  }
}
.chart-container {
  position: relative;
  height: 420px;
  width: 100%;

  @media (max-width: 768px) {
    height: 320px;
  }
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.18s ease;
}

.modal-content {
  background: $bg-secondary;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.28);
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.6);
  transform-origin: center;
  animation: popIn 0.18s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.modal-title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: $muted;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text;
  }
}

.modal-body {
  padding: 18px;
}

.modal-footer {
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-field {
  margin-bottom: 14px;
}
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 1000;
  color: $text;
  margin-bottom: 8px;
}
.form-input {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.28);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-family: $font-family;
  transition: border-color 0.18s ease, background 0.18s ease,
    box-shadow 0.18s ease;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.55);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 4px rgba($orange, 0.12);
  }
}

.current-value {
  font-size: 14px;
  font-weight: 900;
  color: $muted;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.hint {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 900;
  color: $muted2;
}

.financial-edit-buttons {
  display: flex;
  gap: 12px;
  margin-top: 14px;

  .btn {
    flex: 1;
  }

  @media (max-width: 520px) {
    flex-direction: column;
  }
}

/* ===== Buttons ===== */
.btn {
  padding: 12px 18px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease, box-shadow 0.18s ease;
  font-family: $font-family;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.24);

  &:active {
    transform: translateY(0px) scale(0.99);
  }

  &--primary {
    background: rgba($orange, 0.15);
    color: $orange2;
    border: 1px solid rgba($orange, 0.3);

    &:hover {
      background: rgba($orange, 0.25);
      border-color: rgba($orange, 0.55);
      transform: translateY(-1px);
      box-shadow: 0 16px 34px rgba(0, 0, 0, 0.34);
    }
  }

  &--danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);

    &:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.55);
      transform: translateY(-1px);
      box-shadow: 0 16px 34px rgba(0, 0, 0, 0.34);
    }
  }

  &--ghost {
    background: transparent;
    color: $muted;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: $text;
    }
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
@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
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

/* Mobile Responsive - max-width 500px */
@media (max-width: 500px) {
  .financials-hero {
    padding: 14px;
    border-radius: 12px;
  }

  .financials-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
  }

  .financials-title {
    font-size: 18px;
  }

  .header-sub {
    font-size: 12px;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .hero-net {
    width: 100%;
    min-width: 100%;
  }

  .hero-net__value {
    font-size: 16px;
  }

  .refresh-financials-btn {
    width: 100%;
    justify-content: center;
  }

  .insights-row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 0 14px 14px;
  }

  .insight-card {
    padding: 12px;
  }

  .insight-card__icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .insight-card__value {
    font-size: 14px;
  }

  .financials-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .financials-card__header {
    padding: 14px;
  }

  .financials-card__title {
    font-size: 16px;
  }

  .card-sub {
    font-size: 12px;
  }

  .financials-card__body {
    padding: 14px;
    gap: 12px;
  }

  .financial-item {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px 0;
  }

  .financial-item__label {
    font-size: 13px;
  }

  .financial-item__value {
    font-size: 14px;
  }

  .financial-item__value--total-expense,
  .financial-item__value--total-revenue {
    font-size: 18px;
  }

  .financial-item__actions {
    justify-content: flex-end;
  }

  .financial-action-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .financials-pies {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .pie-card {
    border-radius: 12px;
  }

  .pie-header {
    padding: 14px;
  }

  .pie-title {
    font-size: 15px;
  }

  .pie-body {
    height: 280px;
    padding: 12px;
  }

  .pie-body--small {
    height: 240px;
  }

  .financials-summary {
    margin-top: 16px;
  }

  .summary-card {
    padding: 18px;
    border-radius: 12px;
  }

  .summary-card__value {
    font-size: 24px;
    flex-direction: column;
    gap: 8px;
  }

  .financials-chart {
    padding: 16px;
    border-radius: 12px;
    margin-top: 16px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  .chart-title {
    font-size: 16px;
  }

  .chart-period-selector {
    width: 100%;
    flex-wrap: wrap;
    gap: 6px;
  }

  .period-btn {
    flex: 1;
    min-width: calc(50% - 3px);
    padding: 8px 12px;
    font-size: 12px;
  }

  .chart-container {
    height: 300px;
  }

  .modal-content {
    max-width: 95vw;
    margin: 10px;
  }

  .modal-header {
    padding: 14px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-body {
    padding: 14px;
  }

  .form-field {
    margin-bottom: 12px;
  }

  .form-label {
    font-size: 13px;
  }

  .form-input {
    font-size: 14px;
    padding: 10px;
  }

  .current-value {
    font-size: 13px;
    padding: 8px 10px;
  }

  .financial-edit-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer {
    padding: 14px;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
    padding: 10px;
  }
}
</style>
