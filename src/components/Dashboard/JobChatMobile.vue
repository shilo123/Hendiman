<template>
  <section class="chat" dir="rtl">
    <!-- Header -->
    <header class="chat__header">
      <button
        class="chat__iconBtn"
        type="button"
        @click="$emit('minimize')"
        aria-label="חזור"
      >
        ←
      </button>

      <div class="chat__headInfo">
        <div class="chat__title">
          {{ isHandyman ? clientName : handymanName }}
        </div>
        <div class="chat__subtitle">
          {{ jobInfo?.subcategoryInfo?.name || "עבודה" }}
        </div>
      </div>

      <div class="chat__headRight">
        <span class="chat__status" :class="'status--' + chipTone">{{
          statusLabel
        }}</span>

        <button
          class="chat__iconBtn"
          type="button"
          @click="showMenu = !showMenu"
          aria-label="תפריט"
        >
          ⋯
        </button>
      </div>

      <!-- Menu -->
      <div v-if="showMenu" class="chat__menu" @click.self="showMenu = false">
        <button
          class="chat__menuItem chat__menuItem--danger"
          type="button"
          @click="openCancel()"
        >
          ביטול עבודה
        </button>
        <button class="chat__menuItem" type="button" @click="showMenu = false">
          סגור
        </button>
      </div>
    </header>

    <!-- Action bar (one line, scrollable) -->
    <div v-if="showActionBar" class="chat__actions">
      <!-- Handyman: navigation button -->
      <button
        v-if="isHandyman && jobLocation"
        class="chip chip--ghost"
        type="button"
        @click.stop="showNavModal = true"
      >
        🗺️ ניווט
      </button>

      <!-- Handyman: one smart status button instead of 3 blocks -->
      <button
        v-if="isHandyman && nextStatus"
        class="chip chip--primary"
        type="button"
        @click="updateStatus(nextStatus)"
      >
        {{ nextStatusLabel }}
      </button>

      <!-- Client: location -->
      <button
        v-if="!isHandyman && showStatusButtons"
        class="chip chip--primary"
        type="button"
        @click="sendLocation"
      >
        📍 שלח מיקום
      </button>

      <!-- Always: steps toggle -->
      <button
        class="chip chip--ghost"
        type="button"
        @click="stepsOpen = !stepsOpen"
      >
        {{ stepsOpen ? "הסתר סטטוס" : "הצג סטטוס" }}
      </button>
    </div>

    <!-- Compact stepper -->
    <div v-if="stepsOpen" class="chat__stepper">
      <div
        v-for="(step, i) in jobSteps"
        :key="step.status"
        class="step"
        :class="{
          'is-active': step.status === jobStatus,
          'is-done': isStepCompleted(step.status),
        }"
      >
        <div class="step__dot">
          <span v-if="isStepCompleted(step.status)">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="step__label">{{ step.label }}</div>
      </div>
    </div>

    <!-- Rating (client) -->
    <div
      v-if="!isHandyman && jobStatus === 'done' && !ratingSubmitted"
      class="chat__rating"
    >
      <div class="chat__ratingTitle">דרג את ההנדימן</div>

      <div class="chat__stars">
        <template v-for="s in 5" :key="s">
          <input
            :value="s"
            :id="`star-v2-${s}`"
            name="rating-v2"
            type="radio"
            :checked="rating === s"
            @change="rating = s"
          />
          <label
            :for="`star-v2-${s}`"
            :title="`${s} כוכבים`"
            @touchstart="hoverRating = s"
            @touchend="hoverRating = 0"
          >
            <span
              class="star"
              :class="{
                'is-on':
                  (hoverRating > 0 && s <= hoverRating) ||
                  (hoverRating === 0 && rating >= s),
              }"
              >★</span
            >
          </label>
        </template>
      </div>

      <textarea
        v-model="reviewText"
        class="chat__review"
        rows="2"
        placeholder="משהו קצר (אופציונלי)"
      />
      <button class="chat__rateBtn" type="button" @click="submitRating">
        שלח דירוג
      </button>
    </div>

    <!-- Messages -->
    <div class="chat__messages" ref="messagesContainer">
      <div v-if="!messages.length" class="chat__empty">
        עדיין אין הודעות. תתחילו 🙂
      </div>

      <div
        v-for="(m, i) in messages"
        :key="i"
        class="msg"
        :class="{
          'is-me': m.sender === 'me',
          'is-system': m.sender === 'system' || m.isSystem,
        }"
      >
        <div
          class="bubble"
          :class="{
            'bubble--me': m.sender === 'me',
            'bubble--system': m.sender === 'system' || m.isSystem,
          }"
        >
          <button
            v-if="m.image"
            type="button"
            class="bubble__imgBtn"
            @click="openImage(m.image)"
          >
            <img :src="m.image" class="bubble__img" alt="תמונה" />
          </button>

          <button
            v-if="m.location"
            type="button"
            class="bubble__loc"
            @click.stop="openLocationModal(m.location)"
          >
            <img
              :src="getLocationMapImage(m.location)"
              class="bubble__locMap"
              alt="מיקום"
              @error="onMapImageError"
            />
            <div class="bubble__locOverlay">📍 מיקום</div>
          </button>

          <div v-if="m.text" class="bubble__text">{{ m.text }}</div>

          <div class="bubble__meta">
            <span class="bubble__time">{{ m.time }}</span>
            <span v-if="m.sender === 'me'" class="bubble__tick">✓✓</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Composer -->
    <div class="composer">
      <button
        class="composer__plus"
        type="button"
        @click="toggleTools"
        aria-label="כלים"
      >
        ＋
      </button>

      <div v-if="imagePreview" class="composer__preview">
        <div class="composer__previewTop">
          <img :src="imagePreview" class="composer__previewImg" alt="תמונה" />
          <button
            class="composer__previewClose"
            type="button"
            @click="cancelImagePreview"
            aria-label="ביטול"
          >
            ✕
          </button>
        </div>
        <input
          ref="imagePreviewTextInput"
          v-model="imagePreviewText"
          class="composer__input"
          type="text"
          placeholder="הוסף כיתוב לתמונה…"
          @keyup.enter="sendImageWithText"
        />
      </div>

      <input
        v-else
        v-model="newMessage"
        class="composer__input"
        type="text"
        placeholder="הקלד הודעה…"
        @keyup.enter="sendMessage"
      />

      <button
        class="composer__send"
        type="button"
        @click="imagePreview ? sendImageWithText() : sendMessage()"
        :disabled="!imagePreview && !newMessage.trim()"
      >
        שלח
      </button>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- Tools bottom sheet -->
    <div v-if="showTools" class="toolsSheet" @click.self="showTools = false">
      <div class="toolsSheet__card">
        <button class="toolsSheet__item" type="button" @click="triggerFile">
          📷 תמונה
        </button>
        <button class="toolsSheet__item" type="button" @click="sendLocation">
          📍 מיקום
        </button>
        <button
          class="toolsSheet__item"
          type="button"
          @click="sendQuick('אני בדרך')"
        >
          🚗 אני בדרך
        </button>
        <button
          class="toolsSheet__item"
          type="button"
          @click="sendQuick('הגעתי')"
        >
          ✅ הגעתי
        </button>
        <button
          class="toolsSheet__close"
          type="button"
          @click="showTools = false"
        >
          סגור
        </button>
      </div>
    </div>

    <!-- Image modal -->
    <div v-if="imageModal" class="modal" @click.self="imageModal = null">
      <div class="modal__card">
        <button class="modal__close" type="button" @click="imageModal = null">
          ✕
        </button>
        <img :src="imageModal" class="modal__img" alt="preview" />
      </div>
    </div>

    <!-- Navigation modal -->
    <div
      v-if="showNavModal"
      class="modal"
      dir="rtl"
      @click.self="showNavModal = false"
    >
      <div class="navModal">
        <div class="navModal__title">איפה לפתוח את המיקום?</div>
        <div class="navModal__actions">
          <a
            :href="getWazeUrl(jobLocation)"
            target="_blank"
            rel="noopener noreferrer"
            class="navModal__btn navModal__btn--waze"
            @click="showNavModal = false"
          >
            <span class="navModal__btnIcon">📍</span>
            <span class="navModal__btnText">ווייז</span>
          </a>
          <a
            :href="getGoogleMapsUrl(jobLocation)"
            target="_blank"
            rel="noopener noreferrer"
            class="navModal__btn navModal__btn--google"
            @click="showNavModal = false"
          >
            <span class="navModal__btnIcon">🗺️</span>
            <span class="navModal__btnText">גוגל מפות</span>
          </a>
          <button
            class="navModal__cancel"
            type="button"
            @click="showNavModal = false"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel confirmation -->
    <div
      v-if="showCancelConfirmModal"
      class="modal"
      dir="rtl"
      @click.self="showCancelConfirmModal = false"
    >
      <div class="confirm">
        <div class="confirm__title">ביטול עבודה</div>
        <div class="confirm__text">האם אתה בטוח שברצונך לבטל את העבודה?</div>
        <div class="confirm__actions">
          <button
            class="confirm__btn"
            type="button"
            @click="showCancelConfirmModal = false"
          >
            לא
          </button>
          <button
            class="confirm__btn confirm__btn--danger"
            type="button"
            @click="handleCancelJob"
          >
            כן, בטל
          </button>
        </div>
      </div>
    </div>

    <!-- Location modal -->
    <div v-if="locationModal" class="modal" @click.self="locationModal = null">
      <div class="locCard">
        <button
          class="locCard__close"
          type="button"
          @click="locationModal = null"
        >
          ✕
        </button>

        <img
          :src="getLocationMapImage(locationModal)"
          class="locCard__map"
          alt="מיקום"
        />

        <div class="locCard__body">
          <div class="locCard__title">📍 מיקום</div>
          <div class="locCard__coords">{{ formatLocation(locationModal) }}</div>

          <a
            :href="getWazeUrl(locationModal)"
            target="_blank"
            rel="noopener noreferrer"
            class="locCard__btn locCard__btn--waze"
            >ווייז</a
          >

          <a
            :href="getGoogleMapsUrl(locationModal)"
            target="_blank"
            rel="noopener noreferrer"
            class="locCard__btn locCard__btn--gm"
            >גוגל מפות</a
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from "axios";
import { io } from "socket.io-client";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { useMainStore } from "@/store/index";

