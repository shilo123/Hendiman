<template>
  <div class="support-chat-overlay" @click.self="$emit('close')">
    <div class="support-chat" dir="rtl">
      <!-- Header -->
      <div class="support-chat__header">
        <div class="support-chat__header-info">
          <div class="support-chat__avatar">
            <i v-if="channel === 'ai'" class="ph-fill ph-robot"></i>
            <i v-else-if="assignedTo" class="ph-fill ph-headset"></i>
            <i v-else class="ph-fill ph-question"></i>
          </div>
          <div class="support-chat__header-text">
            <h2 class="support-chat__title">
              {{ headerTitle }}
            </h2>
            <span class="support-chat__subtitle">{{ headerSubtitle }}</span>
          </div>
        </div>
        <button class="support-chat__close" @click="$emit('close')">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>

      <!-- Step 1: Choose Channel -->
      <div v-if="step === 'channel'" class="support-chat__step">
        <div class="support-chat__step-content">
          <h3 class="support-chat__step-title">איך תרצה לקבל עזרה?</h3>
          <div class="support-chat__channel-options">
            <button 
              class="support-chat__channel-btn"
              @click="selectChannel('ai')"
            >
              <div class="support-chat__channel-icon support-chat__channel-icon--ai">
                <i class="ph-fill ph-robot"></i>
              </div>
              <div class="support-chat__channel-text">
                <span class="support-chat__channel-title">שיחה עם AI</span>
                <span class="support-chat__channel-desc">קבל תשובה מיידית מהמערכת החכמה</span>
              </div>
              <i class="ph-bold ph-caret-left"></i>
            </button>
            <button 
              class="support-chat__channel-btn"
              @click="selectChannel('human')"
            >
              <div class="support-chat__channel-icon support-chat__channel-icon--human">
                <i class="ph-fill ph-headset"></i>
              </div>
              <div class="support-chat__channel-text">
                <span class="support-chat__channel-title">שיחה עם נציג</span>
                <span class="support-chat__channel-desc">דבר עם נציג אנושי שיעזור לך</span>
              </div>
              <i class="ph-bold ph-caret-left"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Choose Title -->
      <div v-else-if="step === 'title'" class="support-chat__step">
        <div class="support-chat__step-content">
          <button class="support-chat__back-btn" @click="step = 'channel'">
            <i class="ph-bold ph-arrow-right"></i>
            חזרה
          </button>
          <h3 class="support-chat__step-title">מה נושא הפנייה?</h3>
          <div class="support-chat__title-options">
            <button 
              v-for="titleOption in titleOptions"
              :key="titleOption.value"
              class="support-chat__title-btn"
              :class="{ 'support-chat__title-btn--selected': selectedTitle === titleOption.value }"
              @click="selectTitle(titleOption.value)"
            >
              <i :class="titleOption.icon"></i>
              <span>{{ titleOption.label }}</span>
            </button>
          </div>
          
          <!-- Custom Title Input -->
          <div v-if="selectedTitle === 'other'" class="support-chat__custom-title">
            <input
              v-model="customTitle"
              type="text"
              class="support-chat__custom-input"
              placeholder="הזן את נושא הפנייה..."
              maxlength="100"
            />
          </div>

          <button 
            class="support-chat__continue-btn"
            :disabled="!canContinue"
            @click="startChat"
          >
            התחל שיחה
            <i class="ph-bold ph-arrow-left"></i>
          </button>
        </div>
      </div>

      <!-- Step 3: Chat -->
      <div v-else-if="step === 'chat'" class="support-chat__chat">
        <!-- Waiting for Agent -->
        <div v-if="channel === 'human' && status === 'open' && !assignedTo" class="support-chat__waiting">
          <div class="support-chat__waiting-animation">
            <div class="support-chat__waiting-dot"></div>
            <div class="support-chat__waiting-dot"></div>
            <div class="support-chat__waiting-dot"></div>
          </div>
          <p class="support-chat__waiting-text">ממתין לנציג...</p>
          <p class="support-chat__waiting-subtext">נציג יענה לך בהקדם האפשרי</p>
        </div>

        <!-- Messages -->
        <div class="support-chat__messages" ref="messagesContainer">
          <div 
            v-for="(msg, idx) in messages" 
            :key="idx"
            class="support-chat__message"
            :class="getMessageClass(msg)"
          >
            <div class="support-chat__message-avatar" v-if="msg.sender !== 'user'">
              <i v-if="msg.sender === 'ai'" class="ph-fill ph-robot"></i>
              <i v-else-if="msg.sender === 'admin'" class="ph-fill ph-headset"></i>
              <i v-else class="ph-fill ph-info"></i>
            </div>
            <div class="support-chat__message-content">
              <p class="support-chat__message-text">{{ msg.text }}</p>
              <span class="support-chat__message-time">{{ formatTime(msg.createdAt) }}</span>
            </div>
          </div>

          <!-- AI Typing Indicator -->
          <div v-if="isAiTyping" class="support-chat__message support-chat__message--ai">
            <div class="support-chat__message-avatar">
              <i class="ph-fill ph-robot"></i>
            </div>
            <div class="support-chat__message-content">
              <div class="support-chat__typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="support-chat__input-area" v-if="status !== 'resolved'">
          <input
            v-model="newMessage"
            type="text"
            class="support-chat__input"
            placeholder="הקלד הודעה..."
            @keyup.enter="sendMessage"
            :disabled="isSending"
          />
          <button 
            class="support-chat__send-btn"
            @click="sendMessage"
            :disabled="!newMessage.trim() || isSending"
          >
            <i class="ph-fill ph-paper-plane-tilt"></i>
          </button>
        </div>

        <!-- Resolved State with Rating -->
        <div v-if="status === 'resolved' && !hasRated" class="support-chat__rating">
          <h4 class="support-chat__rating-title">השיחה הסתיימה</h4>
          <p class="support-chat__rating-subtitle">איך היה השירות?</p>
          <div class="support-chat__rating-stars">
            <button 
              v-for="star in 5" 
              :key="star"
              class="support-chat__star"
              :class="{ 'support-chat__star--active': ratingScore >= star }"
              @click="ratingScore = star"
            >
              <i :class="ratingScore >= star ? 'ph-fill ph-star' : 'ph-bold ph-star'"></i>
            </button>
          </div>
          <textarea
            v-model="ratingNote"
            class="support-chat__rating-note"
            placeholder="הערות נוספות (אופציונלי)..."
            rows="2"
          ></textarea>
          <button 
            class="support-chat__rating-submit"
            :disabled="!ratingScore || isSubmittingRating"
            @click="submitRating"
          >
            {{ isSubmittingRating ? 'שולח...' : 'שלח דירוג' }}
          </button>
        </div>

        <!-- Thank You After Rating -->
        <div v-if="hasRated" class="support-chat__thank-you">
          <i class="ph-fill ph-check-circle"></i>
          <p>תודה על המשוב!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { io } from "socket.io-client";

