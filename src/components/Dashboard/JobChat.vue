<template>
  <section class="lux" dir="rtl">
    <!-- Top bar -->
    <header class="luxTop">
      <div class="luxTop__left">
        <div class="luxTop__title">צ'אט עבודה</div>
        <div class="luxTop__meta">
          <span class="luxTop__name">{{
            isHandyman ? clientName : getHandymanName()
          }}</span>
          <span class="luxTop__sep">•</span>
          <span class="luxTop__sub">{{ getJobDisplayName() || "עבודה" }}</span>
        </div>
      </div>

      <div class="luxTop__right">
        <span class="statusPill" :class="'statusPill--' + chipTone">
          <span class="statusPill__dot"></span>
          {{ statusLabel }}
        </span>

        <!-- Navigation buttons for handyman -->
        <div v-if="isHandyman" class="luxTop__nav">
          <!-- Navigation to job location -->
          <template v-if="jobLocation">
            <a
              :href="getWazeUrl(jobLocation)"
              target="_blank"
              rel="noopener noreferrer"
              class="navBtn navBtn--waze"
              title="נווט בווייז"
              aria-label="נווט בווייז"
            >
              <span class="navBtn__text">לניווט בוויז</span>
              <span class="navBtn__icon">📍</span>
            </a>
            <a
              :href="getGoogleMapsUrl(jobLocation)"
              target="_blank"
              rel="noopener noreferrer"
              class="navBtn navBtn--google"
              title="נווט בגוגל מפות"
              aria-label="נווט בגוגל מפות"
            >
              <span class="navBtn__text">לניווט בגוגל</span>
              <span class="navBtn__icon">🗺️</span>
            </a>
          </template>
        </div>

        <!-- Cancel job button (for both handyman and client) -->
        <button
          class="cancelJobBtn"
          type="button"
          @click="showCancelConfirmModal = true"
          aria-label="ביטול עבודה"
          title="בטל עבודה"
        >
          בטל עבודה
        </button>

        <button
          class="iconBtn iconBtn--minimize"
          type="button"
          @click="$emit('minimize')"
          aria-label="מזער"
          title="מזער"
        >
          ➖
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
            {{ getJobDisplayName() || "עבודה" }}
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

        <!-- Client location button -->
        <div v-if="!isHandyman && showStatusButtons" class="segWrap">
          <button
            class="seg__btn seg__btn--full"
            type="button"
            @click="sendLocation"
          >
            📍 שלח מיקום
          </button>
          <div class="segTip">שליחת המיקום שלך להנדימן</div>
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
            <div
              class="bubble"
              :class="{
                'bubble--img': !!m.image,
                'bubble--location': !!m.location,
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

              <div v-if="m.location" class="bubble__location">
                <button
                  type="button"
                  class="bubble__locationPreview"
                  @click.stop="openLocationModal(m.location)"
                >
                  <img
                    :src="getLocationMapImage(m.location)"
                    alt="מיקום"
                    class="bubble__locationMap"
                    @error="onMapImageError"
                  />
                  <div class="bubble__locationOverlay">
                    <span class="bubble__locationIcon">📍</span>
                    <span class="bubble__locationText">מיקום שלי</span>
                  </div>
                </button>
              </div>

              <div v-if="m.text" class="bubble__text">{{ m.text }}</div>

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
            <button class="tool" type="button" @click="sendLocation">
              <span class="tool__ic">📍</span>
              <span class="tool__t">מיקום</span>
            </button>
            <button class="tool" type="button" @click="sendQuick('אני בדרך')">
              <span class="tool__ic">🚗</span>
              <span class="tool__t">אני בדרך</span>
            </button>
            <button class="tool" type="button" @click="sendQuick('הגעתי')">
              <span class="tool__ic">✅</span>
              <span class="tool__t">הגעתי</span>
            </button>
          </div>

          <!-- Image preview with text input (WhatsApp style) -->
          <div v-if="imagePreview" class="imagePreview">
            <div class="imagePreview__preview">
              <img :src="imagePreview" alt="תמונה" class="imagePreview__img" />
              <button
                class="imagePreview__close"
                type="button"
                @click="cancelImagePreview"
                aria-label="ביטול"
              >
                ✕
              </button>
            </div>
            <input
              v-model="imagePreviewText"
              class="composer__input imagePreview__input"
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
            v-if="imagePreview"
            class="sendCta"
            type="button"
            @click="sendImageWithText"
          >
            שלח
          </button>
          <button
            v-else
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

    <!-- Cancel Job Confirmation Modal -->
    <div
      v-if="showCancelConfirmModal"
      class="cancelConfirmModal"
      dir="rtl"
      @click.self="showCancelConfirmModal = false"
    >
      <div class="cancelConfirmModal__content">
        <h2 class="cancelConfirmModal__title">ביטול עבודה</h2>
        <p class="cancelConfirmModal__message">
          האם אתה בטוח שברצונך לבטל את העבודה?
        </p>
        <div class="cancelConfirmModal__actions">
          <button
            class="cancelConfirmModal__btn cancelConfirmModal__btn--no"
            type="button"
            @click="showCancelConfirmModal = false"
          >
            לא
          </button>
          <button
            class="cancelConfirmModal__btn cancelConfirmModal__btn--yes"
            type="button"
            @click="handleCancelJob"
          >
            כן, בטל
          </button>
        </div>
      </div>
    </div>

    <!-- Location modal (WhatsApp style) -->
    <div
      v-if="locationModal"
      class="locationModal"
      @click.self="locationModal = null"
    >
      <div class="locationModal__card">
        <button
          class="locationModal__x"
          type="button"
          @click="locationModal = null"
        >
          ✕
        </button>
        <div class="locationModal__map">
          <img
            :src="getLocationMapImage(locationModal)"
            alt="מיקום"
            class="locationModal__mapImg"
          />
        </div>
        <div class="locationModal__content">
          <div class="locationModal__header">
            <span class="locationModal__icon">📍</span>
            <span class="locationModal__title">מיקום שלי</span>
          </div>
          <div class="locationModal__coords">
            {{ formatLocation(locationModal) }}
          </div>
          <div class="locationModal__actions">
            <a
              :href="getWazeUrl(locationModal)"
              target="_blank"
              rel="noopener noreferrer"
              class="locationModal__btn locationModal__btn--waze"
            >
              <span class="locationModal__btnIcon">📍</span>
              <span>ווייז</span>
            </a>
            <a
              :href="getGoogleMapsUrl(locationModal)"
              target="_blank"
              rel="noopener noreferrer"
              class="locationModal__btn locationModal__btn--google"
            >
              <span class="locationModal__btnIcon">🗺️</span>
              <span>גוגל מפות</span>
            </a>
          </div>
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
import { getCurrentLocation } from "@/utils/geolocation";

