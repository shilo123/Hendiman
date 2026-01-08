<template>
  <div class="users-section">
    <!-- HERO HEADER -->
    <div class="users-hero">
      <div class="users-hero__top">
        <div class="users-hero__titlewrap">
          <h2 class="users-section__title">משתמשים</h2>
          <div class="users-hero__subtitle">
            ניהול, חיפוש, סינון ופעולות מהירות — הכל במקום אחד
          </div>
        </div>

        <div class="users-hero__meta">
          <div class="meta-chip meta-chip--handy">
            👷 הנדימנים: <b>{{ handymenCount }}</b>
          </div>
          <div class="meta-chip meta-chip--client">
            👥 לקוחות: <b>{{ clientsCount }}</b>
          </div>
          <div class="meta-chip meta-chip--total">
            🧾 סה"כ: <b>{{ usersPagination.total || 0 }}</b>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="users-hero__controls">
        <div class="controls-left">
          <div class="search-wrap">
            <span class="search-icon">🔎</span>
            <input
              v-model="userFilters.search"
              type="text"
              class="filter-input"
              placeholder="חפש לפי שם או אימייל..."
              @input="filterUsers"
            />
            <button
              v-if="userFilters.search"
              class="clear-search-btn"
              type="button"
              title="נקה חיפוש"
              @click="
                userFilters.search = '';
                filterUsers();
              "
            >
              ✕
            </button>
          </div>

          <div class="select-wrap">
            <span class="select-icon">⇅</span>
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

        <!-- Tabs -->
        <div class="user-type-tabs" role="tablist" aria-label="סוג משתמש">
          <button
            class="user-type-tab"
            role="tab"
            :aria-selected="userFilters.userType === 'handyman'"
            :class="{
              'user-type-tab--active': userFilters.userType === 'handyman',
            }"
            @click="switchUserType('handyman')"
          >
            <span class="tab-icon">👷</span>
            הנדימנים
            <span class="tab-count">{{ handymenCount }}</span>
          </button>

          <button
            class="user-type-tab"
            role="tab"
            :aria-selected="userFilters.userType === 'client'"
            :class="{
              'user-type-tab--active': userFilters.userType === 'client',
            }"
            @click="switchUserType('client')"
          >
            <span class="tab-icon">👥</span>
            לקוחות
            <span class="tab-count">{{ clientsCount }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="isLoadingUsers" class="loading-state">
      <div class="skeleton-title"></div>
      <div class="skeleton-row" v-for="i in 6" :key="i"></div>
      <div class="loading-text">טוען משתמשים...</div>
    </div>

    <!-- TABLE -->
    <div v-else class="users-surface">
      <div class="users-surface__top">
        <div class="results-hint">
          מציג <b>{{ filteredUsers.length }}</b> תוצאות בעמוד הזה
          <span class="muted">·</span>
          עמוד <b>{{ usersPagination.page }}</b> מתוך
          <b>{{ usersPagination.totalPages }}</b>
        </div>

        <div class="surface-actions">
          <div class="pill">
            {{
              userFilters.userType === "handyman"
                ? "מצב הנדימנים"
                : "מצב לקוחות"
            }}
          </div>
        </div>
      </div>

      <div class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>משתמש</th>
              <th>אימייל</th>
              <th>טלפון</th>
              <th>כתובת/עיר</th>

              <th v-if="userFilters.userType === 'handyman'">תחומי התמחות</th>
              <th v-if="userFilters.userType === 'handyman'">דירוג</th>
              <th v-if="userFilters.userType === 'handyman'">עבודות</th>

              <th v-if="userFilters.userType === 'client'">הזמנות</th>

              <th>נוצר</th>
              <th>פעילות אחרונה</th>
              <th>סטטוס</th>
              <th class="th-actions">פעולות</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="user in filteredUsers"
              :key="user._id || user.id"
              class="users-table__row"
            >
              <!-- USER -->
              <td>
                <div class="user-cell">
                  <div class="avatar-wrap">
                    <img
                      v-if="user.imageUrl"
                      :src="user.imageUrl"
                      :alt="user.username"
                      class="user-avatar"
                      @error="handleImageError"
                    />
                    <div v-else class="avatar-fallback">
                      {{ (user.username || "?").slice(0, 1).toUpperCase() }}
                    </div>
                  </div>

                  <div class="user-main">
                    <div class="user-name">
                      {{ user.username || "ללא שם" }}
                    </div>
                    <div class="user-sub muted">
                      {{ user.firstName || "" }}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <span class="mono">{{ user.email || "-" }}</span>
              </td>

              <td>
                <span class="mono">{{ user.phone || "-" }}</span>
              </td>

              <td>
                <span>{{ user.city || user.address || "-" }}</span>
              </td>

              <!-- SPECIALTIES -->
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
                    :title="spec.name"
                  >
                    {{ spec.name }}
                  </span>
                  <span
                    v-if="getCategorySpecialties(user.specialties).length > 3"
                    class="specialty-more"
                    :title="
                      getCategorySpecialties(user.specialties)
                        .map((s) => s.name)
                        .join(', ')
                    "
                  >
                    +{{ getCategorySpecialties(user.specialties).length - 3 }}
                  </span>
                </div>
                <span v-else class="no-data-small">אין</span>
              </td>

              <!-- RATING -->
              <td v-if="userFilters.userType === 'handyman'">
                <span v-if="user.rating && user.rating > 0" class="rating-pill">
                  <span class="rating-star">⭐</span>
                  {{ user.rating.toFixed(1) }}
                </span>
                <span v-else class="no-rating">אין דירוג</span>
              </td>

              <!-- JOBS -->
              <td v-if="userFilters.userType === 'handyman'">
                <span class="count-pill">{{ user.jobDone || 0 }}</span>
              </td>

              <!-- ORDERS -->
              <td v-if="userFilters.userType === 'client'">
                <span class="count-pill count-pill--violet">{{
                  user.Ordered || 0
                }}</span>
              </td>

              <!-- CREATED -->
              <td>
                <div class="date-cell">
                  <div class="date-value">
                    {{ user.createdAt ? formatDate(user.createdAt) : "-" }}
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

              <!-- LAST ACTIVITY -->
              <td>
                <div class="date-cell">
                  <div
                    v-if="user['last-activity']"
                    class="date-tooltip"
                    :title="formatDate(user['last-activity'])"
                  >
                    {{ getTimeAgo(user["last-activity"]) }}
                  </div>
                  <span v-else class="no-data-small">לא זמין</span>
                </div>
              </td>

              <!-- STATUS -->
              <td>
                <button
                  class="block-user-btn"
                  :class="{
                    'block-user-btn--blocked': user.IsBlocked === true,
                  }"
                  type="button"
                  @click="toggleBlockUser(user)"
                  :title="user.IsBlocked === true ? 'ביטול חסימה' : 'חסום'"
                >
                  <font-awesome-icon
                    :icon="
                      user.IsBlocked === true
                        ? ['fas', 'ban']
                        : ['fas', 'check']
                    "
                  />
                  <span class="status-text">
                    {{ user.IsBlocked === true ? "חסום" : "פעיל" }}
                  </span>
                </button>
              </td>

              <!-- ACTIONS -->
              <td class="td-actions">
                <div class="actions-buttons">
                  <button
                    class="icon-btn icon-btn--edit"
                    type="button"
                    @click="editUser(user)"
                    title="ערוך משתמש"
                  >
                    <font-awesome-icon :icon="['fas', 'edit']" />
                  </button>

                  <button
                    class="icon-btn icon-btn--message"
                    type="button"
                    @click="sendMessage(user)"
                    title="שלח הודעה"
                  >
                    <font-awesome-icon :icon="['fas', 'comment']" />
                  </button>

                  <button
                    class="icon-btn icon-btn--delete"
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
                :colspan="userFilters.userType === 'handyman' ? 12 : 10"
                class="no-data"
              >
                אין משתמשים להצגה
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="usersPagination.totalPages > 0" class="pagination">
        <button
          class="pagination-btn"
          :disabled="usersPagination.page === 1"
          @click="loadUsers(usersPagination.page - 1)"
        >
          הקודם
        </button>

        <span class="pagination-info">
          עמוד <b>{{ usersPagination.page }}</b> מתוך
          <b>{{ usersPagination.totalPages }}</b>
          <span class="muted">·</span>
          סה"כ <b>{{ usersPagination.total }}</b> משתמשים
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

    <!-- Edit User Modal -->
    <div
      v-if="showEditUserModal"
      class="modal-overlay"
      @click="closeEditUserModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">ערוך משתמש</h3>
          <button class="modal-close" @click="closeEditUserModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
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
                type="tel"
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

            <div class="form-field form-field--wide">
              <label class="form-label">כתובת</label>
              <input
                v-model="userForm.address"
                type="text"
                class="form-input"
                placeholder="כתובת"
              />
            </div>
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
          <h3 class="modal-title">
            שלח הודעה ל-{{ messageUser?.username || "משתמש" }}
          </h3>
          <button class="modal-close" @click="closeSendMessageModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">תוכן ההודעה</label>
            <textarea
              v-model="messageText"
              class="form-input form-input--textarea"
              placeholder="הזן את תוכן ההודעה..."
              rows="5"
            ></textarea>
            <div class="hint">טיפ: הודעה קצרה וברורה מביאה מענה יותר מהר.</div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn--ghost" @click="closeSendMessageModal">
            ביטול
          </button>
          <button
            class="btn btn--primary"
            @click="submitMessage"
            :disabled="isSubmittingMessage"
          >
            {{ isSubmittingMessage ? "שולח..." : "שלח" }}
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
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";

