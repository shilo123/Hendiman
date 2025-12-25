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
                  filterUsers();
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
                  filterUsers();
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
                    <th>דירוג</th>
                    <th>עבודות שבוצעו</th>
                    <th>נוצר ב</th>
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
                    <td>
                      <span v-if="user.rating && user.rating > 0">
                        {{ user.rating.toFixed(1) }} ⭐
                      </span>
                      <span v-else class="no-rating">אין דירוג</span>
                    </td>
                    <td>{{ user.jobDone || 0 }}</td>
                    <td>
                      {{ user.createdAt ? formatDate(user.createdAt) : "-" }}
                    </td>
                    <td>
                      <button
                        class="delete-user-btn"
                        type="button"
                        @click="confirmDeleteUser(user)"
                        title="מחק משתמש"
                      >
                        <font-awesome-icon :icon="['fas', 'trash']" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredUsers.length === 0">
                    <td
                      :colspan="userFilters.userType === 'handyman' ? 9 : 8"
                      class="no-data"
                    >
                      אין משתמשים להצגה
                    </td>
                  </tr>
                </tbody>
              </table>
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
          <div class="empty-state">
            <p>פניות - בעתיד</p>
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
                      ${{ formatCurrency(financials.expenses["AI expenses"]) }}
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
                      ${{ formatCurrency(financials.expenses["DB expenses"]) }}
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
                      ${{ formatCurrency(financials.expenses["API expenses"]) }}
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
                      ${{
                        formatCurrency(
                          financials.expenses["Marketing expenses"]
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
                  <div class="financial-item financial-item--total">
                    <div class="financial-item__label">סה"כ הוצאות</div>
                    <div
                      class="financial-item__value financial-item__value--total-expense"
                    >
                      ${{
                        formatCurrency(
                          financials.expenses["AI expenses"] +
                            financials.expenses["DB expenses"] +
                            financials.expenses["API expenses"] +
                            financials.expenses["Marketing expenses"]
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
                      ${{ formatCurrency(financials.Revenue.Fees) }}
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
                      ${{ formatCurrency(financials.Revenue.Drawings) }}
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
                    <div class="financial-item__label">שיחת חירום</div>
                    <div
                      class="financial-item__value financial-item__value--revenue"
                    >
                      ${{ formatCurrency(financials.Revenue["Urgent call"]) }}
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
                      ${{
                        formatCurrency(
                          financials.Revenue.Fees +
                            financials.Revenue.Drawings +
                            financials.Revenue["Urgent call"]
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
                    ${{ formatCurrency(Math.abs(netProfit)) }}
                    <span class="summary-card__indicator">{{
                      netProfit >= 0 ? "רווח" : "הפסד"
                    }}</span>
                  </div>
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
                ערך נוכחי: ${{ formatCurrency(editFinancialCurrentValue) }}
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">סכום לשינוי ($)</label>
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
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { loadCategories } from "@/utils/categoriesLoader";
import { useToast } from "@/composables/useToast";

export default {
  name: "AdminManager",
  data() {
    return {
      activeTab: "users",
      tabs: [
        { id: "users", label: "משתמשים" },
        { id: "categories", label: "ניהול קטגוריות" },
        { id: "contact", label: "פניות" },
        { id: "expenses", label: "פירוט הוצאות" },
      ],
      users: [],
      filteredUsers: [],
      isLoadingUsers: false,
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
        },
        Revenue: {
          Fees: 0,
          Drawings: 0,
          "Urgent call": 0,
        },
      },
      isLoadingFinancials: false,
      // Edit Financial Modal
      showEditFinancialModal: false,
      editFinancialField: "",
      editFinancialCurrentValue: 0,
      editFinancialAmount: 0,
      toast: null,
    };
  },
  created() {
    this.toast = useToast();
  },
  computed: {
    netProfit() {
      const totalRevenue =
        this.financials.Revenue.Fees +
        this.financials.Revenue.Drawings +
        this.financials.Revenue["Urgent call"];
      const totalExpenses =
        this.financials.expenses["AI expenses"] +
        this.financials.expenses["DB expenses"] +
        this.financials.expenses["API expenses"];
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
        "Revenue.Fees": "עמלות",
        "Revenue.Drawings": "רישומים",
        "Revenue.Urgent call": "שיחת חירום",
      };
      return fieldMap[this.editFinancialField] || this.editFinancialField;
    },
  },
  async mounted() {
    await this.loadUsers();
    this.loadCategories();
    if (this.activeTab === "expenses") {
      await this.loadFinancials();
    }
  },
  watch: {
    activeTab(newTab) {
      if (newTab === "expenses") {
        this.loadFinancials();
      }
    },
  },
  methods: {
    async loadUsers() {
      this.isLoadingUsers = true;
      try {
        const response = await axios.get(`${URL}/admin/users`);
        if (response.data.success) {
          this.users = response.data.users || [];
          this.filterUsers();
        }
      } catch (error) {
        console.error("Error loading users:", error);
        this.toast?.showError("שגיאה בטעינת המשתמשים");
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
        console.error("Error loading categories:", error);
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
        console.error("Error deleting user:", error);
        this.toast.showError(
          error.response?.data?.message || "שגיאה במחיקת המשתמש"
        );
      }
    },
    handleImageError(event) {
      event.target.style.display = "none";
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
        console.error("Error saving category:", error);
        this.toast.showError(
          error.response?.data?.message || "שגיאה בשמירת הקטגוריה"
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
            console.error("Error deleting category:", error);
            this.toast.showError(
              error.response?.data?.message || "שגיאה במחיקת הקטגוריה"
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
        console.error("Error saving subcategory:", error);
        this.toast.showError(
          error.response?.data?.message || "שגיאה בשמירת התת-קטגוריה"
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
        console.error("Error deleting subcategory:", error);
        this.toast.showError(
          error.response?.data?.message || "שגיאה במחיקת התת-קטגוריה"
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
            },
            Revenue: {
              Fees: 0,
              Drawings: 0,
              "Urgent call": 0,
            },
          };
        }
      } catch (error) {
        console.error("Error loading financials:", error);
        this.toast?.showError("שגיאה בטעינת נתונים פיננסיים");
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
        console.error("Error updating financial:", error);
        this.toast?.showError(
          error.response?.data?.message || "שגיאה בעדכון הסכום"
        );
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

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
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

    &:hover {
      background: rgba($orange, 0.25);
      border-color: rgba($orange, 0.5);
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
}
</style>