export default {
  name: "JobChatLux",
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
      hoverRating: 0, // Track which star is being hovered
      reviewText: "",
      ratingSubmitted: false,
      imageModal: null,
      showTools: false,
      socket: null,
      localJobStatus: null, // Local copy of job status for real-time updates
      showCancelConfirmModal: false,
      imagePreview: null, // Preview of image before sending
      imagePreviewText: "", // Text to send with image
      imagePreviewFile: null, // The file to upload
      locationModal: null, // Location to show in modal
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
      // Handle handymanName as array
      if (
        Array.isArray(this.job?.handymanName) &&
        this.job.handymanName.length > 0
      ) {
        return this.job.handymanName[0]; // Return first handyman name
      }
      return this.job?.handymanName || "הנדימן";
    },
    jobInfo() {
      return this.job;
    },
    jobLocation() {
      // Get job location from coordinates or location field
      if (this.job?.coordinates && Array.isArray(this.job.coordinates)) {
        return {
          lng: this.job.coordinates[0],
          lat: this.job.coordinates[1],
        };
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
    // Watch for job prop changes - reload messages when job changes
    job: {
      immediate: false,
      deep: true,
      async handler(newJob, oldJob) {
        // Only reload if job ID actually changed (not just status update)
        const newJobId = String(newJob?.id || newJob?._id || "");
        const oldJobId = String(oldJob?.id || oldJob?._id || "");

        if (newJobId && newJobId !== oldJobId) {
          // Job changed - reload messages and reconnect WebSocket
          this.messages = []; // Clear old messages
          this.localJobStatus = newJob?.status || null;

          // Disconnect old WebSocket
          this.disconnectWebSocket();

          // Reconnect with new job
          this.initWebSocket();
          await this.loadMessages();
          this.scrollToBottom();
        } else if (newJob?.status !== oldJob?.status) {
          // Only status changed - update local status
          this.localJobStatus = newJob?.status || null;
        }
      },
    },
    // Watch for job status changes
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

      // Disconnect existing socket if any (prevent duplicate connections)
      if (this.socket) {
        this.socket.removeAllListeners(); // Remove all listeners
        this.socket.disconnect();
        this.socket = null;
      }

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

      // Listen for new messages - only once, prevent duplicates
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
          // Navigate to job summary page
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(
            `/Dashboard/${userId}/job-summary/${receivedJobId}`
          );
        }
      });

      this.socket.on("error", () => {
        // WebSocket error - silent fail
      });
    },

    disconnectWebSocket() {
      if (this.socket) {
        const jobId = this.job?.id || this.job?._id;
        if (jobId) {
          this.socket.emit("leave-job", jobId);
        }
        // Remove all listeners before disconnecting to prevent memory leaks
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
    },

    getJobDisplayName() {
      if (!this.jobInfo) return "עבודה";
      // Handle subcategoryInfo as array
      if (
        Array.isArray(this.jobInfo.subcategoryInfo) &&
        this.jobInfo.subcategoryInfo.length > 0
      ) {
        if (this.jobInfo.subcategoryInfo.length === 1) {
          // Single job - show name
          return (
            this.jobInfo.subcategoryInfo[0].subcategory ||
            this.jobInfo.subcategoryInfo[0].category ||
            "עבודה"
          );
        } else {
          // Multiple jobs - show count
          return `${this.jobInfo.subcategoryInfo.length} עבודות`;
        }
      }
      // Fallback for old format (object) or no subcategoryInfo
      return (
        this.jobInfo.subcategoryInfo?.name ||
        this.jobInfo.subcategoryInfo?.subcategory ||
        "עבודה"
      );
    },
    getHandymanName() {
      // Handle handymanName as array
      if (
        Array.isArray(this.job?.handymanName) &&
        this.job.handymanName.length > 0
      ) {
        return this.job.handymanName[0]; // Return first handyman name
      }
      return this.job?.handymanName || "הנדימן";
    },
    async loadMessages() {
      try {
        const jobId = this.job?.id || this.job?._id;
        if (!jobId) return;

        const { data } = await axios.get(`${URL}/jobs/${jobId}/messages`);
        if (data.success && data.messages) {
          // Convert DB messages to UI format
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
      } catch (error) {
        this.toast?.showError("שגיאה בטעינת הודעות");
      }
    },

    addMessageToUI(messageObj) {
      // Determine sender: if handyman sent, for handyman it's "me", for customer it's "other"
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

      // Check if message already exists (avoid duplicates)
      // First priority: Check for optimistic messages (uploading) that should be updated
      if (image || location) {
        const optimisticIndex = this.messages.findIndex((m) => {
          if (m.sender !== sender || !m.uploading) return false;

          // For optimistic messages with location, match by location coordinates
          if (location && m.location) {
            // Compare coordinates with tolerance for floating point precision
            const latMatch =
              Math.abs((m.location.lat || 0) - (location.lat || 0)) < 0.0001;
            const lngMatch =
              Math.abs((m.location.lng || 0) - (location.lng || 0)) < 0.0001;
            return latMatch && lngMatch;
          }

          // For optimistic messages with image, match by text
          if (image && m.image) {
            const textMatches =
              (!m.text && !text) ||
              (m.text && text && m.text.trim() === text.trim());
            return textMatches;
          }

          return false;
        });

        if (optimisticIndex !== -1) {
          // Update existing optimistic message with real data from server
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

      // Second: Check for exact duplicate by content
      const exists = this.messages.some((m) => {
        // Skip optimistic messages (they're handled above)
        if (m.uploading) return false;
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

        // Text-only messages
        if (text && m.text && !image && !m.image && !location && !m.location) {
          return text.trim() === m.text.trim();
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

    stepHint(s) {
      const h = {
        assigned: "הקריאה שובצה להנדימן",
        on_the_way: "בדרך אל הלקוח",
        in_progress: "מתבצעת עבודה בשטח",
        done: "העבודה הסתיימה",
      };
      return h[s] || "";
    },
    async getCurrentLocation() {
      return await getCurrentLocation();
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

    async sendLocation() {
      this.showTools = false;

      // Show loading
      this.toast?.showSuccess("מאתר את המיקום שלך...");

      try {
        const loc = await this.getCurrentLocation();
        const location = {
          lat: loc.lat,
          lng: loc.lon,
          accuracy: loc.accuracy,
        };
        await this.sendLocationMessage(location);
      } catch (error) {
        let errorMessage = "שגיאה בקבלת המיקום";
        if (error.code === 1) {
          errorMessage = "הגישה למיקום נדחתה";
        } else if (error.code === 2) {
          errorMessage = "המיקום לא זמין";
        } else if (error.code === 3) {
          errorMessage = "פג הזמן לקבלת המיקום";
        } else if (error.message === "Geolocation not supported") {
          errorMessage = "הדפדפן שלך לא תומך במיקום";
        }
        this.toast?.showError(errorMessage);
      }
    },

    async sendLocationMessage(location) {
      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      // Create unique message ID
      const messageId = Date.now() + Math.random();

      // Show optimistic message
      const tempMessage = {
        sender: "me",
        location: location,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
        uploading: true,
        _tempId: messageId,
      };
      this.messages.push(tempMessage);
      this.scrollToBottom();

      try {
        // Send to server
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          location: location,
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Update optimistic message - mark as no longer uploading
        // The WebSocket will handle the actual update with server data
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          // Keep the message but mark it for WebSocket update
          // The _tempId will help match it when WebSocket message arrives
          this.messages[tempIndex] = {
            ...this.messages[tempIndex],
            uploading: false,
            _tempId: messageId,
          };
        }
      } catch (error) {
        // Remove optimistic message on error
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          this.messages.splice(tempIndex, 1);
        }
        this.toast?.showError("שגיאה בשליחת המיקום");
      }
    },

    openLocationModal(location) {
      if (!location) return;
      this.locationModal = location;
    },

    getLocationMapImage(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        // Use server endpoint that uses Mapbox Static Images API
        const zoom = 15;
        const width = 400;
        const height = 300;
        return `${URL}/location-map-image?lat=${location.lat}&lng=${location.lng}&zoom=${zoom}&width=${width}&height=${height}`;
      }
      return "";
    },

    onMapImageError(event) {
      // Fallback to OpenStreetMap if Mapbox fails
      if (this.locationModal || event.target.dataset.location) {
        const location =
          this.locationModal ||
          JSON.parse(event.target.dataset.location || "{}");
        if (location.lat && location.lng) {
          event.target.src = `https://www.openstreetmap.org/export/embed.html?bbox=${
            location.lng - 0.01
          },${location.lat - 0.01},${location.lng + 0.01},${
            location.lat + 0.01
          }&layer=mapnik&marker=${location.lat},${location.lng}`;
        }
      }
    },

    getLocationUrl(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      }
      return "#";
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

    handleFileSelect(e) {
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

      // Show preview (WhatsApp style) - user can add text before sending
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.imagePreview = ev.target.result;
        this.imagePreviewFile = file;
        this.imagePreviewText = ""; // Clear any previous text
      };
      reader.readAsDataURL(file);

      e.target.value = "";
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

      // Create unique message ID to prevent duplicates
      const messageId = Date.now() + Math.random();

      // Show optimistic message immediately
      const tempMessage = {
        sender: "me",
        image: this.imagePreview, // Preview URL
        text: imageText || null,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
        uploading: true,
        _tempId: messageId, // Unique ID to prevent socket duplicates
      };
      this.messages.push(tempMessage);
      this.scrollToBottom();

      // Clear preview
      this.cancelImagePreview();

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
            (m) => m._tempId === messageId && m.uploading && m.sender === "me"
          );
          if (tempIndex !== -1) {
            // Send the image message to server with text
            await this.sendImageMessage(data.imageUrl, imageText);
            // Update the message with the real URL and remove uploading flag
            this.messages[tempIndex] = {
              ...this.messages[tempIndex],
              image: data.imageUrl,
              uploading: false,
              _tempId: messageId, // Keep ID to prevent socket duplicate
            };
          }
        }
      } catch (error) {
        // Remove the temp message on error
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          this.messages.splice(tempIndex, 1);
        }
        this.toast?.showError("שגיאה בהעלאת התמונה");
      }
    },

    async sendImageMessage(imageUrl, text = null) {
      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      // Get current user ID from store
      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      try {
        // Send to server with text if provided
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          imageUrl: imageUrl,
          text: text || undefined, // Send text only if it exists
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Message will be added via WebSocket, but we already added it optimistically
        // The duplicate check in addMessageToUI will prevent showing it twice
      } catch (error) {
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
        // Navigate to job summary page
        const userId = this.store?.user?._id || this.$route.params.id;
        this.$router.push(
          `/Dashboard/${userId}/job-summary/${this.job._id || this.job.id}`
        );
      } catch (err) {
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

        await axios.post(`${URL}/jobs/cancel`, {
          jobId,
          userId,
        });

        this.toast.showSuccess("העבודה בוטלה והשביוץ בוטל");
        this.showCancelConfirmModal = false;
        this.$emit("cancel-job");
      } catch (error) {
        this.toast.showError("שגיאה בביטול העבודה");
        this.showCancelConfirmModal = false;
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

  @media (max-width: 768px) {
    padding: 12px 10px;
    flex-wrap: wrap;
    gap: 8px;
  }
}
.luxTop__title {
  font-size: 20px;
  font-weight: 1100;
  color: $text;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}
.luxTop__meta {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 10px;
    margin-top: 4px;
    gap: 4px;
  }
}
.luxTop__left {
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
    order: 1;
  }
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

  @media (max-width: 768px) {
    gap: 6px;
    flex-wrap: wrap;
    order: 2;
    width: 100%;
    justify-content: flex-end;
  }
}

