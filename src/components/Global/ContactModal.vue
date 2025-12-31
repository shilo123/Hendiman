<template>
  <div
    v-if="visible"
    class="contact-modal"
    dir="rtl"
    @click.self="closeModal"
    role="dialog"
    aria-labelledby="contact-modal-title"
    aria-modal="true"
  >
    <div class="contact-modal__content">
      <button
        class="contact-modal__close"
        type="button"
        @click="closeModal"
        aria-label="סגור"
      >
        ✕
      </button>

      <h2 id="contact-modal-title" class="contact-modal__title">צרו קשר</h2>

      <form @submit.prevent="submitInquiry" class="contact-modal__form">
        <!-- Sender Name -->
        <div class="contact-modal__field">
          <label class="contact-modal__label" for="sender-name">
            שם השולח
          </label>
          <input
            id="sender-name"
            v-model="senderName"
            type="text"
            class="contact-modal__input"
            disabled
            placeholder="הזן את שמך"
            required
            maxlength="100"
          />
        </div>

        <!-- Title/Subject -->
        <div class="contact-modal__field">
          <label class="contact-modal__label" for="inquiry-title">
            נושא הפנייה
          </label>
          <select
            v-if="selectedTitle !== 'other'"
            id="inquiry-title"
            v-model="selectedTitle"
            class="contact-modal__select"
            required
          >
            <option value="">בחר נושא</option>
            <option value="general">שאלה כללית</option>
            <option value="technical">בעיה טכנית</option>
            <option value="payment">בעיה בתשלום</option>
            <option value="complaint-user">תלונה על משתמש</option>
            <option value="complaint-handyman">תלונה על הנדימן</option>
            <option value="suggestion">הצעה לשיפור</option>
            <option value="other">אחר</option>
          </select>
          <input
            v-else
            id="inquiry-title"
            v-model="customTitle"
            type="text"
            class="contact-modal__input"
            placeholder="הזן נושא מותאם אישית"
            required
            maxlength="100"
          />
        </div>

        <!-- Hint for user complaint -->
        <p
          v-if="selectedTitle === 'complaint-user'"
          class="contact-modal__hint"
        >
          אם תרצה להתלונן על משתמש מסויים הקלד @ ואת שמו
        </p>

        <!-- Content -->
        <div class="contact-modal__field">
          <label class="contact-modal__label" for="inquiry-content">
            תוכן ההודעה
          </label>
          <div class="contact-modal__textarea-wrapper">
            <textarea
              id="inquiry-content"
              v-model="content"
              class="contact-modal__textarea"
              placeholder="תאר את הפנייה שלך..."
              rows="6"
              required
              maxlength="2000"
              @input="handleTextareaInput"
              @keydown="handleKeydown"
            ></textarea>
            <!-- Mention dropdown -->
            <div
              v-if="showMentionDropdown && mentionUsers.length > 0"
              class="contact-modal__mention-dropdown"
            >
              <button
                v-for="user in mentionUsers"
                :key="user._id || user.id"
                type="button"
                class="contact-modal__mention-item"
                @click="insertMention(user)"
              >
                {{ user.username || user.name }}
              </button>
            </div>
          </div>
          <div class="contact-modal__char-count">{{ content.length }}/2000</div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="contact-modal__error" role="alert">
          {{ error }}
        </div>

        <!-- Actions -->
        <div class="contact-modal__actions">
          <button
            type="button"
            class="contact-modal__btn contact-modal__btn--cancel"
            @click="closeModal"
            :disabled="isSubmitting"
          >
            ביטול
          </button>
          <button
            type="submit"
            class="contact-modal__btn contact-modal__btn--submit"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="!isSubmitting">שלח</span>
            <span v-else>שולח...</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { useMainStore } from "@/store/index";

