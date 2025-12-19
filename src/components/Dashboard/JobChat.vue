<template>
  <section class="lux" dir="rtl">
    <!-- Top bar -->
    <header class="luxTop">
      <div class="luxTop__left">
        <div class="luxTop__title">צ'אט עבודה</div>
        <div class="luxTop__meta">
          <span class="luxTop__name">{{
            isHandyman ? clientName : handymanName
          }}</span>
          <span class="luxTop__sep">•</span>
          <span class="luxTop__sub">{{
            jobInfo?.subcategoryInfo?.name || "עבודה"
          }}</span>
        </div>
      </div>

      <div class="luxTop__right">
        <span class="statusPill" :class="'statusPill--' + chipTone">
          <span class="statusPill__dot"></span>
          {{ statusLabel }}
        </span>

        <!-- Navigation buttons for handyman -->
        <div v-if="isHandyman" class="luxTop__nav">
          <button
            class="navBtn"
            type="button"
            @click="$emit('open-profile')"
            aria-label="פרופיל"
            title="פרופיל"
          >
            👤
          </button>
        </div>

        <!-- Cancel job button with confirmation -->
        <button
          v-if="!showCancelConfirm"
          class="iconBtn"
          type="button"
          @click="showCancelConfirm = true"
          aria-label="ביטול עבודה"
          title="בטל עבודה"
        >
          🗑️
        </button>
        <div v-else class="cancelConfirm">
          <span class="cancelConfirm__text">בטוח?</span>
          <button
            class="cancelConfirm__btn cancelConfirm__btn--yes"
            type="button"
            @click="handleCancelJob"
          >
            כן
          </button>
          <button
            class="cancelConfirm__btn cancelConfirm__btn--no"
            type="button"
            @click="showCancelConfirm = false"
          >
            לא
          </button>
        </div>

        <button
          class="iconBtn"
          type="button"
          @click="$emit('close')"
          aria-label="סגירה"
        >
          ✕
        </button>
      </div>
    </header>

    <!-- Layout -->
    <div class="luxGrid">
      <!-- Side card -->
      <aside class="sideCard">
        <div class="sideCard__hero">
          <div class="sideCard__badge">קריאה</div>
          <div class="sideCard__headline">
            {{ jobInfo?.subcategoryInfo?.name || "עבודה" }}
          </div>
          <div class="sideCard__desc">
            סטטוס: <b>{{ statusLabel }}</b>
          </div>
        </div>

        <div class="sideCard__body">
          <div class="infoRow">
            <div class="infoRow__k">לקוח</div>
            <div class="infoRow__v">{{ clientName }}</div>
          </div>
          <div class="infoRow">
            <div class="infoRow__k">הנדימן</div>
            <div class="infoRow__v">{{ handymanName }}</div>
          </div>
          <div class="infoRow" v-if="jobInfo?.price">
            <div class="infoRow__k">מחיר</div>
            <div class="infoRow__v">
              <span class="money">{{ jobInfo.price }}</span>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Step timeline (different style) -->
          <div class="timeline">
            <div
              v-for="(step, i) in jobSteps"
              :key="step.status"
              class="tlItem"
              :class="{
                'is-active': step.status === jobStatus,
                'is-done': isStepCompleted(step.status),
              }"
            >
              <div class="tlItem__rail">
                <div class="tlItem__node">
                  <span v-if="isStepCompleted(step.status)">✓</span>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <div
                  v-if="i !== jobSteps.length - 1"
                  class="tlItem__line"
                ></div>
              </div>
              <div class="tlItem__txt">
                <div class="tlItem__label">{{ step.label }}</div>
                <div class="tlItem__hint">{{ stepHint(step.status) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Handyman status control (segmented) -->
        <div v-if="isHandyman && showStatusButtons" class="segWrap">
          <div class="seg">
            <button
              class="seg__btn"
              :class="{ 'is-on': jobStatus === 'assigned' }"
              type="button"
              @click="updateStatus('on_the_way')"
              v-if="jobStatus === 'assigned'"
            >
              🚗 בדרך
            </button>

            <button
              class="seg__btn"
              :class="{ 'is-on': jobStatus === 'on_the_way' }"
              type="button"
              @click="updateStatus('in_progress')"
              v-if="jobStatus === 'on_the_way'"
            >
              📍 הגעתי
            </button>

            <button
              class="seg__btn"
              :class="{ 'is-on': jobStatus === 'in_progress' }"
              type="button"
              @click="updateStatus('done')"
              v-if="jobStatus === 'in_progress'"
            >
              ✅ סיימתי
            </button>
          </div>
          <div class="segTip">עדכון סטטוס שולח התראה ללקוח</div>
        </div>
      </aside>

      <!-- Chat panel -->
      <main class="chatPanel">
        <!-- Rating overlay card (client only) -->
        <div
          v-if="!isHandyman && jobStatus === 'done' && !ratingSubmitted"
          class="rateCard"
        >
          <div class="rateCard__title">דרג את ההנדימן</div>
          <div class="rating">
            <template v-for="s in 5" :key="s">
              <input
                :value="s"
                :id="`star${s}`"
                name="rating"
                type="radio"
                :checked="rating === s"
                @change="rating = s"
              />
              <label
                :title="`${s} כוכבים`"
                :for="`star${s}`"
                @mouseenter="hoverRating = s"
                @mouseleave="hoverRating = 0"
              >
                <svg
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  stroke-width="2"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                  height="35"
                  width="35"
                  xmlns="http://www.w3.org/2000/svg"
                  class="svgOne"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  ></polygon>
                </svg>
                <svg
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  stroke-width="2"
                  stroke="rgba(255, 106, 0, 0)"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  height="35"
                  width="35"
                  xmlns="http://www.w3.org/2000/svg"
                  class="svgTwo"
                  :class="{
                    'is-filled':
                      (hoverRating > 0 && s <= hoverRating) ||
                      (hoverRating === 0 && rating >= s),
                  }"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  ></polygon>
                </svg>
                <div
                  class="ombre"
                  :class="{
                    'is-visible':
                      (hoverRating > 0 && s >= hoverRating) ||
                      (hoverRating === 0 && rating >= s),
                  }"
                ></div>
              </label>
            </template>
          </div>
          <textarea
            v-model="reviewText"
            class="rateCard__txt"
            rows="3"
            placeholder="משהו קצר (אופציונלי)"
          ></textarea>
          <button class="cta" type="button" @click="submitRating">
            שלח דירוג
          </button>
        </div>

        <!-- Messages -->
        <div class="msgs" ref="messagesContainer">
          <div v-if="!messages.length" class="empty">
            עדיין אין הודעות. תתחילו 🙂
          </div>

          <div
            v-for="(m, i) in messages"
            :key="i"
            class="msgRow"
            :class="{
              'is-me': m.sender === 'me',
              'is-other': m.sender === 'other',
            }"
          >
            <div class="bubble" :class="{ 'bubble--img': !!m.image }">
              <div v-if="m.text" class="bubble__text">{{ m.text }}</div>

              <button
                v-if="m.image"
                type="button"
                class="bubble__imgBtn"
                @click="openImage(m.image)"
              >
                <img :src="m.image" class="bubble__img" alt="תמונה" />
              </button>

              <div class="bubble__meta">
                <span class="bubble__time">{{ m.time }}</span>
                <span v-if="m.sender === 'me'" class="bubble__tick">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Composer (WhatsApp-ish but premium) -->
        <div class="composer">
          <button
            class="pillBtn"
            type="button"
            @click="toggleTools"
            aria-label="כלים"
          >
            <span class="pillBtn__plus">＋</span>
          </button>

          <div v-if="showTools" class="tools" @click.self="showTools = false">
            <button class="tool" type="button" @click="triggerFile">
              <span class="tool__ic">📷</span>
              <span class="tool__t">תמונה</span>
            </button>
            <button class="tool" type="button" @click="sendQuick('אני בדרך')">
              <span class="tool__ic">🚗</span>
              <span class="tool__t">אני בדרך</span>
            </button>
            <button class="tool" type="button" @click="sendQuick('הגעתי')">
              <span class="tool__ic">📍</span>
              <span class="tool__t">הגעתי</span>
            </button>
          </div>

          <input
            v-model="newMessage"
            class="composer__input"
            type="text"
            placeholder="הקלד הודעה…"
            @keyup.enter="sendMessage"
          />

          <button
            class="sendCta"
            type="button"
            @click="sendMessage"
            :disabled="!newMessage.trim()"
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
      </main>
    </div>

    <!-- Image modal -->
    <div v-if="imageModal" class="imgModal" @click.self="imageModal = null">
      <div class="imgModal__card">
        <button class="imgModal__x" type="button" @click="imageModal = null">
          ✕
        </button>
        <img :src="imageModal" class="imgModal__img" alt="preview" />
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
  name: "JobChatLux",
  props: {
    job: { type: Object, required: true },
    isHandyman: { type: Boolean, default: false },
  },
  emits: [
    "close",
    "status-updated",
    "rating-submitted",
    "open-profile",
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
      hoverRating: 0, // Track which star is being hovered
      reviewText: "",
      ratingSubmitted: false,
      imageModal: null,
      showTools: false,
      socket: null,
      localJobStatus: null, // Local copy of job status for real-time updates
      showCancelConfirm: false,
    };
  },
  computed: {
    jobStatus() {
      // Use local status if available (from WebSocket), otherwise use prop
      return this.localJobStatus || this.job?.status || "open";
    },
    showStatusButtons() {
      return ["assigned", "on_the_way", "in_progress"].includes(this.jobStatus);
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
    jobSteps() {
      return [
        { status: "assigned", label: "שובצה" },
        { status: "on_the_way", label: "בדרך" },
        { status: "in_progress", label: "בביצוע" },
        { status: "done", label: "הושלמה" },
      ];
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
  },
  created() {
    this.toast = useToast();
    // Initialize local job status
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
    // Watch for job prop changes
    "job.status"(newStatus) {
      if (newStatus && !this.localJobStatus) {
        this.localJobStatus = newStatus;
      }
    },
    messages: {
      deep: true,
      handler() {
        this.scrollToBottom();
      },
    },
  },
  methods: {
    initWebSocket() {
      if (!this.job?.id && !this.job?._id) return;

      const jobId = this.job.id || this.job._id;

      // Connect to WebSocket server
      this.socket = io(URL, {
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        // Join the job room
        this.socket.emit("join-job", String(jobId));
      });

      this.socket.on("disconnect", () => {
        // Handle disconnect if needed
      });

      // Listen for job status updates
      this.socket.on("job-status-updated", (data) => {
        // Compare jobId as strings to handle ObjectId vs string
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          this.localJobStatus = data.status;
          // Emit event to parent component to update the job
          this.$emit("status-updated", data.status);
        }
      });

      // Listen for new messages
      this.socket.on("new-message", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && data.message) {
          this.addMessageToUI(data.message);
        }
      });

      // Listen for rating submitted
      this.socket.on("rating-submitted", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          // If handyman, close the chat
          if (this.isHandyman) {
            this.$emit("close");
          }
        }
      });

      this.socket.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    },

    disconnectWebSocket() {
      if (this.socket) {
        const jobId = this.job?.id || this.job?._id;
        if (jobId) {
          this.socket.emit("leave-job", jobId);
        }
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
          // Convert DB messages to UI format
          this.messages = data.messages.map((msg) => {
            const isFromHandyman = !!msg.handyman || !!msg.handymanImage;
            const sender = this.isHandyman
              ? isFromHandyman
                ? "me"
                : "other"
              : isFromHandyman
              ? "other"
              : "me";
            const text = msg.handyman || msg.customer || "";
            const image = msg.handymanImage || msg.customerImage || null;
            const createdAt = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date();
            return {
              sender,
              text,
              image,
              time: createdAt.toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt,
            };
          });
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        this.toast?.showError("שגיאה בטעינת הודעות");
      }
    },

    addMessageToUI(messageObj) {
      // Determine sender: if handyman sent, for handyman it's "me", for customer it's "other"
      const isFromHandyman =
        !!messageObj.handyman || !!messageObj.handymanImage;
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
      const createdAt = messageObj.createdAt
        ? new Date(messageObj.createdAt)
        : new Date();

      // Check if message already exists (avoid duplicates)
      const exists = this.messages.some(
        (m) =>
          ((m.text === text && text) || (m.image === image && image)) &&
          m.sender === sender &&
          Math.abs(
            new Date(m.createdAt || m.time).getTime() - createdAt.getTime()
          ) < 2000
      );

      if (!exists) {
        this.messages.push({
          sender,
          text,
          image,
          time: createdAt.toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt,
        });
        this.scrollToBottom();
      }
    },

    stepHint(s) {
      const h = {
        assigned: "הקריאה שובצה להנדימן",
        on_the_way: "בדרך אל הלקוח",
        in_progress: "מתבצעת עבודה בשטח",
        done: "העבודה הסתיימה",
      };
      return h[s] || "";
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

    toggleTools(e) {
      e?.stopPropagation?.();
      this.showTools = !this.showTools;
    },

    onOutsideTools(e) {
      const inside = e?.target?.closest?.(".composer");
      if (!inside) this.showTools = false;
    },

    triggerFile() {
      this.showTools = false;
      this.$refs.fileInput?.click();
    },

    sendQuick(text) {
      this.showTools = false;
      this.newMessage = text;
      this.sendMessage();
    },

    async sendMessage() {
      const t = this.newMessage.trim();
      if (!t) return;

      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      // Get current user ID from store
      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      // Optimistically add message to UI
      const tempMessage = {
        sender: "me",
        text: t,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
      };
      this.messages.push(tempMessage);
      this.newMessage = "";
      this.scrollToBottom();

      try {
        // Send to server
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          text: t,
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Message will be added via WebSocket, but we already added it optimistically
        // The WebSocket handler will check for duplicates
      } catch (error) {
        console.error("Error sending message:", error);
        // Remove the optimistic message on error
        const index = this.messages.findIndex(
          (m) =>
            m.text === t &&
            m.sender === "me" &&
            m.createdAt === tempMessage.createdAt
        );
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
        this.toast?.showError("שגיאה בשליחת ההודעה");
      }
    },

    async handleFileSelect(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        this.toast?.showError("יש לבחור קובץ תמונה בלבד");
        e.target.value = "";
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toast?.showError("הקובץ גדול מדי. מקסימום 5MB");
        e.target.value = "";
        return;
      }

      // Show preview while uploading
      const reader = new FileReader();
      reader.onload = (ev) => {
        const tempMessage = {
          sender: "me",
          image: ev.target.result, // Preview
          time: new Date().toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: new Date(),
          uploading: true, // Mark as uploading
        };
        this.messages.push(tempMessage);
        this.scrollToBottom();
      };
      reader.readAsDataURL(file);

      try {
        // Upload to server
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (data.imageUrl) {
          // Find the temp message and update it with the real URL
          const tempIndex = this.messages.findIndex(
            (m) => m.uploading && m.sender === "me"
          );
          if (tempIndex !== -1) {
            const tempMessage = this.messages[tempIndex];
            // Send the image message to server
            await this.sendImageMessage(data.imageUrl);
            // Update the message with the real URL and remove uploading flag
            this.messages[tempIndex] = {
              ...tempMessage,
              image: data.imageUrl,
              uploading: false,
            };
          }
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        // Remove the temp message on error
        const tempIndex = this.messages.findIndex(
          (m) => m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          this.messages.splice(tempIndex, 1);
        }
        this.toast?.showError("שגיאה בהעלאת התמונה");
      }

      e.target.value = "";
    },

    async sendImageMessage(imageUrl) {
      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      // Get current user ID from store
      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      try {
        // Send to server
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          imageUrl: imageUrl,
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Message will be added via WebSocket, but we already added it optimistically
      } catch (error) {
        console.error("Error sending image message:", error);
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
        this.toast.showSuccess("הסטטוס עודכן");
        this.$emit("status-updated", newStatus);
      } catch (err) {
        this.toast.showError("שגיאה בעדכון הסטטוס");
        console.error(err);
      }
    },

    async submitRating() {
      if (this.rating === 0) {
        this.toast.showError("אנא בחר דירוג");
        return;
      }
      try {
        // Get current user ID (customer)
        const customerId = this.store?.user?._id || this.job?.clientId;
        if (!customerId) {
          this.toast.showError("לא ניתן לזהות את הלקוח");
          return;
        }

        await axios.post(`${URL}/jobs/rate`, {
          jobId: this.job._id || this.job.id,
          handymanId: this.job.handymanId,
          customerId: customerId,
          rating: this.rating,
          review: this.reviewText,
        });
        this.toast.showSuccess("הדירוג נשלח");
        this.ratingSubmitted = true;
        this.$emit("rating-submitted");
      } catch (err) {
        this.toast.showError("שגיאה בשליחת הדירוג");
        console.error(err);
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

        await axios.post(`${URL}/jobs/cancel`, {
          jobId,
        });

        this.toast.showSuccess("העבודה בוטלה");
        this.showCancelConfirm = false;
        this.$emit("cancel-job");
        this.$emit("close");
      } catch (error) {
        console.error("Error cancelling job:", error);
        this.toast.showError("שגיאה בביטול העבודה");
        this.showCancelConfirm = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
/* black/gray/orange – “lux” style */
$bg: #08090c;
$panel: rgba(255, 255, 255, 0.06);
$panel2: rgba(255, 255, 255, 0.085);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;

.lux {
  grid-column: 1 / -1;
  justify-self: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.18);
  background: radial-gradient(
      900px 420px at 10% 0%,
      rgba($orange, 0.12),
      transparent 55%
    ),
    radial-gradient(
      1100px 520px at 90% 10%,
      rgba(255, 255, 255, 0.06),
      transparent 60%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.28));
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.62);
  min-height: 640px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 0;
    min-height: 100vh;
    max-height: 100vh;
  }
}

.luxTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px;
  border-bottom: 1px solid rgba($orange, 0.14);
  background: linear-gradient(180deg, $panel2, $panel);
}
.luxTop__title {
  font-size: 20px;
  font-weight: 1100;
  color: $text;
}
.luxTop__meta {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  display: flex;
  gap: 8px;
}
.luxTop__name {
  color: rgba(255, 255, 255, 0.82);
}
.luxTop__sep {
  opacity: 0.7;
}
.luxTop__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.iconBtn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.24);
  color: $text;
  cursor: pointer;
}
.iconBtn:hover {
  border-color: rgba($orange, 0.35);
  box-shadow: 0 10px 24px rgba($orange, 0.12);
}

.statusPill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  font-size: 12px;
  font-weight: 1000;
}
.statusPill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.06);
}
.statusPill--new {
  border-color: rgba($orange, 0.3);
}
.statusPill--new .statusPill__dot {
  background: $orange;
  box-shadow: 0 0 0 4px rgba($orange, 0.12);
}
.statusPill--move {
  border-color: rgba($orange2, 0.38);
}
.statusPill--move .statusPill__dot {
  background: $orange2;
  box-shadow: 0 0 0 4px rgba($orange2, 0.12);
}
.statusPill--work {
  border-color: rgba(59, 130, 246, 0.45);
}
.statusPill--work .statusPill__dot {
  background: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}