export default {
  name: "UsersTab",
  data() {
    return {
      users: [],
      filteredUsers: [],
      isLoadingUsers: false,
      usersPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      userFilters: {
        search: "",
        userType: "handyman", // Default to handymen
        sortBy: "",
      },
      userCounts: {
        handymen: 0,
        clients: 0,
      },
      toast: null,
      // Edit User Modal
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
      // Delete User Modal
      showDeleteUserModal: false,
      userToDelete: null,
    };
  },
  computed: {
    handymenCount() {
      return this.userCounts.handymen;
    },
    clientsCount() {
      return this.userCounts.clients;
    },
  },
  mounted() {
    this.toast = useToast();
    this.loadUsers(1);
  },
  methods: {
    switchUserType(userType) {
      // Clear users before switching tabs to prevent showing wrong data
      this.users = [];
      this.filteredUsers = [];
      this.userFilters.userType = userType;
      this.usersPagination.page = 1;
      this.loadUsers(1);
    },
    async loadUsers(page = 1) {
      this.isLoadingUsers = true;
      try {
        const userType = this.userFilters.userType || "handyman";
        const response = await axios.get(`${URL}/admin/users`, {
          params: {
            page,
            limit: this.usersPagination.limit,
            userType: userType,
          },
        });
        if (response.data.success) {
          this.users = response.data.users || [];
          this.usersPagination.page = response.data.pagination?.page || page;
          this.usersPagination.total = response.data.pagination?.total || 0;
          this.usersPagination.totalPages =
            response.data.pagination?.totalPages || 0;
          // Update user counts from server response
          if (response.data.counts) {
            this.userCounts.handymen = response.data.counts.handymen || 0;
            this.userCounts.clients = response.data.counts.clients || 0;
          }
          this.filterUsers();
        }
      } catch (error) {
        this.toast?.showError("לא הצלחנו לטעון את המשתמשים");
      } finally {
        this.isLoadingUsers = false;
      }
    },
    filterUsers() {
      // Start with users from server (already filtered by userType)
      let filtered = [...this.users];

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
          error.response?.data?.message || "לא הצלחנו למחוק את המשתמש"
        );
      }
    },
    async toggleBlockUser(user) {
      if (!user || !user._id) {
        this.toast?.showError("משתמש לא תקין");
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
        this.toast.showError("המשתמש לא תקין");
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
            response?.data?.message || " לא הצלחנו לשלוח את ההודעה"
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "לא הצלחנו לשלוח את ההודעה";
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
        this.toast?.showError("משתמש לא תקין");
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
          error.response?.data?.message || " לא הצלחנו לעדכן את המשתמש"
        );
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
  },
};
</script>