.luxTop__nav {
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 4px;
    order: 3;
    width: 100%;
    justify-content: flex-end;
    margin-top: 4px;
  }
}

.navBtn {
  min-width: 38px;
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.24);
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    min-width: auto;
    height: 32px;
    padding: 0 8px;
    font-size: 11px;
    gap: 4px;
  }
}

.navBtn__icon {
  font-size: 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.navBtn__text {
  font-size: 12px;
  font-weight: 900;

  @media (max-width: 768px) {
    font-size: 9px;
  }
}

.navBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.navBtn--waze {
  border-color: rgba(118, 186, 153, 0.4);
  background: rgba(118, 186, 153, 0.15);
  color: #76ba99;
}

.navBtn--waze:hover {
  background: rgba(118, 186, 153, 0.25);
  border-color: rgba(118, 186, 153, 0.6);
}

.navBtn--waze .navBtn__text {
  color: #76ba99;
}

.navBtn--google {
  border-color: rgba(66, 133, 244, 0.4);
  background: rgba(66, 133, 244, 0.15);
  color: #4285f4;
}

.navBtn--google:hover {
  background: rgba(66, 133, 244, 0.25);
  border-color: rgba(66, 133, 244, 0.6);
}

.navBtn--google .navBtn__text {
  color: #4285f4;
}

.iconBtn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.24);
  color: $text;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 14px;
  }
}
.iconBtn:hover {
  border-color: rgba($orange, 0.35);
  box-shadow: 0 10px 24px rgba($orange, 0.12);
}

