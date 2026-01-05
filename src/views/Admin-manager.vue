<template>
  <div class="admin-manager" dir="rtl">
    <div class="admin-manager__container">
      <div class="admin-manager__header">
        <h1 class="admin-manager__title">ניהול מערכת</h1>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ 'tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Users Tab -->
        <UsersTab v-if="activeTab === 'users'" />

        <!-- Categories Tab -->
        <div v-if="activeTab === 'categories'" class="tab-panel">
          <CategoriesTab />
        </div>

        <!-- Contact Tab -->
        <div v-if="activeTab === 'contact'" class="tab-panel">
          <div class="inquiries-section">
            <div class="inquiries-section__header">
              <h2 class="inquiries-section__title">פניות</h2>
              <div class="inquiries-section__controls">
                <select v-model="inquiryFilters.status" class="filter-select">
                  <option value="all">כל הסטטוסים</option>
                  <option value="pending">ממתין</option>
                  <option value="responded">נענה</option>
                  <option value="resolved">טופל</option>
                </select>
                <button
                  class="refresh-inquiries-btn"
                  type="button"
                  @click="loadInquiries"
                >
                  ↻ רענן
                </button>
              </div>
            </div>

            <div v-if="isLoadingInquiries" class="loading-state">
              טוען פניות...
            </div>

            <div v-else class="inquiries-table-wrapper">
              <table class="inquiries-table">
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>נושא</th>
                    <th>תוכן</th>
                    <th>משתמש</th>
                    <th>תגיות משתמשים</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="inquiry in filteredInquiries"
                    :key="inquiry._id"
                    class="inquiries-table__row"
                  >
                    <td>
                      <div class="inquiry-date">
                        {{ formatDate(inquiry.createdAt) }}
                      </div>
                      <div class="inquiry-time">
                        {{ formatTime(inquiry.createdAt) }}
                      </div>
                    </td>
                    <td>
                      <div class="inquiry-title">{{ inquiry.Title }}</div>
                    </td>
                    <td>
                      <div class="inquiry-content">
                        <template
                          v-for="(token, idx) in parseInquiryContent(inquiry)"
                          :key="idx"
                        >
                          <span v-if="token.type === 'text'">{{
                            token.content
                          }}</span>
                          <button
                            v-else-if="token.type === 'mention'"
                            type="button"
                            class="inquiry-content-mention"
                            @click="openUserDetailsModal(token.user)"
                            :title="`לחץ לצפייה בפרטי ${token.userName}`"
                          >
                            {{ token.userName }}
                          </button>
                        </template>
                      </div>
                    </td>
                    <td>
                      <div class="inquiry-user">
                        {{
                          inquiry.SenderName ||
                          inquiry.user?.username ||
                          inquiry.user?.email ||
                          "-"
                        }}
                      </div>
                    </td>
                    <td>
                      <div
                        v-if="
                          inquiry.mentionedUsers &&
                          inquiry.mentionedUsers.length > 0
                        "
                        class="inquiry-mentions"
                      >
                        <button
                          v-for="(user, idx) in inquiry.mentionedUsers"
                          :key="user._id"
                          type="button"
                          class="inquiry-mention-tag inquiry-mention-tag--clickable"
                          @click="openUserDetailsModal(user)"
                          :title="`לחץ לצפייה בפרטי ${
                            user.username || user.email
                          }`"
                        >
                          {{ user.username || user.email }}
                          <span v-if="idx < inquiry.mentionedUsers.length - 1"
                            >,
                          </span>
                        </button>
                      </div>
                      <span v-else class="inquiry-no-mentions">-</span>
                    </td>
                    <td>
                      <span
                        class="inquiry-status-badge"
                        :class="`inquiry-status-badge--${inquiry.status}`"
                      >
                        {{ getStatusLabel(inquiry.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="inquiry-actions">
                        <button
                          class="inquiry-action-btn inquiry-action-btn--push"
                          type="button"
                          @click="openPushModal(inquiry)"
                          title="שלח פוש"
                        >
                          📱
                        </button>
                        <button
                          class="inquiry-action-btn inquiry-action-btn--email"
                          type="button"
                          @click="openEmailModal(inquiry)"
                          title="שלח מייל"
                        >
                          ✉️
                        </button>
                        <button
                          class="inquiry-action-btn inquiry-action-btn--respond"
                          type="button"
                          @click="markAsResponded(inquiry)"
                          :disabled="inquiry.status === 'responded'"
                          title="סמן כנענה"
                        >
                          ✓
                        </button>
                        <button
                          class="inquiry-action-btn inquiry-action-btn--delete"
                          type="button"
                          @click="confirmDeleteInquiry(inquiry)"
                          title="מחק"
                        >
                          <font-awesome-icon :icon="['fas', 'trash']" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredInquiries.length === 0">
                    <td colspan="7" class="no-data">אין פניות להצגה</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Payments Tab -->
        <div v-if="activeTab === 'payments'" class="tab-panel">
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
                  'payments-sub-tab--active':
                    activePaymentsTab === 'transactions',
                }"
                type="button"
                @click="activePaymentsTab = 'transactions'"
              >
                עסקאות
              </button>
              <button
                class="payments-sub-tab"
                :class="{
                  'payments-sub-tab--active':
                    activePaymentsTab === 'subscriptions',
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
            <div
              v-if="activePaymentsTab === 'transactions'"
              class="payments-sub-panel"
            >
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

              <div v-if="isLoadingPayments" class="loading-state">
                טוען תשלומים...
              </div>

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
                          <span>{{
                            payment.client?.username || "ללא שם"
                          }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="user-cell">
                          <span>{{
                            payment.handyman?.username || "ללא שם"
                          }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="job-desc">{{
                          getJobNames(payment.job) || "-"
                        }}</span>
                      </td>
                      <td class="amount-cell amount-cell--price">
                        {{ formatCurrencySimple(payment.totalAmount || 0) }}
                        ₪
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
                            <font-awesome-icon
                              :icon="['fas', 'money-bill-wave']"
                            />
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
                  :disabled="
                    paymentsPagination.page >= paymentsPagination.totalPages
                  "
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
                    <tr
                      v-for="subscription in subscriptions"
                      :key="subscription._id"
                    >
                      <td>{{ subscription.userName || "ללא שם" }}</td>
                      <td>
                        {{ formatCurrencySimple(subscription.amount || 0) }} ₪
                      </td>
                      <td>
                        {{ formatCurrencySimple(subscription.vatAmount || 0) }}
                        ₪
                      </td>
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
              <div
                v-if="subscriptionsPagination.totalPages > 1"
                class="pagination"
              >
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
                    subscriptionsPagination.page >=
                    subscriptionsPagination.totalPages
                  "
                  @click="loadSubscriptions(subscriptionsPagination.page + 1)"
                >
                  הבא
                </button>
              </div>
            </div>

            <!-- Receipts Tab -->
            <div
              v-if="activePaymentsTab === 'receipts'"
              class="payments-sub-panel"
            >
              <ReceiptsTab />
            </div>
          </div>
        </div>

        <!-- Status Tab -->
        <div v-if="activeTab === 'status'" class="tab-panel">
          <StatusTab />
        </div>

        <!-- Jobs Tab -->
        <div v-if="activeTab === 'jobs'" class="tab-panel">
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
                <button
                  class="refresh-jobs-btn"
                  type="button"
                  @click="loadJobs"
                >
                  ↻ רענן
                </button>
              </div>
            </div>

            <div v-if="isLoadingJobs" class="loading-state">טוען עבודות...</div>

            <div v-else class="jobs-table-wrapper">
              <table class="jobs-table">
                <thead>
                  <tr class="jobs-table__header-group">
                    <th colspan="3" class="jobs-table__group-header">
                      פרטים יבשים
                    </th>
                    <th colspan="3" class="jobs-table__group-header">
                      פרטי עבודה
                    </th>
                    <th colspan="2" class="jobs-table__group-header">תוספות</th>
                    <th colspan="3" class="jobs-table__group-header">
                      מידע נוסף
                    </th>
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
                      <div class="job-date">
                        {{ formatDate(job.createdAt) }}
                      </div>
                      <div class="job-time">
                        {{ formatTime(job.createdAt) }}
                      </div>
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
                            const hoursPrice =
                              parseFloat(job.hoursTotalPrice) || 0;
                            const total = basePrice + hoursPrice;
                            return total > 0 ? total.toFixed(2) : "0.00";
                          })()
                        }}
                        ₪
                      </span>
                    </td>
                    <td>
                      <span v-if="job.hoursWorked">
                        {{ job.hoursWorked }} שעות ({{
                          job.hoursTotalPrice || 0
                        }}
                        ₪)
                      </span>
                      <span v-else class="no-data">אין</span>
                    </td>
                    <td>
                      <span
                        class="job-status"
                        :class="`job-status--${job.status}`"
                      >
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
          </div>
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
                    <span class="job-details-item__label"
                      >תאריך עדכון אחרון:</span
                    >
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
                <div
                  v-if="selectedJobDetails.handyman"
                  class="job-details-grid"
                >
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
                      {{
                        (parseFloat(selectedJobDetails.price) || 0).toFixed(2)
                      }}
                      ₪
                    </span>
                  </div>
                  <div
                    v-if="parseFloat(selectedJobDetails.hoursTotalPrice) > 0"
                    class="job-details-item"
                  >
                    <span class="job-details-item__label"
                      >מחיר שעות עבודה:</span
                    >
                    <span class="job-details-item__value job-price">
                      {{
                        parseFloat(selectedJobDetails.hoursTotalPrice).toFixed(
                          2
                        )
                      }}
                      ₪
                      <span
                        v-if="selectedJobDetails.hoursWorked"
                        class="job-details-item__subtext"
                      >
                        ({{ selectedJobDetails.hoursWorked }} שעות ×
                        {{
                          (
                            parseFloat(selectedJobDetails.hourlyPrice) || 0
                          ).toFixed(2)
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
                      ? selectedJobDetails.subcategoryInfo.some(
                          (s) => s.imageUrl
                        )
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
                      openImageModal(
                        selectedJobDetails.subcategoryInfo.imageUrl
                      )
                    "
                  />
                </div>
              </div>

              <!-- Receipt Section -->
              <div
                v-if="selectedJobDetails.receipt"
                class="job-details-section"
              >
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
                      {{ (selectedJobDetails.receipt.amount || 0).toFixed(2) }}
                      ₪
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

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="tab-panel">
          <div class="settings-section">
            <div class="settings-section__header">
              <h2 class="settings-section__title">הגדרות מערכת</h2>
            </div>

            <div class="settings-content">
              <div class="settings-card">
                <div class="settings-card__header">
                  <h3 class="settings-card__title">אחוז עמלה</h3>
                  <p class="settings-card__description">
                    אחוז העמלה שהמערכת גובה מכל תשלום
                  </p>
                </div>
                <div class="settings-card__body">
                  <div class="form-field">
                    <label class="form-label">אחוז עמלה (%)</label>
                    <input
                      v-model.number="platformFee"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      class="form-input"
                      placeholder="לדוגמה: 7"
                    />
                    <div class="current-fee-display">
                      ערך נוכחי: {{ currentPlatformFee }}%
                    </div>
                  </div>
                  <div class="settings-card__actions">
                    <button
                      class="btn btn--primary"
                      @click="updatePlatformFee"
                      :disabled="
                        isUpdatingFee || platformFee === currentPlatformFee
                      "
                    >
                      <span v-if="isUpdatingFee">מעדכן...</span>
                      <span v-else>עדכן עמלה</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="settings-card__header">
                  <h3 class="settings-card__title">אחוז מע"מ</h3>
                  <p class="settings-card__description">
                    אחוז המע"מ (מס ערך מוסף) שמחושב על כל תשלום
                  </p>
                </div>
                <div class="settings-card__body">
                  <div class="form-field">
                    <label class="form-label">אחוז מע"מ (%)</label>
                    <input
                      v-model.number="maamPercent"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      class="form-input"
                      placeholder="לדוגמה: 18"
                    />
                    <div class="current-fee-display">
                      ערך נוכחי: {{ currentMaamPercent }}%
                    </div>
                  </div>
                  <div class="settings-card__actions">
                    <button
                      class="btn btn--primary"
                      @click="updateMaamPercent"
                      :disabled="
                        isUpdatingMaam || maamPercent === currentMaamPercent
                      "
                    >
                      <span v-if="isUpdatingMaam">מעדכן...</span>
                      <span v-else>עדכן מע"מ</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="settings-card__header">
                  <h3 class="settings-card__title">מנוי חודשי</h3>
                  <p class="settings-card__description">
                    סכום המנוי החודשי להנדימנים
                  </p>
                </div>
                <div class="settings-card__body">
                  <div class="form-field">
                    <label class="form-label">סכום מנוי חודשי (₪)</label>
                    <input
                      v-model.number="monthlySubscription"
                      type="number"
                      step="0.1"
                      min="0"
                      class="form-input"
                      placeholder="לדוגמה: 49.9"
                    />
                    <div class="current-fee-display">
                      ערך נוכחי: {{ currentMonthlySubscription }} ₪
                    </div>
                  </div>
                  <div class="settings-card__actions">
                    <button
                      class="btn btn--primary"
                      @click="updateMonthlySubscription"
                      :disabled="
                        isUpdatingMonthlySubscription ||
                        monthlySubscription === currentMonthlySubscription
                      "
                    >
                      <span v-if="isUpdatingMonthlySubscription">מעדכן...</span>
                      <span v-else>עדכן מנוי חודשי</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cancellations Tab -->
        <CancellationsTab v-if="activeTab === 'cancellations'" />

        <!-- Expenses Tab -->
        <div v-if="activeTab === 'expenses'" class="tab-panel">
          <div class="financials-section">
            <div class="financials-header">
              <h2 class="financials-title">פירוט הוצאות והכנסות</h2>
              <button
                class="refresh-financials-btn"
                type="button"
                @click="loadFinancials"
              >
                ↻ רענן
              </button>
            </div>

            <div v-if="isLoadingFinancials" class="loading-state">
              טוען נתונים פיננסיים...
            </div>

            <div v-else class="financials-content">
              <!-- Expenses -->
              <div class="financials-card financials-card--expenses">
                <div class="financials-card__header">
                  <h3 class="financials-card__title">💰 הוצאות</h3>
                </div>
                <div class="financials-card__body">
                  <div class="financial-item">
                    <div class="financial-item__label">הוצאות AI</div>
                    <div
                      class="financial-item__value financial-item__value--expense"
                    >
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
                    <div
                      class="financial-item__value financial-item__value--expense"
                    >
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
                    <div
                      class="financial-item__value financial-item__value--expense"
                    >
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
                    <div
                      class="financial-item__value financial-item__value--expense"
                    >
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
                    <div
                      class="financial-item__value financial-item__value--expense"
                    >
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
                      ₪{{
                        formatCurrency(
                          getDisplayValue(
                            "expenses.AI expenses",
                            financials.expenses["AI expenses"]
                          ) +
                            getDisplayValue(
                              "expenses.DB expenses",
                              financials.expenses["DB expenses"]
                            ) +
                            getDisplayValue(
                              "expenses.API expenses",
                              financials.expenses["API expenses"]
                            ) +
                            getDisplayValue(
                              "expenses.Marketing expenses",
                              financials.expenses["Marketing expenses"]
                            ) +
                            getDisplayValue(
                              "expenses.clearing fee",
                              financials.expenses["clearing fee"]
                            )
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Revenue -->
              <div class="financials-card financials-card--revenue">
                <div class="financials-card__header">
                  <h3 class="financials-card__title">💵 הכנסות</h3>
                </div>
                <div class="financials-card__body">
                  <div class="financial-item">
                    <div class="financial-item__label">עמלות</div>
                    <div
                      class="financial-item__value financial-item__value--revenue"
                    >
                      {{ getCurrencySymbol("Revenue.Fees")
                      }}{{
                        formatCurrency(
                          getDisplayValue(
                            "Revenue.Fees",
                            financials.Revenue.Fees
                          )
                        )
                      }}
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
                    <div
                      class="financial-item__value financial-item__value--revenue"
                    >
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
                    <div
                      class="financial-item__value financial-item__value--revenue"
                    >
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
                      ₪{{
                        formatCurrency(
                          getDisplayValue(
                            "Revenue.Fees",
                            financials.Revenue.Fees
                          ) +
                            getDisplayValue(
                              "Revenue.Drawings",
                              financials.Revenue.Drawings
                            ) +
                            getDisplayValue(
                              "Revenue.Urgent call",
                              financials.Revenue["Urgent call"]
                            )
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Summary -->
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

              <!-- Chart -->
              <div class="financials-chart">
                <div class="chart-header">
                  <h3 class="chart-title">גרף רווח/הפסד</h3>
                  <div class="chart-period-selector">
                    <button
                      class="period-btn"
                      :class="{
                        'period-btn--active': chartPeriod === 'hourly',
                      }"
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
                      :class="{
                        'period-btn--active': chartPeriod === 'weekly',
                      }"
                      @click="loadChartData('weekly')"
                    >
                      שבועי
                    </button>
                    <button
                      class="period-btn"
                      :class="{
                        'period-btn--active': chartPeriod === 'monthly',
                      }"
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
          </div>
        </div>

        <!-- Free Handyman Registration Tab -->
        <div v-if="activeTab === 'free-handyman'" class="tab-panel">
          <div class="free-handyman-section">
            <div class="free-handyman-section__header">
              <h2 class="free-handyman-section__title">
                רישום הנדימן חבר בחינם
              </h2>
              <div class="free-handyman-section__badge">
                <span class="badge badge--free">חינם</span>
              </div>
            </div>

            <div class="free-handyman-form-wrapper">
              <form
                @submit.prevent="handleFreeHandymanRegister"
                class="free-handyman-form"
              >
                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label" for="freeHandymanFirstName"
                      >שם פרטי *</label
                    >
                    <input
                      id="freeHandymanFirstName"
                      v-model="freeHandymanForm.firstName"
                      type="text"
                      class="form-input"
                      placeholder="הכנס שם פרטי"
                      required
                    />
                  </div>
                  <div class="form-field">
                    <label class="form-label" for="freeHandymanLastName"
                      >שם משפחה *</label
                    >
                    <input
                      id="freeHandymanLastName"
                      v-model="freeHandymanForm.lastName"
                      type="text"
                      class="form-input"
                      placeholder="הכנס שם משפחה"
                      required
                    />
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label" for="freeHandymanEmail"
                    >מייל *</label
                  >
                  <input
                    id="freeHandymanEmail"
                    v-model="freeHandymanForm.email"
                    type="email"
                    class="form-input"
                    placeholder="הכנס כתובת מייל"
                    required
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="freeHandymanPassword"
                    >סיסמה *</label
                  >
                  <div class="input-with-icon">
                    <input
                      id="freeHandymanPassword"
                      v-model="freeHandymanForm.password"
                      :type="freeHandymanShowPassword ? 'text' : 'password'"
                      class="form-input"
                      placeholder="הכנס סיסמה"
                      required
                    />
                    <button
                      type="button"
                      class="icon-btn"
                      @click="
                        freeHandymanShowPassword = !freeHandymanShowPassword
                      "
                    >
                      <font-awesome-icon
                        :icon="
                          freeHandymanShowPassword
                            ? ['fas', 'eye-slash']
                            : ['fas', 'eye']
                        "
                      />
                    </button>
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label" for="freeHandymanPhone"
                    >פלאפון *</label
                  >
                  <input
                    id="freeHandymanPhone"
                    v-model="freeHandymanForm.phone"
                    type="tel"
                    class="form-input"
                    placeholder="הכנס מספר טלפון"
                    required
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="freeHandymanAddress"
                    >עיר *</label
                  >
                  <AddressAutocomplete
                    v-model="freeHandymanForm.city"
                    @update:englishName="
                      freeHandymanForm.addressEnglish = $event
                    "
                    @update:modelValue="freeHandymanForm.address = $event"
                    input-id="freeHandymanAddress"
                    placeholder="בחר עיר"
                    :required="true"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="freeHandymanHowDidYouHear"
                    >איך הגעת אלינו? (רשות)</label
                  >
                  <input
                    id="freeHandymanHowDidYouHear"
                    v-model="freeHandymanForm.howDidYouHear"
                    type="text"
                    class="form-input"
                    placeholder="אינסטגרם / חבר / מודעה..."
                  />
                </div>

                <div class="form-field">
                  <CategoryCheckboxSelector
                    v-model="freeHandymanForm.specialties"
                    label="תחומי התמחות *"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="freeHandymanImage"
                    >תמונה</label
                  >
                  <div class="file-upload">
                    <input
                      id="freeHandymanImage"
                      type="file"
                      accept="image/*"
                      @change="handleFreeHandymanImageUpload"
                      class="file-upload__input"
                      :disabled="!!freeHandymanForm.image"
                    />
                    <label
                      for="freeHandymanImage"
                      class="file-upload__btn"
                      :class="{ disabled: freeHandymanForm.image }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      <span>{{
                        freeHandymanForm.image ? "נבחרה תמונה" : "בחר תמונה"
                      }}</span>
                    </label>
                    <div
                      v-if="freeHandymanForm.imagePreview"
                      class="image-preview"
                    >
                      <img :src="freeHandymanForm.imagePreview" alt="Preview" />
                    </div>
                  </div>
                </div>

                <div class="form-field">
                  <label class="form-label" for="freeHandymanLogo"
                    >לוגו (רשות)</label
                  >
                  <div class="file-upload">
                    <input
                      id="freeHandymanLogo"
                      type="file"
                      accept="image/*"
                      @change="handleFreeHandymanLogoUpload"
                      class="file-upload__input"
                      :disabled="!!freeHandymanForm.logo"
                    />
                    <label
                      for="freeHandymanLogo"
                      class="file-upload__btn"
                      :class="{ disabled: freeHandymanForm.logo }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      <span>{{
                        freeHandymanForm.logo ? "נבחר לוגו" : "בחר לוגו"
                      }}</span>
                    </label>
                    <div
                      v-if="freeHandymanForm.logoPreview"
                      class="image-preview"
                    >
                      <img :src="freeHandymanForm.logoPreview" alt="Preview" />
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button
                    type="submit"
                    class="btn btn--free"
                    :disabled="isSubmittingFreeHandyman"
                  >
                    {{
                      isSubmittingFreeHandyman
                        ? "שולח..."
                        : "רישום הנדימן בחינם"
                    }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Edit Modal -->
      <!-- Edit Financial Modal -->
      <div
        v-if="showEditFinancialModal"
        class="modal-overlay"
        @click="closeEditFinancialModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">עריכת סכום</h3>
            <button class="modal-close" @click="closeEditFinancialModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">{{ editFinancialFieldLabel }}</label>
              <div class="current-value">
                ערך נוכחי: ₪{{
                  formatCurrency(
                    getDisplayValue(
                      editFinancialField,
                      editFinancialCurrentValue
                    )
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

      <!-- Delete Payment Confirmation Modal -->
      <div
        v-if="showDeletePaymentModal"
        class="modal-overlay"
        @click="closeDeletePaymentModal"
      >
        <div class="modal-content modal-content--confirm" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">מחיקת תשלום</h3>
            <button class="modal-close" @click="closeDeletePaymentModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="confirm-message">
              האם אתה בטוח שברצונך למחוק את התשלום?
              <br />
              <strong>
                לקוח: {{ paymentToDelete?.client?.username || "ללא שם" }} |
                הנדימן: {{ paymentToDelete?.handyman?.username || "ללא שם" }} |
                סכום:
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

      <!-- Collect Fine Modal -->
    </div>

    <!-- Push Modal -->
    <div
      v-if="showPushModal"
      class="modal-overlay"
      @click.self="closePushModal"
    >
      <div class="modal-content" dir="rtl">
        <div class="modal-header">
          <h3 class="modal-title">שלח הודעת פוש</h3>
          <button
            class="modal-close"
            type="button"
            @click="closePushModal"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">הודעה</label>
            <textarea
              v-model="pushMessage"
              class="form-textarea"
              rows="4"
              placeholder="הזן את תוכן ההודעה..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn--cancel"
            type="button"
            @click="closePushModal"
            :disabled="isSendingPush"
          >
            ביטול
          </button>
          <button
            class="btn btn--primary"
            type="button"
            @click="sendPush"
            :disabled="!pushMessage.trim() || isSendingPush"
          >
            {{ isSendingPush ? "שולח..." : "שלח" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Email Modal -->
    <div
      v-if="showEmailModal"
      class="modal-overlay"
      @click.self="closeEmailModal"
    >
      <div class="modal-content" dir="rtl">
        <div class="modal-header">
          <h3 class="modal-title">שלח מייל</h3>
          <button
            class="modal-close"
            type="button"
            @click="closeEmailModal"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">כתובת מייל</label>
            <input
              v-model="emailRecipient"
              type="email"
              class="form-input"
              placeholder="הזן כתובת מייל..."
            />
          </div>
          <div class="form-field">
            <label class="form-label">תוכן המייל</label>
            <textarea
              v-model="emailContent"
              class="form-textarea"
              rows="6"
              placeholder="הזן את תוכן המייל..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn--cancel"
            type="button"
            @click="closeEmailModal"
            :disabled="isSendingEmail"
          >
            ביטול
          </button>
          <button
            class="btn btn--primary"
            type="button"
            @click="sendEmail"
            :disabled="
              !emailContent.trim() || !emailRecipient.trim() || isSendingEmail
            "
          >
            {{ isSendingEmail ? "שולח..." : "שלח" }}
          </button>
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
import AddressAutocomplete from "@/components/Global/AddressAutocomplete.vue";
import CategoryCheckboxSelector from "@/components/Global/CategoryCheckboxSelector.vue";
import ReceiptsTab from "@/components/Admin/ReceiptsTab.vue";
import UsersTab from "@/components/Admin/UsersTab.vue";
import CategoriesTab from "@/components/Admin/CategoriesTab.vue";
import StatusTab from "@/components/Admin/StatusTab.vue";
import CancellationsTab from "@/components/Admin/CancellationsTab.vue";

Chart.register(...registerables);

export default {
  name: "AdminManager",
  components: {
    AddressAutocomplete,
    CategoryCheckboxSelector,
    ReceiptsTab,
    UsersTab,
    CategoriesTab,
    StatusTab,
    CancellationsTab,
  },
  data() {
    return {
      activeTab: "users",
      tabs: [
        { id: "users", label: "משתמשים" },
        { id: "categories", label: "ניהול קטגוריות" },
        { id: "jobs", label: "עבודות" },
        { id: "contact", label: "פניות" },
        { id: "payments", label: "תשלומים" },
        { id: "expenses", label: "פירוט הוצאות" },
        { id: "status", label: "סטטוסים" },
        { id: "settings", label: "הגדרות" },
        { id: "cancellations", label: "ביטולים" },
        { id: "free-handyman", label: "רישום הנדימן חבר בחינם" },
      ],
      // Jobs
      jobs: [],
      isLoadingJobs: false,
      jobFilters: {
        status: "all",
      },
      // Job Details Modal
      showJobDetailsModal: false,
      selectedJob: null,
      selectedJobDetails: null,
      isLoadingJobDetails: false,
      selectedImageModal: null,
      // Financials
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
      // Exchange rate
      usdToIlsRate: 1, // Default rate, will be fetched
      isLoadingExchangeRate: false,
      // Edit Financial Modal
      showEditFinancialModal: false,
      editFinancialField: "",
      editFinancialCurrentValue: 0,
      editFinancialAmount: 0,
      toast: null,
      // Chart
      chart: null,
      // Free Handyman Registration
      freeHandymanShowPassword: false,
      isSubmittingFreeHandyman: false,
      freeHandymanForm: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        city: "",
        address: "",
        addressEnglish: "",
        howDidYouHear: "",
        specialties: [],
        image: null,
        imagePreview: null,
        imageUrl: null,
        logo: null,
        logoPreview: null,
        logoUrl: null,
        isHandyman: true,
        trialExpiresAt: "always", // Free forever - replaces handimanFree
      },
      chartPeriod: "daily",
      chartData: [],
      // Status
      // Payments
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
      // Subscriptions
      subscriptions: [],
      isLoadingSubscriptions: false,
      subscriptionsPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      // Payments sub-tabs
      activePaymentsTab: "transactions", // 'transactions', 'subscriptions', or 'receipts'
      // Delete payment modal
      showDeletePaymentModal: false,
      paymentToDelete: null,
      // Settings
      platformFee: 7,
      currentPlatformFee: 7,
      isUpdatingFee: false,
      maamPercent: 18,
      currentMaamPercent: 18,
      isUpdatingMaam: false,
      monthlySubscription: 49.9,
      currentMonthlySubscription: 49.9,
      isUpdatingMonthlySubscription: false,
      isCapturingPayment: false,
      // Inquiries
      inquiries: [],
      isLoadingInquiries: false,
      inquiryFilters: {
        status: "all",
      },
      showPushModal: false,
      pushInquiry: null,
      pushMessage: "",
      isSendingPush: false,
      showEmailModal: false,
      emailInquiry: null,
      emailRecipient: "",
      emailContent: "",
      isSendingEmail: false,
      // User Details Modal
      showUserDetailsModal: false,
      selectedUser: null,
      userDetails: null,
      isLoadingUserDetails: false,
    };
  },
  created() {
    this.toast = useToast();
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
    netProfit() {
      // כל הערכים מחושבים בשקלים תוך התחשבות בשדות שכבר בשקלים
      const totalRevenue =
        this.getDisplayValue("Revenue.Fees", this.financials.Revenue.Fees) +
        this.getDisplayValue(
          "Revenue.Drawings",
          this.financials.Revenue.Drawings
        ) +
        this.getDisplayValue(
          "Revenue.Urgent call",
          this.financials.Revenue["Urgent call"]
        );
      const totalExpenses =
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
        );
      return totalRevenue - totalExpenses;
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
          // "הועבר" includes: transferred, succeeded, and captured (all represent completed/transferred payments)
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
    filteredInquiries() {
      let filtered = [...this.inquiries];
      if (this.inquiryFilters.status && this.inquiryFilters.status !== "all") {
        filtered = filtered.filter(
          (inquiry) => inquiry.status === this.inquiryFilters.status
        );
      }
      return filtered;
    },
  },
  async mounted() {
    await this.loadExchangeRate();
    if (this.activeTab === "expenses") {
      await this.loadFinancials();
      // טען את הגרף אוטומטית עם התקופה הנוכחית (או daily כברירת מחדל)
      await this.$nextTick();
      await this.loadChartData(this.chartPeriod || "daily");
    }
    if (this.activeTab === "status") {
    }
    if (this.activeTab === "settings") {
      await this.loadPlatformFee();
      await this.loadMaamPercent();
      await this.loadMonthlySubscription();
    }
  },
  watch: {
    activePaymentsTab(newTab) {
      if (newTab === "subscriptions") {
        this.loadSubscriptions(this.subscriptionsPagination.page);
      }
    },
    async activeTab(newTab) {
      if (newTab === "jobs") {
        this.loadJobs();
      }
      if (newTab === "expenses") {
        await this.loadFinancials();
        // טען את הגרף אוטומטית עם התקופה הנוכחית (או daily כברירת מחדל)
        await this.$nextTick();
        await this.loadChartData(this.chartPeriod || "daily");
      }
      if (newTab === "payments") {
        this.loadPayments(this.paymentsPagination.page);
      }
      if (newTab === "settings") {
        this.loadPlatformFee();
        this.loadMaamPercent();
        this.loadMonthlySubscription();
      }
      if (newTab === "contact") {
        this.loadInquiries();
      }
    },
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  },
  methods: {
    getCategorySpecialties(specialties) {
      if (!specialties || !Array.isArray(specialties)) return [];
      return specialties.filter((s) => s.type === "category");
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
        // Keep default rate of 1 if API fails
        this.usdToIlsRate = 1;
      }
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
        console.log("🔍 [Admin] Loaded jobs:", this.jobs.length);
      } catch (error) {
        console.error("❌ [Admin] Error loading jobs:", error);
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
        // Fetch full job details including receipt and handyman info
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
        console.error("❌ [Admin] Error loading job details:", error);
        this.selectedJobDetails = { ...job, receipt: null, handyman: null };
        this.showJobDetailsModal = true;
      } finally {
        this.isLoadingJobDetails = false;
      }
    },
    openImageModal(imageUrl) {
      this.selectedImageModal = imageUrl;
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
    isAlreadyInILS(field) {
      // שדות שכבר מאוחסנים בשקלים ולא צריך להמיר אותם
      const fieldsInILS = [
        "Revenue.Urgent call", // קריאת חירום
        "Revenue.Drawings", // רישומים
        "Revenue.Fees", // עמלות
        "expenses.clearing fee", // עמלת סליקה
      ];
      return fieldsInILS.includes(field);
    },
    getDisplayValue(field, value) {
      // אם השדה כבר בשקלים, מחזיר את הערך כמו שהוא
      // אחרת, ממיר מדולרים לשקלים
      if (this.isAlreadyInILS(field)) {
        return value;
      }
      return value * this.usdToIlsRate;
    },
    getCurrencySymbol(field) {
      // כל הערכים מוצגים בשקלים
      return "₪";
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
              'מע"מ': 0,
            },
            Revenue: {
              Fees: 0,
              Drawings: 0,
              "Urgent call": 0,
            },
          };
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את הנתונים הפיננסיים");
      } finally {
        this.isLoadingFinancials = false;
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
      }).format(value || 0);
    },
    formatCurrencySimple(value) {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value || 0);
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
          // המתן שהדום יעודכן לפני שרטוט הגרף
          await this.$nextTick();
          this.renderChart();
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את נתוני הגרף");
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
              label: "רווח/הפסד",
              data: this.chartData
                .map((item) => (item.profit || 0) * this.usdToIlsRate)
                .reverse(),
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
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
                  return "₪" + value.toFixed(2);
                },
              },
            },
          },
        },
      });
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
        // Load subscriptions as well (if on subscriptions tab)
        if (this.activePaymentsTab === "subscriptions") {
          await this.loadSubscriptions(this.subscriptionsPagination.page);
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
    async loadInquiries() {
      this.isLoadingInquiries = true;
      try {
        const response = await axios.get(`${URL}/api/inquiries`);
        if (response.data.success) {
          this.inquiries = response.data.inquiries || [];
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את הפניות");
      } finally {
        this.isLoadingInquiries = false;
      }
    },
    getStatusLabel(status) {
      const statusMap = {
        pending: "ממתין",
        responded: "נענה",
        resolved: "טופל",
        deleted: "נמחק",
      };
      return statusMap[status] || status;
    },
    truncateText(text, maxLength) {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    },
    openPushModal(inquiry) {
      this.pushInquiry = inquiry;
      this.pushMessage = "";
      this.showPushModal = true;
    },
    closePushModal() {
      this.showPushModal = false;
      this.pushInquiry = null;
      this.pushMessage = "";
    },
    async sendPush() {
      if (!this.pushMessage.trim() || !this.pushInquiry || this.isSendingPush)
        return;

      this.isSendingPush = true;
      try {
        const userId =
          this.pushInquiry.userId?.toString() ||
          this.pushInquiry.user?._id?.toString();
        if (!userId) {
          this.toast?.showError("לא ניתן לשלוח פוש - אין מזהה משתמש");
          return;
        }

        await axios.post(
          `${URL}/api/inquiries/${this.pushInquiry._id}/send-push`,
          {
            message: this.pushMessage,
            userId: userId,
          }
        );

        this.toast?.showSuccess("ההודעה נשלחה בהצלחה");
        this.closePushModal();
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו לשלוח את ההודעה"
        );
      } finally {
        this.isSendingPush = false;
      }
    },
    openEmailModal(inquiry) {
      this.emailInquiry = inquiry;
      this.emailContent = "";
      this.emailRecipient = inquiry.user?.email || "";
      this.showEmailModal = true;
    },
    closeEmailModal() {
      this.showEmailModal = false;
      this.emailInquiry = null;
      this.emailContent = "";
      this.emailRecipient = "";
    },
    async sendEmail() {
      if (
        !this.emailContent.trim() ||
        !this.emailRecipient.trim() ||
        !this.emailInquiry ||
        this.isSendingEmail
      )
        return;

      this.isSendingEmail = true;
      try {
        await axios.post(
          `${URL}/api/inquiries/${this.emailInquiry._id}/send-email`,
          {
            emailContent: this.emailContent,
            recipientEmail: this.emailRecipient,
          }
        );

        this.toast?.showSuccess("המייל נשלח בהצלחה");
        this.closeEmailModal();
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו לשלוח את המייל"
        );
      } finally {
        this.isSendingEmail = false;
      }
    },
    async markAsResponded(inquiry) {
      try {
        await axios.patch(`${URL}/api/inquiries/${inquiry._id}/status`, {
          status: "responded",
        });
        this.toast?.showSuccess("הפנייה סומנה כנענה");
        await this.loadInquiries();
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לעדכן את הסטטוס");
      }
    },
    confirmDeleteInquiry(inquiry) {
      this.showDeleteConfirm(
        "מחיקת פנייה",
        "האם אתה בטוח שאתה רוצה למחוק את הפנייה הזו?",
        async () => {
          await this.deleteInquiry(inquiry);
        }
      );
    },
    async deleteInquiry(inquiry) {
      try {
        await axios.delete(`${URL}/api/inquiries/${inquiry._id}`);
        this.toast?.showSuccess("הפנייה נמחקה בהצלחה");
        await this.loadInquiries();
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו למחוק את הפנייה"
        );
      }
    },
    async openUserDetailsModal(user) {
      this.selectedUser = user;
      this.showUserDetailsModal = true;
      await this.loadUserDetails(user._id || user.id);
    },
    closeUserDetailsModal() {
      this.showUserDetailsModal = false;
      this.selectedUser = null;
      this.userDetails = null;
    },
    async loadUserDetails(userId) {
      this.isLoadingUserDetails = true;
      try {
        const response = await axios.get(`${URL}/admin/users/${userId}`);
        if (response.data.success) {
          this.userDetails = response.data.user;
        } else {
          this.toast?.showError(" לא הצלחנו לטעון את פרטי המשתמש");
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את פרטי המשתמש");
      } finally {
        this.isLoadingUserDetails = false;
      }
    },
    parseInquiryContent(inquiry) {
      if (!inquiry.Content) return [];

      let content = inquiry.Content;

      // Create a map of userId to user details
      const userMap = new Map();
      if (inquiry.mentionedUsers && Array.isArray(inquiry.mentionedUsers)) {
        inquiry.mentionedUsers.forEach((user) => {
          const userId = user._id?.toString() || user.id?.toString();
          if (userId) {
            userMap.set(userId, user);
          }
        });
      }

      // Parse content into tokens (text or mention)
      // Pattern: @ followed by ObjectId (24 hex characters)
      const mentionPattern = /@([a-fA-F0-9]{24})/g;
      const tokens = [];
      let lastIndex = 0;
      let match;

      while ((match = mentionPattern.exec(content)) !== null) {
        // Add text before mention
        if (match.index > lastIndex) {
          tokens.push({
            type: "text",
            content: content.substring(lastIndex, match.index),
          });
        }

        // Add mention
        const userId = match[1];
        const user = userMap.get(userId);
        if (user) {
          const userName = user.username || user.name || user.email || userId;
          tokens.push({
            type: "mention",
            userId: userId,
            userName: userName,
            user: user,
          });
        } else {
          // If user not found, keep as text
          tokens.push({
            type: "text",
            content: match[0],
          });
        }

        lastIndex = mentionPattern.lastIndex;
      }

      // Add remaining text
      if (lastIndex < content.length) {
        tokens.push({
          type: "text",
          content: content.substring(lastIndex),
        });
      }

      // If no mentions found, return the whole content as text
      if (tokens.length === 0) {
        tokens.push({
          type: "text",
          content: content,
        });
      }

      return tokens;
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
        succeeded: "הועבר", // Unified with transferred and captured
        requires_payment_method: "נדרש תשלום",
        requires_capture: "נדרש לכידה",
        requires_confirmation: "נדרש אישור",
        requires_action: "נדרש פעולה",
        processing: "מעבד",
        canceled: "בוטל",
        captured: "הועבר", // Unified with transferred and succeeded
      };
      return statusMap[status] || status || "לא ידוע";
    },
    getStatusBadgeClass(status) {
      const classMap = {
        transferred: "status-badge--transferred",
        succeeded: "status-badge--transferred", // Use same class as transferred
        captured: "status-badge--transferred", // Use same class as transferred
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
        .filter((name) => name); // Filter out empty/null values
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
    async loadPlatformFee() {
      try {
        const response = await axios.get(`${URL}/admin/fee`);
        if (response.data.success) {
          this.currentPlatformFee = response.data.fee;
          this.platformFee = response.data.fee;
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את אחוז העמלה");
      }
    },
    async updatePlatformFee() {
      if (this.platformFee === null || this.platformFee === undefined) {
        this.toast?.showError("יש להזין אחוז עמלה תקין");
        return;
      }

      if (this.platformFee < 0 || this.platformFee > 100) {
        this.toast?.showError("אחוז העמלה חייב להיות בין 0 ל-100");
        return;
      }

      this.isUpdatingFee = true;
      try {
        const response = await axios.post(`${URL}/admin/fee`, {
          fee: this.platformFee,
        });

        if (response.data.success) {
          this.currentPlatformFee = response.data.fee;
          this.toast?.showSuccess("אחוז העמלה עודכן בהצלחה");
        } else {
          this.toast?.showError(
            response.data.message || " לא הצלחנו לעדכן את אחוז העמלה"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו לעדכן את אחוז העמלה"
        );
      } finally {
        this.isUpdatingFee = false;
      }
    },
    async loadMaamPercent() {
      try {
        const response = await axios.get(`${URL}/admin/maam`);
        if (response.data.success) {
          this.currentMaamPercent = response.data.maam;
          this.maamPercent = response.data.maam;
        }
      } catch (error) {
        this.toast?.showError(' לא הצלחנו לטעון את אחוז המע"מ');
      }
    },
    async updateMaamPercent() {
      if (this.maamPercent === null || this.maamPercent === undefined) {
        this.toast?.showError('יש להזין אחוז מע"מ תקין');
        return;
      }

      if (this.maamPercent < 0 || this.maamPercent > 100) {
        this.toast?.showError('אחוז המע"מ חייב להיות בין 0 ל-100');
        return;
      }

      this.isUpdatingMaam = true;
      try {
        const response = await axios.post(`${URL}/admin/maam`, {
          maam: this.maamPercent,
        });

        if (response.data.success) {
          this.currentMaamPercent = response.data.maam;
          this.toast?.showSuccess('אחוז המע"מ עודכן בהצלחה');
        } else {
          this.toast?.showError(
            response.data.message || ' לא הצלחנו לעדכן את אחוז המע"מ'
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || ' לא הצלחנו לעדכן את אחוז המע"מ'
        );
      } finally {
        this.isUpdatingMaam = false;
      }
    },
    async loadMonthlySubscription() {
      try {
        const response = await axios.get(`${URL}/admin/monthly-subscription`);
        if (response.data.success) {
          this.currentMonthlySubscription = response.data.amount;
          this.monthlySubscription = response.data.amount;
        }
      } catch (error) {
        this.toast?.showError("לא הצלחנו לטעון את סכום המנוי החודשי");
      }
    },
    async updateMonthlySubscription() {
      if (
        this.monthlySubscription === null ||
        this.monthlySubscription === undefined
      ) {
        this.toast?.showError("יש להזין סכום מנוי חודשי תקין");
        return;
      }

      if (this.monthlySubscription < 0) {
        this.toast?.showError("סכום המנוי החודשי חייב להיות מספר חיובי");
        return;
      }

      this.isUpdatingMonthlySubscription = true;
      try {
        const response = await axios.post(`${URL}/admin/monthly-subscription`, {
          amount: this.monthlySubscription,
        });

        if (response.data.success) {
          this.currentMonthlySubscription = response.data.amount;
          this.toast?.showSuccess("סכום המנוי החודשי עודכן בהצלחה");
        } else {
          this.toast?.showError(
            response.data.message || " לא הצלחנו לעדכן את סכום המנוי החודשי"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message ||
            " לא הצלחנו לעדכן את סכום המנוי החודשי"
        );
      } finally {
        this.isUpdatingMonthlySubscription = false;
      }
    },
    async handleFreeHandymanImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.freeHandymanForm.image = file;
      const reader = new FileReader();
      reader.onload = (e) =>
        (this.freeHandymanForm.imagePreview = e.target.result);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.freeHandymanForm.imageUrl = data.imageUrl;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 403
            ? "אין הרשאה להעלות תמונות. אנא בדוק הרשאות AWS."
            : error.response?.status === 404
            ? "שרת לא זמין. אנא ודא שהשרת רץ"
            : "לא הצלחנו להעלות את התמונה");
        this.toast?.showError(msg);
      }
    },
    async handleFreeHandymanLogoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.freeHandymanForm.logo = file;
      const reader = new FileReader();
      reader.onload = (e) =>
        (this.freeHandymanForm.logoPreview = e.target.result);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-logo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.freeHandymanForm.logoUrl = data.imageUrl;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 403
            ? "אין הרשאה להעלות תמונות. אנא בדוק הרשאות AWS."
            : error.response?.status === 404
            ? "שרת לא זמין. אנא ודא שהשרת רץ"
            : "לא הצלחנו להעלות את הלוגו");
        this.toast?.showError(msg);
      }
    },
    async handleFreeHandymanRegister() {
      if (this.isSubmittingFreeHandyman) return;

      try {
        this.isSubmittingFreeHandyman = true;
        let formData = { ...this.freeHandymanForm };

        // Get English address if needed
        if (!formData.addressEnglish && formData.city) {
          try {
            const citiesData = await import("@/APIS/AdressFromIsrael.json");
            const cities = Array.isArray(citiesData.default)
              ? citiesData.default
              : citiesData;

            const searchValue = formData.city.trim();
            const foundCity = cities.find((city) => {
              const cityName = (city.name || city.שם_ישוב || "").trim();
              if (!cityName) return false;
              const a = cityName.replace(/\s+/g, " ");
              const b = searchValue.replace(/\s+/g, " ");
              return (
                a === b ||
                a.toLowerCase() === b.toLowerCase() ||
                a.replace(/['"()]/g, "").trim() ===
                  b.replace(/['"()]/g, "").trim()
              );
            });

            if (foundCity && foundCity.english_name) {
              formData.addressEnglish = foundCity.english_name;
            }
          } catch (e) {
            // Ignore error
          }
        }

        // Upload image if needed
        if (formData.image && !formData.imageUrl) {
          const upload = new FormData();
          upload.append("image", formData.image);
          const { data } = await axios.post(`${URL}/upload-image`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          formData.imageUrl = data.imageUrl;
        }

        // Upload logo if needed
        if (formData.logo && !formData.logoUrl) {
          const upload = new FormData();
          upload.append("image", formData.logo);
          const { data } = await axios.post(`${URL}/upload-logo`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          formData.logoUrl = data.imageUrl;
        }

        // Clean up form data
        delete formData.image;
        delete formData.logo;
        delete formData.imagePreview;
        delete formData.logoPreview;

        // Format specialties
        if (formData.specialties && Array.isArray(formData.specialties)) {
          formData.specialties = formData.specialties
            .filter(
              (item) =>
                item &&
                item.name &&
                (item.isFullCategory === true || item.type === "category")
            )
            .map((item) => item.name);
        }

        // Add trialExpiresAt: "always" for free handymen
        formData.trialExpiresAt = "always"; // Free forever - replaces handimanFree

        // Send registration request
        const { data } = await axios.post(
          `${URL}/register-handyman`,
          formData,
          {
            timeout: 30000,
          }
        );

        if (data === true || (data && data.success !== false)) {
          this.toast?.showSuccess("רישום הנדימן בוצע בהצלחה!");
          // Reset form
          this.freeHandymanForm = {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            phone: "",
            city: "",
            address: "",
            addressEnglish: "",
            howDidYouHear: "",
            specialties: [],
            image: null,
            imagePreview: null,
            imageUrl: null,
            logo: null,
            logoPreview: null,
            logoUrl: null,
            isHandyman: true,
            trialExpiresAt: "always", // Free forever - replaces handimanFree
          };
        } else {
          this.toast?.showError(data?.message || "לא הצלחנו לרשום את ההנדימן");
        }
      } catch (error) {
        let errorMessage = "לא הצלחנו לרשום את ההנדימן";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 400) {
          errorMessage = "הנתונים שהוזנו לא תקינים. אנא בדוק ונסה שוב.";
        } else if (error.response?.status === 500) {
          errorMessage = "יש בעיה בשרת. אנא נסה שוב מאוחר יותר.";
        } else if (error.message) {
          errorMessage = `לא הצלחנו לרשום את ההנדימן: ${error.message}`;
        }
        this.toast?.showError(errorMessage);
      } finally {
        this.isSubmittingFreeHandyman = false;
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

.admin-manager {
  min-height: 100vh;
  background: $bg;
  padding: 20px;
}

.admin-manager__container {
  max-width: 1400px;
  margin: 0 auto;
}

.admin-manager__header {
  margin-bottom: 24px;
}

.admin-manager__title {
  font-size: 28px;
  font-weight: 1100;
  color: $text;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba($orange, 0.2);
  margin-bottom: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabs::-webkit-scrollbar {
  height: 4px;
}

.tabs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.tabs::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.3);
  border-radius: 2px;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: $muted;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: $font-family;

  &:hover {
    color: $orange2;
  }

  &--active {
    color: $orange2;
    border-bottom-color: $orange;
  }
}

.tab-content {
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
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

.no-rating {
  color: $muted;
  font-style: italic;
  font-size: 12px;
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

.payments-tables-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.subscriptions-table-wrapper {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 20px;
  overflow-x: auto;
}

.subscriptions-table-title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 16px 0;
  text-align: center;
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

.amount-cell {
  font-weight: 1000;
  font-family: "Courier New", monospace;
  color: $orange2;

  // מחיר - כתום/צהוב
  &--price {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  // מע"מ - כחול
  &--vat {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  // רווח הנדימן - ירוק
  &--handyman {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  // רווח המערכת - סגול
  &--system {
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(139, 92, 246, 0.2);
  }

  // מחיר שנגבה מהלקוח - כתום חזק
  &--client {
    color: #ff6a00;
    background: rgba(255, 106, 0, 0.15);
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 106, 0, 0.3);
    font-weight: 1100;
  }

  // שינוי מחיר
  &--change {
    font-weight: 1000;
    padding: 3px 6px;
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);

    &-positive {
      color: #10b981;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    &-negative {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
  }
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

/* Categories Section */
/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: $muted;
  font-size: 16px;
  font-weight: 800;
}

/* Status Section */
/* Financials Section */
.financials-section {
  animation: fadeIn 0.3s ease;
}

.financials-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.financials-title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.refresh-financials-btn {
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

.financials-card {
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.3);
  }

  &--expenses {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
  }

  &--revenue {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }
}

.financials-card__header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.financials-card__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  margin: 0;
}

.financials-card__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.financial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }

  &--total {
    padding-top: 16px;
    margin-top: 8px;
    border-top: 2px solid rgba(255, 255, 255, 0.15);
    border-bottom: none;
  }
}

.financial-item__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.financial-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
  background: rgba($orange, 0.15);
  color: $orange2;
  border: 1px solid rgba($orange, 0.3);

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &--add {
    background: rgba($orange, 0.15);
    color: $orange2;
  }
}

.financial-item__label {
  font-size: 14px;
  font-weight: 900;
  color: $muted;
}

.financial-item__value {
  font-size: 16px;
  font-weight: 1000;
  font-family: "Courier New", monospace;

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

.financials-summary {
  grid-column: 1 / -1;
}

.summary-card {
  padding: 24px;
  border-radius: 16px;
  border: 2px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  text-align: center;
}

.summary-card__label {
  font-size: 14px;
  font-weight: 900;
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
  font-size: 16px;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 8px;
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

/* Chart Section */
.financials-chart {
  grid-column: 1 / -1;
  margin-top: 24px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  height: 400px;
  width: 100%;

  @media (max-width: 768px) {
    height: 300px;
  }
}

.current-value {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.financial-edit-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.financial-edit-buttons .btn {
  flex: 1;
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

.form-field {
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 900;
  color: $text;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 800;
  font-family: $font-family;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }

  &[type="textarea"],
  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

// Style select inputs specifically
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  padding-left: 36px;
  background-size: 12px;
  cursor: pointer;

  option {
    background: $bg;
    color: $text;
    padding: 10px;
    font-weight: 800;
  }

  &:hover {
    border-color: rgba($orange, 0.5);
  }
}

.modal-content--confirm {
  max-width: 450px;
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

  &--primary {
    background: rgba($orange, 0.15);
    color: $orange2;
    border: 1px solid rgba($orange, 0.3);

    &:hover:not(:disabled) {
      background: rgba($orange, 0.25);
      border-color: rgba($orange, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba($orange, 0.1);
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

/* Loading State */
.loading-state {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
  font-weight: 800;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-manager {
    padding: 12px;
  }

  .admin-manager__title {
    font-size: 24px;
  }

  .users-section__header {
    gap: 12px;
  }

  .users-section__filters {
    flex-direction: column;
  }

  .user-type-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .user-type-tab {
    padding: 8px 16px;
    font-size: 13px;
  }

  .filter-input,
  .filter-select {
    min-width: 100%;
  }

  .users-table-wrapper {
    font-size: 12px;
  }

  .users-table {
    th,
    td {
      padding: 8px 6px;
      font-size: 11px;
    }
  }

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
}

/* Settings Section */
.settings-section {
  animation: fadeIn 0.3s ease;
}

.settings-section__header {
  margin-bottom: 24px;
}

.settings-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.settings-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.settings-card {
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.3);
  }
}

.settings-card__header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-card__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  margin: 0 0 8px 0;
}

.settings-card__description {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin: 0;
}

.settings-card__body {
  padding: 20px;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-card__actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.current-fee-display {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

/* Cancellations Section */

/* Inquiries Section */
.inquiries-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.inquiries-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.inquiries-section__controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.refresh-inquiries-btn {
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

.inquiries-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.inquiries-table {
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

.inquiry-date {
  font-weight: 800;
  color: $text;
  font-size: 13px;
}

.inquiry-time {
  font-size: 11px;
  color: $muted;
  margin-top: 4px;
}

.inquiry-title {
  font-weight: 900;
  color: $text;
  font-size: 13px;
}

.inquiry-content {
  color: $text;
  font-size: 12px;
  line-height: 1.4;
  max-width: 300px;
  word-wrap: break-word;
}

.inquiry-content-mention {
  display: inline;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba($orange, 0.2);
  border: 1px solid rgba($orange, 0.4);
  color: $orange2;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  margin: 0 2px;
  font-family: $font-family;
  vertical-align: baseline;

  &:hover {
    background: rgba($orange, 0.3);
    border-color: rgba($orange, 0.6);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba($orange, 0.3);
  }
}

.inquiry-user {
  font-weight: 800;
  color: $text;
  font-size: 13px;

  &--anonymous {
    color: $muted;
    font-style: italic;
  }
}

.inquiry-mentions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.inquiry-mention-tag {
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.3);
  font-size: 11px;
  font-weight: 800;
  color: $orange2;
  white-space: nowrap;
  display: inline-block;

  &--clickable {
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba($orange, 0.3);
    background: rgba($orange, 0.15);

    &:hover {
      background: rgba($orange, 0.25);
      border-color: rgba($orange, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($orange, 0.3);
    }
  }
}

.inquiry-no-mentions {
  color: $muted;
  font-size: 12px;
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

.inquiry-status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
  border: 1px solid;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--pending {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    border-color: rgba(255, 193, 7, 0.3);
  }

  &--responded {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--resolved {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
  }

  &--deleted {
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
    border-color: rgba(107, 114, 128, 0.3);
  }
}

.inquiry-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.inquiry-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid;
  background: transparent;
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--push {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;

    &:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.25);
      border-color: rgba(59, 130, 246, 0.5);
    }
  }

  &--email {
    border-color: rgba(234, 67, 53, 0.3);
    background: rgba(234, 67, 53, 0.15);
    color: #ea4335;

    &:hover:not(:disabled) {
      background: rgba(234, 67, 53, 0.25);
      border-color: rgba(234, 67, 53, 0.5);
    }
  }

  &--respond {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;

    &:hover:not(:disabled) {
      background: rgba(16, 185, 129, 0.25);
      border-color: rgba(16, 185, 129, 0.5);
    }
  }

  &--delete {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;

    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
}

@media (max-width: 768px) {
  .inquiries-section__header {
    flex-direction: column;
    align-items: stretch;
  }

  .inquiries-section__controls {
    width: 100%;
    flex-direction: column;
  }

  .refresh-inquiries-btn {
    width: 100%;
    justify-content: center;
  }

  .inquiries-table-wrapper {
    font-size: 12px;
  }

  .inquiries-table {
    th,
    td {
      padding: 8px 6px;
      font-size: 11px;
    }
  }

  .inquiry-content {
    max-width: 150px;
  }

  .inquiry-action-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
}

/* User Details Modal */
.modal-content--large {
  max-width: 700px;
}

.user-details-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-details-section {
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.user-details-section__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 16px 0;
}

.user-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.user-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-detail-label {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
}

.user-detail-value {
  font-size: 14px;
  font-weight: 900;
  color: $text;
}

.user-status--active {
  color: #10b981;
}

.user-status--blocked {
  color: #ef4444;
}

.user-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.user-stat-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.4);
    transform: translateY(-2px);
  }
}

.user-stat-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.user-stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-stat-value {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  font-family: "Courier New", monospace;
}

.user-stat-label {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
}

@media (max-width: 768px) {
  .modal-content--large {
    max-width: 95%;
  }

  .user-details-grid,
  .user-stats-grid {
    grid-template-columns: 1fr;
  }

  .user-stat-card {
    padding: 12px;
  }
}

/* Free Handyman Registration Styles */
.free-handyman-section {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
}

.free-handyman-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.free-handyman-section__title {
  font-size: 28px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  font-family: $font-family;
}

.free-handyman-section__badge {
  display: flex;
  align-items: center;
}

.badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 900;
  display: inline-block;
  border: 2px solid;

  &--free {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.4);
  }
}

.free-handyman-form-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.free-handyman-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: rgba(255, 255, 255, 0.03);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.15);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 900;
  color: $orange2;
  font-family: $font-family;
}

.form-input {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  font-size: 14px;
  font-weight: 600;
  font-family: $font-family;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: $orange;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba($orange, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;

  .form-input {
    padding-right: 48px;
    width: 100%;
  }

  .icon-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;

    &:hover {
      color: $orange2;
    }
  }
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-upload__input {
  display: none;
}

.file-upload__btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: 2px dashed rgba($orange, 0.4);
  background: rgba($orange, 0.1);
  color: $orange2;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover:not(.disabled) {
    background: rgba($orange, 0.2);
    border-color: rgba($orange, 0.6);
    transform: translateY(-1px);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.image-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.3);
  max-width: 200px;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.btn {
  padding: 14px 32px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &--free {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

/* Receipts Section Styles */
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
/* Jobs Tab Styles */
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

@media (max-width: 768px) {
  .jobs-table {
    font-size: 12px;
  }

  .jobs-table th,
  .jobs-table td {
    padding: 10px 8px;
  }

  .jobs-section__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.job-category {
  font-weight: 900;
  color: $orange2;
}

.job-subcategory {
  font-weight: 1000;
  color: $text;
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

.job-price {
  color: $orange2;
  font-weight: 1100;
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
</style>