.statusPill--done {
  border-color: rgba(16, 185, 129, 0.5);
}
.statusPill--done .statusPill__dot {
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
}

.luxGrid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px 1fr;
}
@media (max-width: 980px) {
  .luxGrid {
    grid-template-columns: 1fr;
  }
  .sideCard {
    display: none;
  }
}

.sideCard {
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.34));
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.sideCard__hero {
  border-radius: 18px;
  padding: 14px 14px;
  background: radial-gradient(
      500px 220px at 30% 0%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.16);
}
.sideCard__badge {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 1000;
  color: #0b0c10;
  background: linear-gradient(135deg, $orange, $orange2);
}
.sideCard__headline {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 1100;
  color: $text;
}
.sideCard__desc {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: $muted;
}
.sideCard__body {
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: auto;
}
.infoRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.infoRow__k {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  font-size: 12px;
}
.infoRow__v {
  color: $text;
  font-weight: 1000;
  font-size: 12px;
}
.money {
  color: $orange;
}
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 10px 0 12px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tlItem {
  display: flex;
  gap: 10px;
}
.tlItem__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tlItem__node {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 1000;
}
.tlItem__line {
  width: 2px;
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  margin-top: 6px;
  border-radius: 10px;
}
.tlItem__txt {
  padding-top: 2px;
}
.tlItem__label {
  color: $text;
  font-weight: 1000;
  font-size: 12px;
}
.tlItem__hint {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 800;
  font-size: 11px;
}
.tlItem.is-active .tlItem__node {
  background: linear-gradient(135deg, $orange, $orange2);
  border-color: rgba($orange, 0.55);
  color: #0b0c10;
  box-shadow: 0 0 16px rgba($orange, 0.25);
}
.tlItem.is-done .tlItem__node {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: rgba(16, 185, 129, 0.55);
  color: #fff;
}

