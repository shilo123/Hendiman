<template>
  <div class="support-admin">
    <!-- Header -->
    <div class="support-admin__header">
      <h2 class="support-admin__title">פניות תמיכה</h2>
      <div class="support-admin__controls">
        <select v-model="statusFilter" class="support-admin__filter">
          <option value="all">כל הפניות</option>
          <option value="open">ממתינות</option>
          <option value="assigned">בטיפול</option>
          <option value="resolved">נסגרו</option>
        </select>
        <select v-model="channelFilter" class="support-admin__filter">
          <option value="all">כל הערוצים</option>
          <option value="human">נציג אנושי</option>
          <option value="ai">AI</option>
        </select>
        <button class="support-admin__refresh-btn" @click="loadChats">
          <i class="ph-bold ph-arrows-clockwise"></i>
          רענן
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="support-admin__stats">
      <div class="support-admin__stat support-admin__stat--waiting">
        <span class="support-admin__stat-value">{{ openChats.length }}</span>
        <span class="support-admin__stat-label">ממתינות</span>
      </div>
      <div class="support-admin__stat support-admin__stat--active">
        <span class="support-admin__stat-value">{{ assignedChats.length }}</span>
        <span class="support-admin__stat-label">בטיפול</span>
      </div>
      <div class="support-admin__stat support-admin__stat--resolved">
        <span class="support-admin__stat-value">{{ resolvedChats.length }}</span>
        <span class="support-admin__stat-label">נסגרו</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="support-admin__loading">
      טוען פניות...
    </div>

    <!-- Chat Grid -->
    <div v-else class="support-admin__grid">
      <!-- Open Chats Section -->
      <div v-if="filteredOpenChats.length > 0" class="support-admin__section">
        <h3 class="support-admin__section-title">
          <span class="support-admin__section-dot support-admin__section-dot--waiting"></span>
          ממתינות לנציג ({{ filteredOpenChats.length }})
        </h3>
        <div class="support-admin__cards">
          <div 
            v-for="chat in filteredOpenChats" 
            :key="chat._id"
            class="support-admin__card support-admin__card--open"
            @click="openChatModal(chat)"
          >
            <div class="support-admin__card-header">
              <span class="support-admin__card-channel" :class="`support-admin__card-channel--${chat.channel}`">
                <i :class="chat.channel === 'ai' ? 'ph-fill ph-robot' : 'ph-fill ph-headset'"></i>
                {{ chat.channel === 'ai' ? 'AI' : 'נציג' }}
              </span>
              <span class="support-admin__card-time">{{ formatTimeAgo(chat.createdAt) }}</span>
            </div>
            <h4 class="support-admin__card-title">{{ chat.title }}</h4>
            <p class="support-admin__card-user">
              <i class="ph-fill ph-user"></i>
              {{ chat.userName || 'משתמש אנונימי' }}
              <span class="support-admin__user-type" :class="`support-admin__user-type--${chat.userType || 'client'}`">
                {{ chat.userType === 'handyman' ? 'הנדימן' : 'לקוח' }}
              </span>
            </p>
            <p class="support-admin__card-preview">{{ getLastMessage(chat) }}</p>
            <button class="support-admin__card-accept-btn" @click.stop="openAcceptModal(chat)">
              <i class="ph-bold ph-check"></i>
              קבל פנייה
            </button>
          </div>
        </div>
      </div>

      <!-- Assigned Chats Section -->
      <div v-if="filteredAssignedChats.length > 0" class="support-admin__section">
        <h3 class="support-admin__section-title">
          <span class="support-admin__section-dot support-admin__section-dot--active"></span>
          בטיפול ({{ filteredAssignedChats.length }})
        </h3>
        <div class="support-admin__cards">
          <div 
            v-for="chat in filteredAssignedChats" 
            :key="chat._id"
            class="support-admin__card support-admin__card--assigned"
            @click="openChatModal(chat)"
          >
            <div class="support-admin__card-header">
              <span class="support-admin__card-channel" :class="`support-admin__card-channel--${chat.channel}`">
                <i :class="chat.channel === 'ai' ? 'ph-fill ph-robot' : 'ph-fill ph-headset'"></i>
                {{ chat.channel === 'ai' ? 'AI' : 'נציג' }}
              </span>
              <span class="support-admin__card-agent">
                <i class="ph-fill ph-user-circle"></i>
                {{ chat.assignedTo?.name }}
              </span>
            </div>
            <h4 class="support-admin__card-title">{{ chat.title }}</h4>
            <p class="support-admin__card-user">
              <i class="ph-fill ph-user"></i>
              {{ chat.userName || 'משתמש אנונימי' }}
              <span class="support-admin__user-type" :class="`support-admin__user-type--${chat.userType || 'client'}`">
                {{ chat.userType === 'handyman' ? 'הנדימן' : 'לקוח' }}
              </span>
            </p>
            <p class="support-admin__card-preview">{{ getLastMessage(chat) }}</p>
          </div>
        </div>
      </div>

      <!-- Resolved Chats Section -->
      <div v-if="filteredResolvedChats.length > 0" class="support-admin__section">
        <h3 class="support-admin__section-title">
          <span class="support-admin__section-dot support-admin__section-dot--resolved"></span>
          נסגרו ({{ filteredResolvedChats.length }})
        </h3>
        <div class="support-admin__cards">
          <div 
            v-for="chat in filteredResolvedChats" 
            :key="chat._id"
            class="support-admin__card support-admin__card--resolved"
            @click="openChatModal(chat)"
          >
            <div class="support-admin__card-header">
              <span class="support-admin__card-channel" :class="`support-admin__card-channel--${chat.channel}`">
                <i :class="chat.channel === 'ai' ? 'ph-fill ph-robot' : 'ph-fill ph-headset'"></i>
                {{ chat.channel === 'ai' ? 'AI' : 'נציג' }}
              </span>
              <div class="support-admin__card-rating" v-if="chat.rating">
                <i class="ph-fill ph-star"></i>
                {{ chat.rating.score }}/5
              </div>
            </div>
            <h4 class="support-admin__card-title">{{ chat.title }}</h4>
            <p class="support-admin__card-user">
              <i class="ph-fill ph-user"></i>
              {{ chat.userName || 'משתמש אנונימי' }}
              <span class="support-admin__user-type" :class="`support-admin__user-type--${chat.userType || 'client'}`">
                {{ chat.userType === 'handyman' ? 'הנדימן' : 'לקוח' }}
              </span>
            </p>
            <p class="support-admin__card-agent-info">
              <i class="ph-fill ph-user-circle"></i>
              טופל ע"י: {{ chat.assignedTo?.name || 'AI' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredChats.length === 0" class="support-admin__empty">
        <i class="ph-fill ph-chat-circle-dots"></i>
        <p>אין פניות להצגה</p>
      </div>
    </div>

    <!-- Accept Modal -->
    <div v-if="showAcceptModal" class="support-admin__modal-overlay" @click.self="closeAcceptModal">
      <div class="support-admin__modal" dir="rtl">
        <div class="support-admin__modal-header">
          <h3>קבלת פנייה</h3>
          <button class="support-admin__modal-close" @click="closeAcceptModal">
            <i class="ph-bold ph-x"></i>
          </button>
        </div>
        <div class="support-admin__modal-body">
          <div class="support-admin__form-field">
            <label>שם הנציג</label>
            <input 
              v-model="agentName" 
              type="text" 
              placeholder="הזן את שמך..."
              class="support-admin__form-input"
            />
          </div>
        </div>
        <div class="support-admin__modal-footer">
          <button class="support-admin__btn support-admin__btn--cancel" @click="closeAcceptModal">
            ביטול
          </button>
          <button 
            class="support-admin__btn support-admin__btn--primary" 
            :disabled="!agentName.trim() || isAccepting"
            @click="acceptChat"
          >
            {{ isAccepting ? 'מקבל...' : 'קבל פנייה' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Chat View Modal -->
    <div v-if="showChatModal" class="support-admin__chat-overlay" @click.self="closeChatModal">
      <div class="support-admin__chat-modal" dir="rtl">
        <div class="support-admin__chat-header">
          <div class="support-admin__chat-header-info">
            <h3>{{ selectedChat?.title }}</h3>
            <span class="support-admin__chat-user">{{ selectedChat?.userName }}</span>
          </div>
          <div class="support-admin__chat-header-actions">
            <button 
              v-if="selectedChat?.status === 'assigned'"
              class="support-admin__btn support-admin__btn--resolve"
              @click="resolveChat"
              :disabled="isResolving"
            >
              <i class="ph-bold ph-check-circle"></i>
              {{ isResolving ? 'סוגר...' : 'סגור פנייה' }}
            </button>
            <button class="support-admin__chat-close" @click="closeChatModal">
              <i class="ph-bold ph-x"></i>
            </button>
          </div>
        </div>

        <div class="support-admin__chat-info">
          <span class="support-admin__chat-info-item">
            <i class="ph-fill ph-clock"></i>
            {{ formatDate(selectedChat?.createdAt) }}
          </span>
          <span class="support-admin__chat-info-item support-admin__chat-info-item--user-type" :class="`support-admin__chat-info-item--${selectedChat?.userType || 'client'}`">
            <i :class="selectedChat?.userType === 'handyman' ? 'ph-fill ph-wrench' : 'ph-fill ph-user'"></i>
            {{ selectedChat?.userType === 'handyman' ? 'הנדימן' : 'לקוח' }}
          </span>
          <span class="support-admin__chat-info-item" :class="`support-admin__chat-info-item--${selectedChat?.status}`">
            <i class="ph-fill ph-circle"></i>
            {{ getStatusLabel(selectedChat?.status) }}
          </span>
          <span v-if="selectedChat?.assignedTo" class="support-admin__chat-info-item">
            <i class="ph-fill ph-user-circle"></i>
            {{ selectedChat.assignedTo.name }}
          </span>
          <span v-if="selectedChat?.rating" class="support-admin__chat-info-item support-admin__chat-info-item--rating">
            <i class="ph-fill ph-star"></i>
            {{ selectedChat.rating.score }}/5
            <span v-if="selectedChat.rating.note" class="support-admin__rating-note">
              "{{ selectedChat.rating.note }}"
            </span>
          </span>
        </div>

        <div class="support-admin__chat-messages" ref="chatMessages">
          <div 
            v-for="(msg, idx) in selectedChat?.messages" 
            :key="idx"
            class="support-admin__chat-message"
            :class="getMessageClass(msg)"
          >
            <div class="support-admin__chat-message-avatar" v-if="msg.sender !== 'user'">
              <i v-if="msg.sender === 'ai'" class="ph-fill ph-robot"></i>
              <i v-else-if="msg.sender === 'admin'" class="ph-fill ph-headset"></i>
              <i v-else class="ph-fill ph-info"></i>
            </div>
            <div class="support-admin__chat-message-content">
              <span class="support-admin__chat-message-sender">{{ getSenderName(msg) }}</span>
              <p class="support-admin__chat-message-text">{{ msg.text }}</p>
              <span class="support-admin__chat-message-time">{{ formatTime(msg.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Admin Input -->
        <div v-if="selectedChat?.status === 'assigned'" class="support-admin__chat-input-area">
          <input
            v-model="adminMessage"
            type="text"
            placeholder="הקלד הודעה..."
            class="support-admin__chat-input"
            @keyup.enter="sendAdminMessage"
          />
          <button 
            class="support-admin__chat-send-btn"
            @click="sendAdminMessage"
            :disabled="!adminMessage.trim() || isSendingMessage"
          >
            <i class="ph-fill ph-paper-plane-tilt"></i>
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
import { io } from "socket.io-client";

export default {
  name: "ContactTab",
  data() {
    return {
      toast: null,
      socket: null,
      chats: [],
      isLoading: false,
      statusFilter: "all",
      channelFilter: "all",
      
      // Accept Modal
      showAcceptModal: false,
      selectedChatForAccept: null,
      agentName: "",
      isAccepting: false,
      
      // Chat Modal
      showChatModal: false,
      selectedChat: null,
      adminMessage: "",
      isSendingMessage: false,
      isResolving: false
    };
  },
  computed: {
    openChats() {
      return this.chats.filter(c => c.status === "open");
    },
    assignedChats() {
      return this.chats.filter(c => c.status === "assigned");
    },
    resolvedChats() {
      return this.chats.filter(c => c.status === "resolved");
    },
    filteredChats() {
      let filtered = [...this.chats];
      
      if (this.statusFilter !== "all") {
        filtered = filtered.filter(c => c.status === this.statusFilter);
      }
      
      if (this.channelFilter !== "all") {
        filtered = filtered.filter(c => c.channel === this.channelFilter);
      }
      
      return filtered;
    },
    filteredOpenChats() {
      return this.filteredChats.filter(c => c.status === "open");
    },
    filteredAssignedChats() {
      return this.filteredChats.filter(c => c.status === "assigned");
    },
    filteredResolvedChats() {
      return this.filteredChats.filter(c => c.status === "resolved");
    }
  },
  created() {
    this.toast = useToast();
    this.loadChats();
    this.initSocket();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    initSocket() {
      this.socket = io(URL, {
        transports: ["websocket", "polling"],
        reconnection: true
      });

      this.socket.on("connect", () => {
        this.socket.emit("join-admin-support");
      });

      // Listen for new support chats
      this.socket.on("new-support-chat", (chat) => {
        this.chats.unshift(chat);
        this.toast?.showInfo(`פנייה חדשה: ${chat.title}`);
      });

      // Listen for chat updates
      this.socket.on("support-chat-updated", (updatedChat) => {
        const idx = this.chats.findIndex(c => c._id === updatedChat._id);
        if (idx !== -1) {
          this.chats[idx] = updatedChat;
        }
        if (this.selectedChat?._id === updatedChat._id) {
          this.selectedChat = updatedChat;
        }
      });

      // Listen for new messages
      this.socket.on("support-message", (data) => {
        const chat = this.chats.find(c => c._id === data.chatId);
        if (chat) {
          chat.messages.push(data.message);
        }
        if (this.selectedChat?._id === data.chatId) {
          this.selectedChat.messages.push(data.message);
          this.$nextTick(() => this.scrollToBottom());
        }
      });
    },

    async loadChats() {
      this.isLoading = true;
      try {
        const { data } = await axios.get(`${URL}/api/support/admin/all`);
        if (data.success) {
          this.chats = data.chats || [];
        }
      } catch (error) {
        this.toast?.showError("שגיאה בטעינת הפניות");
      } finally {
        this.isLoading = false;
      }
    },

    openAcceptModal(chat) {
      this.selectedChatForAccept = chat;
      this.agentName = "";
      this.showAcceptModal = true;
    },

    closeAcceptModal() {
      this.showAcceptModal = false;
      this.selectedChatForAccept = null;
      this.agentName = "";
    },

    async acceptChat() {
      if (!this.agentName.trim() || this.isAccepting) return;

      this.isAccepting = true;
      try {
        const { data } = await axios.post(`${URL}/api/support/${this.selectedChatForAccept._id}/accept`, {
          adminName: this.agentName.trim()
        });

        if (data.success) {
          this.toast?.showSuccess("הפנייה התקבלה בהצלחה");
          this.closeAcceptModal();
          // Open the chat
          this.openChatModal(data.chat);
        } else {
          this.toast?.showError(data.message || "שגיאה בקבלת הפנייה");
        }
      } catch (error) {
        if (error.response?.status === 409) {
          this.toast?.showError("הפנייה כבר התקבלה ע\"י נציג אחר");
          this.loadChats();
        } else {
          this.toast?.showError("שגיאה בקבלת הפנייה");
        }
      } finally {
        this.isAccepting = false;
      }
    },

    openChatModal(chat) {
      this.selectedChat = chat;
      this.showChatModal = true;
      this.adminMessage = "";
      
      if (this.socket) {
        this.socket.emit("join-support-chat", chat._id);
      }
      
      this.$nextTick(() => this.scrollToBottom());
    },

    closeChatModal() {
      if (this.socket && this.selectedChat) {
        this.socket.emit("leave-support-chat", this.selectedChat._id);
      }
      this.showChatModal = false;
      this.selectedChat = null;
      this.adminMessage = "";
    },

    async sendAdminMessage() {
      if (!this.adminMessage.trim() || this.isSendingMessage) return;

      const text = this.adminMessage.trim();
      this.adminMessage = "";
      this.isSendingMessage = true;

      try {
        await axios.post(`${URL}/api/support/${this.selectedChat._id}/message`, {
          sender: "admin",
          text: text
        });
      } catch (error) {
        this.toast?.showError("שגיאה בשליחת ההודעה");
        this.adminMessage = text; // Restore message on error
      } finally {
        this.isSendingMessage = false;
      }
    },

    async resolveChat() {
      if (this.isResolving) return;

      this.isResolving = true;
      try {
        const { data } = await axios.post(`${URL}/api/support/${this.selectedChat._id}/resolve`);
        if (data.success) {
          this.toast?.showSuccess("הפנייה נסגרה בהצלחה");
          this.selectedChat.status = "resolved";
        }
      } catch (error) {
        this.toast?.showError("שגיאה בסגירת הפנייה");
      } finally {
        this.isResolving = false;
      }
    },

    getLastMessage(chat) {
      if (!chat.messages || chat.messages.length === 0) return "אין הודעות";
      const lastMsg = chat.messages[chat.messages.length - 1];
      const text = lastMsg.text || "";
      return text.length > 60 ? text.substring(0, 60) + "..." : text;
    },

    getMessageClass(msg) {
      return {
        "support-admin__chat-message--user": msg.sender === "user",
        "support-admin__chat-message--ai": msg.sender === "ai",
        "support-admin__chat-message--admin": msg.sender === "admin",
        "support-admin__chat-message--system": msg.sender === "system"
      };
    },

    getSenderName(msg) {
      const names = {
        user: "משתמש",
        ai: "AI",
        admin: "נציג",
        system: "מערכת"
      };
      return names[msg.sender] || msg.sender;
    },

    getStatusLabel(status) {
      const labels = {
        open: "ממתין",
        assigned: "בטיפול",
        resolved: "נסגר"
      };
      return labels[status] || status;
    },

    formatTimeAgo(date) {
      if (!date) return "";
      const now = new Date();
      const d = new Date(date);
      const diff = Math.floor((now - d) / 1000 / 60);
      
      if (diff < 1) return "עכשיו";
      if (diff < 60) return `לפני ${diff} דקות`;
      if (diff < 1440) return `לפני ${Math.floor(diff / 60)} שעות`;
      return `לפני ${Math.floor(diff / 1440)} ימים`;
    },

    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("he-IL", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    },

    formatTime(date) {
      if (!date) return "";
      return new Date(date).toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit"
      });
    },

    scrollToBottom() {
      const container = this.$refs.chatMessages;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
$bg: #0b0b0f;
$bg-light: #131318;
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$green: #10b981;
$blue: #3b82f6;
$yellow: #fbbf24;
$red: #ef4444;

.support-admin {
  padding: 0;
}

// Header
.support-admin__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.support-admin__title {
  font-size: 24px;
  font-weight: 900;
  color: $orange2;
  margin: 0;
}

.support-admin__controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.support-admin__filter {
  padding: 10px 36px 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;

  option {
    background: $bg;
    color: $text;
  }
}

.support-admin__refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($orange, 0.25);
    transform: translateY(-1px);
  }
}

// Stats
.support-admin__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.support-admin__stat {
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;

  &--waiting {
    border-color: rgba($yellow, 0.3);
    background: rgba($yellow, 0.05);
  }

  &--active {
    border-color: rgba($blue, 0.3);
    background: rgba($blue, 0.05);
  }

  &--resolved {
    border-color: rgba($green, 0.3);
    background: rgba($green, 0.05);
  }
}

.support-admin__stat-value {
  display: block;
  font-size: 32px;
  font-weight: 900;
  color: $text;
}

.support-admin__stat-label {
  font-size: 14px;
  font-weight: 700;
  color: $muted;
}

// Loading & Empty
.support-admin__loading,
.support-admin__empty {
  padding: 60px;
  text-align: center;
  color: $muted;
  font-size: 16px;
  font-weight: 700;

  i {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
    color: rgba(255, 255, 255, 0.2);
  }
}

// Sections
.support-admin__section {
  margin-bottom: 32px;
}

.support-admin__section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: $text;
  margin: 0 0 16px 0;
}

.support-admin__section-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &--waiting {
    background: $yellow;
    animation: pulse 2s infinite;
  }

  &--active {
    background: $blue;
  }

  &--resolved {
    background: $green;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Cards
.support-admin__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.support-admin__card {
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  &--open {
    border-color: rgba($yellow, 0.3);
  }

  &--assigned {
    border-color: rgba($blue, 0.3);
  }

  &--resolved {
    border-color: rgba($green, 0.3);
    opacity: 0.8;
  }
}

.support-admin__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.support-admin__card-channel {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;

  &--ai {
    background: rgba($blue, 0.15);
    color: $blue;
  }

  &--human {
    background: rgba($green, 0.15);
    color: $green;
  }
}

.support-admin__card-time {
  font-size: 12px;
  color: $muted;
}

.support-admin__card-agent {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $blue;
  font-weight: 700;
}

.support-admin__card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: $yellow;
  font-weight: 700;
}

.support-admin__card-title {
  font-size: 16px;
  font-weight: 800;
  color: $text;
  margin: 0 0 8px 0;
}

.support-admin__card-user {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $muted;
  margin: 0 0 8px 0;
  flex-wrap: wrap;
}

.support-admin__user-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  margin-right: auto;

  &--client {
    background: rgba($blue, 0.15);
    color: $blue;
  }

  &--handyman {
    background: rgba($orange, 0.15);
    color: $orange2;
  }
}

.support-admin__card-preview {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.support-admin__card-agent-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $green;
  margin: 0;
}

.support-admin__card-accept-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, $orange, $orange2);
  color: white;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba($orange, 0.3);
  }
}