export default {
  name: "SupportChat",
  props: {
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      default: ""
    },
    userType: {
      type: String,
      default: "client" // "client" or "handyman"
    },
    existingChatId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      step: "channel", // channel, title, chat
      channel: null, // ai, human
      selectedTitle: null,
      customTitle: "",
      chatId: null,
      messages: [],
      newMessage: "",
      status: "open",
      assignedTo: null,
      isSending: false,
      isAiTyping: false,
      socket: null,
      ratingScore: 0,
      ratingNote: "",
      hasRated: false,
      isSubmittingRating: false,
      titleOptions: [
        { value: "technical", label: "בעיה טכנית", icon: "ph-fill ph-wrench" },
        { value: "payment", label: "שאלה על תשלום", icon: "ph-fill ph-credit-card" },
        { value: "complaint_handyman", label: "תלונה על הנדימן", icon: "ph-fill ph-warning" },
        { value: "complaint_client", label: "תלונה על לקוח", icon: "ph-fill ph-user-minus" },
        { value: "general", label: "שאלה כללית", icon: "ph-fill ph-chat-circle" },
        { value: "other", label: "אחר", icon: "ph-fill ph-dots-three" }
      ]
    };
  },
  computed: {
    headerTitle() {
      if (this.step === "channel") return "צ'אט תמיכה";
      if (this.step === "title") return "בחר נושא";
      if (this.channel === "ai") return "שיחה עם AI";
      if (this.assignedTo) return this.assignedTo.name;
      return "צ'אט תמיכה";
    },
    headerSubtitle() {
      if (this.step === "channel") return "בחר את אופן הפנייה";
      if (this.step === "title") return this.channel === "ai" ? "AI" : "נציג אנושי";
      if (this.status === "resolved") return "השיחה הסתיימה";
      if (this.channel === "ai") return "מערכת חכמה";
      if (this.assignedTo) return "נציג תמיכה";
      return "ממתין לנציג";
    },
    canContinue() {
      if (!this.selectedTitle) return false;
      if (this.selectedTitle === "other" && !this.customTitle.trim()) return false;
      return true;
    },
    finalTitle() {
      if (this.selectedTitle === "other") {
        return this.customTitle.trim();
      }
      const option = this.titleOptions.find(t => t.value === this.selectedTitle);
      return option ? option.label : "";
    }
  },
  async mounted() {
    if (this.existingChatId) {
      await this.loadExistingChat();
    }
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
        if (this.chatId) {
          this.socket.emit("join-support-chat", this.chatId);
        }
        this.socket.emit("join-user", this.userId);
      });

      // Listen for new messages (only from admin/system, not our own)
      this.socket.on("support-message", (data) => {
        if (data.chatId === this.chatId && data.message.sender !== "user") {
          // Only add if not already added (avoid duplicates)
          const lastMsg = this.messages[this.messages.length - 1];
          if (!lastMsg || lastMsg.text !== data.message.text || lastMsg.sender !== data.message.sender) {
            this.messages.push(data.message);
            this.$nextTick(() => this.scrollToBottom());
          }
        }
      });

      // Listen for agent assignment
      this.socket.on("support-assigned", (data) => {
        if (data.chatId === this.chatId) {
          this.assignedTo = data.assignedTo;
          this.status = "assigned";
        }
      });

      // Listen for chat resolved
      this.socket.on("support-resolved", (data) => {
        if (data.chatId === this.chatId) {
          this.status = "resolved";
        }
      });
    },

    selectChannel(channel) {
      this.channel = channel;
      this.step = "title";
    },

    selectTitle(title) {
      this.selectedTitle = title;
      if (title !== "other") {
        this.customTitle = "";
      }
    },

    async startChat() {
      try {
        const { data } = await axios.post(`${URL}/api/support/create`, {
          userId: this.userId,
          userName: this.userName,
          userType: this.userType,
          channel: this.channel,
          title: this.finalTitle
        });

        if (data.success) {
          this.chatId = data.chat._id;
          this.messages = data.chat.messages || [];
          this.status = data.chat.status;
          this.step = "chat";

          // Join socket room
          if (this.socket) {
            this.socket.emit("join-support-chat", this.chatId);
          }

          // Add system welcome message for AI
          if (this.channel === "ai") {
            this.messages.push({
              sender: "ai",
              text: "שלום! אני העוזר הוירטואלי של הנדימן. איך אני יכול לעזור לך היום?",
              createdAt: new Date()
            });
          }
        }
      } catch (error) {
        console.error("Error starting chat:", error);
      }
    },

    async loadExistingChat() {
      try {
        const { data } = await axios.get(`${URL}/api/support/${this.existingChatId}`);
        if (data.success) {
          this.chatId = data.chat._id;
          this.channel = data.chat.channel;
          this.messages = data.chat.messages || [];
          this.status = data.chat.status;
          this.assignedTo = data.chat.assignedTo;
          this.hasRated = !!data.chat.rating;
          this.step = "chat";

          if (this.socket) {
            this.socket.emit("join-support-chat", this.chatId);
          }
        }
      } catch (error) {
        console.error("Error loading chat:", error);
      }
    },

    async sendMessage() {
      if (!this.newMessage.trim() || this.isSending) return;

      const messageText = this.newMessage.trim();
      this.newMessage = "";
      this.isSending = true;

      // Add user message immediately
      this.messages.push({
        sender: "user",
        text: messageText,
        createdAt: new Date()
      });
      this.$nextTick(() => this.scrollToBottom());

      try {
        const { data } = await axios.post(`${URL}/api/support/${this.chatId}/message`, {
          sender: "user",
          text: messageText
        });

        if (data.success && this.channel === "ai") {
          // Show typing indicator
          this.isAiTyping = true;
          this.$nextTick(() => this.scrollToBottom());

          // Get AI response
          const { data: aiData } = await axios.post(`${URL}/api/support/${this.chatId}/ai-response`, {
            userMessage: messageText
          });

          this.isAiTyping = false;

          if (aiData.success && aiData.aiMessage) {
            this.messages.push(aiData.aiMessage);
            this.$nextTick(() => this.scrollToBottom());
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        this.isAiTyping = false;
      } finally {
        this.isSending = false;
      }
    },

    async submitRating() {
      if (!this.ratingScore || this.isSubmittingRating) return;

      this.isSubmittingRating = true;
      try {
        await axios.post(`${URL}/api/support/${this.chatId}/rate`, {
          score: this.ratingScore,
          note: this.ratingNote
        });
        this.hasRated = true;
      } catch (error) {
        console.error("Error submitting rating:", error);
      } finally {
        this.isSubmittingRating = false;
      }
    },

    getMessageClass(msg) {
      return {
        "support-chat__message--user": msg.sender === "user",
        "support-chat__message--ai": msg.sender === "ai",
        "support-chat__message--admin": msg.sender === "admin",
        "support-chat__message--system": msg.sender === "system"
      };
    },

    formatTime(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
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

.support-chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  @media (min-width: 768px) {
    align-items: center;
  }
}

.support-chat {
  width: 100%;
  max-width: 480px;
  height: 90vh;
  max-height: 700px;
  background: $bg;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  box-sizing: border-box;

  @media (min-width: 768px) {
    border-radius: 24px;
    height: 80vh;
  }

  * {
    box-sizing: border-box;
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

// Header
.support-chat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba($orange, 0.15), rgba($orange, 0.05));
  border-bottom: 1px solid rgba($orange, 0.2);
}

.support-chat__header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.support-chat__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, $orange, $orange2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
}

.support-chat__header-text {
  display: flex;
  flex-direction: column;
}

.support-chat__title {
  font-size: 18px;
  font-weight: 800;
  color: $text;
  margin: 0;
}

.support-chat__subtitle {
  font-size: 13px;
  color: $muted;
  font-weight: 600;
}

.support-chat__close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: $text;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

// Step Content
.support-chat__step {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  overflow-x: hidden;
}

.support-chat__step-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
}