.segWrap {
  margin-top: auto;
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.seg {
  display: flex;
  gap: 10px;
}
.seg__btn {
  flex: 1;
  padding: 15px 30px;
  border-radius: 30px;
  border: 2px solid rgba($orange, 0.25);
  background-color: rgba(0, 0, 0, 0.28);
  color: $text;
  font-size: 1.1rem;
  font-weight: 1100;
  cursor: pointer;
  transition: all 0.4s ease;
  outline: none;
  position: relative;
  overflow: hidden;
}

.seg__btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba($orange, 0.25) 0%,
    rgba($orange, 0) 70%
  );
  transform: scale(0);
  transition: transform 0.5s ease;
}

.seg__btn:hover::after {
  transform: scale(4);
}

.seg__btn:hover {
  border-color: rgba($orange, 0.5);
  background: rgba($orange, 0.08);
}

.seg__btn.is-on {
  border-color: rgba($orange, 0.6);
  background: linear-gradient(135deg, rgba($orange, 0.2), rgba($orange2, 0.15));
  color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 16px rgba($orange, 0.3);
}

.seg__btn.is-on::after {
  background: radial-gradient(
    circle,
    rgba($orange2, 0.3) 0%,
    rgba($orange, 0) 70%
  );
}
.segTip {
  margin-top: 10px;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);
}

