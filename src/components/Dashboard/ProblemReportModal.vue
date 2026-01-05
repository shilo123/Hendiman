<template>
  <div
    v-if="isVisible"
    class="problemReportModal"
    dir="rtl"
    @click.self="handleClose"
  >
    <div class="problemReportModal__content">
      <button
        class="problemReportModal__close"
        type="button"
        @click="handleClose"
        aria-label="סגור"
      >
        ✕
      </button>
      <div class="problemReportModal__icon">⚠️</div>
      <h2 class="problemReportModal__title">פרט על הבעיה</h2>
      <p class="problemReportModal__message">
        אנא פרט מה הבעיה בעבודה כדי שנוכל לטפל בזה
      </p>

      <div class="problemReportModal__form">
        <div class="problemReportModal__field">
          <textarea
            v-model="problemDescription"
            class="problemReportModal__textarea"
            placeholder="תאר את הבעיה..."
            rows="5"
            :class="{ 'problemReportModal__textarea--error': hasError }"
          ></textarea>
          <div v-if="hasError" class="problemReportModal__error">
            {{ errorMessage }}
          </div>
        </div>

        <div class="problemReportModal__actions">
          <button
            class="problemReportModal__btn problemReportModal__btn--approve"
            type="button"
            :disabled="isSubmitting"
            @click="handleApprove"
          >
            <span v-if="!isSubmitting">שחרר תשלום</span>
            <span v-else>מעבד...</span>
          </button>
          <button
            class="problemReportModal__btn problemReportModal__btn--submit"
            type="button"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="!isSubmitting">שלח</span>
            <span v-else>שולח...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";

export default {
  name: "ProblemReportModal",
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    job: {
      type: Object,
      default: null,
    },
  },
  emits: ["close", "approve"],
  data() {
    return {
      problemDescription: "",
      isSubmitting: false,
      hasError: false,
      errorMessage: "",
    };
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.problemDescription = "";
        this.hasError = false;
        this.errorMessage = "";
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit("close");
    },
    async handleApprove() {
      // Simply approve and release payment
      this.$emit("approve");
    },
    async handleSubmit() {
      // Validate
      if (!this.problemDescription || !this.problemDescription.trim()) {
        this.hasError = true;
        this.errorMessage = "אנא מלא את פרטי הבעיה";
        return;
      }

      this.hasError = false;
      this.isSubmitting = true;

      try {
        const jobId = this.job?._id || this.job?.id;
        const clientId =
          this.job?.clientId?.toString() ||
          this.job?.clientId ||
          this.$store?.state?.user?._id;

        if (!jobId || !clientId) {
          this.hasError = true;
          this.errorMessage = "חסרים פרטים";
          return;
        }

        // Get handyman info
        const handymanId =
          this.job?.handymanId?.toString() ||
          this.job?.handymanId ||
          (Array.isArray(this.job?.handymanId) &&
            this.job?.handymanId[0]?.toString()) ||
          (Array.isArray(this.job?.handymanId) && this.job?.handymanId[0]);

        // Get job info for title
        const jobTitle =
          this.job?.subcategoryInfo?.[0]?.subcategory ||
          this.job?.subcategoryInfo?.name ||
          "עבודה";

        // Save inquiry
        await axios.post(`${URL}/api/inquiries/create`, {
          jobId: jobId.toString(),
          clientId: clientId.toString(),
          handymanId: handymanId ? handymanId.toString() : null,
          title: `בעיה בעבודה: ${jobTitle}`,
          description: this.problemDescription.trim(),
          type: "job_problem",
        });

        // Show success message
        if (this.$store?.toast) {
          this.$store.toast.showSuccess("הפנייה נשלחה בהצלחה");
        }

        // Close modal
        this.$emit("close");
      } catch (error) {
        this.hasError = true;
        this.errorMessage =
          error.response?.data?.message || "שגיאה בשליחת הפנייה";
        if (this.$store?.toast) {
          this.$store.toast.showError(this.errorMessage);
        }
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: rgba(0, 0, 0, 0.85);
$panel: rgba(255, 255, 255, 0.08);
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$danger: #ff4d4d;

.problemReportModal {
  position: fixed;
  inset: 0;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.problemReportModal__content {
  background: $panel;
  border: 1px solid rgba($orange, 0.3);
  border-radius: 20px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.problemReportModal__close {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.problemReportModal__close:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.problemReportModal__icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.problemReportModal__title {
  font-size: 24px;
  font-weight: 1100;
  color: $text;
  text-align: center;
  margin: 0 0 8px 0;
}

.problemReportModal__message {
  color: $muted;
  text-align: center;
  font-size: 15px;
  margin: 0 0 20px 0;
}

.problemReportModal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.problemReportModal__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.problemReportModal__textarea {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: $text;
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.problemReportModal__textarea:focus {
  outline: none;
  border-color: rgba($orange, 0.5);
  box-shadow: 0 0 0 3px rgba($orange, 0.15);
}

.problemReportModal__textarea--error {
  border-color: rgba($danger, 0.5);
  box-shadow: 0 0 0 3px rgba($danger, 0.15);
}

.problemReportModal__textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.problemReportModal__error {
  color: $danger;
  font-size: 13px;
  font-weight: 800;
  padding: 8px 12px;
  background: rgba($danger, 0.1);
  border: 1px solid rgba($danger, 0.3);
  border-radius: 8px;
}

.problemReportModal__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.problemReportModal__btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 1000;
  font-size: 16px;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.problemReportModal__btn--approve {
  background: linear-gradient(135deg, $orange, $orange2);
  color: white;
  box-shadow: 0 8px 24px rgba($orange, 0.3);
}

.problemReportModal__btn--approve:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba($orange, 0.4);
}

.problemReportModal__btn--submit {
  background: rgba(255, 255, 255, 0.1);
  color: $text;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.problemReportModal__btn--submit:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.problemReportModal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.problemReportModal__btn:active:not(:disabled) {
  transform: translateY(0);
}

@media (max-width: 520px) {
  .problemReportModal__content {
    padding: 20px;
    max-width: 100%;
  }

  .problemReportModal__actions {
    flex-direction: column;
  }

  .problemReportModal__btn {
    width: 100%;
  }
}
</style>
