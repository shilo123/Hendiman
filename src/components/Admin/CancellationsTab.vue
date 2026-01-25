<template>
  <div class="cancellations-section">
    <div class="cancellations-section__header">
      <h2 class="cancellations-section__title">ביטולים</h2>
      <button
        class="refresh-cancellations-btn"
        type="button"
        @click="loadCancellations(cancellationsPagination.page)"
      >
        ↻ רענן
      </button>
    </div>

    <div v-if="isLoadingCancellations" class="loading-state">
      טוען ביטולים...
    </div>

    <div v-else class="cancellations-table-wrapper">
      <table class="cancellations-table">
        <thead>
          <tr>
            <th>תאריך ביטול</th>
            <th>ID עבודה</th>
            <th>עבודה</th>
            <th>לקוח</th>
            <th>הנדימן</th>
            <th>מי ביטל</th>
            <th>סיבת הביטול</th>
            <th>בוטל לגמרי</th>
            <th>קנס נגבה</th>
            <th>סכום קנס</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cancellation in cancellations"
            :key="cancellation._id || cancellation.id"
            class="cancellations-table__row"
          >
            <td>
              <div class="date-cell">
                <div class="date-value">
                  {{
                    cancellation.cancel?.cancelledAt
                      ? formatDate(cancellation.cancel.cancelledAt)
                      : "-"
                  }}
                </div>
                <div
                  v-if="cancellation.cancel?.cancelledAt"
                  class="date-tooltip"
                  :title="getTimeAgo(cancellation.cancel.cancelledAt)"
                >
                  {{ getTimeAgo(cancellation.cancel.cancelledAt) }}
                </div>
              </div>
            </td>
            <td>
              <span class="job-id">{{
                cancellation._id || cancellation.id || "-"
              }}</span>
            </td>
            <td>
              <span class="job-desc">{{
                getJobNames(cancellation) || "-"
              }}</span>
            </td>
            <td>
              <div class="user-cell">
                <span>{{ cancellation.clientName || "ללא שם" }}</span>
              </div>
            </td>
            <td>
              <div class="user-cell">
                <span>{{ cancellation.handymanName || "ללא שם" }}</span>
                <span
                  v-if="cancellation.cancel?.handymanId"
                  class="handyman-id"
                >
                  ({{ cancellation.cancel.handymanId }})
                </span>
              </div>
            </td>
            <td>
              <span
                class="person-badge"
                :class="{
                  'person-badge--handyman':
                    cancellation.cancel?.personcancel === 'handyman',
                  'person-badge--customer':
                    cancellation.cancel?.personcancel === 'customer',
                }"
              >
                {{
                  cancellation.cancel?.personcancel === "handyman"
                    ? "הנדימן"
                    : "לקוח"
                }}
              </span>
            </td>
            <td>
              <span class="reason-text">{{
                cancellation.cancel?.["reason-for-cancellation"] || "-"
              }}</span>
            </td>
            <td>
              <span
                class="status-badge"
                :class="{
                  'status-badge--yes':
                    cancellation.cancel?.['Totally-cancels'] === true,
                  'status-badge--no':
                    cancellation.cancel?.['Totally-cancels'] === false,
                }"
              >
                {{
                  cancellation.cancel?.["Totally-cancels"] === true
                    ? "כן"
                    : "לא"
                }}
              </span>
            </td>
            <td>
              <span
                class="status-badge"
                :class="{
                  'status-badge--collected':
                    cancellation.cancel?.fineCollected === true,
                  'status-badge--not-collected':
                    cancellation.cancel?.fineCollected !== true,
                }"
              >
                {{ cancellation.cancel?.fineCollected === true ? "כן" : "לא" }}
              </span>
            </td>
            <td class="amount-cell">
              {{
                cancellation.cancel?.fineAmount
                  ? formatCurrencySimple(cancellation.cancel.fineAmount) + " ₪"
                  : "-"
              }}
            </td>
            <td>
              <button
                v-if="cancellation.cancel?.fineCollected !== true"
                class="collect-fine-btn"
                type="button"
                @click="openFineModal(cancellation)"
                title="גבה קנס"
              >
                <font-awesome-icon :icon="['fas', 'money-bill']" />
                גבה קנס
              </button>
              <span v-else class="fine-collected-text">נגבה</span>
            </td>
          </tr>
          <tr v-if="cancellations.length === 0">
            <td colspan="11" class="no-data">אין ביטולים להצגה</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination for Cancellations -->
    <div v-if="cancellationsPagination.totalPages > 1" class="pagination">
      <button
        class="pagination-btn"
        :disabled="cancellationsPagination.page === 1"
        @click="loadCancellations(cancellationsPagination.page - 1)"
      >
        הקודם
      </button>
      <span class="pagination-info">
        עמוד {{ cancellationsPagination.page }} מתוך
        {{ cancellationsPagination.totalPages }} (סה"כ
        {{ cancellationsPagination.total }} ביטולים)
      </span>
      <button
        class="pagination-btn"
        :disabled="
          cancellationsPagination.page >= cancellationsPagination.totalPages
        "
        @click="loadCancellations(cancellationsPagination.page + 1)"
      >
        הבא
      </button>
    </div>
  </div>

  <!-- Collect Fine Modal -->
  <div v-if="showFineModal" class="modal-overlay" @click="closeFineModal">
    <div class="modal-content modal-content--confirm" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">גביית קנס</h3>
        <button class="modal-close" @click="closeFineModal">×</button>
      </div>
      <div class="modal-body">
        <div class="confirm-message">
          <p>
            עבודה: <strong>{{ getJobNames(fineJob) || "-" }}</strong>
          </p>
          <p>
            לקוח: <strong>{{ fineJob?.clientName || "ללא שם" }}</strong>
          </p>
          <p>
            הנדימן: <strong>{{ fineJob?.handymanName || "ללא שם" }}</strong>
          </p>
          <p>
            סיבת ביטול:
            <strong>{{
              fineJob?.cancel?.["reason-for-cancellation"] || "-"
            }}</strong>
          </p>
        </div>
        <div class="form-field">
          <label class="form-label">סכום קנס (₪)</label>
          <input
            v-model.number="fineAmount"
            type="number"
            step="1"
            min="0"
            max="200"
            class="form-input"
            placeholder="הכנס סכום (עד 200 ₪)"
          />
          <div class="fine-hint">סכום מקסימלי: 200 ₪</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn--ghost" @click="closeFineModal">ביטול</button>
        <button
          class="btn btn--primary"
          :disabled="
            !fineAmount ||
            fineAmount <= 0 ||
            fineAmount > 200 ||
            isCollectingFine
          "
          @click="showConfirmFineModal = true"
        >
          המשך
        </button>
      </div>
    </div>
  </div>

  <!-- Confirm Fine Collection Modal -->
  <div
    v-if="showConfirmFineModal"
    class="modal-overlay"
    @click="showConfirmFineModal = false"
  >
    <div class="modal-content modal-content--confirm" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">אישור גביית קנס</h3>
        <button class="modal-close" @click="showConfirmFineModal = false">
          ×
        </button>
      </div>
      <div class="modal-body">
        <div class="confirm-message">
          <p>
            האם אתה בטוח שברצונך לגבות קנס של
            <strong>{{ fineAmount }} ₪</strong>?
          </p>
          <p>
            עבודה: <strong>{{ getJobNames(fineJob) || "-" }}</strong>
          </p>
          <p>
            לקוח: <strong>{{ fineJob?.clientName || "ללא שם" }}</strong>
          </p>
          <p>
            הנדימן: <strong>{{ fineJob?.handymanName || "ללא שם" }}</strong>
          </p>
          <p>
            סיבת ביטול:
            <strong>{{
              fineJob?.cancel?.["reason-for-cancellation"] || "-"
            }}</strong>
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn--ghost" @click="showConfirmFineModal = false">
          ביטול
        </button>
        <button
          class="btn btn--primary"
          :disabled="isCollectingFine"
          @click="confirmCollectFine"
        >
          {{ isCollectingFine ? "מגבה..." : "כן, גבה קנס" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { URL } from "@/Url/url";

export default {
  name: "CancellationsTab",
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      cancellations: [],
      isLoadingCancellations: false,
      cancellationsPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      showFineModal: false,
      showConfirmFineModal: false,
      fineJob: null,
      fineAmount: 0,
      isCollectingFine: false,
      toast: null,
    };
  },
  mounted() {
    this.toast = useToast();
    this.loadCancellations(this.cancellationsPagination.page);
  },
  methods: {
    async loadCancellations(page = 1) {
      this.isLoadingCancellations = true;
      try {
        const response = await axios.get(
          `${URL}/admin/cancellations?page=${page}&limit=20`
        );
        if (response.data.success) {
          this.cancellations = response.data.cancellations || [];
          if (response.data.pagination) {
            this.cancellationsPagination = response.data.pagination;
          }
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את הביטולים");
      } finally {
        this.isLoadingCancellations = false;
      }
    },
    openFineModal(job) {
      this.fineJob = job;
      this.fineAmount = 0;
      this.showFineModal = true;
    },
    closeFineModal() {
      this.showFineModal = false;
      this.showConfirmFineModal = false;
      this.fineJob = null;
      this.fineAmount = 0;
      this.isCollectingFine = false;
    },
    confirmCollectFine() {
      // Close confirmation modal and proceed with collection
      this.showConfirmFineModal = false;
      this.collectFine();
    },
    async collectFine() {
      if (
        !this.fineJob ||
        !this.fineAmount ||
        this.fineAmount <= 0 ||
        this.fineAmount > 200
      ) {
        this.toast?.showError("יש להזין סכום קנס תקין (עד 200 ₪)");
        return;
      }

      this.isCollectingFine = true;
      try {
        // Use cancellation ID from the cancellation document
        const cancellationId = this.fineJob._id || this.fineJob.id;
        const response = await axios.post(
          `${URL}/admin/cancellations/collect-fine`,
          {
            cancellationId,
            fineAmount: this.fineAmount,
          }
        );

        if (response.data.success) {
          this.toast?.showSuccess("הקנס נגבה בהצלחה");
          await this.loadCancellations(this.cancellationsPagination.page);
          this.closeFineModal();
        } else {
          this.toast?.showError(
            response.data.message || " לא הצלחנו לגבות את הקנס"
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          " לא הצלחנו לגבות את הקנס";
        this.toast?.showError(errorMessage);
      } finally {
        this.isCollectingFine = false;
      }
    },
    getJobNames(job) {
      if (!job || !job.subcategoryInfo || !Array.isArray(job.subcategoryInfo)) {
        return null;
      }
      const names = job.subcategoryInfo
        .map((item) => item.subcategory)
        .filter((name) => name); // Filter out empty/null values
      return names.length > 0 ? names.join(", ") : null;
    },
    formatDate(date) {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    getTimeAgo(date) {
      if (!date) return "";
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "זה עתה";
      if (diffMins < 60) return `לפני ${diffMins} דקות`;
      if (diffHours < 24) return `לפני ${diffHours} שעות`;
      if (diffDays < 7) return `לפני ${diffDays} ימים`;
      return formatDate(date);
    },
    formatCurrencySimple(value) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value || 0);
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

.loading-state {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
}

.job-id {
  font-family: monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  word-break: break-all;
  max-width: 150px;
  display: inline-block;
}

.handyman-id {
  font-family: monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 5px;
  display: inline-block;
}

.job-desc {
  font-size: 13px;
  color: $text;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cancellations-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.cancellations-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.refresh-cancellations-btn {
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

.cancellations-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.cancellations-table {
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

.person-badge {
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

  &--customer {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.reason-text {
  font-size: 13px;
  color: $text;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
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

  &--yes {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--no {
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
    border-color: rgba(107, 114, 128, 0.3);
  }

  &--collected {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--not-collected {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.collect-fine-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 193, 7, 0.3);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 193, 7, 0.25);
    border-color: rgba(255, 193, 7, 0.5);
    transform: translateY(-1px);
  }
}

.fine-collected-text {
  font-size: 13px;
  color: #10b981;
  font-weight: 900;
}

.fine-hint {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  margin-top: 4px;
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

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-cell {
  font-weight: 800;
  color: $text;
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
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: $bg;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  &--confirm {
    max-width: 600px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: $text;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.modal-body {
  padding: 20px;
}

.confirm-message {
  margin-bottom: 20px;

  p {
    margin: 8px 0;
    font-size: 14px;
    color: $text;
    line-height: 1.6;

    strong {
      color: $orange2;
      font-weight: 900;
    }
  }
}

.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 900;
  color: $text;
}

.form-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 800;
  font-family: $font-family;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  border: 1px solid;

  &--ghost {
    background: transparent;
    color: $text;
    border-color: rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &--primary {
    background: rgba($orange, 0.2);
    color: $orange2;
    border-color: rgba($orange, 0.3);

    &:hover:not(:disabled) {
      background: rgba($orange, 0.3);
      border-color: rgba($orange, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* Mobile Responsive - max-width 500px */
@media (max-width: 500px) {
  .cancellations-section__header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .cancellations-section__title {
    font-size: 18px;
  }

  .refresh-cancellations-btn {
    width: 100%;
    justify-content: center;
    padding: 10px;
  }

  .cancellations-table-wrapper {
    border-radius: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .cancellations-table {
    min-width: 1000px;
    font-size: 11px;
  }

  .cancellations-table th {
    padding: 10px 6px;
    font-size: 10px;
    white-space: nowrap;
  }

  .cancellations-table td {
    padding: 10px 6px;
    font-size: 11px;
  }

  .date-value {
    font-size: 11px;
  }

  .date-tooltip {
    font-size: 9px;
  }

  .job-id {
    font-size: 10px;
    max-width: 100px;
  }

  .handyman-id {
    font-size: 9px;
  }

  .job-desc {
    max-width: 120px;
    font-size: 11px;
  }

  .person-badge {
    font-size: 10px;
    padding: 4px 8px;
  }

  .reason-text {
    max-width: 150px;
    font-size: 11px;
  }

  .status-badge {
    font-size: 10px;
    padding: 4px 8px;
  }

  .collect-fine-btn {
    padding: 6px 10px;
    font-size: 11px;
    gap: 4px;
  }

  .fine-collected-text {
    font-size: 11px;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .pagination-info {
    font-size: 12px;
    text-align: center;
  }

  .pagination-btn {
    width: 100%;
    padding: 10px;
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

  .confirm-message {
    font-size: 14px;
  }

  .form-field {
    margin-bottom: 16px;
  }

  .form-label {
    font-size: 13px;
  }

  .form-input {
    font-size: 14px;
    padding: 10px;
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