/* Chat Panel */
.chatPanel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.rateCard {
  margin: 14px 14px 0 14px;
  padding: 14px;
  border-radius: 18px;
  background: radial-gradient(
      700px 260px at 50% 0%,
      rgba($orange, 0.16),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.16);
}
.rateCard__title {
  color: $orange;
  font-weight: 1100;
  font-size: 14px;
}
.rating {
  display: flex;
  flex-direction: row-reverse;
  gap: 0.3rem;
  justify-content: center;
  margin: 10px 0;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.rating input {
  display: none;
}

.rating label .svgOne {
  stroke: rgba(255, 255, 255, 0.3);
  fill: rgba(255, 106, 0, 0);
  transition: stroke 0.5s ease, fill 0.5s ease;
  color: rgba(255, 255, 255, 0.3);
}

.rating label .svgTwo {
  position: absolute;
  top: -1px;
  fill: $orange;
  stroke: rgba(255, 106, 0, 0);
  opacity: 0;
  transition: stroke 0.5s ease, fill 0.5s ease, opacity 0.5s ease;
  color: $orange;
}

.rating label {
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3px;
  transition: all 0.5s ease;
}

/* כוכבים שנבחרו או שעליהם עוברים */
.rating label:hover .svgOne {
  stroke: $orange;
  color: $orange;
}

/* כשנבחר כוכב, כל הכוכבים עד הכוכב שנבחר (כולל) נצבעים */
.rating input:checked ~ label .svgOne {
  stroke: rgba(255, 106, 0, 0);
  color: rgba(255, 106, 0, 0);
}

.rating label .svgTwo.is-filled {
  transform: rotateX(0deg) rotateY(0deg) translateY(0px);
  opacity: 1;
  animation: displayStar 0.5s cubic-bezier(0.75, 0.41, 0.82, 1.2);
}

.rating label .ombre.is-visible {
  opacity: 1;
}

@keyframes displayStar {
  0% {
    transform: rotateX(100deg) rotateY(100deg) translateY(10px);
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg) translateY(0px);
  }
}

