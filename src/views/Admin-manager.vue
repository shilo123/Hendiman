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
        <div v-if="activeTab === 'users'" class="tab-panel">
          <div class="users-section">
            <div class="users-section__header">
              <h2 class="users-section__title">משתמשים</h2>
              <div class="users-section__controls">
                <div class="users-section__filters">
                  <input
                    v-model="userFilters.search"
                    type="text"
                    class="filter-input"
                    placeholder="חפש לפי שם או אימייל..."
                    @input="filterUsers"
                  />
                  <select
                    v-model="userFilters.sortBy"
                    class="filter-select"
                    @change="filterUsers"
                  >
                    <option value="">מיין לפי</option>
                    <option value="username">שם משתמש</option>
                    <option value="createdAt">תאריך יצירה</option>
                    <option value="rating">דירוג</option>
                    <option value="jobDone">עבודות שבוצעו</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- User Type Tabs -->
            <div class="user-type-tabs">
              <button
                class="user-type-tab"
                :class="{
                  'user-type-tab--active': userFilters.userType === 'handyman',
                }"
                @click="
                  userFilters.userType = 'handyman';
                  usersPagination.page = 1;
                  loadUsers(1);
                "
              >
                הנדימנים ({{ handymenCount }})
              </button>
              <button
                class="user-type-tab"
                :class="{
                  'user-type-tab--active': userFilters.userType === 'client',
                }"
                @click="
                  userFilters.userType = 'client';
                  usersPagination.page = 1;
                  loadUsers(1);
                "
              >
                לקוחות ({{ clientsCount }})
              </button>
            </div>

            <div v-if="isLoadingUsers" class="loading-state">
              טוען משתמשים...
            </div>

            <div v-else class="users-table-wrapper">
              <table class="users-table">
                <thead>
                  <tr>
                    <th>שם משתמש</th>
                    <th>אימייל</th>
                    <th>טלפון</th>
                    <th>כתובת/עיר</th>
                    <th v-if="userFilters.userType === 'handyman'">
                      תחומי התמחות
                    </th>
                    <th v-if="userFilters.userType === 'handyman'">דירוג</th>
                    <th v-if="userFilters.userType === 'handyman'">
                      עבודות שבוצעו
                    </th>
                    <th v-if="userFilters.userType === 'client'">
                      מספר הזמנות
                    </th>
                    <th>נוצר ב</th>
                    <th>חסום</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in filteredUsers"
                    :key="user._id || user.id"
                    class="users-table__row"
                  >
                    <td>
                      <div class="user-cell">
                        <img
                          v-if="user.imageUrl"
                          :src="user.imageUrl"
                          :alt="user.username"
                          class="user-avatar"
                          @error="handleImageError"
                        />
                        <span>{{ user.username || "ללא שם" }}</span>
                      </div>
                    </td>
                    <td>{{ user.email || "-" }}</td>
                    <td>{{ user.phone || "-" }}</td>
                    <td>{{ user.city || user.address || "-" }}</td>
                    <td v-if="userFilters.userType === 'handyman'">
                      <div
                        v-if="user.specialties && user.specialties.length > 0"
                        class="specialties-list"
                      >
                        <span
                          v-for="(spec, idx) in getCategorySpecialties(
                            user.specialties
                          ).slice(0, 3)"
                          :key="idx"
                          class="specialty-badge"
                        >
                          {{ spec.name }}
                        </span>
                        <span
                          v-if="
                            getCategorySpecialties(user.specialties).length > 3
                          "
                          class="specialty-more"
                        >
                          +{{
                            getCategorySpecialties(user.specialties).length - 3
                          }}
                        </span>
                      </div>
                      <span v-else class="no-data-small">אין</span>
                    </td>
                    <td v-if="userFilters.userType === 'handyman'">
                      <span v-if="user.rating && user.rating > 0">
                        {{ user.rating.toFixed(1) }} ⭐
                      </span>
                      <span v-else class="no-rating">אין דירוג</span>
                    </td>
                    <td v-if="userFilters.userType === 'handyman'">
                      {{ user.jobDone || 0 }}
                    </td>
                    <td v-if="userFilters.userType === 'client'">
                      {{ user.Ordered || 0 }}
                    </td>
                    <td>
                      <div class="date-cell">
                        <div class="date-value">
                          {{
                            user.createdAt ? formatDate(user.createdAt) : "-"
                          }}
                        </div>
                        <div
                          v-if="user.createdAt"
                          class="date-tooltip"
                          :title="getTimeAgo(user.createdAt)"
                        >
                          {{ getTimeAgo(user.createdAt) }}
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        class="block-user-btn"
                        :class="{
                          'block-user-btn--blocked': user.IsBlocked === true,
                        }"
                        type="button"
                        @click="toggleBlockUser(user)"
                        :title="
                          user.IsBlocked === true ? 'ביטול חסימה' : 'חסום'
                        "
                      >
                        <font-awesome-icon
                          :icon="
                            user.IsBlocked === true
                              ? ['fas', 'ban']
                              : ['fas', 'check']
                          "
                        />
                        {{ user.IsBlocked === true ? "חסום" : "פעיל" }}
                      </button>
                    </td>
                    <td>
                      <div class="actions-buttons">
                        <button
                          class="edit-user-btn"
                          type="button"
                          @click="editUser(user)"
                          title="ערוך משתמש"
                        >
                          <font-awesome-icon :icon="['fas', 'edit']" />
                        </button>
                        <button
                          class="send-message-btn"
                          type="button"
                          @click="sendMessage(user)"
                          title="שלח הודעה"
                        >
                          <font-awesome-icon :icon="['fas', 'comment']" />
                        </button>
                        <button
                          class="delete-user-btn"
                          type="button"
                          @click="confirmDeleteUser(user)"
                          title="מחק משתמש"
                        >
                          <font-awesome-icon :icon="['fas', 'trash']" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredUsers.length === 0">
                    <td
                      :colspan="userFilters.userType === 'handyman' ? 10 : 8"
                      class="no-data"
                    >
                      אין משתמשים להצגה
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination for Users -->
            <div v-if="usersPagination.totalPages > 0" class="pagination">
              <button
                class="pagination-btn"
                :disabled="usersPagination.page === 1"
                @click="loadUsers(usersPagination.page - 1)"
              >
                הקודם
              </button>
              <span class="pagination-info">
                עמוד {{ usersPagination.page }} מתוך
                {{ usersPagination.totalPages }} (סה"כ
                {{ usersPagination.total }} משתמשים)
              </span>
              <button
                class="pagination-btn"
                :disabled="usersPagination.page >= usersPagination.totalPages"
                @click="loadUsers(usersPagination.page + 1)"
              >
                הבא
              </button>
            </div>
          </div>
        </div>

        <!-- Categories Tab -->
        <div v-if="activeTab === 'categories'" class="tab-panel">
          <div class="categories-section">
            <div class="categories-section__header">
              <h2 class="categories-section__title">ניהול קטגוריות</h2>
              <button
                class="add-category-btn"
                type="button"
                @click="addCategory"
              >
                <font-awesome-icon :icon="['fas', 'plus']" />
                הוסף קטגוריה
              </button>
            </div>

            <div v-if="isLoadingCategories" class="loading-state">
              טוען קטגוריות...
            </div>

            <div v-else>
              <!-- Category Tabs -->
              <div class="category-tabs">
                <button
                  v-for="category in categories"
                  :key="category.name"
                  class="category-tab"
                  :class="{
                    'category-tab--active': activeCategoryTab === category.name,
                  }"
                  @click="activeCategoryTab = category.name"
                >
                  {{ category.name }}
                </button>
              </div>

              <!-- Category Content -->
              <div class="category-content">
                <div
                  v-for="category in categories"
                  :key="category.name"
                  v-show="activeCategoryTab === category.name"
                  class="category-panel"
                >
                  <div class="category-panel__header">
                    <h3 class="category-panel__title">{{ category.name }}</h3>
                    <div class="category-panel__actions">
                      <button
                        class="category-panel__edit-btn"
                        type="button"
                        @click="editCategory(category)"
                      >
                        <font-awesome-icon :icon="['fas', 'edit']" />
                        ערוך
                      </button>
                      <button
                        class="category-panel__delete-btn"
                        type="button"
                        @click="deleteCategory(category)"
                      >
                        <font-awesome-icon :icon="['fas', 'trash']" />
                        מחק
                      </button>
                    </div>
                  </div>
                  <div class="category-panel__content">
                    <div class="subcategories-header">
                      <h4 class="subcategories-title">תת-קטגוריות</h4>
                      <button
                        class="add-subcategory-btn"
                        type="button"
                        @click="openAddSubcategoryModal(category)"
                      >
                        <font-awesome-icon :icon="['fas', 'plus']" />
                        הוסף תת-קטגוריה
                      </button>
                    </div>
                    <div class="subcategories-grid">
                      <div
                        v-for="(sub, index) in category.subcategories"
                        :key="index"
                        class="subcategory-item"
                      >
                        <div class="subcategory-item__content">
                          <div class="subcategory-item__name">
                            {{ sub.name }}
                          </div>
                          <div class="subcategory-item__details">
                            <span class="subcategory-item__price">
                              {{ sub.price }} ₪
                            </span>
                            <span class="subcategory-item__work-type">
                              {{ sub.workType }}
                            </span>
                          </div>
                        </div>
                        <div class="subcategory-item__actions">
                          <button
                            class="subcategory-item__edit-btn"
                            type="button"
                            @click="openEditSubcategoryModal(category, sub)"
                          >
                            <font-awesome-icon :icon="['fas', 'edit']" />
                          </button>
                          <button
                            class="subcategory-item__delete-btn"
                            type="button"
                            @click="deleteSubcategory(category, sub)"
                          >
                            <font-awesome-icon :icon="['fas', 'trash']" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                      : loadSubscriptions(subscriptionsPagination.page)
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
                        {{ formatCurrencySimple(payment.spacious_H || 0) }} ₪
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
          </div>
        </div>

        <!-- Status Tab -->
        <div v-if="activeTab === 'status'" class="tab-panel">
          <div class="status-section">
            <div class="status-section__header">
              <h2 class="status-section__title">סטטוסים</h2>
              <button
                class="refresh-status-btn"
                type="button"
                @click="loadStatus"
              >
                ↻ רענן
              </button>
            </div>

            <div v-if="isLoadingStatus" class="loading-state">
              טוען נתוני סטטוס...
            </div>

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
                <div
                  class="how-did-you-hear-item how-did-you-hear-item--instagram"
                >
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
                <div
                  class="how-did-you-hear-item how-did-you-hear-item--facebook"
                >
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
                <div
                  class="how-did-you-hear-item how-did-you-hear-item--friend"
                >
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
                <div
                  class="how-did-you-hear-item how-did-you-hear-item--google"
                >
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
        <div v-if="activeTab === 'cancellations'" class="tab-panel">
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
                        {{
                          cancellation.cancel?.fineCollected === true
                            ? "כן"
                            : "לא"
                        }}
                      </span>
                    </td>
                    <td class="amount-cell">
                      {{
                        cancellation.cancel?.fineAmount
                          ? formatCurrencySimple(
                              cancellation.cancel.fineAmount
                            ) + " ₪"
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
            <div
              v-if="cancellationsPagination.totalPages > 1"
              class="pagination"
            >
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
                  cancellationsPagination.page >=
                  cancellationsPagination.totalPages
                "
                @click="loadCancellations(cancellationsPagination.page + 1)"
              >
                הבא
              </button>
            </div>
          </div>
        </div>

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
      </div>

      <!-- Category Edit Modal -->
      <div
        v-if="showCategoryModal"
        class="modal-overlay"
        @click="closeCategoryModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              {{ editingCategory ? "ערוך קטגוריה" : "הוסף קטגוריה" }}
            </h3>
            <button class="modal-close" @click="closeCategoryModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">שם הקטגוריה</label>
              <input
                v-model="categoryForm.name"
                type="text"
                class="form-input"
                placeholder="לדוגמה: אינסטלציה"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--ghost" @click="closeCategoryModal">
              ביטול
            </button>
            <button class="btn btn--primary" @click="saveCategory">
              {{ editingCategory ? "שמור שינויים" : "הוסף" }}
            </button>
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

      <!-- Delete User Confirmation Modal -->
      <div
        v-if="showDeleteUserModal"
        class="modal-overlay"
        @click="closeDeleteUserModal"
      >
        <div class="modal-content modal-content--confirm" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">מחיקת משתמש</h3>
            <button class="modal-close" @click="closeDeleteUserModal">×</button>
          </div>
          <div class="modal-body">
            <div class="confirm-message">
              האם אתה בטוח שברצונך למחוק את המשתמש
              <strong>{{ userToDelete?.username || "ללא שם" }}</strong
              >?
              <br />
              פעולה זו לא ניתנת לביטול!
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--ghost" @click="closeDeleteUserModal">
              ביטול
            </button>
            <button class="btn btn--danger" @click="deleteUser">מחק</button>
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

      <!-- Subcategory Edit Modal -->
      <div
        v-if="showSubcategoryModal"
        class="modal-overlay"
        @click="closeSubcategoryModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              {{ editingSubcategory ? "ערוך תת-קטגוריה" : "הוסף תת-קטגוריה" }}
            </h3>
            <button class="modal-close" @click="closeSubcategoryModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">שם התת-קטגוריה</label>
              <input
                v-model="subcategoryForm.name"
                type="text"
                class="form-input"
                placeholder="לדוגמה: פתיחת סתימות"
              />
            </div>
            <div class="form-field">
              <label class="form-label">מחיר (₪)</label>
              <input
                v-model.number="subcategoryForm.price"
                type="number"
                class="form-input"
                placeholder="לדוגמה: 350"
              />
            </div>
            <div class="form-field">
              <label class="form-label">סוג עבודה</label>
              <select v-model="subcategoryForm.workType" class="form-input">
                <option value="קבלנות">קבלנות</option>
                <option value="לשעה">לשעה</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--ghost" @click="closeSubcategoryModal">
              ביטול
            </button>
            <button
              v-if="editingSubcategory"
              class="btn btn--danger"
              @click="confirmDeleteSubcategory"
            >
              מחק
            </button>
            <button class="btn btn--primary" @click="saveSubcategory">
              {{ editingSubcategory ? "שמור שינויים" : "הוסף" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div
        v-if="showEditUserModal"
        class="modal-overlay"
        @click="closeEditUserModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">עריכת משתמש</h3>
            <button class="modal-close" @click="closeEditUserModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">שם משתמש</label>
              <input
                v-model="userForm.username"
                type="text"
                class="form-input"
                placeholder="שם משתמש"
              />
            </div>
            <div class="form-field">
              <label class="form-label">אימייל</label>
              <input
                v-model="userForm.email"
                type="email"
                class="form-input"
                placeholder="אימייל"
              />
            </div>
            <div class="form-field">
              <label class="form-label">טלפון</label>
              <input
                v-model="userForm.phone"
                type="text"
                class="form-input"
                placeholder="טלפון"
              />
            </div>
            <div class="form-field">
              <label class="form-label">עיר</label>
              <input
                v-model="userForm.city"
                type="text"
                class="form-input"
                placeholder="עיר"
              />
            </div>
            <div class="form-field">
              <label class="form-label">כתובת</label>
              <input
                v-model="userForm.address"
                type="text"
                class="form-input"
                placeholder="כתובת"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--ghost" @click="closeEditUserModal">
              ביטול
            </button>
            <button class="btn btn--primary" @click="saveUser">שמור</button>
          </div>
        </div>
      </div>

      <!-- Send Message Modal -->
      <div
        v-if="showSendMessageModal"
        class="modal-overlay"
        @click="closeSendMessageModal"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">שליחת הודעה</h3>
            <button class="modal-close" @click="closeSendMessageModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">מה יהיה תוכן ההודעה?</label>
              <textarea
                v-model="messageText"
                class="form-input"
                rows="4"
                placeholder="הכנס תוכן הודעה..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--ghost" @click="closeSendMessageModal">
              ביטול
            </button>
            <button
              class="btn btn--primary"
              :disabled="isSubmittingMessage"
              @click="submitMessage"
            >
              <span v-if="isSubmittingMessage">שולח...</span>
              <span v-else>שלח</span>
            </button>
          </div>
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
            <button class="btn btn--ghost" @click="closeFineModal">
              ביטול
            </button>
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
            <button
              class="btn btn--ghost"
              @click="showConfirmFineModal = false"
            >
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
import { loadCategories } from "@/utils/categoriesLoader";
import { useToast } from "@/composables/useToast";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default {
  name: "AdminManager",
  data() {
    return {
      activeTab: "users",
      tabs: [
        { id: "users", label: "משתמשים" },
        { id: "categories", label: "ניהול קטגוריות" },
        { id: "contact", label: "פניות" },
        { id: "payments", label: "תשלומים" },
        { id: "expenses", label: "פירוט הוצאות" },
        { id: "status", label: "סטטוסים" },
        { id: "settings", label: "הגדרות" },
        { id: "cancellations", label: "ביטולים" },
      ],
      users: [],
      filteredUsers: [],
      isLoadingUsers: false,
      usersPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      categories: [],
      isLoadingCategories: false,
      activeCategoryTab: "", // Track active category tab
      userFilters: {
        search: "",
        userType: "handyman", // Default to handymen
        sortBy: "",
      },
      // Category modal
      showCategoryModal: false,
      editingCategory: null,
      categoryForm: {
        name: "",
      },
      // Subcategory modal
      showSubcategoryModal: false,
      editingSubcategory: null,
      editingSubcategoryCategory: null,
      subcategoryForm: {
        name: "",
        price: 0,
        workType: "קבלנות",
      },
      // Delete confirmation modal
      showDeleteConfirmModal: false,
      deleteConfirmCallback: null,
      deleteConfirmTitle: "",
      deleteConfirmMessage: "",
      // User delete confirmation
      showDeleteUserModal: false,
      userToDelete: null,
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
      // User Edit Modal
      showEditUserModal: false,
      editingUser: null,
      userForm: {
        username: "",
        email: "",
        phone: "",
        city: "",
        address: "",
      },
      // Send Message Modal
      showSendMessageModal: false,
      messageUser: null,
      messageText: "",
      isSubmittingMessage: false,
      toast: null,
      // Chart
      chart: null,
      chartPeriod: "daily",
      chartData: [],
      // Status
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
      // Charts for status tab
      usersChart: null,
      usersChartData: [],
      transactionsChart: null,
      transactionsChartData: [],
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
      activePaymentsTab: "transactions", // 'transactions' or 'subscriptions'
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
      // Cancellations
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
    handymenCount() {
      return this.users.filter((u) => u.isHandyman === true).length;
    },
    clientsCount() {
      return this.users.filter((u) => !u.isHandyman).length;
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
    await this.loadUsers();
    this.loadCategories();
    await this.loadExchangeRate();
    if (this.activeTab === "expenses") {
      await this.loadFinancials();
      // טען את הגרף אוטומטית עם התקופה הנוכחית (או daily כברירת מחדל)
      await this.$nextTick();
      await this.loadChartData(this.chartPeriod || "daily");
    }
    if (this.activeTab === "status") {
      await this.loadStatus();
      await this.loadUsersChart();
      await this.loadTransactionsChart();
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
      if (newTab === "expenses") {
        await this.loadFinancials();
        // טען את הגרף אוטומטית עם התקופה הנוכחית (או daily כברירת מחדל)
        await this.$nextTick();
        await this.loadChartData(this.chartPeriod || "daily");
      }
      if (newTab === "status") {
        this.loadStatus();
        this.loadUsersChart();
        this.loadTransactionsChart();
      }
      if (newTab === "payments") {
        this.loadPayments(this.paymentsPagination.page);
      }
      if (newTab === "settings") {
        this.loadPlatformFee();
        this.loadMaamPercent();
        this.loadMonthlySubscription();
      }
      if (newTab === "cancellations") {
        this.loadCancellations(this.cancellationsPagination.page);
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
    async loadUsers(page = 1) {
      this.isLoadingUsers = true;
      try {
        const userType = this.userFilters.userType || "handyman";
        const response = await axios.get(`${URL}/admin/users`, {
          params: {
            page,
            limit: this.usersPagination.limit,
            userType: userType, // Send userType to backend
          },
        });
        if (response.data.success) {
          this.users = response.data.users || [];
          this.usersPagination.page = response.data.page || page;
          this.usersPagination.total = response.data.total || 0;
          this.usersPagination.totalPages = response.data.totalPages || 0;
          this.filterUsers();
        }
      } catch (error) {
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את המשתמשים");
      } finally {
        this.isLoadingUsers = false;
      }
    },
    async loadCategories() {
      this.isLoadingCategories = true;
      try {
        // Load from server
        const data = await loadCategories();
        this.categories = data.categories || [];
        // Set first category as active tab if available
        if (this.categories.length > 0 && !this.activeCategoryTab) {
          this.activeCategoryTab = this.categories[0].name;
        }
      } catch (error) {
      } finally {
        this.isLoadingCategories = false;
      }
    },
    addCategory() {
      this.openCategoryModal();
    },
    filterUsers() {
      let filtered = [...this.users];

      // Filter by user type
      if (this.userFilters.userType === "handyman") {
        filtered = filtered.filter((user) => user.isHandyman === true);
      } else if (this.userFilters.userType === "client") {
        filtered = filtered.filter((user) => !user.isHandyman);
      }

      // Filter by search
      if (this.userFilters.search) {
        const searchLower = this.userFilters.search.toLowerCase();
        filtered = filtered.filter((user) => {
          const username = (user.username || "").toLowerCase();
          const email = (user.email || "").toLowerCase();
          const firstName = (user.firstName || "").toLowerCase();
          return (
            username.includes(searchLower) ||
            email.includes(searchLower) ||
            firstName.includes(searchLower)
          );
        });
      }

      // Sort users
      if (this.userFilters.sortBy) {
        filtered.sort((a, b) => {
          switch (this.userFilters.sortBy) {
            case "username":
              return (a.username || "").localeCompare(b.username || "", "he");
            case "createdAt":
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case "rating":
              return (b.rating || 0) - (a.rating || 0);
            case "jobDone":
              return (b.jobDone || 0) - (a.jobDone || 0);
            default:
              return 0;
          }
        });
      }

      this.filteredUsers = filtered;
    },
    getCategorySpecialties(specialties) {
      if (!specialties || !Array.isArray(specialties)) return [];
      return specialties.filter((s) => s.type === "category");
    },
    confirmDeleteUser(user) {
      this.userToDelete = user;
      this.showDeleteUserModal = true;
    },
    closeDeleteUserModal() {
      this.showDeleteUserModal = false;
      this.userToDelete = null;
    },
    async deleteUser() {
      if (!this.userToDelete) return;

      try {
        const userId = this.userToDelete._id || this.userToDelete.id;
        await axios.delete(`${URL}/admin/users/${userId}`);
        this.toast.showSuccess("משתמש נמחק בהצלחה");
        await this.loadUsers();
        this.closeDeleteUserModal();
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || "אויי חבל, לא הצלחנו למחוק את המשתמש"
        );
      }
    },
    async toggleBlockUser(user) {
      if (!user || !user._id) {
        this.toast?.showError("אויי חבל, משתמש לא תקין");
        return;
      }

      const newBlockStatus = !(user.IsBlocked === true);

      try {
        const userId = user._id || user.id;
        await axios.post(`${URL}/admin/users/${userId}/block`, {
          isBlocked: newBlockStatus,
        });

        this.toast?.showSuccess(
          newBlockStatus ? "משתמש נחסם בהצלחה" : "חסימת משתמש בוטלה בהצלחה"
        );
        await this.loadUsers();
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || "שגיאה בעדכון סטטוס החסימה"
        );
      }
    },
    handleImageError(event) {
      event.target.style.display = "none";
    },
    sendMessage(user) {
      this.messageUser = user;
      this.messageText = "";
      this.showSendMessageModal = true;
    },
    closeSendMessageModal() {
      this.showSendMessageModal = false;
      this.messageUser = null;
      this.messageText = "";
      this.isSubmittingMessage = false;
    },
    async submitMessage() {
      if (!this.toast) {
        return;
      }

      if (!this.messageText || !this.messageText.trim()) {
        this.toast.showError("יש להזין תוכן הודעה");
        return;
      }

      if (!this.messageUser || !this.messageUser._id) {
        this.toast.showError("אויי חבל, המשתמש לא תקין");
        return;
      }

      // Prevent double submission
      if (this.isSubmittingMessage) {
        return;
      }

      this.isSubmittingMessage = true;

      try {
        const payload = {
          userId: this.messageUser._id,
          message: this.messageText.trim(),
        };

        const response = await axios.post(`${URL}/admin/send-message`, payload);

        if (response && response.data && response.data.success) {
          this.toast.showSuccess("הודעה נשלחה בהצלחה");
          this.closeSendMessageModal();
        } else {
          this.toast.showError(
            response?.data?.message || "אויי חבל, לא הצלחנו לשלוח את ההודעה"
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "אויי חבל, לא הצלחנו לשלוח את ההודעה";
        this.toast.showError(errorMessage);
      } finally {
        this.isSubmittingMessage = false;
      }
    },
    editUser(user) {
      this.editingUser = user;
      this.userForm = {
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        address: user.address || "",
      };
      this.showEditUserModal = true;
    },
    closeEditUserModal() {
      this.showEditUserModal = false;
      this.editingUser = null;
      this.userForm = {
        username: "",
        email: "",
        phone: "",
        city: "",
        address: "",
      };
    },
    async saveUser() {
      if (!this.editingUser || !this.editingUser._id) {
        this.toast?.showError("אויי חבל, משתמש לא תקין");
        return;
      }

      try {
        const userId = this.editingUser._id;
        await axios.put(`${URL}/admin/users/${userId}`, this.userForm);

        this.toast?.showSuccess("משתמש עודכן בהצלחה");
        await this.loadUsers();
        this.closeEditUserModal();
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || "אויי חבל, לא הצלחנו לעדכן את המשתמש"
        );
      }
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
    openCategoryModal(category = null) {
      this.editingCategory = category;
      if (category) {
        this.categoryForm.name = category.name;
      } else {
        this.categoryForm.name = "";
      }
      this.showCategoryModal = true;
    },
    closeCategoryModal() {
      this.showCategoryModal = false;
      this.editingCategory = null;
      this.categoryForm.name = "";
    },
    async saveCategory() {
      try {
        if (!this.categoryForm.name.trim()) {
          this.toast.showError("יש להזין שם קטגוריה");
          return;
        }

        if (this.editingCategory) {
          // Update category
          await axios.put(
            `${URL}/categories/${encodeURIComponent(
              this.editingCategory.name
            )}`,
            {
              name: this.categoryForm.name,
            }
          );
          this.toast.showSuccess("קטגוריה עודכנה בהצלחה");
        } else {
          // Add category
          await axios.post(`${URL}/categories`, {
            name: this.categoryForm.name,
            subcategories: [],
          });
          this.toast.showSuccess("קטגוריה נוספה בהצלחה");
        }

        await this.loadCategories();
        this.closeCategoryModal();
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message ||
            "אויי חבל, לא הצלחנו לשמור את הקטגוריה"
        );
      }
    },
    deleteCategory(category) {
      this.showDeleteConfirm(
        "מחיקת קטגוריה",
        `האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`,
        async () => {
          try {
            await axios.delete(
              `${URL}/categories/${encodeURIComponent(category.name)}`
            );
            this.toast.showSuccess("קטגוריה נמחקה בהצלחה");
            await this.loadCategories();
          } catch (error) {
            this.toast.showError(
              error.response?.data?.message ||
                "אויי חבל, לא הצלחנו למחוק את הקטגוריה"
            );
          }
        }
      );
    },
    openAddSubcategoryModal(category) {
      this.editingSubcategoryCategory = category;
      this.editingSubcategory = null;
      this.subcategoryForm = {
        name: "",
        price: 0,
        workType: "קבלנות",
      };
      this.showSubcategoryModal = true;
    },
    openEditSubcategoryModal(category, subcategory) {
      this.editingSubcategoryCategory = category;
      this.editingSubcategory = subcategory;
      this.subcategoryForm = {
        name: subcategory.name,
        price: subcategory.price || 0,
        workType: subcategory.workType || "קבלנות",
      };
      this.showSubcategoryModal = true;
    },
    closeSubcategoryModal() {
      this.showSubcategoryModal = false;
      this.editingSubcategory = null;
      this.editingSubcategoryCategory = null;
      this.subcategoryForm = {
        name: "",
        price: 0,
        workType: "קבלנות",
      };
    },
    async saveSubcategory() {
      try {
        if (!this.subcategoryForm.name.trim()) {
          this.toast.showError("יש להזין שם תת-קטגוריה");
          return;
        }

        const categoryName = encodeURIComponent(
          this.editingSubcategoryCategory.name
        );

        if (this.editingSubcategory) {
          // Update subcategory
          await axios.put(
            `${URL}/categories/${categoryName}/subcategories/${encodeURIComponent(
              this.editingSubcategory.name
            )}`,
            this.subcategoryForm
          );
          this.toast.showSuccess("תת-קטגוריה עודכנה בהצלחה");
        } else {
          // Add subcategory
          await axios.post(
            `${URL}/categories/${categoryName}/subcategories`,
            this.subcategoryForm
          );
          this.toast.showSuccess("תת-קטגוריה נוספה בהצלחה");
        }

        await this.loadCategories();
        this.closeSubcategoryModal();
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message ||
            "אויי חבל, לא הצלחנו לשמור את התת-קטגוריה"
        );
      }
    },
    deleteSubcategory(category, subcategory) {
      this.showDeleteConfirm(
        "מחיקת תת-קטגוריה",
        `האם אתה בטוח שברצונך למחוק את התת-קטגוריה "${subcategory.name}"?`,
        async () => {
          await this.performDeleteSubcategory(category, subcategory);
        }
      );
    },
    confirmDeleteSubcategory() {
      this.showDeleteConfirm(
        "מחיקת תת-קטגוריה",
        `האם אתה בטוח שברצונך למחוק את התת-קטגוריה "${this.editingSubcategory.name}"?`,
        async () => {
          await this.performDeleteSubcategory(
            this.editingSubcategoryCategory,
            this.editingSubcategory
          );
          this.closeSubcategoryModal();
        }
      );
    },
    showDeleteConfirm(title, message, callback) {
      this.deleteConfirmTitle = title;
      this.deleteConfirmMessage = message;
      this.deleteConfirmCallback = callback;
      this.showDeleteConfirmModal = true;
    },
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false;
      this.deleteConfirmCallback = null;
      this.deleteConfirmTitle = "";
      this.deleteConfirmMessage = "";
    },
    async confirmDelete() {
      if (this.deleteConfirmCallback) {
        await this.deleteConfirmCallback();
      }
      this.closeDeleteConfirmModal();
    },
    async performDeleteSubcategory(category, subcategory) {
      try {
        await axios.delete(
          `${URL}/categories/${encodeURIComponent(
            category.name
          )}/subcategories/${encodeURIComponent(subcategory.name)}`
        );
        this.toast.showSuccess("תת-קטגוריה נמחקה בהצלחה");
        await this.loadCategories();
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message ||
            "אויי חבל, לא הצלחנו למחוק את התת-קטגוריה"
        );
      }
    },
    editCategory(category) {
      this.openCategoryModal(category);
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את הנתונים הפיננסיים");
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את נתוני הסטטוס");
      } finally {
        this.isLoadingStatus = false;
      }
    },
    async loadUsersChart() {
      try {
        const response = await axios.get(`${URL}/admin/status/users-chart`);
        if (response.data.success) {
          this.usersChartData = response.data.chartData || [];
          this.renderUsersChart();
        }
      } catch (error) {
        this.toast?.showError(
          "אויי חבל, לא הצלחנו לטעון את נתוני גרף המשתמשים"
        );
      }
    },
    async loadTransactionsChart() {
      try {
        const response = await axios.get(
          `${URL}/admin/status/transactions-chart`
        );
        if (response.data.success) {
          this.transactionsChartData = response.data.chartData || [];
          this.renderTransactionsChart();
        }
      } catch (error) {
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את נתוני גרף העסקאות");
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
          error.response?.data?.message || "אויי חבל, לא הצלחנו לעדכן את הסכום"
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את נתוני הגרף");
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את התשלומים");
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את הפניות");
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
          error.response?.data?.message || "אויי חבל, לא הצלחנו לשלוח את ההודעה"
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
          error.response?.data?.message || "אויי חבל, לא הצלחנו לשלוח את המייל"
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
        this.toast?.showError("אויי חבל, לא הצלחנו לעדכן את הסטטוס");
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
          error.response?.data?.message || "אויי חבל, לא הצלחנו למחוק את הפנייה"
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
          this.toast?.showError("אויי חבל, לא הצלחנו לטעון את פרטי המשתמש");
        }
      } catch (error) {
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את פרטי המשתמש");
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
          error.response?.data?.message || "אויי חבל, לא הצלחנו ליצור את הדוח"
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
        this.toast?.showError("אויי חבל, תשלום לא תקין");
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
          error.response?.data?.message || "אויי חבל, לא הצלחנו למחוק את התשלום"
        );
      }
    },
    async capturePayment(payment) {
      if (!payment || !payment.paymentIntentId) {
        this.toast?.showError("אויי חבל, פרטי תשלום לא תקינים");
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
        this.toast?.showError("אויי חבל, לא מצאנו מזהה עבודה");
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
            response.data.message || "אויי חבל, לא הצלחנו לשחרר את התשלום"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || "אויי חבל, לא הצלחנו לשחרר את התשלום"
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את אחוז העמלה");
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
            response.data.message || "אויי חבל, לא הצלחנו לעדכן את אחוז העמלה"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message ||
            "אויי חבל, לא הצלחנו לעדכן את אחוז העמלה"
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
        this.toast?.showError('אויי חבל, לא הצלחנו לטעון את אחוז המע"מ');
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
            response.data.message || 'אויי חבל, לא הצלחנו לעדכן את אחוז המע"מ'
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message ||
            'אויי חבל, לא הצלחנו לעדכן את אחוז המע"מ'
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את סכום המנוי החודשי");
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
            response.data.message ||
              "אויי חבל, לא הצלחנו לעדכן את סכום המנוי החודשי"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message ||
            "אויי חבל, לא הצלחנו לעדכן את סכום המנוי החודשי"
        );
      } finally {
        this.isUpdatingMonthlySubscription = false;
      }
    },
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
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את הביטולים");
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
        const jobId = this.fineJob._id || this.fineJob.id;
        const response = await axios.post(
          `${URL}/admin/cancellations/collect-fine`,
          {
            jobId,
            fineAmount: this.fineAmount,
          }
        );

        if (response.data.success) {
          this.toast?.showSuccess("הקנס נגבה בהצלחה");
          await this.loadCancellations(this.cancellationsPagination.page);
          this.closeFineModal();
        } else {
          this.toast?.showError(
            response.data.message || "אויי חבל, לא הצלחנו לגבות את הקנס"
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "אויי חבל, לא הצלחנו לגבות את הקנס";
        this.toast?.showError(errorMessage);
      } finally {
        this.isCollectingFine = false;
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

/* Users Section */
.users-section__header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.users-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.users-section__controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.users-section__filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

.users-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.users-table {
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

.user-type-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba($orange, 0.2);
  margin-bottom: 20px;
}

.user-type-tab {
  padding: 10px 20px;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba($orange, 0.3);
  flex-shrink: 0;
}

.specialties-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.specialty-badge {
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.3);
  font-size: 11px;
  font-weight: 800;
  color: $orange2;
  white-space: nowrap;
}

.specialty-more {
  font-size: 11px;
  font-weight: 800;
  color: $muted;
}

.no-data-small {
  font-size: 12px;
  color: $muted;
  font-style: italic;
}

.actions-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
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

.edit-user-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.send-message-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.delete-user-btn {
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

.block-user-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 193, 7, 0.3);
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 900;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 193, 7, 0.25);
    border-color: rgba(255, 193, 7, 0.5);
    transform: translateY(-1px);
  }

  &--blocked {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
    }
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
.categories-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.categories-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.add-category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
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

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba($orange, 0.2);
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0;
}

