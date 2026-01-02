<template>
  <button
    class="push-notification-btn"
    :class="{ disabled: isRequesting || isEnabled }"
    @click="enablePush"
    :disabled="isRequesting || isEnabled"
  >
    <span v-if="isRequesting">מאפשר התראות...</span>
    <span v-else-if="isEnabled">✓ התראות מופעלות</span>
    <span v-else>הפעל התראות</span>
  </button>
</template>

<script>
import { messaging, VAPID_KEY, getToken } from "@/firebase";
import { useToast } from "@/composables/useToast";

export default {
  name: "PushNotificationButton",
  data() {
    return {
      isRequesting: false,
      isEnabled: false,
      toast: null,
    };
  },
  created() {
    this.toast = useToast();
    this.checkNotificationPermission();
  },
  methods: {
    checkNotificationPermission() {
      if ("Notification" in window) {
        this.isEnabled = Notification.permission === "granted";
      }
    },
    async enablePush() {
      if (this.isRequesting || this.isEnabled) return;

      this.isRequesting = true;

      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          this.toast?.showError(
            "הרשאות התראות נדחו. אנא הפעל אותן בהגדרות הדפדפן."
          );
          this.isRequesting = false;
          return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

        // Get FCM token
        if (!messaging) {
          throw new Error("Firebase Messaging לא זמין");
        }

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          this.isEnabled = true;
          this.toast?.showSuccess("התראות הופעלו בהצלחה!");

          // כאן תוכל לשלוח את ה-token לשרת כדי לשמור אותו
          // await this.saveTokenToServer(token);
        } else {
          this.toast?.showError("לא ניתן לקבל token להתראות");
        }
      } catch (error) {
        this.toast?.showError("לא הצלחנו להפעיל את ההתראות: " + error.message);
      } finally {
        this.isRequesting = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.push-notification-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff9f1c, #ff6a00);
  border: none;
  border-radius: 8px;
  color: #0f0f0f;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 159, 28, 0.3);

  &:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(255, 159, 28, 0.4);
  }

  &:active:not(.disabled) {
    transform: translateY(0);
  }

  &.disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    box-shadow: none;
  }
}
</style>