<style scoped lang="scss">
/* ===== Tokens ===== */
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;

$orange: #ff6a00;
$orange2: #ff8a2b;

$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$muted2: rgba(255, 255, 255, 0.48);

$bg: #0b0b0f;
$panel: #0f1016;

$success: #10b981;
$danger: #ef4444;
$info: #3b82f6;
$violet: #8b5cf6;

/* ===== Base ===== */
.users-section {
  color: $text;
  animation: fadeIn 0.35s ease;
}

.muted {
  color: $muted;
}

.mono {
  font-family: "Courier New", monospace;
}

/* ===== HERO ===== */
.users-hero {
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.22);
  background: radial-gradient(
      1100px 420px at 0% 0%,
      rgba($orange, 0.18),
      transparent 60%
    ),
    radial-gradient(
      900px 360px at 100% 0%,
      rgba($success, 0.14),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.03);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.38);
  overflow: hidden;
  position: relative;
  padding: 18px;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.07),
      transparent 45%,
      rgba(255, 255, 255, 0.02)
    );
    pointer-events: none;
  }
}

.users-hero__top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.users-section__title {
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  letter-spacing: 0.2px;
  text-shadow: 0 12px 32px rgba($orange, 0.25);
}

.users-hero__subtitle {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 900;
  color: $muted2;
}