.category-tabs::-webkit-scrollbar {
  height: 4px;
}

.category-tabs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.category-tabs::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.3);
  border-radius: 2px;
}

.category-tab {
  padding: 12px 24px;
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

.category-content {
  min-height: 400px;
}

.category-panel {
  animation: fadeIn 0.3s ease;
}

.category-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.category-panel__title {
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
}

.category-panel__actions {
  display: flex;
  gap: 8px;
}

.category-panel__edit-btn,
.category-panel__delete-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  border: none;
}

.category-panel__edit-btn {
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.category-panel__delete-btn {
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-1px);
  }
}

.category-panel__content {
  padding: 20px 0;
}

.subcategories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subcategories-title {
  font-size: 16px;
  font-weight: 900;
  color: $text;
}

.add-subcategory-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
  }
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.subcategory-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: rgba($orange, 0);
    transition: all 0.3s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.4);
    transform: translateX(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &::before {
      background: rgba($orange, 0.8);
    }

    .subcategory-item__actions {
      opacity: 1;
    }
  }
}

.subcategory-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subcategory-item__name {
  font-size: 15px;
  font-weight: 900;
  color: $text;
  margin-bottom: 0;
  line-height: 1.4;
}

.subcategory-item__details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.subcategory-item__price {
  font-size: 14px;
  font-weight: 1000;
  color: $orange2;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.2);
}

.subcategory-item__work-type {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.subcategory-item__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.subcategory-item__edit-btn,
.subcategory-item__delete-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
  position: relative;

  &:active {
    transform: scale(0.95);
  }
}

.subcategory-item__edit-btn {
  background: rgba($orange, 0.15);
  color: $orange2;
  border: 1px solid rgba($orange, 0.3);

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba($orange, 0.3);
  }
}

.subcategory-item__delete-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: $muted;
  font-size: 16px;
  font-weight: 800;
}

/* Status Section */
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

  .categories-section__header {
    flex-direction: column;
    align-items: stretch;
  }

  .add-category-btn {
    width: 100%;
    justify-content: center;
  }

  .category-tabs {
    gap: 4px;
  }

  .category-tab {
    padding: 10px 16px;
    font-size: 12px;
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

.status-badge--yes {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

.status-badge--no {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
  border-color: rgba(107, 114, 128, 0.3);
}

.status-badge--collected {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

.status-badge--not-collected {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
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
</style>