export default {
  name: "ContactModal",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["close", "submitted"],
  data() {
    return {
      selectedTitle: "",
      customTitle: "",
      content: "",
      senderName: "",
      error: null,
      isSubmitting: false,
      showMentionDropdown: false,
      mentionUsers: [],
      mentionStartIndex: -1,
      mentionQuery: "",
    };
  },
  computed: {
    title() {
      return this.selectedTitle === "other"
        ? this.customTitle
        : this.selectedTitle;
    },
    isFormValid() {
      const hasTitle =
        this.selectedTitle &&
        (this.selectedTitle !== "other" || this.customTitle.trim());
      const hasContent = this.content.trim().length > 0;
      const hasSenderName = this.senderName.trim().length > 0;
      return hasTitle && hasContent && hasSenderName;
    },
    isLoggedIn() {
      // Check if user is logged in (has user in store or route params)
      const store = useMainStore();
      return !!(store?.user || this.$route?.params?.id);
    },
    currentUserName() {
      // Try to get user from store
      const store = useMainStore();
      if (store?.user) {
        // Try username first, then name, then firstName + lastName, then firstName, then email
        return (
          store.user.username ||
          store.user.name ||
          (store.user.firstName && store.user.lastName
            ? `${store.user.firstName} ${store.user.lastName}`
            : store.user.firstName) ||
          store.user.email ||
          ""
        );
      }
      // If no store user, but we're in Dashboard (has route params.id), return empty
      // The name will be "משתמש שאינו רשום" in this case
      return "";
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
      } else {
        this.showMentionDropdown = false;
      }
    },
    selectedTitle() {
      this.showMentionDropdown = false;
    },
  },
  methods: {
    closeModal() {
      if (this.isSubmitting) return;
      this.$emit("close");
    },
    resetForm() {
      this.selectedTitle = "";
      this.customTitle = "";
      this.content = "";
      this.error = null;
      this.showMentionDropdown = false;
      this.mentionUsers = [];
      this.mentionStartIndex = -1;
      this.mentionQuery = "";
      // Set sender name based on logged in status
      if (this.isLoggedIn && this.currentUserName) {
        this.senderName = this.currentUserName;
      } else {
        this.senderName = "משתמש שאינו רשום";
      }
    },
    async handleTextareaInput(event) {
      const text = event.target.value;
      const cursorPos = event.target.selectionStart;

      // Check if we're typing after @
      const textBeforeCursor = text.substring(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(atIndex + 1);
        // Check if there's a space or newline after @ (meaning @ is complete)
        if (textAfterAt.includes(" ") || textAfterAt.includes("\n")) {
          this.showMentionDropdown = false;
          return;
        }

        // We're in a mention - show dropdown
        this.mentionStartIndex = atIndex;
        this.mentionQuery = textAfterAt.toLowerCase();
        await this.searchUsers(this.mentionQuery);
        this.showMentionDropdown = true;
      } else {
        this.showMentionDropdown = false;
      }
    },
    handleKeydown(event) {
      if (this.showMentionDropdown && this.mentionUsers.length > 0) {
        // Handle arrow keys for dropdown navigation
        // This is a simple implementation - can be enhanced
        if (event.key === "Escape") {
          this.showMentionDropdown = false;
        }
      }
    },
    async searchUsers(query) {
      if (!query || query.length < 1) {
        this.mentionUsers = [];
        return;
      }

      try {
        const response = await axios.get(`${URL}/api/users/search`, {
          params: { q: query, limit: 10 },
        });

        if (response.data && response.data.success) {
          this.mentionUsers = response.data.users || [];
        }
      } catch (error) {
        // Silently fail - don't show dropdown if search fails
        this.mentionUsers = [];
      }
    },
    insertMention(user) {
      const textarea = document.getElementById("inquiry-content");
      if (!textarea) return;

      const text = this.content;
      const beforeMention = text.substring(0, this.mentionStartIndex);
      const afterMention = text.substring(
        this.mentionStartIndex + 1 + this.mentionQuery.length
      );

      const mentionText = `@${user.username || user.name}`;
      this.content = beforeMention + mentionText + " " + afterMention;

      // Close dropdown
      this.showMentionDropdown = false;

      // Set cursor after mention
      this.$nextTick(() => {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      });
    },
    async submitInquiry() {
      if (!this.isFormValid || this.isSubmitting) return;

      this.isSubmitting = true;
      this.error = null;

      try {
        // Extract user IDs from mentions in content
        const mentionedUserIds = [];
        const mentionRegex = /@([^@\s]+)/g;
        let match;

        while ((match = mentionRegex.exec(this.content)) !== null) {
          const mentionText = match[1];
          // Find user by username
          const user = this.mentionUsers.find(
            (u) =>
              (u.username || u.name || "").toLowerCase() ===
              mentionText.toLowerCase()
          );
          if (user && user._id) {
            // Replace @username with @userId in content
            this.content = this.content.replace(match[0], `@${user._id}`);
            if (!mentionedUserIds.includes(user._id.toString())) {
              mentionedUserIds.push(user._id.toString());
            }
          }
        }

        // If no users found from dropdown, try to search for them
        if (mentionedUserIds.length === 0) {
          const allMentions = this.content.match(/@([^@\s]+)/g) || [];
          for (const mention of allMentions) {
            const username = mention.substring(1);
            try {
              const response = await axios.get(`${URL}/api/users/search`, {
                params: { q: username, limit: 1 },
              });
              if (
                response.data &&
                response.data.success &&
                response.data.users &&
                response.data.users.length > 0
              ) {
                const user = response.data.users[0];
                this.content = this.content.replace(mention, `@${user._id}`);
                if (!mentionedUserIds.includes(user._id.toString())) {
                  mentionedUserIds.push(user._id.toString());
                }
              }
            } catch (e) {
              // Continue if search fails
            }
          }
        }

        const store = useMainStore();
        const userId = store?.user?._id?.toString() || this.$route?.params?.id;
        const inquiryData = {
          title: this.title,
          content: this.content,
          senderName: this.senderName,
          userId: userId || null,
        };

        // Only add ArrIDS if there are mentioned users
        if (mentionedUserIds.length > 0) {
          inquiryData.ArrIDS = mentionedUserIds;
        }

        const response = await axios.post(
          `${URL}/api/inquiries/create`,
          inquiryData
        );

        if (response.data && response.data.success) {
          this.$emit("submitted");
          this.closeModal();
          const toast = useToast();
          toast.showSuccess("הפנייה נשלחה בהצלחה!");
        } else {
          this.error = response.data?.message || "שגיאה בשליחת הפנייה";
        }
      } catch (error) {
        this.error = error.response?.data?.message || "שגיאה בשליחת הפנייה";
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$orange2: #ff8a2b;
$bg: #0b0b0f;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

.contact-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(4px);

  @media (max-width: 768px) {
    padding: 16px;
    align-items: flex-end;
  }

  &__content {
    background: $bg;
    border-radius: 20px;
    padding: 24px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    border: 1px solid rgba($orange, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

    @media (max-width: 768px) {
      padding: 20px;
      border-radius: 16px 16px 0 0;
      max-height: 85vh;
    }
  }

  &__close {
    position: absolute;
    top: 16px;
    left: 16px;
    background: transparent;
    border: none;
    color: $muted;
    font-size: 24px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;

    @media (max-width: 768px) {
      top: 12px;
      left: 12px;
      font-size: 20px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: $text;
    }
  }

  &__title {
    font-size: 24px;
    font-weight: 1000;
    color: $text;
    margin: 0 0 24px 0;
    text-align: right;

    @media (max-width: 768px) {
      font-size: 20px;
      margin-bottom: 20px;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: 14px;
    font-weight: 900;
    color: $text;
    text-align: right;
  }

  &__select,
  &__input {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: $text;
    font-size: 14px;
    font-family: "Heebo", sans-serif;
    font-weight: 800;
    transition: all 0.2s ease;
    text-align: right;
    direction: rtl;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: rgba($orange, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }

    &::placeholder {
      color: $muted;
    }
  }

  &__select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff6a00' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: left 12px center;
    padding-right: 12px;
    padding-left: 36px;

    option {
      background: $bg;
      color: $text;
      padding: 12px;
      font-weight: 800;
      font-family: "Heebo", sans-serif;

      &:hover {
        background: rgba($orange, 0.15);
      }

      &:checked {
        background: rgba($orange, 0.25);
        color: $orange2;
      }
    }
  }

  &__hint {
    font-size: 12px;
    color: $muted;
    font-weight: 700;
    margin-top: -8px;
    text-align: right;
  }

  &__textarea-wrapper {
    position: relative;
  }

  &__textarea {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: $text;
    font-size: 14px;
    font-family: "Heebo", sans-serif;
    font-weight: 800;
    resize: vertical;
    min-height: 120px;
    text-align: right;
    direction: rtl;
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: rgba($orange, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }

    &::placeholder {
      color: $muted;
    }
  }

  &__mention-dropdown {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 4px;
    background: $bg;
    border: 1px solid rgba($orange, 0.3);
    border-radius: 12px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    min-width: 200px;
  }

  &__mention-item {
    width: 100%;
    padding: 10px 12px;
    text-align: right;
    background: transparent;
    border: none;
    color: $text;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba($orange, 0.15);
      color: $orange2;
    }
  }

  &__char-count {
    font-size: 11px;
    color: $muted;
    text-align: left;
    margin-top: -4px;
  }

  &__error {
    padding: 12px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    color: #ef4444;
    font-size: 13px;
    font-weight: 800;
    text-align: right;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  &__btn {
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 1000;
    font-family: "Heebo", sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;

    @media (max-width: 768px) {
      padding: 10px 20px;
      font-size: 13px;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--cancel {
      background: rgba(255, 255, 255, 0.1);
      color: $text;
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    &--submit {
      background: linear-gradient(135deg, $orange, $orange2);
      color: #111;
      box-shadow: 0 4px 12px rgba($orange, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba($orange, 0.4);
      }
    }
  }
}
</style>