// .iconBtn--minimize {
//   margin-right: 50px;
// }

.cancelJobBtn {
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  cursor: pointer;
  font-size: 13px;
  font-weight: 900;
  transition: all 0.2s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 10px;
    border-radius: 10px;
  }
}

.cancelJobBtn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.6);
  transform: translateY(-1px);
}

.cancelConfirmModal {
  position: fixed;
  inset: 0;
  z-index: 100002;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Heebo", sans-serif;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.cancelConfirmModal__content {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: calc(100% - 40px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  text-align: center;
}

.cancelConfirmModal__title {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 16px 0;
}

.cancelConfirmModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.cancelConfirmModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.cancelConfirmModal__btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Heebo", sans-serif;
  min-width: 100px;
}

.cancelConfirmModal__btn--no {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.cancelConfirmModal__btn--no:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.cancelConfirmModal__btn--yes {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.cancelConfirmModal__btn--yes:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
  transform: translateY(-1px);
}

.cancelConfirmModal__btn:active {
  transform: translateY(0);
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

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 10px;
    gap: 6px;
  }
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

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 0.9rem;
    border-radius: 20px;
    border-width: 1.5px;
  }
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

.seg__btn--full {
  width: 100%;
  flex: none;
}

.seg__btn--nav {
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.segTip {
  margin-top: 10px;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);

  @media (max-width: 768px) {
    font-size: 9px;
    margin-top: 6px;
  }
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

  @media (max-width: 768px) {
    margin: 10px 10px 0 10px;
    padding: 12px;
    border-radius: 14px;
  }
}
.rateCard__title {
  color: $orange;
  font-weight: 1100;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
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

  @media (max-width: 768px) {
    padding: 12px 10px 8px 10px;
    gap: 10px;
  }
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

  @media (max-width: 768px) {
    max-width: 85%;
    padding: 10px 10px 8px 10px;
    border-radius: 16px;
  }
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

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 1.5;
  }
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
  padding: 0;
  margin-bottom: 8px;
  cursor: pointer;
  width: 100%;
  display: block;
}
.bubble__img {
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: block;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 12px;
  }
}

