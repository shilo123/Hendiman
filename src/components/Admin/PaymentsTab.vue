<template>
  <div class="payments-section">
    <div class="payments-section__header">
      <h2 class="payments-section__title">תשלומים</h2>
      <div class="payments-section__actions">
        <button
          v-if="activePaymentsTab === 'transactions'"
          class="download-pdf-btn"
          type="button"
          @click="downloadMonthlyPDF"
          :disabled="isGeneratingPDF"
        >
          {{ isGeneratingPDF ? "מייצר PDF..." : "📄 הורד דוח חודשי" }}
        </button>
        <button
          class="refresh-payments-btn"
          type="button"
          @click="
            activePaymentsTab === 'transactions'
              ? loadPayments(paymentsPagination.page)
              : activePaymentsTab === 'subscriptions'
              ? loadSubscriptions(subscriptionsPagination.page)
              : null
          "
        >
          ↻ רענן
        </button>
      </div>
    </div>

    <!-- Payments Sub-Tabs -->
    <div class="payments-sub-tabs">
      <button
        class="payments-sub-tab"
        :class="{
          'payments-sub-tab--active': activePaymentsTab === 'transactions',
        }"
        type="button"
        @click="activePaymentsTab = 'transactions'"
      >
        עסקאות
      </button>
      <button
        class="payments-sub-tab"
        :class="{
          'payments-sub-tab--active': activePaymentsTab === 'subscriptions',
        }"
        type="button"
        @click="activePaymentsTab = 'subscriptions'"
      >
        מנויים
      </button>
      <button
        class="payments-sub-tab"
        :class="{
          'payments-sub-tab--active': activePaymentsTab === 'receipts',
        }"
        type="button"
        @click="activePaymentsTab = 'receipts'"
      >
        קבלות
      </button>
    </div>

    <!-- Transactions Tab -->
    <div v-if="activePaymentsTab === 'transactions'" class="payments-sub-panel">
      <!-- Filters -->
      <div class="payments-section__filters">
        <input
          v-model="paymentFilters.search"
          type="text"
          class="filter-input"
          placeholder="חפש לפי לקוח, הנדימן או עבודה..."
          @input="filterPayments"
        />
        <select
          v-model="paymentFilters.status"
          class="filter-select"
          @change="filterPayments"
        >
          <option value="">כל הסטטוסים</option>
          <option value="transferred">הועבר</option>
          <option value="pending">ממתין</option>
          <option value="processing">מעבד</option>
          <option value="requires_payment_method">נדרש תשלום</option>
          <option value="requires_capture">נדרש לכידה</option>
          <option value="failed">נכשל</option>
          <option value="canceled">בוטל</option>
        </select>
        <select
          v-model="paymentFilters.sortBy"
          class="filter-select"
          @change="filterPayments"
        >
          <option value="">מיין לפי</option>
          <option value="date-desc">תאריך (חדש לישן)</option>
          <option value="date-asc">תאריך (ישן לחדש)</option>
          <option value="amount-desc">סכום (גבוה לנמוך)</option>
          <option value="amount-asc">סכום (נמוך לגבוה)</option>
        </select>
      </div>

      <div v-if="isLoadingPayments" class="loading-state">טוען תשלומים...</div>

      <div v-else class="payments-table-wrapper">
        <table class="payments-table">
          <thead>
            <tr>
              <th>תאריך</th>
              <th>שעה</th>
              <th>לקוח</th>
              <th>הנדימן</th>
              <th>עבודה</th>
              <th>מחיר נוכחי</th>
              <th>מחיר שנגבה מהלקוח</th>
              <th>סכום בלי מע"מ</th>
              <th>מע"מ</th>
              <th>רווח הנדימן</th>
              <th>רווח המערכת</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="payment in filteredPayments"
              :key="payment._id"
              class="payments-table__row"
            >
              <td>
                <div class="date-cell">
                  <div class="date-value">
                    {{ formatDate(payment.createdAt) }}
                  </div>
                  <div
                    v-if="payment.createdAt"
                    class="date-tooltip"
                    :title="getTimeAgo(payment.createdAt)"
                  >
                    {{ getTimeAgo(payment.createdAt) }}
                  </div>
                </div>
              </td>
              <td>
                <div class="time-cell">
                  {{ formatTime(payment.createdAt) }}
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <span>{{ payment.client?.username || "ללא שם" }}</span>
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <span>{{ payment.handyman?.username || "ללא שם" }}</span>
                </div>
              </td>
              <td>
                <span class="job-desc">{{
                  getJobNames(payment.job) || "-"
                }}</span>
              </td>
              <td class="amount-cell amount-cell--price">
                {{ formatCurrencySimple(payment.totalAmount || 0) }} ₪
              </td>
              <td class="amount-cell amount-cell--client">
                {{
                  formatCurrencySimple(
                    payment.amountWithVAT || payment.totalAmount || 0
                  )
                }}
                ₪
              </td>
              <td class="amount-cell amount-cell--vat">
                {{
                  formatCurrencySimple(
                    payment.amountWithoutVAT || payment.totalAmount || 0
                  )
                }}
                ₪
              </td>
              <td class="amount-cell amount-cell--vat">
                {{ formatCurrencySimple(payment.vatAmount || 0) }} ₪
              </td>
              <td class="amount-cell amount-cell--handyman">
                {{
                  formatCurrencySimple(
                    payment.handymanRevenue ||
                      payment.handymanAmount ||
                      payment.spacious_H ||
                      0
                  )
                }}
                ₪
              </td>
              <td class="amount-cell amount-cell--system">
                {{ formatCurrencySimple(payment.spacious_M || 0) }} ₪
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="getStatusBadgeClass(payment.status)"
                >
                  {{ getStatusLabel(payment.status) }}
                </span>
              </td>
              <td>
                <div class="actions-buttons">
                  <button
                    v-if="payment.status === 'requires_capture'"
                    class="capture-payment-btn"
                    type="button"
                    @click="capturePayment(payment)"
                    :disabled="isCapturingPayment"
                    title="שחרר תשלום"
                  >
                    <font-awesome-icon :icon="['fas', 'money-bill-wave']" />
                    {{ isCapturingPayment ? "משחרר..." : "שחרר תשלום" }}
                  </button>
                  <button
                    class="delete-payment-btn"
                    type="button"
                    @click="confirmDeletePayment(payment)"
                    title="מחק תשלום"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredPayments.length === 0">
              <td colspan="16" class="no-data">אין תשלומים להצגה</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination for Payments -->
      <div v-if="paymentsPagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="paymentsPagination.page === 1"
          @click="loadPayments(paymentsPagination.page - 1)"
        >
          הקודם
        </button>
        <span class="pagination-info">
          עמוד {{ paymentsPagination.page }} מתוך
          {{ paymentsPagination.totalPages }} (סה"כ
          {{ paymentsPagination.total }} תשלומים)
        </span>
        <button
          class="pagination-btn"
          :disabled="paymentsPagination.page >= paymentsPagination.totalPages"
          @click="loadPayments(paymentsPagination.page + 1)"
        >
          הבא
        </button>
      </div>
    </div>

    <!-- Subscriptions Tab -->
    <div
      v-if="activePaymentsTab === 'subscriptions'"
      class="payments-sub-panel"
    >
      <div v-if="isLoadingSubscriptions" class="loading-state">
        טוען מנויים...
      </div>
      <div v-else class="subscriptions-table-wrapper">
        <table class="subscriptions-table">
          <thead>
            <tr>
              <th>שם המנוי</th>
              <th>סכום החיוב</th>
              <th>סכום המעמ</th>
              <th>תאריך חיוב אחרון</th>
              <th>זמן במערכת</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subscription in subscriptions" :key="subscription._id">
              <td>{{ subscription.userName || "ללא שם" }}</td>
              <td>{{ formatCurrencySimple(subscription.amount || 0) }} ₪</td>
              <td>{{ formatCurrencySimple(subscription.vatAmount || 0) }} ₪</td>
              <td>
                <span v-if="subscription.lastPaymentDate">
                  {{ formatDate(subscription.lastPaymentDate) }}
                </span>
                <span v-else class="no-data">-</span>
              </td>
              <td>
                <span v-if="subscription.userCreatedAt">
                  {{ getTimeInSystem(subscription.userCreatedAt) }}
                </span>
                <span v-else class="no-data">-</span>
              </td>
            </tr>
            <tr v-if="subscriptions.length === 0">
              <td colspan="5" class="no-data">אין מנויים פעילים</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination for Subscriptions -->
      <div v-if="subscriptionsPagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="subscriptionsPagination.page === 1"
          @click="loadSubscriptions(subscriptionsPagination.page - 1)"
        >
          הקודם
        </button>
        <span class="pagination-info">
          עמוד {{ subscriptionsPagination.page }} מתוך
          {{ subscriptionsPagination.totalPages }} (סה"כ
          {{ subscriptionsPagination.total }} מנויים)
        </span>
        <button
          class="pagination-btn"
          :disabled="
            subscriptionsPagination.page >= subscriptionsPagination.totalPages
          "
          @click="loadSubscriptions(subscriptionsPagination.page + 1)"
        >
          הבא
        </button>
      </div>
    </div>

    <!-- Receipts Tab -->
    <div v-if="activePaymentsTab === 'receipts'" class="payments-sub-panel">
      <ReceiptsTab />
    </div>
  </div>

  <!-- Delete Payment Confirmation Modal -->
  <div
    v-if="showDeletePaymentModal"
    class="modal-overlay"
    @click="closeDeletePaymentModal"
  >
    <div class="modal-content modal-content--confirm" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">מחיקת תשלום</h3>
        <button class="modal-close" @click="closeDeletePaymentModal">×</button>
      </div>
      <div class="modal-body">
        <div class="confirm-message">
          האם אתה בטוח שברצונך למחוק את התשלום?
          <br />
          <strong>
            לקוח: {{ paymentToDelete?.client?.username || "ללא שם" }} | הנדימן:
            {{ paymentToDelete?.handyman?.username || "ללא שם" }} | סכום:
            {{ formatCurrencySimple(paymentToDelete?.totalAmount || 0) }} ₪
          </strong>
          <br />
          פעולה זו לא ניתנת לביטול!
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn--ghost" @click="closeDeletePaymentModal">
          ביטול
        </button>
        <button class="btn btn--danger" @click="deletePayment">מחק</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import ReceiptsTab from "@/components/Admin/ReceiptsTab.vue";