// Modals
.support-admin__modal-overlay,
.support-admin__chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.support-admin__modal {
  background: $bg;
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.2);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.support-admin__modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    font-size: 18px;
    font-weight: 800;
    color: $text;
    margin: 0;
  }
}

.support-admin__modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: $text;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.support-admin__modal-body {
  padding: 20px;
}

.support-admin__modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.support-admin__form-field {
  label {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: $text;
    margin-bottom: 8px;
  }
}

.support-admin__form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 600;

  &:focus {
    outline: none;
    border-color: $orange;
  }

  &::placeholder {
    color: $muted;
  }
}

.support-admin__btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &--cancel {
    background: rgba(255, 255, 255, 0.1);
    color: $text;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  &--primary {
    background: linear-gradient(135deg, $orange, $orange2);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--resolve {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba($green, 0.15);
    border: 1px solid rgba($green, 0.3);
    color: $green;

    &:hover:not(:disabled) {
      background: rgba($green, 0.25);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Chat Modal
.support-admin__chat-modal {
  background: $bg;
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.2);
  width: 100%;
  max-width: 600px;
  height: 80vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.support-admin__chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba($orange, 0.05);
}

.support-admin__chat-header-info {
  h3 {
    font-size: 16px;
    font-weight: 800;
    color: $text;
    margin: 0 0 4px 0;
  }
}

.support-admin__chat-user {
  font-size: 13px;
  color: $muted;
}

.support-admin__chat-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.support-admin__chat-close {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: $text;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.support-admin__chat-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.support-admin__chat-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $muted;

  &--open { color: $yellow; }
  &--assigned { color: $blue; }
  &--resolved { color: $green; }
  &--rating { color: $yellow; }
  
  &--user-type {
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 700;
  }

  &--client {
    background: rgba($blue, 0.15);
    color: $blue;
  }

  &--handyman {
    background: rgba($orange, 0.15);
    color: $orange2;
  }
}

.support-admin__rating-note {
  font-style: italic;
  margin-right: 8px;
}

.support-admin__chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.support-admin__chat-message {
  display: flex;
  gap: 10px;
  max-width: 85%;

  &--user {
    align-self: flex-start;
    flex-direction: row-reverse;

    .support-admin__chat-message-content {
      background: linear-gradient(135deg, $orange, $orange2);
      border-radius: 16px 16px 4px 16px;
    }
  }

  &--ai, &--admin {
    align-self: flex-end;

    .support-admin__chat-message-content {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 16px 16px 16px 4px;
    }
  }

  &--system {
    align-self: center;
    max-width: 90%;

    .support-admin__chat-message-content {
      background: rgba($green, 0.15);
      border: 1px solid rgba($green, 0.3);
      border-radius: 12px;
      text-align: center;
    }

    .support-admin__chat-message-text {
      color: $green;
      font-size: 13px;
    }
  }
}

.support-admin__chat-message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: $orange2;
  flex-shrink: 0;
}

.support-admin__chat-message-content {
  padding: 12px 16px;
}

.support-admin__chat-message-sender {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.support-admin__chat-message-text {
  font-size: 14px;
  font-weight: 600;
  color: $text;
  margin: 0;
  line-height: 1.5;
}

.support-admin__chat-message-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
  display: block;
}

.support-admin__chat-input-area {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: $bg-light;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.support-admin__chat-input {
  flex: 1;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  color: $text;
  font-size: 14px;
  font-weight: 600;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.5);
  }

  &::placeholder {
    color: $muted;
  }
}

.support-admin__chat-send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, $orange, $orange2);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Responsive
@media (max-width: 768px) {
  .support-admin__header {
    flex-direction: column;
    align-items: stretch;
  }

  .support-admin__controls {
    width: 100%;
    flex-direction: column;
  }

  .support-admin__filter,
  .support-admin__refresh-btn {
    width: 100%;
  }

  .support-admin__stats {
    grid-template-columns: 1fr;
  }

  .support-admin__cards {
    grid-template-columns: 1fr;
  }

  .support-admin__chat-modal {
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
