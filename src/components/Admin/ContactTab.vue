<template>
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

    <div v-if="isLoadingInquiries" class="loading-state">טוען פניות...</div>

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
                  <span v-if="token.type === 'text'">{{ token.content }}</span>
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
                  inquiry.mentionedUsers && inquiry.mentionedUsers.length > 0
                "
                class="inquiry-mentions"
              >
                <button
                  v-for="(user, idx) in inquiry.mentionedUsers"
                  :key="user._id"
                  type="button"
                  class="inquiry-mention-tag inquiry-mention-tag--clickable"
                  @click="openUserDetailsModal(user)"
                  :title="`לחץ לצפייה בפרטי ${user.username || user.email}`"
                >
                  {{ user.username || user.email }}
                  <span v-if="idx < inquiry.mentionedUsers.length - 1">, </span>
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

  <!-- Push Modal -->
  <div v-if="showPushModal" class="modal-overlay" @click.self="closePushModal">
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

  <!-- User Details Modal -->
  <div
    v-if="showUserDetailsModal"
    class="modal-overlay modal-content--large"
    @click.self="closeUserDetailsModal"
  >
    <div class="modal-content" dir="rtl">
      <div class="modal-header">
        <h3 class="modal-title">פרטי משתמש</h3>
        <button
          class="modal-close"
          type="button"
          @click="closeUserDetailsModal"
          aria-label="סגור"
        >
          ✕
        </button>
      </div>
      <div class="modal-body">
        <div v-if="isLoadingUserDetails" class="loading-state">
          טוען פרטים...
        </div>
        <div v-else-if="userDetails" class="user-details-content">
          <div class="user-details-section">
            <h4 class="user-details-section__title">מידע בסיסי</h4>
            <div class="user-details-grid">
              <div class="user-detail-item">
                <span class="user-detail-label">שם משתמש</span>
                <span class="user-detail-value">{{
                  userDetails.username || "-"
                }}</span>
              </div>
              <div class="user-detail-item">
                <span class="user-detail-label">אימייל</span>
                <span class="user-detail-value">{{
                  userDetails.email || "-"
                }}</span>
              </div>
              <div class="user-detail-item">
                <span class="user-detail-label">טלפון</span>
                <span class="user-detail-value">{{
                  userDetails.phone || "-"
                }}</span>
              </div>
              <div class="user-detail-item">
                <span class="user-detail-label">סטטוס</span>
                <span
                  class="user-detail-value"
                  :class="
                    userDetails.isBlocked
                      ? 'user-status--blocked'
                      : 'user-status--active'
                  "
                >
                  {{ userDetails.isBlocked ? "חסום" : "פעיל" }}
                </span>
              </div>
            </div>
          </div>
        </div>
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
  name: "ContactTab",
  data() {
    return {
      toast: null,
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
      showUserDetailsModal: false,
      selectedUser: null,
      userDetails: null,
      isLoadingUserDetails: false,
    };
  },
  created() {
    this.toast = useToast();
    this.loadInquiries();
  },
  computed: {
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
    getStatusLabel(status) {
      const statusMap = {
        pending: "ממתין",
        responded: "נענה",
        resolved: "טופל",
        deleted: "נמחק",
      };
      return statusMap[status] || status;
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
      if (
        confirm(
          "האם אתה בטוח שאתה רוצה למחוק את הפנייה הזו? פעולה זו לא ניתנת לביטול!"
        )
      ) {
        this.deleteInquiry(inquiry);
      }
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

.filter-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 800;
  font-family: $font-family;
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

.modal-content--large {
  max-width: 700px;
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

.form-input,
.form-textarea {
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
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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

  &--cancel {
    background: rgba(255, 255, 255, 0.06);
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover:not(:disabled) {
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
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

  .modal-content--large {
    max-width: 95%;
  }

  .user-details-grid {
    grid-template-columns: 1fr;
  }
}

/* Mobile Responsive - max-width 500px */
@media (max-width: 500px) {
  .inquiries-section__header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .inquiries-section__title {
    font-size: 18px;
  }

  .inquiries-section__controls {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .filter-select,
  .refresh-inquiries-btn {
    width: 100%;
    padding: 10px;
  }

  .inquiries-table-wrapper {
    border-radius: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .inquiries-table {
    min-width: 900px;
    font-size: 11px;
  }

  .inquiries-table th {
    padding: 10px 6px;
    font-size: 10px;
    white-space: nowrap;
  }

  .inquiries-table td {
    padding: 10px 6px;
    font-size: 11px;
  }

  .inquiry-date {
    font-size: 11px;
  }

  .inquiry-time {
    font-size: 9px;
  }

  .inquiry-title {
    font-size: 12px;
  }

  .inquiry-content {
    max-width: 200px;
    font-size: 11px;
  }

  .inquiry-content-mention {
    font-size: 10px;
    padding: 2px 4px;
  }

  .inquiry-user {
    font-size: 12px;
  }

  .inquiry-mention-tag {
    font-size: 10px;
    padding: 3px 6px;
  }

  .inquiry-status-badge {
    font-size: 10px;
    padding: 4px 8px;
  }

  .inquiry-actions {
    gap: 6px;
    flex-wrap: wrap;
  }

  .inquiry-action-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-width: 95vw;
    margin: 0;
  }

  .modal-content--large {
    max-width: 95vw;
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

  .modal-footer {
    padding: 14px;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
    padding: 10px;
  }

  .form-field {
    margin-bottom: 16px;
  }

  .form-label {
    font-size: 13px;
  }

  .form-input,
  .form-textarea {
    font-size: 14px;
    padding: 10px;
  }

  .user-details-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .user-details-section {
    padding-bottom: 16px;
  }

  .user-details-section__title {
    font-size: 16px;
  }
}
</style>