.support-chat__back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: $muted;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  align-self: flex-start;

  &:hover {
    color: $orange2;
  }
}

.support-chat__step-title {
  font-size: 22px;
  font-weight: 800;
  color: $text;
  margin: 0;
  text-align: center;
}

// Channel Options
.support-chat__channel-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.support-chat__channel-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: right;

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.3);
    transform: translateX(-4px);
  }

  i:last-child {
    margin-right: auto;
    color: $muted;
    font-size: 18px;
  }
}

.support-chat__channel-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;

  &--ai {
    background: linear-gradient(135deg, rgba($blue, 0.2), rgba($blue, 0.1));
    color: $blue;
  }

  &--human {
    background: linear-gradient(135deg, rgba($green, 0.2), rgba($green, 0.1));
    color: $green;
  }
}

.support-chat__channel-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.support-chat__channel-title {
  font-size: 16px;
  font-weight: 800;
  color: $text;
}

.support-chat__channel-desc {
  font-size: 13px;
  color: $muted;
  font-weight: 600;
}

// Title Options
.support-chat__title-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.support-chat__title-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: $text;

  i {
    font-size: 24px;
    color: $muted;
  }

  span {
    font-size: 13px;
    font-weight: 700;
    text-align: center;
  }

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.3);
  }

  &--selected {
    background: rgba($orange, 0.15);
    border-color: $orange;

    i {
      color: $orange2;
    }
  }
}

