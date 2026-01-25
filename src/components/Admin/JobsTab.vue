<template>
  <div class="jobs-section">
    <div class="jobs-section__header">
      <h2 class="jobs-section__title">ניהול עבודות</h2>
      <div class="jobs-section__controls">
        <select v-model="jobFilters.status" class="filter-select">
          <option value="all">כל הסטטוסים</option>
          <option value="open">פתוח</option>
          <option value="assigned">הוקצה</option>
          <option value="on_the_way">בדרך</option>
          <option value="in_progress">בתהליך</option>
          <option value="done">הושלם</option>
          <option value="cancelled">בוטל</option>
        </select>
        <button class="refresh-jobs-btn" type="button" @click="loadJobs">
          ↻ רענן
        </button>
      </div>
    </div>

    <div v-if="isLoadingJobs" class="loading-state">טוען עבודות...</div>

    <div v-else class="jobs-table-wrapper">
      <table class="jobs-table">
        <thead>
          <tr class="jobs-table__header-group">
            <th colspan="3" class="jobs-table__group-header">פרטים יבשים</th>
            <th colspan="3" class="jobs-table__group-header">פרטי עבודה</th>
            <th colspan="2" class="jobs-table__group-header">תוספות</th>
            <th colspan="3" class="jobs-table__group-header">מידע נוסף</th>
          </tr>
          <tr>
            <th>תאריך</th>
            <th>לקוח</th>
            <th>הנדימן</th>
            <th>קטגוריה</th>
            <th>שם העבודה</th>
            <th>מיקום</th>
            <th>מחיר</th>
            <th>שעות עבודה</th>
            <th>סטטוס</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="job in filteredJobs"
            :key="job._id"
            class="jobs-table__row"
          >
            <td>
              <div class="job-date">{{ formatDate(job.createdAt) }}</div>
              <div class="job-time">{{ formatTime(job.createdAt) }}</div>
            </td>
            <td>{{ job.clientName || "לא זמין" }}</td>
            <td>
              {{
                Array.isArray(job.handymanName)
                  ? job.handymanName.join(", ")
                  : job.handymanName || "לא הוקצה"
              }}
            </td>
            <td>
              <span class="job-category">
                {{ job.category || "לא זמין" }}
              </span>
            </td>
            <td>
              <span class="job-subcategory">
                {{
                  Array.isArray(job.subcategoryInfo)
                    ? job.subcategoryInfo
                        .map((s) => s.name || s.subcategory || "")
                        .filter(Boolean)
                        .join(", ") || "לא זמין"
                    : job.subcategoryInfo?.name ||
                      job.subcategoryInfo?.subcategory ||
                      job.subcategory ||
                      "לא זמין"
                }}
              </span>
            </td>
            <td>{{ job.locationText || "לא זמין" }}</td>
            <td>
              <span class="job-price">
                {{
                  (() => {
                    const basePrice = parseFloat(job.price) || 0;
                    const hoursPrice = parseFloat(job.hoursTotalPrice) || 0;
                    const total = basePrice + hoursPrice;
                    return total > 0 ? total.toFixed(2) : "0.00";
                  })()
                }}
                ₪
              </span>
            </td>
            <td>
              <span v-if="job.hoursWorked">
                {{ job.hoursWorked }} שעות ({{ job.hoursTotalPrice || 0 }}
                ₪)
              </span>
              <span v-else class="no-data">אין</span>
            </td>
            <td>
              <span class="job-status" :class="`job-status--${job.status}`">
                {{ getJobStatusLabel(job.status) }}
              </span>
            </td>
            <td>
              <button
                class="job-view-btn"
                type="button"
                @click="viewJobDetails(job)"
              >
                צפה
              </button>
            </td>
          </tr>
          <tr v-if="filteredJobs.length === 0">
            <td colspan="11" class="no-data">אין עבודות להצגה</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Job Details Modal -->
    <div
      v-if="showJobDetailsModal"
      class="job-details-modal-overlay"
      @click.self="showJobDetailsModal = false"
    >
      <div class="job-details-modal">
        <div class="job-details-modal__header">
          <h2 class="job-details-modal__title">פרטי העבודה</h2>
          <button
            class="job-details-modal__close"
            type="button"
            @click="showJobDetailsModal = false"
          >
            ✕
          </button>
        </div>

        <div v-if="isLoadingJobDetails" class="job-details-modal__loading">
          טוען פרטים...
        </div>

        <div v-else-if="selectedJobDetails" class="job-details-modal__body">
          <!-- Basic Info Section -->
          <div class="job-details-section">
            <h3 class="job-details-section__title">מידע כללי</h3>
            <div class="job-details-grid">
              <div class="job-details-item">
                <span class="job-details-item__label">מספר עבודה:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails._id || selectedJobDetails.id
                }}</span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">סטטוס:</span>
                <span
                  class="job-details-item__value job-status"
                  :class="`job-status--${selectedJobDetails.status}`"
                >
                  {{ getJobStatusLabel(selectedJobDetails.status) }}
                </span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">תאריך יצירה:</span>
                <span class="job-details-item__value">
                  {{ formatDate(selectedJobDetails.createdAt) }}
                  {{ formatTime(selectedJobDetails.createdAt) }}
                </span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">תאריך עדכון אחרון:</span>
                <span class="job-details-item__value">
                  {{ formatDate(selectedJobDetails.updatedAt) }}
                  {{ formatTime(selectedJobDetails.updatedAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Category & Subcategory Section -->
          <div class="job-details-section">
            <h3 class="job-details-section__title">קטגוריה ותת-קטגוריה</h3>
            <div class="job-details-grid">
              <div class="job-details-item">
                <span class="job-details-item__label">קטגוריה:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails.category || "לא זמין"
                }}</span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">שם העבודה:</span>
                <span class="job-details-item__value">
                  {{
                    Array.isArray(selectedJobDetails.subcategoryInfo)
                      ? selectedJobDetails.subcategoryInfo
                          .map((s) => s.name || s.subcategory || "")
                          .filter(Boolean)
                          .join(", ") || "לא זמין"
                      : selectedJobDetails.subcategoryInfo?.name ||
                        selectedJobDetails.subcategoryInfo?.subcategory ||
                        selectedJobDetails.subcategory ||
                        "לא זמין"
                  }}
                </span>
              </div>
              <div
                v-if="
                  selectedJobDetails.subcategoryInfo &&
                  (Array.isArray(selectedJobDetails.subcategoryInfo)
                    ? selectedJobDetails.subcategoryInfo[0]?.workType
                    : selectedJobDetails.subcategoryInfo.workType)
                "
                class="job-details-item"
              >
                <span class="job-details-item__label">סוג עבודה:</span>
                <span class="job-details-item__value">
                  {{
                    Array.isArray(selectedJobDetails.subcategoryInfo)
                      ? selectedJobDetails.subcategoryInfo[0]?.workType
                      : selectedJobDetails.subcategoryInfo.workType
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Client Section -->
          <div class="job-details-section">
            <h3 class="job-details-section__title">לקוח</h3>
            <div class="job-details-grid">
              <div class="job-details-item">
                <span class="job-details-item__label">שם לקוח:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails.clientName || "לא זמין"
                }}</span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">מזהה לקוח:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails.clientId || "לא זמין"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Handyman Section -->
          <div class="job-details-section">
            <h3 class="job-details-section__title">הנדימן</h3>
            <div v-if="selectedJobDetails.handyman" class="job-details-grid">
              <div class="job-details-item">
                <span class="job-details-item__label">שם הנדימן:</span>
                <span class="job-details-item__value">
                  {{
                    selectedJobDetails.handyman.username ||
                    selectedJobDetails.handymanName ||
                    "לא זמין"
                  }}
                </span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">מייל:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails.handyman.email || "לא זמין"
                }}</span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">טלפון:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails.handyman.phone || "לא זמין"
                }}</span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">מזהה הנדימן:</span>
                <span class="job-details-item__value">
                  {{
                    Array.isArray(selectedJobDetails.handymanId)
                      ? selectedJobDetails.handymanId.join(", ")
                      : selectedJobDetails.handymanId || "לא זמין"
                  }}
                </span>
              </div>
            </div>
            <div v-else class="job-details-item">
              <span class="job-details-item__label">הנדימן:</span>
              <span class="job-details-item__value">
                {{
                  Array.isArray(selectedJobDetails.handymanName)
                    ? selectedJobDetails.handymanName.join(", ")
                    : selectedJobDetails.handymanName || "לא הוקצה"
                }}
              </span>
            </div>
          </div>

          <!-- Location Section -->
          <div class="job-details-section">
            <h3 class="job-details-section__title">מיקום</h3>
            <div class="job-details-grid">
              <div class="job-details-item job-details-item--full">
                <span class="job-details-item__label">כתובת:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails.locationText || "לא זמין"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Price Section -->
          <div class="job-details-section">
            <h3 class="job-details-section__title">מחירים</h3>
            <div class="job-details-grid">
              <div class="job-details-item">
                <span class="job-details-item__label">מחיר בסיס:</span>
                <span class="job-details-item__value job-price">
                  {{ (parseFloat(selectedJobDetails.price) || 0).toFixed(2) }}
                  ₪
                </span>
              </div>
              <div
                v-if="parseFloat(selectedJobDetails.hoursTotalPrice) > 0"
                class="job-details-item"
              >
                <span class="job-details-item__label">מחיר שעות עבודה:</span>
                <span class="job-details-item__value job-price">
                  {{
                    parseFloat(selectedJobDetails.hoursTotalPrice).toFixed(2)
                  }}
                  ₪
                  <span
                    v-if="selectedJobDetails.hoursWorked"
                    class="job-details-item__subtext"
                  >
                    ({{ selectedJobDetails.hoursWorked }} שעות ×
                    {{
                      (parseFloat(selectedJobDetails.hourlyPrice) || 0).toFixed(
                        2
                      )
                    }}
                    ₪)
                  </span>
                </span>
              </div>
              <div class="job-details-item job-details-item--total">
                <span class="job-details-item__label">סה"כ לתשלום:</span>
                <span
                  class="job-details-item__value job-price job-price--total"
                >
                  {{
                    (
                      (parseFloat(selectedJobDetails.price) || 0) +
                      (parseFloat(selectedJobDetails.hoursTotalPrice) || 0)
                    ).toFixed(2)
                  }}
                  ₪
                </span>
              </div>
            </div>
          </div>

          <!-- Images Section -->
          <div
            v-if="
              selectedJobDetails.imageUrl ||
              (selectedJobDetails.subcategoryInfo &&
                (Array.isArray(selectedJobDetails.subcategoryInfo)
                  ? selectedJobDetails.subcategoryInfo.some((s) => s.imageUrl)
                  : selectedJobDetails.subcategoryInfo.imageUrl))
            "
            class="job-details-section"
          >
            <h3 class="job-details-section__title">תמונות</h3>
            <div class="job-details-images">
              <img
                v-if="selectedJobDetails.imageUrl"
                :src="selectedJobDetails.imageUrl"
                alt="תמונת עבודה"
                class="job-details-image"
                @click="openImageModal(selectedJobDetails.imageUrl)"
              />
              <template
                v-if="Array.isArray(selectedJobDetails.subcategoryInfo)"
              >
                <img
                  v-for="(
                    sub, index
                  ) in selectedJobDetails.subcategoryInfo.filter(
                    (s) => s.imageUrl
                  )"
                  :key="index"
                  :src="sub.imageUrl"
                  alt="תמונת תת-קטגוריה"
                  class="job-details-image"
                  @click="openImageModal(sub.imageUrl)"
                />
              </template>
              <img
                v-else-if="selectedJobDetails.subcategoryInfo?.imageUrl"
                :src="selectedJobDetails.subcategoryInfo.imageUrl"
                alt="תמונת תת-קטגוריה"
                class="job-details-image"
                @click="
                  openImageModal(selectedJobDetails.subcategoryInfo.imageUrl)
                "
              />
            </div>
          </div>

          <!-- Receipt Section -->
          <div v-if="selectedJobDetails.receipt" class="job-details-section">
            <h3 class="job-details-section__title">קבלה</h3>
            <div class="job-details-grid">
              <div class="job-details-item">
                <span class="job-details-item__label">מספר קבלה:</span>
                <span class="job-details-item__value">{{
                  selectedJobDetails.receipt.orderNumber || "לא זמין"
                }}</span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">תאריך קבלה:</span>
                <span class="job-details-item__value">
                  {{ formatDate(selectedJobDetails.receipt.createdAt) }}
                </span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">סכום:</span>
                <span class="job-details-item__value job-price">
                  {{ (selectedJobDetails.receipt.amount || 0).toFixed(2) }} ₪
                </span>
              </div>
              <div class="job-details-item">
                <span class="job-details-item__label">סטטוס תשלום:</span>
                <span class="job-details-item__value">
                  {{ selectedJobDetails.receipt.status || "לא זמין" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Description Section -->
          <div v-if="selectedJobDetails.desc" class="job-details-section">
            <h3 class="job-details-section__title">תיאור</h3>
            <div class="job-details-description">
              {{ selectedJobDetails.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div
      v-if="selectedImageModal"
      class="image-modal-overlay"
      @click.self="selectedImageModal = null"
    >
      <div class="image-modal">
        <button
          class="image-modal__close"
          type="button"
          @click="selectedImageModal = null"
        >
          ✕
        </button>
        <img
          :src="selectedImageModal"
          alt="תמונת עבודה"
          class="image-modal__img"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import logger from "@/utils/logger";

export default {
  name: "JobsTab",
  data() {
    return {
      jobs: [],
      isLoadingJobs: false,
      jobFilters: {
        status: "all",
      },
      showJobDetailsModal: false,
      selectedJob: null,
      selectedJobDetails: null,
      isLoadingJobDetails: false,
      selectedImageModal: null,
      toast: null,
    };
  },
  computed: {
    filteredJobs() {
      let filtered = this.jobs;
      if (this.jobFilters.status !== "all") {
        filtered = filtered.filter(
          (job) => job.status === this.jobFilters.status
        );
      }
      return filtered;
    },
  },
  created() {
    this.toast = useToast();
    this.loadJobs();
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
    async loadJobs() {
      this.isLoadingJobs = true;
      try {
        const response = await axios.get(`${URL}/admin/jobs`);
        if (response.data && response.data.success) {
          this.jobs = response.data.jobs || [];
        } else {
          this.jobs = response.data?.jobs || [];
        }
      } catch (error) {
        logger.error("❌ [Admin] Error loading jobs:", error);
        this.toast.showError(
          error.response?.data?.message || "שגיאה בטעינת העבודות"
        );
        this.jobs = [];
      } finally {
        this.isLoadingJobs = false;
      }
    },
    getJobStatusLabel(status) {
      const statusLabels = {
        open: "פתוח",
        assigned: "הוקצה",
        on_the_way: "בדרך",
        in_progress: "בתהליך",
        done: "הושלם",
        cancelled: "בוטל",
      };
      return statusLabels[status] || status;
    },
    async viewJobDetails(job) {
      this.selectedJob = job;
      this.isLoadingJobDetails = true;
      try {
        const jobId = job._id || job.id;
        const [jobResponse, receiptResponse, handymanResponse] =
          await Promise.all([
            axios
              .get(`${URL}/admin/jobs/${jobId}`)
              .catch(() => ({ data: { job } })),
            job.paymentIntentId
              ? axios
                  .get(`${URL}/admin/receipts/${job.paymentIntentId}`)
                  .catch(() => ({ data: null }))
              : Promise.resolve({ data: null }),
            job.handymanId
              ? axios
                  .get(
                    `${URL}/admin/users/${
                      Array.isArray(job.handymanId)
                        ? job.handymanId[0]
                        : job.handymanId
                    }`
                  )
                  .catch(() => ({ data: null }))
              : Promise.resolve({ data: null }),
          ]);

        this.selectedJobDetails = {
          ...(jobResponse.data.job || job),
          receipt: receiptResponse.data?.receipt || null,
          handyman: handymanResponse.data?.user || null,
        };
        this.showJobDetailsModal = true;
      } catch (error) {
        logger.error("❌ [Admin] Error loading job details:", error);
        this.selectedJobDetails = { ...job, receipt: null, handyman: null };
        this.showJobDetailsModal = true;
      } finally {
        this.isLoadingJobDetails = false;
      }
    },
    openImageModal(imageUrl) {
      this.selectedImageModal = imageUrl;
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

.jobs-section {
  padding: 24px;
}

.jobs-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.jobs-section__title {
  font-size: 24px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.jobs-section__controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba($orange, 0.5);
}

.refresh-jobs-btn {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-jobs-btn:hover {
  background: rgba($orange, 0.25);
  transform: translateY(-1px);
}

.jobs-table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.jobs-table__header-group {
  background: rgba($orange, 0.15);
  border-bottom: 2px solid rgba($orange, 0.3);
}

.jobs-table__group-header {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 1000;
  color: $orange2;
  text-align: center;
  border: 1px solid rgba($orange, 0.2);
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
}

.jobs-table thead {
  background: rgba($orange, 0.1);
}

.jobs-table th {
  padding: 16px;
  text-align: right;
  font-size: 14px;
  font-weight: 1000;
  color: $orange2;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.jobs-table td {
  padding: 16px;
  text-align: right;
  font-size: 14px;
  font-weight: 900;
  color: $text;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.jobs-table__row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.job-date {
  font-size: 13px;
  font-weight: 1000;
  color: $text;
}

.job-time {
  font-size: 11px;
  font-weight: 800;
  color: $muted;
  margin-top: 4px;
}

.job-price {
  font-size: 15px;
  font-weight: 1000;
  color: $orange2;
}

.job-status {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
}

.job-status--open {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.job-status--assigned {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.job-status--on_the_way {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.job-status--in_progress {
  background: rgba($orange, 0.2);
  color: $orange2;
  border: 1px solid rgba($orange, 0.4);
}

.job-status--done {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.job-status--cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.job-view-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.job-view-btn:hover {
  background: rgba($orange, 0.25);
  transform: translateY(-1px);
}

.job-category {
  font-weight: 900;
  color: $orange2;
}

.job-subcategory {
  font-weight: 1000;
  color: $text;
}

.no-data {
  color: $muted;
  font-style: italic;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
  font-weight: 800;
}

/* Job Details Modal */
.job-details-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.job-details-modal {
  background: rgba(11, 11, 15, 0.98);
  border-radius: 24px;
  border: 1px solid rgba($orange, 0.3);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9);
  width: 95vw;
  max-width: 1400px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.job-details-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid rgba($orange, 0.2);
  background: rgba($orange, 0.05);
  flex-shrink: 0;
}

.job-details-modal__title {
  font-size: 28px;
  font-weight: 1100;
  color: $orange2;
  margin: 0;
}

.job-details-modal__close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: $text;
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.job-details-modal__close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.job-details-modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.job-details-modal__loading {
  padding: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
  color: $muted;
}

.job-details-section {
  margin-bottom: 20px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.job-details-section__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 14px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.job-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.job-details-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.job-details-item--full {
  grid-column: 1 / -1;
}

.job-details-item--total {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.3);
  margin-top: 8px;
}

.job-details-item__label {
  font-size: 13px;
  font-weight: 900;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.job-details-item__value {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
}

.job-details-item__subtext {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  margin-right: 8px;
}

.job-price--total {
  font-size: 20px;
  color: $orange;
}

.job-details-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.job-details-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid rgba($orange, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.job-details-image:hover {
  transform: scale(1.05);
  border-color: $orange;
  box-shadow: 0 8px 24px rgba($orange, 0.4);
}

.job-details-description {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 15px;
  font-weight: 900;
  color: $text;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Image Modal */
.image-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.image-modal {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-modal__close {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: $text;
  font-size: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  z-index: 10;
}

.image-modal__close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-50%) scale(1.1);
}

.image-modal__img {
  max-width: 100%;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

@media (max-width: 768px) {
  .jobs-section {
    padding: 12px;
  }

  .jobs-section__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .jobs-table {
    font-size: 12px;
  }

  .jobs-table th,
  .jobs-table td {
    padding: 10px 8px;
  }

  .job-details-modal {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .job-details-modal__header {
    padding: 16px 20px;
  }

  .job-details-modal__title {
    font-size: 20px;
  }

  .job-details-modal__body {
    padding: 20px;
  }

  .job-details-grid {
    grid-template-columns: 1fr;
  }

  .job-details-images {
    grid-template-columns: 1fr;
  }
}

/* Mobile Responsive - max-width 500px */
@media (max-width: 500px) {
  .jobs-section {
    padding: 0;
  }

  .jobs-section__header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .jobs-section__title {
    font-size: 18px;
  }

  .jobs-section__controls {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .filter-select,
  .refresh-jobs-btn {
    width: 100%;
    padding: 10px;
  }

  .jobs-table-wrapper {
    border-radius: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .jobs-table {
    min-width: 1000px;
    font-size: 11px;
  }

  .jobs-table__header-group {
    display: none;
  }

  .jobs-table thead th {
    padding: 10px 6px;
    font-size: 10px;
    white-space: nowrap;
  }

  .jobs-table tbody td {
    padding: 10px 6px;
    font-size: 11px;
  }

  .job-date {
    font-size: 11px;
  }

  .job-time {
    font-size: 9px;
  }

  .job-price {
    font-size: 12px;
  }

  .job-status {
    font-size: 10px;
    padding: 4px 8px;
  }

  .job-view-btn {
    padding: 6px 10px;
    font-size: 11px;
  }

  .job-details-modal {
    width: 100vw;
    max-width: 100vw;
    border-radius: 0;
  }

  .job-details-modal__header {
    padding: 14px 16px;
  }

  .job-details-modal__title {
    font-size: 18px;
  }

  .job-details-modal__close {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .job-details-modal__body {
    padding: 16px;
  }

  .job-details-section {
    padding: 14px;
    margin-bottom: 16px;
  }

  .job-details-section__title {
    font-size: 15px;
    margin-bottom: 12px;
  }

  .job-details-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .job-details-item {
    padding: 10px;
  }

  .job-details-item__label {
    font-size: 11px;
  }

  .job-details-item__value {
    font-size: 14px;
  }

  .job-details-images {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .job-details-image {
    height: 180px;
  }

  .image-modal__close {
    top: -40px;
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}
</style>
