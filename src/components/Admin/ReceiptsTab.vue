<template>
  <div class="receipts-section">
    <div class="receipts-section__header">
      <h2 class="receipts-section__title">קבלות</h2>
      <button
        class="refresh-receipts-btn"
        type="button"
        @click="loadReceipts(receiptsPagination.page)"
      >
        ↻ רענן
      </button>
    </div>

    <div v-if="isLoadingReceipts" class="loading-state">טוען קבלות...</div>

    <div v-else class="receipts-table-wrapper">
      <table class="receipts-table">
        <thead>
          <tr>
            <th>מספר קבלה</th>
            <th>סוג</th>
            <th>מקור</th>
            <th>מספר הזמנה</th>
            <th>שם העבודה</th>
            <th>סכום עבודה</th>
            <th>עמלת תיווך</th>
            <th>סה״כ לפני מע״מ</th>
            <th>סה״כ עם מע״מ</th>
            <th>סטטוס</th>
            <th>נשלח ב</th>
            <th>פרטים</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="receipt in receipts"
            :key="receipt._id"
            class="receipts-table__row"
          >
            <td>{{ receipt.receiptNumber }}</td>
            <td>
              <span
                class="receipt-type-badge"
                :class="`receipt-type-badge--${receipt.type}`"
              >
                {{
                  receipt.type === "handyman"
                    ? "הנדימן"
                    : receipt.type === "platform"
                    ? "מערכת"
                    : "מנוי"
                }}
              </span>
            </td>
            <td>
              {{ receipt.source === "job_payment" ? "תשלום עבודה" : "מנוי" }}
            </td>
            <td>{{ receipt.orderNumber || "-" }}</td>
            <td>
              <span
                v-if="receipt.jobsCount > 1"
                class="jobs-count-link"
                @click="openJobsModal(receipt)"
                style="
                  color: #ff6a00;
                  cursor: pointer;
                  text-decoration: underline;
                  font-weight: 700;
                "
              >
                {{ receipt.jobName }}
              </span>
              <span v-else>{{ receipt.jobName || "שם העבודה לא זמין" }}</span>
            </td>
            <td>{{ formatCurrency(receipt.handymanAmount || 0) }}</td>
            <td>{{ formatCurrency(receipt.platformFee || 0) }}</td>
            <td>{{ formatCurrency(receipt.amount) }}</td>
            <td>{{ formatCurrency(receipt.totalWithVat) }}</td>
            <td>
              <span
                class="receipt-status-badge"
                :class="`receipt-status-badge--${receipt.status}`"
              >
                {{
                  receipt.status === "sent"
                    ? "נשלח"
                    : receipt.status === "pending"
                    ? "ממתין"
                    : "נכשל"
                }}
              </span>
            </td>
            <td>
              {{
                receipt.sentAt
                  ? new Date(receipt.sentAt).toLocaleDateString("he-IL")
                  : "-"
              }}
            </td>
            <td>
              <div class="receipt-details">
                <div v-if="receipt.paymentId">
                  Payment: {{ receipt.paymentId.toString().substring(0, 8) }}...
                </div>
                <div v-if="receipt.jobId">
                  Job: {{ receipt.jobId.toString().substring(0, 8) }}...
                </div>
                <div v-if="receipt.invoiceId">
                  Invoice: {{ receipt.invoiceId }}
                </div>
                <div v-if="receipt.subscriptionId">
                  Subscription: {{ receipt.subscriptionId.substring(0, 12) }}...
                </div>
                <div v-if="receipt.lastError" class="receipt-error">
                  שגיאה: {{ receipt.lastError }}
                </div>
              </div>
            </td>
            <td>
              <button
                class="delete-receipt-btn"
                type="button"
                @click="openDeleteReceiptModal(receipt)"
                :disabled="isDeletingReceipt === receipt._id"
              >
                מחק
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button
          class="pagination-btn"
          :disabled="receiptsPagination.page === 1"
          @click="loadReceipts(receiptsPagination.page - 1)"
        >
          הקודם
        </button>
        <span class="pagination-info">
          עמוד {{ receiptsPagination.page }} מתוך
          {{ receiptsPagination.totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="receiptsPagination.page >= receiptsPagination.totalPages"
          @click="loadReceipts(receiptsPagination.page + 1)"
        >
          הבא
        </button>
      </div>
    </div>

    <!-- Delete Receipt Confirmation Modal -->
    <div
      v-if="showDeleteReceiptModal"
      class="modal-overlay"
      @click="closeDeleteReceiptModal"
    >
      <div class="modal-content modal-content--confirm" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">מחיקת קבלה</h3>
          <button class="modal-close" @click="closeDeleteReceiptModal">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            האם אתה בטוח שברצונך למחוק את הקבלה?
            <br />
            <strong v-if="receiptToDelete">
              מספר קבלה: {{ receiptToDelete.receiptNumber }} | סוג:
              {{
                receiptToDelete.type === "handyman"
                  ? "הנדימן"
                  : receiptToDelete.type === "platform"
                  ? "מערכת"
                  : "מנוי"
              }}
              | סכום: {{ formatCurrency(receiptToDelete.totalWithVat) }}
            </strong>
            <br />
            פעולה זו לא ניתנת לביטול!
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--ghost" @click="closeDeleteReceiptModal">
            ביטול
          </button>
          <button
            class="btn btn--danger"
            @click="confirmDeleteReceipt"
            :disabled="isDeletingReceipt === receiptToDelete?._id"
          >
            {{ isDeletingReceipt === receiptToDelete?._id ? "מוחק..." : "מחק" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Jobs Modal -->
    <div v-if="showJobsModal" class="modal-overlay" @click="closeJobsModal">
      <div class="modal-content modal-content--confirm" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">עבודות להזמנה {{ orderNumberForJobs }}</h3>
          <button class="modal-close" @click="closeJobsModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="jobsForOrder && jobsForOrder.length > 0">
            <table
              style="width: 100%; border-collapse: collapse; margin-top: 20px"
              dir="rtl"
            >
              <thead>
                <tr style="background: rgba(255, 106, 0, 0.1)">
                  <th
                    style="
                      padding: 12px;
                      text-align: right;
                      border-bottom: 2px solid rgba(255, 106, 0, 0.3);
                      color: #ff6a00;
                      font-weight: 900;
                    "
                  >
                    מספר קבלה
                  </th>
                  <th
                    style="
                      padding: 12px;
                      text-align: right;
                      border-bottom: 2px solid rgba(255, 106, 0, 0.3);
                      color: #ff6a00;
                      font-weight: 900;
                    "
                  >
                    שם העבודה
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(job, index) in jobsForOrder"
                  :key="index"
                  style="border-bottom: 1px solid rgba(255, 255, 255, 0.1)"
                >
                  <td style="padding: 12px; color: rgba(255, 255, 255, 0.9)">
                    {{ job.receiptNumber }}
                  </td>
                  <td style="padding: 12px; color: rgba(255, 255, 255, 0.9)">
                    {{ job.jobName }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-else
            style="
              text-align: center;
              padding: 20px;
              color: rgba(255, 255, 255, 0.7);
            "
          >
            אין עבודות להצגה
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--ghost" @click="closeJobsModal">סגור</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "@/composables/useToast";
import logger from "@/utils/logger";

export default {
  name: "ReceiptsTab",
  data() {
    return {
      receipts: [],
      isLoadingReceipts: false,
      receiptsPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      toast: null,
      isDeletingReceipt: null,
      showDeleteReceiptModal: false,
      receiptToDelete: null,
    };
  },
  mounted() {
    this.toast = useToast();
    this.loadReceipts(1);
  },
  methods: {
    async loadReceipts(page = 1) {
      try {
        this.isLoadingReceipts = true;
        const { URL } = await import("@/Url/url");
        const response = await axios.get(`${URL}/api/receipts`, {
          params: {
            page,
            limit: this.receiptsPagination.limit,
          },
        });

        if (response.data.success) {
          this.receipts = response.data.receipts;
          this.receiptsPagination = {
            page: response.data.page,
            limit: response.data.limit,
            total: response.data.total,
            totalPages: response.data.totalPages,
          };
        } else {
          this.toast?.showError(
            response.data.message || "לא הצלחנו לטעון את הקבלות"
          );
        }
      } catch (error) {
        this.toast?.showError("לא הצלחנו לטעון את הקבלות");
        logger.error("Error loading receipts:", error);
      } finally {
        this.isLoadingReceipts = false;
      }
    },
    formatCurrency(amount) {
      if (!amount && amount !== 0) return "0.00 ₪";
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount);
    },
    openDeleteReceiptModal(receipt) {
      this.receiptToDelete = receipt;
      this.showDeleteReceiptModal = true;
    },
    closeDeleteReceiptModal() {
      this.showDeleteReceiptModal = false;
      this.receiptToDelete = null;
    },
    async confirmDeleteReceipt() {
      if (!this.receiptToDelete || !this.receiptToDelete._id) {
        this.toast?.showError("קבלה לא תקינה");
        return;
      }

      try {
        const receiptId = this.receiptToDelete._id;
        this.isDeletingReceipt = receiptId;
        const { URL } = await import("@/Url/url");
        const response = await axios.delete(`${URL}/api/receipts/${receiptId}`);

        if (response.data.success) {
          this.toast?.showSuccess("הקבלה נמחקה בהצלחה");
          // Reload receipts
          await this.loadReceipts(this.receiptsPagination.page);
          this.closeDeleteReceiptModal();
        } else {
          this.toast?.showError(
            response.data.message || "לא הצלחנו למחוק את הקבלה"
          );
        }
      } catch (error) {
        this.toast?.showError("לא הצלחנו למחוק את הקבלה");
        logger.error("Error deleting receipt:", error);
      } finally {
        this.isDeletingReceipt = null;
      }
    },
    openJobsModal(receipt) {
      if (receipt.allJobsForOrder && receipt.allJobsForOrder.length > 0) {
        this.jobsForOrder = receipt.allJobsForOrder;
        this.orderNumberForJobs = receipt.orderNumber;
        this.showJobsModal = true;
      }
    },
    closeJobsModal() {
      this.showJobsModal = false;
      this.jobsForOrder = null;
      this.orderNumberForJobs = null;
    },
  },
};
</script>

<style scoped lang="scss">
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);

.receipts-section {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
}

.receipts-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.receipts-section__title {
  font-size: 28px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  font-family: $font-family;
}

.refresh-receipts-btn {
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

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.receipts-table-wrapper {
  overflow-x: auto;
  margin-top: 20px;
}

.receipts-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  overflow: hidden;

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

.receipt-type-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
  border: 1px solid;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--handyman {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
  }

  &--platform {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--subscription {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
    border-color: rgba(139, 92, 246, 0.3);
  }
}

.receipt-status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
  border: 1px solid;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--sent {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--pending {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    border-color: rgba(255, 193, 7, 0.3);
  }

  &--failed {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.receipt-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.receipt-error {
  color: #ef4444;
  font-weight: 700;
  margin-top: 4px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: $text;
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
}

.pagination-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.1);
  color: $orange2;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover:not(:disabled) {
    background: rgba($orange, 0.2);
    border-color: rgba($orange, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  color: $text;
  font-size: 14px;
  font-weight: 700;
}

.delete-receipt-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: rgba(11, 11, 15, 0.98);
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

  &--confirm {
    max-width: 450px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.modal-title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  font-family: $font-family;
}

.modal-close {
  background: none;
  border: none;
  color: $muted;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  font-family: $font-family;

  &:hover {
    color: $orange2;
  }
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid rgba($orange, 0.2);
}

.confirm-message {
  text-align: center;
  color: $text;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 700;

  strong {
    color: $orange2;
    display: block;
    margin-top: 12px;
    font-size: 14px;
  }
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &--ghost {
    background: rgba(255, 255, 255, 0.05);
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  &--danger {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);

    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.3);
      border-color: rgba(239, 68, 68, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