.bubble__location {
  margin-bottom: 8px;
  width: 100%;
  max-width: 100% !important;
  min-width: 350px;

  @media (max-width: 768px) {
    min-width: 100%;
    max-width: 100% !important;
  }
}

.bubble--location {
  max-width: 85% !important;
  padding-bottom: 0;

  @media (max-width: 768px) {
    max-width: 95% !important;
  }
}

.bubble__locationPreview {
  position: relative;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.bubble__locationPreview:hover {
  transform: scale(1.02);
}

.bubble__locationMap {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);

  @media (max-width: 768px) {
    height: 150px;
    border-radius: 10px;
  }
}

.bubble__locationOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    transparent 100%
  );
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  pointer-events: none; /* Allow clicks to pass through */
}

.bubble__locationIcon {
  font-size: 18px;
}

.bubble__locationText {
  font-size: 14px;
  font-weight: 900;
  color: white;
}

/* Location Modal (WhatsApp style) */
.locationModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100002;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

.locationModal__card {
  background: $bg;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  position: relative;
  animation: slideUp 0.3s ease;
}

.locationModal__x {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  z-index: 10;
  transition: background 0.2s ease;
}

.locationModal__x:hover {
  background: rgba(0, 0, 0, 0.8);
}

.locationModal__map {
  width: 100%;
  height: 250px;
  position: relative;
}