.ombre {
  background: radial-gradient(
    ellipse closest-side,
    rgba($orange, 0.4),
    rgba(255, 106, 0, 0)
  );
  width: 30px;
  height: 8px;
  opacity: 0;
  transition: opacity 0.6s ease 0.2s;
}

/* כוכבים שנבחרו או שעליהם עוברים */
.rating label:hover .ombre,
.rating label:hover ~ label .ombre {
  opacity: 0.3;
}

.rating input:checked ~ label .ombre {
  opacity: 1;
}

/* אנימציה של רעד רק ב-hover */
.rating label:hover .svgTwo:hover {
  animation: chackStar 0.6s ease-out, displayStar none 1s;
}

@keyframes chackStar {
  0% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(20deg);
  }
  80% {
    transform: rotate(-20deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
.rateCard__txt {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.16);
  color: $text;
  padding: 12px 12px;
  font-weight: 800;
  outline: none;
  resize: vertical;
}
.cta {
  margin-top: 10px;
  width: 100%;
  position: relative;
  height: 3.5em;
  border: 3px ridge $orange;
  outline: none;
  background-color: transparent;
  color: $text;
  transition: 1s;
  border-radius: 0.3em;
  font-size: 16px;
  font-weight: 1100;
  cursor: pointer;
}

.cta::after {
  content: "";
  position: absolute;
  top: -10px;
  left: 3%;
  width: 95%;
  height: 40%;
  background-color: $bg;
  transition: 0.5s;
  transform-origin: center;
}

.cta::before {
  content: "";
  transform-origin: center;
  position: absolute;
  top: 80%;
  left: 3%;
  width: 95%;
  height: 40%;
  background-color: $bg;
  transition: 0.5s;
}

.cta:hover::before,
.cta:hover::after {
  transform: scale(0);
}

.cta:hover {
  box-shadow: inset 0px 0px 25px $orange;
}

.msgs {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 16px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.empty {
  margin: auto;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
}

.msgRow {
  display: flex;
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 12px 12px 10px 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
}
.msgRow.is-me .bubble {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  border-color: rgba($orange, 0.55);
  color: #0b0c10;
}
.msgRow.is-other .bubble {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: $text;
}
.bubble__text {
  font-size: 14px;
  font-weight: 750;
  line-height: 1.55;
}
.bubble__meta {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.bubble__time {
  font-size: 10px;
  font-weight: 1000;
  opacity: 0.65;
}
.bubble__tick {
  font-size: 10px;
  font-weight: 1100;
  opacity: 0.75;
}

.bubble__imgBtn {
  border: 0;
  background: transparent;
  padding: 10px 0 0 0;
  cursor: pointer;
  width: 100%;
}
.bubble__img {
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: block;
}

/* Composer */
.composer {
  position: sticky;
  bottom: 0;
  padding: 12px 12px;
  border-top: 1px solid rgba($orange, 0.14);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  gap: 10px;
  align-items: center;
}
.pillBtn {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
}
.pillBtn:hover {
  border-color: rgba($orange, 0.42);
  background: rgba($orange, 0.1);
}
.pillBtn__plus {
  font-size: 22px;
  font-weight: 1100;
}

.tools {
  position: absolute;
  bottom: 70px;
  right: 12px;
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 16, 20, 0.92);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.55);
}
.tool {
  width: 96px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-weight: 1000;
}
.tool:hover {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 10px 22px rgba($orange, 0.1);
}
.tool__ic {
  font-size: 18px;
}
.tool__t {
  font-size: 11px;
  opacity: 0.9;
}

.composer__input {
  flex: 1;
  height: 46px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 0 16px;
  font-weight: 900;
  outline: none;
}
.composer__input:focus {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 0 0 3px rgba($orange, 0.18);
}

.sendCta {
  height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.55);
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-weight: 1100;
  cursor: pointer;
}
.sendCta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Modal */
.imgModal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}
.imgModal__card {
  width: min(980px, 96vw);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(14, 14, 18, 0.92);
  position: relative;
}
.imgModal__x {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  color: $text;
  cursor: pointer;
  font-weight: 1100;
}
.imgModal__img {
  width: 100%;
  height: auto;
  display: block;
}
</style>
