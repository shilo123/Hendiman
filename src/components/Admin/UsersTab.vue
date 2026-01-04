<template>
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
        @click="switchUserType('handyman')"
      >
        הנדימנים ({{ handymenCount }})
      </button>
      <button
        class="user-type-tab"
        :class="{
          'user-type-tab--active': userFilters.userType === 'client',
        }"
        @click="switchUserType('client')"
      >
        לקוחות ({{ clientsCount }})
      </button>
    </div>

    <div v-if="isLoadingUsers" class="loading-state">טוען משתמשים...</div>

    <div v-else class="users-table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th>שם משתמש</th>
            <th>אימייל</th>
            <th>טלפון</th>
            <th>כתובת/עיר</th>
            <th v-if="userFilters.userType === 'handyman'">תחומי התמחות</th>
            <th v-if="userFilters.userType === 'handyman'">דירוג</th>
            <th v-if="userFilters.userType === 'handyman'">עבודות שבוצעו</th>
            <th v-if="userFilters.userType === 'client'">מספר הזמנות</th>
            <th>נוצר ב</th>
            <th>היה פעיל לאחרונה</th>
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
                  v-if="getCategorySpecialties(user.specialties).length > 3"
                  class="specialty-more"
                >
                  +{{ getCategorySpecialties(user.specialties).length - 3 }}
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
                    user.IsBlocked === true ? ['fas', 'ban'] : ['fas', 'check']
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
              :colspan="userFilters.userType === 'handyman' ? 11 : 9"
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
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$bg: #0b0b0f;

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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-value {
  font-size: 13px;
  font-weight: 800;
  color: $text;
}

.date-tooltip {
  font-size: 11px;
  color: $muted;
  font-weight: 700;
}

.no-rating {
  font-size: 12px;
  color: $muted;
  font-style: italic;
}

.block-user-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: rgba(16, 185, 129, 0.25);
    border-color: rgba(16, 185, 129, 0.5);
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

.edit-user-btn,
.send-message-btn,
.delete-user-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
}

.edit-user-btn {
  background: rgba($orange, 0.15);
  color: $orange2;
  border: 1px solid rgba($orange, 0.3);

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
  }
}

.send-message-btn {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);

  &:hover {
    background: rgba(59, 130, 246, 0.25);
    border-color: rgba(59, 130, 246, 0.5);
  }
}

.delete-user-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
  }
}

.no-data {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
  font-weight: 800;
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

  &--confirm {
    max-width: 400px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.modal-title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
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
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 800;
  color: $text;
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

  &::placeholder {
    color: $muted;
  }

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }

  &--textarea {
    resize: vertical;
    min-height: 100px;
  }
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &--primary {
    background: rgba($orange, 0.2);
    color: $orange2;
    border: 1px solid rgba($orange, 0.3);

    &:hover {
      background: rgba($orange, 0.3);
      border-color: rgba($orange, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--ghost {
    background: transparent;
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &--danger {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);

    &:hover {
      background: rgba(239, 68, 68, 0.3);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
}

.confirm-message {
  text-align: center;
  color: $text;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.6;

  strong {
    color: $orange2;
    font-weight: 1000;
  }
}
</style>