import logger from "@/utils/logger";

export default {
  name: "PaymentsTab",
  components: {
    ReceiptsTab,
  },
  data() {
    return {
      toast: null,
      payments: [],
      isLoadingPayments: false,
      isGeneratingPDF: false,
      paymentFilters: {
        search: "",
        status: "",
        sortBy: "",
      },
      paymentsPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      subscriptions: [],
      isLoadingSubscriptions: false,
      subscriptionsPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      activePaymentsTab: "transactions",
      showDeletePaymentModal: false,
      paymentToDelete: null,
      isCapturingPayment: false,
    };
  },
  created() {
    this.toast = useToast();
    this.loadPayments(1);
  },
  computed: {
    filteredPayments() {
      let filtered = [...this.payments];

      // Filter out subscription payments (they appear in subscriptions table)
      filtered = filtered.filter((payment) => payment.type !== "subscription");

      // Filter by search
      if (this.paymentFilters.search) {
        const searchLower = this.paymentFilters.search.toLowerCase();
        filtered = filtered.filter((payment) => {
          const clientName = (payment.client?.username || "").toLowerCase();
          const handymanName = (payment.handyman?.username || "").toLowerCase();
          const jobNames = this.getJobNames(payment.job) || "";
          const jobNamesLower = jobNames.toLowerCase();
          return (
            clientName.includes(searchLower) ||
            handymanName.includes(searchLower) ||
            jobNamesLower.includes(searchLower)
          );
        });
      }

      // Filter by status
      if (this.paymentFilters.status) {
        // Group similar statuses together
        if (this.paymentFilters.status === "transferred") {
          filtered = filtered.filter(
            (payment) =>
              payment.status === "transferred" ||
              payment.status === "succeeded" ||
              payment.status === "captured"
          );
        } else {
          filtered = filtered.filter(
            (payment) => payment.status === this.paymentFilters.status
          );
        }
      }

      // Sort
      if (this.paymentFilters.sortBy) {
        filtered.sort((a, b) => {
          switch (this.paymentFilters.sortBy) {
            case "date-desc":
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case "date-asc":
              return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case "amount-desc":
              return (b.totalAmount || 0) - (a.totalAmount || 0);
            case "amount-asc":
              return (a.totalAmount || 0) - (b.totalAmount || 0);
            default:
              return 0;
          }
        });
      }

      return filtered;
    },
  },
  watch: {
    activePaymentsTab(newTab) {
      if (newTab === "subscriptions") {
        this.loadSubscriptions(this.subscriptionsPagination.page);
      }
    },
  },
  methods: {
    formatDate(date) {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    formatTime(date) {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    getTimeAgo(date) {
      if (!date) return "";
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffDays === 0) return "היום";
      if (diffDays === 1) return "לפני יום אחד";
      if (diffDays < 7) return `לפני ${diffDays} ימים`;
      if (diffWeeks === 1) return "לפני שבוע אחד";
      if (diffWeeks < 4) return `לפני ${diffWeeks} שבועות`;
      if (diffMonths === 1) return "לפני חודש אחד";
      if (diffMonths < 12) return `לפני ${diffMonths} חודשים`;
      if (diffYears === 1) return "לפני שנה אחת";
      return `לפני ${diffYears} שנים`;
    },
    getTimeInSystem(date) {
      if (!date) return "";
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffDays === 0) return "היום";
      if (diffDays === 1) return "יום אחד";
      if (diffDays < 7) return `${diffDays} ימים`;
      if (diffWeeks === 1) return "שבוע אחד";
      if (diffWeeks < 4) return `${diffWeeks} שבועות`;
      if (diffMonths === 1) return "חודש אחד";
      if (diffMonths < 12) return `${diffMonths} חודשים`;
      if (diffYears === 1) return "שנה אחת";
      return `${diffYears} שנים`;
    },
    formatCurrencySimple(value) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value || 0);
    },
    async loadPayments(page = 1) {
      this.isLoadingPayments = true;
      try {
        const response = await axios.get(
          `${URL}/admin/payments?page=${page}&limit=20`
        );
        if (response.data.success) {
          this.payments = response.data.payments || [];
          if (response.data.pagination) {
            this.paymentsPagination = response.data.pagination;
          }
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את התשלומים");
      } finally {
        this.isLoadingPayments = false;
      }
    },
    async loadSubscriptions(page = 1) {
      this.isLoadingSubscriptions = true;
      try {
        const response = await axios.get(
          `${URL}/admin/subscriptions?page=${page}&limit=20`
        );
        if (response.data.success) {
          this.subscriptions = response.data.subscriptions || [];
          if (response.data.pagination) {
            this.subscriptionsPagination = response.data.pagination;
          }
        }
      } catch (error) {
        // Don't show error toast - subscriptions are optional
      } finally {
        this.isLoadingSubscriptions = false;
      }
    },
    async downloadMonthlyPDF() {
      this.isGeneratingPDF = true;
      try {
        const response = await axios.get(`${URL}/admin/payments/monthly-pdf`, {
          responseType: "blob",
        });

        // Create blob URL and download
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Generate filename with current month
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        link.download = `דוח_חודשי_${month}_${year}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.toast?.showSuccess("הדוח הורד בהצלחה");
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו ליצור את הדוח"
        );
      } finally {
        this.isGeneratingPDF = false;
      }
    },
    getStatusLabel(status) {
      const statusMap = {
        transferred: "הועבר",
        pending: "ממתין",
        failed: "נכשל",
        succeeded: "הועבר",
        requires_payment_method: "נדרש תשלום",
        requires_capture: "נדרש לכידה",
        requires_confirmation: "נדרש אישור",
        requires_action: "נדרש פעולה",
        processing: "מעבד",
        canceled: "בוטל",
        captured: "הועבר",
      };
      return statusMap[status] || status || "לא ידוע";
    },
    getStatusBadgeClass(status) {
      const classMap = {
        transferred: "status-badge--transferred",
        succeeded: "status-badge--transferred",
        captured: "status-badge--transferred",
        pending: "status-badge--pending",
        processing: "status-badge--processing",
        requires_payment_method: "status-badge--requires-payment",
        requires_capture: "status-badge--requires-capture",
        requires_confirmation: "status-badge--requires-confirmation",
        requires_action: "status-badge--requires-action",
        failed: "status-badge--failed",
        canceled: "status-badge--canceled",
      };
      return classMap[status] || "status-badge--unknown";
    },
    getJobNames(job) {
      if (!job || !job.subcategoryInfo || !Array.isArray(job.subcategoryInfo)) {
        return null;
      }
      const names = job.subcategoryInfo
        .map((item) => item.subcategory)
        .filter((name) => name);
      return names.length > 0 ? names.join(", ") : null;
    },
    filterPayments() {
      // This method is called when filters change
      // The computed property filteredPayments will automatically update
    },
    confirmDeletePayment(payment) {
      this.paymentToDelete = payment;
      this.showDeletePaymentModal = true;
    },
    closeDeletePaymentModal() {
      this.showDeletePaymentModal = false;
      this.paymentToDelete = null;
    },
    async deletePayment() {
      if (!this.paymentToDelete || !this.paymentToDelete._id) {
        this.toast?.showError("תשלום לא תקין");
        return;
      }

      try {
        const paymentId = this.paymentToDelete._id;
        await axios.delete(`${URL}/admin/payments/${paymentId}`);
        this.toast?.showSuccess("תשלום נמחק בהצלחה");
        await this.loadPayments(this.paymentsPagination.page);
        this.closeDeletePaymentModal();
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו למחוק את התשלום"
        );
      }
    },
    async capturePayment(payment) {
      if (!payment || !payment.paymentIntentId) {
        this.toast?.showError("פרטי תשלום לא תקינים");
        return;
      }

      // Get jobId - handle both ObjectId and string formats
      let jobId = null;
      if (payment.jobId) {
        if (typeof payment.jobId === "object" && payment.jobId._id) {
          jobId = payment.jobId._id;
        } else if (typeof payment.jobId === "string") {
          jobId = payment.jobId;
        } else {
          jobId = payment.jobId;
        }
      }

      if (!jobId) {
        this.toast?.showError(" לא מצאנו מזהה עבודה");
        return;
      }

      // Confirm before capturing
      const confirmed = confirm(
        `האם אתה בטוח שברצונך לשחרר את התשלום?\n\n` +
          `לקוח: ${payment.client?.username || "ללא שם"}\n` +
          `הנדימן: ${payment.handyman?.username || "ללא שם"}\n` +
          `סכום: ${this.formatCurrencySimple(payment.totalAmount || 0)} ₪`
      );

      if (!confirmed) return;

      this.isCapturingPayment = true;
      try {
        const paymentIntentId = payment.paymentIntentId;

        const response = await axios.post(`${URL}/admin/payments/capture`, {
          paymentId: payment._id,
          jobId: jobId,
          paymentIntentId: paymentIntentId,
        });

        if (response.data.success) {
          this.toast?.showSuccess("התשלום שוחרר בהצלחה");
          await this.loadPayments(this.paymentsPagination.page);
        } else {
          this.toast?.showError(
            response.data.message || " לא הצלחנו לשחרר את התשלום"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו לשחרר את התשלום"
        );
      } finally {
        this.isCapturingPayment = false;
      }
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

.filter-input,
.filter-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 800;
  font-family: $font-family;
  min-width: 200px;

  &::placeholder {
    color: $muted;
  }

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }
}

.filter-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  padding-left: 36px;
  background-size: 12px;

  option {
    background: $bg;
    color: $text;
    padding: 8px;
  }

  &:hover {
    border-color: rgba($orange, 0.5);
  }
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
  font-weight: 800;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
}

/* Payments Section */
.payments-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.payments-section__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.payments-section__filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.payments-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.download-pdf-btn {
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

  &:hover:not(:disabled) {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.refresh-payments-btn {
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

.payments-sub-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba($orange, 0.2);
  padding-bottom: 0;
}

.payments-sub-tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: $muted;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  position: relative;

  &:hover {
    color: $orange2;
  }

  &--active {
    color: $orange2;
    border-bottom-color: $orange;
    font-weight: 1000;
  }
}

.payments-sub-panel {
  margin-top: 20px;
}

.subscriptions-table-wrapper {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 20px;
  overflow-x: auto;
}

.subscriptions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background: rgba(255, 106, 0, 0.1);
    border-bottom: 2px solid rgba($orange, 0.3);
  }

  th {
    padding: 12px;
    text-align: right;
    font-weight: 1000;
    color: $orange2;
    font-size: 13px;
  }

  tbody {
    tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      transition: background 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 12px;
      text-align: right;
      color: $text;
      font-weight: 800;
    }
  }
}

.payments-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.payments-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: rgba($orange, 0.1);
  }

  th {
    padding: 14px 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 1000;
    color: $orange2;
    border-bottom: 1px solid rgba($orange, 0.2);
    white-space: nowrap;
  }

  td {
    padding: 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 800;
    color: $text;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    vertical-align: middle;
  }

  tbody tr {
    transition: background 0.2s ease;

    &:hover {
      background: rgba($orange, 0.05);
    }

    &:last-child td {
      border-bottom: none;
    }
  }
}

.date-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-value {
  font-weight: 800;
}

.date-tooltip {
  font-size: 11px;
  color: $muted;
  font-style: italic;
  cursor: help;
}

.time-cell {
  font-weight: 800;
  font-size: 13px;
  color: $text;
}

.user-cell {
  font-weight: 800;
  color: $text;
}

.job-desc {
  font-size: 13px;
  color: $text;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount-cell {
  font-weight: 1000;
  font-family: "Courier New", monospace;
  color: $orange2;

  &--price {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  &--vat {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  &--handyman {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  &--system {
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(139, 92, 246, 0.2);
  }

  &--client {
    color: #ff6a00;
    background: rgba(255, 106, 0, 0.15);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 106, 0, 0.3);
    font-weight: 1100;
  }
}

.status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
  border: 1px solid;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--transferred {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--succeeded {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--captured {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
  }

  &--pending {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    border-color: rgba(255, 193, 7, 0.3);
  }

  &--processing {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
    border-color: rgba(139, 92, 246, 0.3);
  }

  &--requires-payment {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }

  &--requires-capture {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.3);
  }

  &--requires-confirmation {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.3);
  }

  &--requires-action {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.3);
  }

  &--failed {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }

  &--canceled {
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
    border-color: rgba(107, 114, 128, 0.3);
  }

  &--unknown {
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
    border-color: rgba(107, 114, 128, 0.3);
  }
}

.actions-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.capture-payment-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.25);
    border-color: rgba(16, 185, 129, 0.5);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.delete-payment-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-1px);
  }
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
}

.pagination-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover:not(:disabled) {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: 14px;
  font-weight: 800;
  color: $text;
  white-space: nowrap;
  font-style: italic;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: $bg;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-content--confirm {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.modal-title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: $text;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba($orange, 0.2);
}

.confirm-message {
  font-size: 15px;
  font-weight: 800;
  color: $text;
  line-height: 1.6;
  text-align: center;
  padding: 10px 0;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  border: none;

  &--ghost {
    background: rgba(255, 255, 255, 0.06);
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &--danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);

    &:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
}

@media (max-width: 768px) {
  .payments-section__header {
    flex-direction: column;
    align-items: stretch;
  }

  .refresh-payments-btn {
    width: 100%;
    justify-content: center;
  }

  .payments-table-wrapper {
    font-size: 12px;
  }

  .payments-table {
    th,
    td {
      padding: 8px 6px;
      font-size: 11px;
    }
  }

  .job-desc {
    max-width: 150px;
  }

  .filter-input,
  .filter-select {
    min-width: 100%;
  }
}
</style>