export default {
  name: "JobChatMobileV2",
  props: {
    job: { type: Object, required: true },
    isHandyman: { type: Boolean, default: false },
  },
  emits: [
    "close",
    "minimize",
    "status-updated",
    "rating-submitted",
    "cancel-job",
  ],
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      toast: null,
      newMessage: "",
      messages: [],
      rating: 0,
      hoverRating: 0,
      reviewText: "",
      ratingSubmitted: false,
      imageModal: null,
      showTools: false,
      socket: null,
      localJobStatus: null,
      showCancelConfirmModal: false,
      imagePreview: null,
      imagePreviewText: "",
      imagePreviewFile: null,
      locationModal: null,

      // new UX state
      stepsOpen: false,
      showMenu: false,
      showNavModal: false,
    };
  },
  computed: {
    jobStatus() {
      return this.localJobStatus || this.job?.status || "open";
    },
    showStatusButtons() {
      return ["assigned", "on_the_way", "in_progress"].includes(this.jobStatus);
    },
    showActionBar() {
      // show chips only when there is something useful
      return (
        (this.isHandyman && this.jobLocation) ||
        (this.isHandyman && !!this.nextStatus) ||
        (!this.isHandyman && this.showStatusButtons) ||
        true
      );
    },
    clientName() {
      return this.job?.clientName || "לקוח";
    },
    handymanName() {
      return this.job?.handymanName || "הנדימן";
    },
    jobInfo() {
      return this.job;
    },
    jobLocation() {
      if (this.job?.coordinates && Array.isArray(this.job.coordinates)) {
        return { lng: this.job.coordinates[0], lat: this.job.coordinates[1] };
      }
      if (
        this.job?.location?.coordinates &&
        Array.isArray(this.job.location.coordinates)
      ) {
        return {
          lng: this.job.location.coordinates[0],
          lat: this.job.location.coordinates[1],
        };
      }
      if (
        this.jobInfo?.coordinates &&
        Array.isArray(this.jobInfo.coordinates)
      ) {
        return {
          lng: this.jobInfo.coordinates[0],
          lat: this.jobInfo.coordinates[1],
        };
      }
      return null;
    },
    statusLabel() {
      const map = {
        assigned: "שובצה",
        on_the_way: "בדרך",
        in_progress: "בביצוע",
        done: "הושלמה",
        open: "פתוחה",
      };
      return map[this.jobStatus] || this.jobStatus;
    },
    chipTone() {
      if (this.jobStatus === "done") return "done";
      if (this.jobStatus === "in_progress") return "work";
      if (this.jobStatus === "on_the_way") return "move";
      return "new";
    },

    // New: one smart next status button
    nextStatus() {
      if (!this.isHandyman) return null;
      if (this.jobStatus === "assigned") return "on_the_way";
      if (this.jobStatus === "on_the_way") return "in_progress";
      if (this.jobStatus === "in_progress") return "done";
      return null;
    },
    nextStatusLabel() {
      const map = {
        on_the_way: "🚗 בדרך",
        in_progress: "📍 הגעתי",
        done: "✅ סיימתי",
      };
      return map[this.nextStatus] || "";
    },

    jobSteps() {
      return [
        { status: "assigned", label: "שובצה" },
        { status: "on_the_way", label: "בדרך" },
        { status: "in_progress", label: "ביצוע" },
        { status: "done", label: "סיום" },
      ];
    },
  },
  created() {
    this.toast = useToast();
    this.localJobStatus = this.job?.status || null;
  },
  async mounted() {
    window.addEventListener("click", this.onOutsideTools);
    this.initWebSocket();
    await this.loadMessages();
    this.scrollToBottom();
  },
  beforeUnmount() {
    window.removeEventListener("click", this.onOutsideTools);
    this.disconnectWebSocket();
  },
  watch: {
    "job.status"(newStatus) {
      if (newStatus && !this.localJobStatus) this.localJobStatus = newStatus;
    },
    messages: {
      deep: true,
      handler() {
        this.scrollToBottom();
      },
    },
  },
  methods: {
    openCancel() {
      this.showMenu = false;
      this.showCancelConfirmModal = true;
    },

    initWebSocket() {
      if (!this.job?.id && !this.job?._id) return;

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      const jobId = this.job.id || this.job._id;

      this.socket = io(URL, { transports: ["websocket", "polling"] });

      this.socket.on("connect", () => {
        this.socket.emit("join-job", String(jobId));
      });

      this.socket.on("job-status-updated", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          this.localJobStatus = data.status;
          this.$emit("status-updated", data.status);
        }
      });

      this.socket.on("new-message", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && data.message) {
          this.addMessageToUI(data.message);
        }
      });

      this.socket.on("rating-submitted", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(
            `/Dashboard/${userId}/job-summary/${receivedJobId}`
          );
        }
      });
    },

    disconnectWebSocket() {
      if (this.socket) {
        const jobId = this.job?.id || this.job?._id;
        if (jobId) this.socket.emit("leave-job", jobId);
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
    },

    async loadMessages() {
      try {
        const jobId = this.job?.id || this.job?._id;
        if (!jobId) return;

        const { data } = await axios.get(`${URL}/jobs/${jobId}/messages`);
        if (data.success && data.messages) {
          this.messages = data.messages.map((msg) => {
            const isFromHandyman =
              !!msg.handyman || !!msg.handymanImage || !!msg.handymanLocation;
            const sender = this.isHandyman
              ? isFromHandyman
                ? "me"
                : "other"
              : isFromHandyman
              ? "other"
              : "me";
            const text = msg.handyman || msg.customer || "";
            const image = msg.handymanImage || msg.customerImage || null;
            const location =
              msg.handymanLocation || msg.customerLocation || null;
            const createdAt = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date();

            return {
              sender,
              text,
              image,
              location,
              time: createdAt.toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt,
            };
          });
        }
      } catch (e) {
        this.toast?.showError("שגיאה בטעינת הודעות");
      }
    },

    addMessageToUI(messageObj) {
      const isFromHandyman =
        !!messageObj.handyman ||
        !!messageObj.handymanImage ||
        !!messageObj.handymanLocation;
      const sender = this.isHandyman
        ? isFromHandyman
          ? "me"
          : "other"
        : isFromHandyman
        ? "other"
        : "me";
      const text = messageObj.handyman || messageObj.customer || "";
      const image =
        messageObj.handymanImage || messageObj.customerImage || null;
      const location =
        messageObj.handymanLocation || messageObj.customerLocation || null;
      const createdAt = messageObj.createdAt
        ? new Date(messageObj.createdAt)
        : new Date();

      // Check if this is an update to an optimistic message (same sender, same content, recent time)
      if (sender === "me") {
        // Find optimistic message with same text and recent time (within 5 seconds)
        const optimisticIndex = this.messages.findIndex((m) => {
          if (m.sender !== "me") return false;
          if (m.tempId) {
            // For text messages
            if (
              text &&
              m.text &&
              !image &&
              !m.image &&
              !location &&
              !m.location
            ) {
              const timeDiff = Math.abs(
                createdAt.getTime() - (m.createdAt?.getTime() || 0)
              );
              return text.trim() === m.text.trim() && timeDiff < 5000;
            }
            // For image messages
            if (image && m.image) {
              const timeDiff = Math.abs(
                createdAt.getTime() - (m.createdAt?.getTime() || 0)
              );
              // Match by tempId (optimistic message) or by time and text match
              if (m.tempId && m.tempId.startsWith("temp-img")) {
                // Match text if both have it, or match if both don't have text
                const textMatch =
                  (!text && !m.text) ||
                  (text && m.text && text.trim() === m.text.trim());
                return textMatch && timeDiff < 5000;
              }
              // Also check if image URLs match (for base64 preview vs server URL)
              // This handles cases where tempId might not be set
              const textMatch =
                (!text && !m.text) ||
                (text && m.text && text.trim() === m.text.trim());
              return textMatch && timeDiff < 5000;
            }
            // For location messages
            if (location && m.location) {
              const latMatch =
                Math.abs((m.location.lat || 0) - (location.lat || 0)) < 0.0001;
              const lngMatch =
                Math.abs((m.location.lng || 0) - (location.lng || 0)) < 0.0001;
              const timeDiff = Math.abs(
                createdAt.getTime() - (m.createdAt?.getTime() || 0)
              );
              return latMatch && lngMatch && timeDiff < 5000;
            }
          }
          return false;
        });

        if (optimisticIndex !== -1) {
          // Replace optimistic message with real one
          this.messages[optimisticIndex] = {
            sender,
            text,
            image,
            location,
            time: createdAt.toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt,
          };
          this.scrollToBottom();
          return; // Don't add duplicate
        }
      }

      // Check if message already exists to prevent duplicates
      const exists = this.messages.some((m) => {
        // Skip optimistic messages (they're handled above)
        if (m.tempId || m.uploading) return false;
        if (m.sender !== sender) return false;

        // Exact match on image URL
        if (image && m.image) {
          if (m.image !== image) return false;
          // If both have text, must match exactly
          if (text && m.text) {
            return text.trim() === m.text.trim();
          }
          // If neither has text, match on image only
          return !text && !m.text;
        }

        // Exact match on location
        if (location && m.location) {
          // Compare coordinates with tolerance for floating point precision
          const latMatch =
            Math.abs((m.location.lat || 0) - (location.lat || 0)) < 0.0001;
          const lngMatch =
            Math.abs((m.location.lng || 0) - (location.lng || 0)) < 0.0001;
          if (!latMatch || !lngMatch) {
            return false;
          }
          // If both have text, must match exactly
          if (text && m.text) {
            return text.trim() === m.text.trim();
          }
          return !text && !m.text;
        }

        // Text-only messages - check by text and time (within 2 seconds)
        if (text && m.text && !image && !m.image && !location && !m.location) {
          const timeDiff = Math.abs(
            createdAt.getTime() - (m.createdAt?.getTime() || 0)
          );
          return text.trim() === m.text.trim() && timeDiff < 2000;
        }

        return false;
      });

      if (!exists) {
        this.messages.push({
          sender,
          text,
          image,
          location,
          time: createdAt.toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt,
        });
        this.scrollToBottom();
      }
    },

    toggleTools(e) {
      e?.stopPropagation?.();
      this.showTools = !this.showTools;
    },
    onOutsideTools(e) {
      const inside = e?.target?.closest?.(".composer");
      if (!inside) this.showTools = false;
      const insideHeader = e?.target?.closest?.(".chat__header");
      if (!insideHeader) this.showMenu = false;
      const insideNavModal = e?.target?.closest?.(".navModal");
      if (!insideNavModal) {
        this.showNavModal = false;
      }
    },
    triggerFile() {
      this.showTools = false;
      this.$refs.fileInput?.click();
    },
    sendQuick(text) {
      this.showTools = false;

      // Map quick messages to status updates for handyman
      if (this.isHandyman) {
        if (text === "אני בדרך") {
          this.updateStatus("on_the_way");
          // Also send as message to notify client
          this.newMessage = text;
          this.sendMessage();
          return;
        } else if (text === "הגעתי") {
          this.updateStatus("in_progress");
          // Also send as message to notify client
          this.newMessage = text;
          this.sendMessage();
          return;
        }
      }

      // For other messages or client, just send as text
      this.newMessage = text;
      this.sendMessage();
    },

    async sendLocation() {
      this.showTools = false;

      if (!navigator.geolocation) {
        this.toast?.showError("הדפדפן שלך לא תומך במיקום");
        return;
      }

      this.toast?.showSuccess("מאתר את המיקום שלך...");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          await this.sendLocationMessage(location);
        },
        (error) => {
          let errorMessage = "שגיאה בקבלת המיקום";
          if (error.code === 1) {
            errorMessage =
              "הגישה למיקום נדחתה. אנא אפשר גישה למיקום בהגדרות הדפדפן.";
          } else if (error.code === 2) {
            errorMessage = "המיקום לא זמין";
          } else if (error.code === 3) {
            errorMessage = "פג הזמן לקבלת המיקום";
          }
          this.toast?.showError(errorMessage);
        },
        {
          enableHighAccuracy: false, // Changed to false for better compatibility
          timeout: 15000, // Increased timeout
          maximumAge: 60000, // Allow cached location up to 1 minute
        }
      );
    },

    async sendLocationMessage(location) {
      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      const tempMessage = {
        sender: "me",
        location,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
      };

      this.messages.push(tempMessage);
      this.scrollToBottom();

      try {
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          location,
          senderId: userId,
          isHandyman: this.isHandyman,
        });
      } catch (e) {
        this.toast?.showError("שגיאה בשליחת המיקום");
      }
    },

    openLocationModal(location) {
      if (!location) return;
      this.locationModal = location;
    },

    getLocationMapImage(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        const zoom = 15;
        const width = 400;
        const height = 300;
        return `${URL}/location-map-image?lat=${location.lat}&lng=${location.lng}&zoom=${zoom}&width=${width}&height=${height}`;
      }
      return "";
    },

    onMapImageError() {
      // אפשר להשאיר ריק / או להחליף ל-fallback כמו שעשית אצלך
    },

    getWazeUrl(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `https://www.waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`;
      }
      return "#";
    },

    getGoogleMapsUrl(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=driving`;
      }
      return "#";
    },

    formatLocation(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      }
      return "";
    },

    isStepCompleted(stepStatus) {
      const statusOrder = {
        assigned: 1,
        on_the_way: 2,
        in_progress: 3,
        done: 4,
      };
      const currentOrder = statusOrder[this.jobStatus] || 0;
      const stepOrder = statusOrder[stepStatus] || 0;
      return stepOrder < currentOrder;
    },

    async sendMessage() {
      const t = this.newMessage.trim();
      if (!t) return;

      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      // Create temporary ID for optimistic message
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempCreatedAt = new Date();

      // Add optimistic message
      this.messages.push({
        sender: "me",
        text: t,
        time: tempCreatedAt.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: tempCreatedAt,
        tempId, // Mark as temporary
      });

      this.newMessage = "";
      this.scrollToBottom();

      try {
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          text: t,
          senderId: userId,
          isHandyman: this.isHandyman,
        });
        // Message will be updated via WebSocket, but we keep the optimistic one
        // until the real one arrives (addMessageToUI will handle replacement)
      } catch (e) {
        // Remove optimistic message on error
        const index = this.messages.findIndex((m) => m.tempId === tempId);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
        this.toast?.showError("שגיאה בשליחת ההודעה");
      }
    },

    handleFileSelect(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        this.toast?.showError("יש לבחור קובץ תמונה בלבד");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toast?.showError("הקובץ גדול מדי. מקסימום 5MB");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        this.imagePreview = ev.target.result;
        this.imagePreviewFile = file;
        this.imagePreviewText = "";
        // Autofocus on the text input after image is loaded
        this.$nextTick(() => {
          if (this.$refs.imagePreviewTextInput) {
            this.$refs.imagePreviewTextInput.focus();
          }
        });
      };
      reader.readAsDataURL(file);

      e.target.value = "";
      this.showTools = false;
    },

    cancelImagePreview() {
      this.imagePreview = null;
      this.imagePreviewFile = null;
      this.imagePreviewText = "";
    },

    async sendImageWithText() {
      if (!this.imagePreviewFile) return;

      const file = this.imagePreviewFile;
      const imageText = this.imagePreviewText.trim();

      // Create temporary ID for optimistic message
      const tempId = `temp-img-${Date.now()}-${Math.random()}`;
      const tempCreatedAt = new Date();

      // Add optimistic message with tempId
      this.messages.push({
        sender: "me",
        image: this.imagePreview,
        text: imageText || null,
        time: tempCreatedAt.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: tempCreatedAt,
        tempId, // Mark as temporary
      });

      this.cancelImagePreview();
      this.scrollToBottom();

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (data.imageUrl) {
          await this.sendImageMessage(data.imageUrl, imageText);
        }
      } catch (e) {
        // Remove optimistic message on error
        const index = this.messages.findIndex((m) => m.tempId === tempId);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
        this.toast?.showError("שגיאה בהעלאת התמונה");
      }
    },

    async sendImageMessage(imageUrl, text = null) {
      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      try {
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          imageUrl,
          text: text || undefined,
          senderId: userId,
          isHandyman: this.isHandyman,
        });
      } catch (e) {
        this.toast?.showError("שגיאה בשליחת התמונה");
      }
    },

    openImage(src) {
      this.imageModal = src;
    },

    async updateStatus(newStatus) {
      try {
        const endpoint = `/jobs/${newStatus.replaceAll("_", "-")}`;
        await axios.post(`${URL}${endpoint}`, {
          jobId: this.job._id || this.job.id,
          handymanId: this.job.handymanId,
        });

        // Show success message with status info
        const statusLabels = {
          on_the_way: "בדרך",
          in_progress: "הגעתי",
          done: "סיימתי",
        };
        const statusLabel = statusLabels[newStatus] || newStatus;
        this.toast.showSuccess(`הסטטוס עודכן ללקוח: ${statusLabel}`);

        // Add system message to chat to show status was updated
        const systemMessage = {
          sender: "system",
          text: `הסטטוס עודכן ללקוח: ${statusLabel}`,
          time: new Date().toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: new Date(),
          isSystem: true,
        };
        this.messages.push(systemMessage);
        this.scrollToBottom();

        this.$emit("status-updated", newStatus);
      } catch (err) {
        this.toast.showError("שגיאה בעדכון הסטטוס");
      }
    },

    async submitRating() {
      if (this.rating === 0) {
        this.toast.showError("אנא בחר דירוג");
        return;
      }
      try {
        const customerId = this.store?.user?._id || this.job?.clientId;
        if (!customerId) {
          this.toast.showError("לא ניתן לזהות את הלקוח");
          return;
        }

        await axios.post(`${URL}/jobs/rate`, {
          jobId: this.job._id || this.job.id,
          handymanId: this.job.handymanId,
          customerId,
          rating: this.rating,
          review: this.reviewText,
        });

        this.toast.showSuccess("הדירוג נשלח");
        this.ratingSubmitted = true;
        this.$emit("rating-submitted");
        const userId = this.store?.user?._id || this.$route.params.id;
        this.$router.push(
          `/Dashboard/${userId}/job-summary/${this.job._id || this.job.id}`
        );
      } catch (e) {
        this.toast.showError("שגיאה בשליחת הדירוג");
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.messagesContainer;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    async handleCancelJob() {
      try {
        const jobId = this.job._id || this.job.id;
        if (!jobId) return;

        const userId = this.store.user?._id || this.store.user?.id;
        if (!userId) {
          this.toast.showError("שגיאה: לא נמצא מזהה משתמש");
          return;
        }

        await axios.post(`${URL}/jobs/cancel`, { jobId, userId });

        this.toast.showSuccess("העבודה בוטלה והשביוץ בוטל");
        this.showCancelConfirmModal = false;
        this.$emit("cancel-job");
      } catch (e) {
        this.toast.showError("שגיאה בביטול העבודה");
        this.showCancelConfirmModal = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
$bg: #0b0b0f;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;

.chat {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: $bg;
  z-index: 1000;
  overflow: hidden;
}

/* Header */
.chat__header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba($orange, 0.14);
  flex-shrink: 0;
}

.chat__iconBtn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  font-size: 18px;
  display: grid;
  place-items: center;
}

.chat__headInfo {
  flex: 1;
  min-width: 0;
}

.chat__title {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat__subtitle {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 800;
  color: $muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat__headRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat__status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 1000;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  white-space: nowrap;
}

.chat__status.status--new {
  border-color: rgba($orange, 0.3);
  color: $orange;
}
.chat__status.status--move {
  border-color: rgba($orange2, 0.38);
  color: $orange2;
}
.chat__status.status--work {
  border-color: rgba(59, 130, 246, 0.45);
  color: #3b82f6;
}
.chat__status.status--done {
  border-color: rgba(16, 185, 129, 0.5);
  color: #10b981;
}

/* Menu */
.chat__menu {
  position: absolute;
  top: 58px;
  left: 10px;
  right: 10px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(15, 16, 20, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
}

.chat__menuItem {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 900;
  text-align: center;
}

.chat__menuItem--danger {
  border-color: rgba(239, 68, 68, 0.35);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

/* Action chips */
.chat__actions {
  display: flex;
  gap: 8px;
  padding: 10px 10px 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}

.chat__actions::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: 0 0 auto;
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip--primary {
  border-color: rgba($orange, 0.5);
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  color: #0b0c10;
}

.chip--ghost {
  border-color: rgba($orange, 0.18);
}

/* Stepper */
.chat__stepper {
  display: flex;
  gap: 10px;
  padding: 10px;
  overflow-x: auto;
  border-bottom: 1px solid rgba($orange, 0.1);
  background: rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}
.chat__stepper::-webkit-scrollbar {
  display: none;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: $text;
  flex: 0 0 auto;
}

.step__dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 1000;
  border: 2px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
}

.step.is-active .step__dot {
  border-color: rgba($orange, 0.8);
  background: rgba($orange, 0.16);
  color: $orange2;
}

.step.is-done .step__dot {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.16);
  color: #22c55e;
}

.step__label {
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

/* Rating */
.chat__rating {
  padding: 12px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba($orange, 0.14);
  flex-shrink: 0;
}

.chat__ratingTitle {
  color: $orange2;
  font-weight: 1000;
  margin-bottom: 8px;
  font-size: 13px;
}

.chat__stars {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}
.chat__stars input {
  display: none;
}
.star {
  font-size: 22px;
  opacity: 0.25;
  color: $orange2;
}
.star.is-on {
  opacity: 1;
}

.chat__review {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.16);
  color: $text;
  padding: 10px;
  font-weight: 800;
  font-size: 14px;
  outline: none;
  resize: vertical;
  margin-bottom: 10px;
  font-family: inherit;
}

.chat__rateBtn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.55);
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-weight: 1100;
}

/* Messages */
.chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
}

.chat__empty {
  margin: auto;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  font-size: 14px;
}

.msg {
  display: flex;
}
.msg.is-me {
  justify-content: flex-end;
}

.msg.is-system {
  justify-content: center;
  margin: 12px 0;
}

.bubble {
  max-width: 86%;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
}

.bubble--me {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  border-color: rgba($orange, 0.55);
  color: #0b0c10;
}

.bubble--system {
  background: rgba(255, 106, 0, 0.15);
  border-color: rgba(255, 106, 0, 0.3);
  color: rgba(255, 106, 0, 0.9);
  font-size: 12px;
  padding: 8px 12px;
  max-width: 70%;
  text-align: center;
}

.bubble__text {
  font-size: 14px;
  font-weight: 750;
  line-height: 1.5;
}
.bubble__meta {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  opacity: 0.75;
}
.bubble__time,
.bubble__tick {
  font-size: 9px;
  font-weight: 1000;
}

.bubble__imgBtn {
  border: 0;
  background: transparent;
  padding: 0;
  margin-bottom: 8px;
  width: 100%;
}
.bubble__img {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: block;
}

.bubble__loc {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  margin-bottom: 8px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.bubble__locMap {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
}
.bubble__locOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  font-weight: 1000;
  font-size: 12px;
  color: white;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.75),
    rgba(0, 0, 0, 0.25),
    transparent
  );
}

/* Composer */
.composer {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 10px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba($orange, 0.14);
  background: rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

.composer__plus {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 20px;
  display: grid;
  place-items: center;
}

.composer__input {
  flex: 1;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 0 14px;
  font-weight: 900;
  outline: none;
  font-size: 16px;
  font-family: inherit;
}

.composer__send {
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.55);
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-weight: 1100;
  font-size: 13px;
}

.composer__send:disabled {
  opacity: 0.55;
}

.composer__preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0; // Allow flex shrinking
}
.composer__previewTop {
  position: relative;
  width: 100%;
  max-width: 220px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
  flex-shrink: 0; // Don't shrink the image
}
.composer__previewImg {
  width: 100%;
  display: block;
  max-height: 200px;
  object-fit: cover;
}
.composer__previewClose {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 1000;
}

// Ensure the input inside preview is at least the same size as regular input, but taller
.composer__preview .composer__input {
  flex: 1;
  min-width: 0; // Allow flex shrinking
  width: 100%; // Take full width of parent
  height: 50px; // Taller than regular input (42px)
  min-height: 50px; // Ensure minimum height
}

/* Tools sheet */
.toolsSheet {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 10050;
  display: flex;
  align-items: flex-end;
}

.toolsSheet__card {
  width: 100%;
  border-radius: 18px 18px 0 0;
  background: rgba(15, 16, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolsSheet__item,
.toolsSheet__close {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
  text-align: center;
}
.toolsSheet__close {
  border-color: rgba(255, 255, 255, 0.12);
}

/* Modals */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal__card {
  position: relative;
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  overflow: hidden;
}
.modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-weight: 1000;
  z-index: 2;
}
.modal__img {
  width: 100%;
  display: block;
}

/* Confirm */
.confirm {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  background: rgba(15, 16, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 18px;
  text-align: center;
}
.confirm__title {
  color: #fff;
  font-weight: 1000;
  font-size: 18px;
  margin-bottom: 10px;
}
.confirm__text {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 14px;
}
.confirm__actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.confirm__btn {
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
}
.confirm__btn--danger {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.14);
  color: #ef4444;
}

/* Navigation Modal */
.navModal {
  background: rgba(15, 16, 20, 0.98);
  border-radius: 20px;
  padding: 24px;
  max-width: 90%;
  width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.navModal__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  text-align: center;
  margin-bottom: 20px;
}

.navModal__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.navModal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid;
  font-size: 16px;
  font-weight: 900;
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: center;
}

.navModal__btn--waze {
  background: rgba(118, 186, 153, 0.15);
  border-color: rgba(118, 186, 153, 0.4);
  color: #76ba99;
}

.navModal__btn--waze:active {
  background: rgba(118, 186, 153, 0.25);
  transform: scale(0.98);
}

.navModal__btn--google {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.4);
  color: #4285f4;
}

.navModal__btn--google:active {
  background: rgba(66, 133, 244, 0.25);
  transform: scale(0.98);
}

.navModal__btnIcon {
  font-size: 20px;
}

.navModal__btnText {
  font-weight: 900;
}

.navModal__cancel {
  margin-top: 8px;
  padding: 14px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.navModal__cancel:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.98);
}

/* Location card */
.locCard {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  overflow: hidden;
  background: $bg;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.locCard__close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-weight: 1000;
  z-index: 2;
}
.locCard__map {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
.locCard__body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.locCard__title {
  color: $orange2;
  font-weight: 1000;
}
.locCard__coords {
  font-family: monospace;
  font-size: 11px;
  opacity: 0.75;
  color: $text;
}
.locCard__btn {
  padding: 12px;
  border-radius: 14px;
  text-decoration: none;
  text-align: center;
  font-weight: 1000;
  border: 1px solid;
}
.locCard__btn--waze {
  background: rgba(118, 186, 153, 0.15);
  border-color: rgba(118, 186, 153, 0.4);
  color: #76ba99;
}
.locCard__btn--gm {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.4);
  color: #4285f4;
}
</style>