.support-chat__custom-title {
  margin-top: 8px;
}

.support-chat__custom-input {
  width: 100%;
  max-width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.3);
  border-radius: 12px;
  color: $text;
  font-size: 15px;
  font-weight: 600;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.15);
  }

  &::placeholder {
    color: $muted;
  }
}

.support-chat__continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, $orange, $orange2);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($orange, 0.35);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Chat Area
.support-chat__chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.support-chat__waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.support-chat__waiting-animation {
  display: flex;
  gap: 8px;
}

.support-chat__waiting-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $orange;
  animation: bounce 1.4s infinite ease-in-out both;

  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.support-chat__waiting-text {
  font-size: 18px;
  font-weight: 800;
  color: $text;
  margin: 0;
}

.support-chat__waiting-subtext {
  font-size: 14px;
  color: $muted;
  margin: 0;
}

// Messages
.support-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.support-chat__message {
  display: flex;
  gap: 10px;
  max-width: 85%;

  &--user {
    align-self: flex-start;
    flex-direction: row-reverse;

    .support-chat__message-content {
      background: linear-gradient(135deg, $orange, $orange2);
      border-radius: 16px 16px 4px 16px;
    }

    .support-chat__message-time {
      text-align: left;
    }
  }

  &--ai, &--admin {
    align-self: flex-end;

    .support-chat__message-content {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 16px 16px 16px 4px;
    }
  }

  &--system {
    align-self: center;
    max-width: 90%;

    .support-chat__message-content {
      background: rgba($green, 0.15);
      border: 1px solid rgba($green, 0.3);
      border-radius: 12px;
      text-align: center;
    }

    .support-chat__message-text {
      color: $green;
      font-size: 13px;
    }
  }
}