.users-hero__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(11, 11, 15, 0.35);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.86);

  b {
    color: $text;
  }

  &--handy {
    border-color: rgba($info, 0.25);
  }
  &--client {
    border-color: rgba($violet, 0.25);
  }
  &--total {
    border-color: rgba($orange, 0.25);
  }
}

.users-hero__controls {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

/* ===== Controls ===== */
.controls-left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-wrap,
.select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon,
.select-icon {
  position: absolute;
  right: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  pointer-events: none;
}

.filter-input,
.filter-select {
  padding: 10px 12px;
  padding-right: 36px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  font-family: $font-family;
  min-width: 260px;
  transition: border-color 0.18s ease, background 0.18s ease,
    box-shadow 0.18s ease;

  &::placeholder {
    color: $muted;
    font-weight: 800;
  }

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.58);
    background: rgba(255, 255, 255, 0.09);
    box-shadow: 0 0 0 4px rgba($orange, 0.12);
  }
}

.clear-search-btn {
  position: absolute;
  left: 10px;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }
}

.filter-select {
  cursor: pointer;
  appearance: none;
  padding-left: 42px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 14px center;
  background-size: 12px;

  option {
    background: $bg;
    color: $text;
    padding: 8px;
  }
}

/* ===== Tabs ===== */
.user-type-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.user-type-tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(11, 11, 15, 0.35);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease,
    background 0.18s ease, box-shadow 0.18s ease;
  font-family: $font-family;

  .tab-icon {
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.3));
  }

  .tab-count {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 1000;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.86);
  }

  &:hover {
    transform: translateY(-2px);
    background: rgba(11, 11, 15, 0.42);
    border-color: rgba(255, 255, 255, 0.16);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  }

  &--active {
    color: $orange2;
    border-color: rgba($orange, 0.42);
    background: rgba($orange, 0.1);
    box-shadow: 0 0 0 1px rgba($orange, 0.08) inset;

    .tab-count {
      border-color: rgba($orange, 0.38);
      background: rgba($orange, 0.14);
      color: $orange2;
    }
  }
}

/* ===== Loading Skeleton ===== */
.loading-state {
  margin-top: 14px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.09),
    rgba(255, 255, 255, 0.05)
  );
  background-size: 200% 100%;
  animation: shimmer 1.15s ease-in-out infinite;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
}

.skeleton-title {
  height: 18px;
  width: 220px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}
.skeleton-row {
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 10px;
}
.loading-text {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 1000;
}

/* ===== Surface (table container) ===== */
.users-surface {
  margin-top: 14px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.32);
  overflow: hidden;
}

.users-surface__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(11, 11, 15, 0.25);
}

.results-hint {
  font-size: 13px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.84);

  .muted {
    margin: 0 8px;
    color: rgba(255, 255, 255, 0.45);
  }
}

.surface-actions .pill {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  border: 1px solid rgba($orange, 0.22);
  background: rgba($orange, 0.1);
  color: $orange2;
}

/* ===== Table ===== */
.users-table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: rgba(11, 11, 15, 0.92);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba($orange, 0.18);
    color: $orange2;
    font-size: 12px;
    font-weight: 1000;
    letter-spacing: 0.2px;
    padding: 14px 12px;
    text-align: right;
    white-space: nowrap;
  }

  tbody td {
    padding: 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 850;
    color: $text;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    vertical-align: middle;
    background: rgba(255, 255, 255, 0.01);
  }

  .th-actions,
  .td-actions {
    text-align: left;
  }

  tbody .users-table__row {
    transition: transform 0.18s ease, background 0.18s ease,
      box-shadow 0.18s ease;

    &:hover {
      background: rgba($orange, 0.05);
      box-shadow: 0 0 0 1px rgba($orange, 0.12) inset;
    }

    &:hover td {
      background: rgba(255, 255, 255, 0.015);
    }
  }
}

/* ===== User cell ===== */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.avatar-wrap {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.86);
  background: radial-gradient(
      120px 60px at 30% 0%,
      rgba($orange, 0.22),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.06);
}

.user-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.user-name {
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.user-sub {
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.55);
}

/* ===== Badges ===== */
.specialties-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.specialty-badge {
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba($orange, 0.12);
  border: 1px solid rgba($orange, 0.22);
  font-size: 11px;
  font-weight: 1000;
  color: $orange2;
  white-space: nowrap;
}
.specialty-more {
  font-size: 11px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.68);
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}