.locationModal__mapImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.locationModal__content {
  padding: 16px;
}

.locationModal__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.locationModal__icon {
  font-size: 22px;
}

.locationModal__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
}

.locationModal__coords {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.7;
  font-family: monospace;
  margin-bottom: 16px;
  word-break: break-all;
}

.locationModal__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.locationModal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid;
}

.locationModal__btn--waze {
  background: rgba(118, 186, 153, 0.15);
  border-color: rgba(118, 186, 153, 0.4);
  color: #76ba99;
}

.locationModal__btn--waze:hover {
  background: rgba(118, 186, 153, 0.25);
  border-color: rgba(118, 186, 153, 0.6);
  transform: translateY(-1px);
}

.locationModal__btn--google {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.4);
  color: #4285f4;
}

.locationModal__btn--google:hover {
  background: rgba(66, 133, 244, 0.25);
  border-color: rgba(66, 133, 244, 0.6);
  transform: translateY(-1px);
}

.locationModal__btnIcon {
  font-size: 18px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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

  @media (max-width: 768px) {
    padding: 10px 8px;
    gap: 6px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
}
.pillBtn {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
}
.pillBtn:hover {
  border-color: rgba($orange, 0.42);
  background: rgba($orange, 0.1);
}
.pillBtn__plus {
  font-size: 22px;
  font-weight: 1100;

  @media (max-width: 768px) {
    font-size: 18px;
  }
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

  @media (max-width: 768px) {
    bottom: 60px;
    right: 8px;
    gap: 6px;
    padding: 8px;
    border-radius: 14px;
  }
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

  @media (max-width: 768px) {
    width: 70px;
    padding: 8px 6px;
    border-radius: 12px;
    gap: 4px;
  }
}
.tool:hover {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 10px 22px rgba($orange, 0.1);
}
.tool__ic {
  font-size: 18px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}
.tool__t {
  font-size: 11px;
  opacity: 0.9;

  @media (max-width: 768px) {
    font-size: 9px;
  }
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
  font-size: 15px;

  @media (max-width: 768px) {
    height: 40px;
    padding: 0 12px;
    font-size: 16px; // Prevent iOS zoom
  }
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
  font-size: 14px;

  @media (max-width: 768px) {
    height: 40px;
    padding: 0 14px;
    font-size: 12px;
  }
}
.sendCta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Image Preview (WhatsApp style) */
.imagePreview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.imagePreview__preview {
  position: relative;
  width: 100%;
  max-width: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
}

.imagePreview__img {
  width: 100%;
  height: auto;
  display: block;
  max-height: 200px;
  object-fit: cover;
}

.imagePreview__close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  transition: background 0.2s ease;
}

.imagePreview__close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.imagePreview__input {
  margin-top: 0;
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