.support-chat__message-avatar {
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

.support-chat__message-content {
  padding: 12px 16px;
}

.support-chat__message-text {
  font-size: 14px;
  font-weight: 600;
  color: $text;
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.support-chat__message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  display: block;
}

// Typing Indicator
.support-chat__typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $muted;
    animation: typing 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

// Input Area
.support-chat__input-area {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: $bg-light;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.support-chat__input {
  flex: 1;
  min-width: 0;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  color: $text;
  font-size: 15px;
  font-weight: 600;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.5);
  }

  &::placeholder {
    color: $muted;
  }
}

.support-chat__send-btn {
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

// Rating
.support-chat__rating {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: rgba($green, 0.05);
  border-top: 1px solid rgba($green, 0.2);
}

.support-chat__rating-title {
  font-size: 18px;
  font-weight: 800;
  color: $text;
  margin: 0;
}

.support-chat__rating-subtitle {
  font-size: 14px;
  color: $muted;
  margin: 0;
}

.support-chat__rating-stars {
  display: flex;
  gap: 8px;
}

.support-chat__star {
  background: none;
  border: none;
  font-size: 32px;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px;

  &--active {
    color: #fbbf24;
  }

  &:hover {
    transform: scale(1.2);
  }
}

.support-chat__rating-note {
  width: 100%;
  max-width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: $text;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.5);
  }

  &::placeholder {
    color: $muted;
  }
}

.support-chat__rating-submit {
  padding: 14px 32px;
  background: linear-gradient(135deg, $green, darken($green, 10%));
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($green, 0.35);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.support-chat__thank-you {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: $green;

  i {
    font-size: 48px;
  }

  p {
    font-size: 18px;
    font-weight: 800;
    margin: 0;
  }
}
</style>