.rating-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba($success, 0.28);
  background: rgba($success, 0.14);
  color: rgba($success, 0.98);
  font-weight: 1000;
}
.rating-star {
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25));
}

.count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba($info, 0.24);
  background: rgba($info, 0.12);
  color: rgba(59, 130, 246, 0.95);
  font-weight: 1000;

  &--violet {
    border-color: rgba($violet, 0.24);
    background: rgba($violet, 0.12);
    color: rgba(167, 139, 250, 0.95);
  }
}

.no-data-small,
.no-rating {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-style: italic;
}

/* ===== Dates ===== */
.date-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.date-value {
  font-size: 13px;
  font-weight: 900;
  color: $text;
}
.date-tooltip {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 800;
}

/* ===== Status button ===== */
.block-user-btn {
  padding: 7px 12px;
  border-radius: 12px;
  border: 1px solid rgba($success, 0.28);
  background: rgba($success, 0.14);
  color: rgba($success, 0.98);
  font-size: 12px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease, box-shadow 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.22);

  &:hover {
    background: rgba($success, 0.22);
    border-color: rgba($success, 0.45);
    transform: translateY(-1px);
  }

  &--blocked {
    border-color: rgba($danger, 0.28);
    background: rgba($danger, 0.14);
    color: rgba($danger, 0.98);

    &:hover {
      background: rgba($danger, 0.22);
      border-color: rgba($danger, 0.45);
    }
  }

  .status-text {
    font-family: $font-family;
  }
}

/* ===== Actions ===== */
.actions-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.22);

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
  }

  &--edit {
    border-color: rgba($orange, 0.22);
    background: rgba($orange, 0.1);
    color: $orange2;

    &:hover {
      border-color: rgba($orange, 0.4);
      background: rgba($orange, 0.16);
    }
  }

  &--message {
    border-color: rgba($info, 0.22);
    background: rgba($info, 0.1);
    color: rgba(59, 130, 246, 0.95);

    &:hover {
      border-color: rgba($info, 0.4);
      background: rgba($info, 0.16);
    }
  }

  &--delete {
    border-color: rgba($danger, 0.22);
    background: rgba($danger, 0.1);
    color: rgba($danger, 0.95);

    &:hover {
      border-color: rgba($danger, 0.4);
      background: rgba($danger, 0.16);
    }
  }
}

/* ===== Empty ===== */
.no-data {
  text-align: center;
  padding: 34px 16px;
  color: $muted;
  font-size: 14px;
  font-weight: 1000;
}

/* ===== Pagination ===== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  padding: 16px;
}

.pagination-btn {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba($orange, 0.1);
  color: $orange2;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  font-family: $font-family;

  &:hover:not(:disabled) {
    background: rgba($orange, 0.18);
    border-color: rgba($orange, 0.45);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
  font-weight: 900;
}

/* ===== Modals ===== */
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
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.18s ease;
}

.modal-content {
  background: $bg;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.28);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.6);
  animation: popIn 0.18s ease;

  &--confirm {
    max-width: 420px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
}

.modal-body {
  padding: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.form-field--wide {
  grid-column: 1 / -1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.form-field {
  margin-bottom: 0;
}
.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.86);
}
.form-input {
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  font-family: $font-family;
  transition: border-color 0.18s ease, background 0.18s ease,
    box-shadow 0.18s ease;

  &::placeholder {
    color: $muted;
  }

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.58);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 4px rgba($orange, 0.12);
  }

  &--textarea {
    resize: vertical;
    min-height: 110px;
  }
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.55);
}

/* Buttons */
.btn {
  padding: 11px 18px;
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
    transform: scale(0.99);
  }

  &--primary {
    background: rgba($orange, 0.18);
    color: $orange2;
    border: 1px solid rgba($orange, 0.28);

    &:hover {
      background: rgba($orange, 0.26);
      border-color: rgba($orange, 0.5);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }
  }

  &--ghost {
    background: transparent;
    color: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: none;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-1px);
    }
  }

  &--danger {
    background: rgba($danger, 0.16);
    color: rgba($danger, 0.98);
    border: 1px solid rgba($danger, 0.28);

    &:hover {
      background: rgba($danger, 0.24);
      border-color: rgba($danger, 0.5);
      transform: translateY(-1px);
    }
  }
}

.confirm-message {
  text-align: center;
  color: $text;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.7;

  strong {
    color: $orange2;
    font-weight: 1000;
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

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
