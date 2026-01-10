<template>
  <div>
    <router-view />
    <ContactButton
      :class="{ 'contact-button--hidden': isJobChatActive }"
      @open-contact-modal="showContactModal = true"
    />
    <ContactModal
      :visible="showContactModal"
      @close="showContactModal = false"
      @submitted="handleInquirySubmitted"
    />
  </div>
</template>
<script>
import ContactButton from "@/components/Global/ContactButton.vue";
import ContactModal from "@/components/Global/ContactModal.vue";
import { useMainStore } from "@/store/index";

export default {
  name: "AppVue",
  components: {
    ContactButton,
    ContactModal,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      showContactModal: false,
    };
  },
  computed: {
    isJobChatActive() {
      // בדוק אם אנחנו בדף Dashboard
      if (this.$route.name !== "Dashboard") {
        return false;
      }

      // בדוק אם יש route param id שמתאים למשתמש הנוכחי
      const routeUserId = this.$route.params?.id;
      const currentUserId = this.store.user?._id;

      if (!currentUserId) {
        return false;
      }

      // אם route param לא תואם למשתמש הנוכחי, לא נסתיר את הכפתור
      if (routeUserId && String(routeUserId) !== String(currentUserId)) {
        return false;
      }

      // בדוק אם יש עבודה פעילה (לא "open" ולא "done")
      const jobs = this.store.jobs || [];
      const userId = currentUserId;

      if (!userId) {
        return false;
      }

      const userIdStr = String(userId);
      const isHandyman = this.store.user?.isHandyman;

      // מצא עבודה משובצת פעילה - בדיוק כמו ב-Dashboard.vue (שורות 1580-1648)
      // נבדוק גם עבודות עם status: assigned, on_the_way, in_progress
      const activeJob = jobs.find((job) => {
        if (!job) return false;

        // בדוק אם העבודה מבוטלת
        const isCancelled =
          job.cancel === true ||
          job.isCancelled === true ||
          job.status === "cancelled";

        if (isCancelled) {
          return false;
        }

        // עבור הנדימן - בדוק קודם אם יש handymanId (אפילו אם לא תואם)
        // זה יעזור לנו לזהות אם יש עבודה פעילה
        if (isHandyman && !job.handymanId) {
          return false;
        }

        // עבור לקוח - בדוק קודם אם יש handymanId
        if (!isHandyman && !job.handymanId) {
          return false;
        }

        // בדוק אם המשתמש משובץ לעבודה
        if (isHandyman) {
          // עבור הנדימן - בדוק אם handymanId תואם (תמיכה במערך ו-ObjectId)
          // בדיוק כמו ב-Dashboard.vue שורה 1585-1621
          let isHandymanInJob = false;
          if (job.handymanId) {
            if (Array.isArray(job.handymanId)) {
              isHandymanInJob = job.handymanId.some((id) => {
                // Handle both ObjectId and string - try multiple formats
                let idStr = "";
                if (id) {
                  if (id._id) {
                    idStr = String(id._id);
                  } else if (id.$oid) {
                    idStr = String(id.$oid);
                  } else if (typeof id === "object" && id.toString) {
                    idStr = id.toString();
                  } else {
                    idStr = String(id);
                  }
                }
                return idStr === userIdStr;
              });
            } else {
              // Handle single handymanId (not array)
              let handymanIdStr = "";
              if (job.handymanId) {
                if (job.handymanId._id) {
                  handymanIdStr = String(job.handymanId._id);
                } else if (job.handymanId.$oid) {
                  handymanIdStr = String(job.handymanId.$oid);
                } else if (
                  typeof job.handymanId === "object" &&
                  job.handymanId.toString
                ) {
                  handymanIdStr = job.handymanId.toString();
                } else {
                  handymanIdStr = String(job.handymanId);
                }
              }
              isHandymanInJob = handymanIdStr === userIdStr;
            }
          }
          // עבודה פעילה היא כזו עם סטטוס: assigned, on_the_way, in_progress
          // לא עבודות שדורגו (ratingSubmitted: true) - אם קיים
          // לא עבודות שהתשלום שוחרר (paymentStatus: "paid") - אם קיים
          const activeStatuses = ["assigned", "on_the_way", "in_progress"];
          return (
            isHandymanInJob &&
            activeStatuses.includes(job.status) && // רק עבודות עם סטטוס פעיל
            (job.paymentStatus === undefined || job.paymentStatus !== "paid") && // לא עבודות שהתשלום שוחרר (אם קיים)
            !job.ratingSubmitted // לא עבודות שדורגו (אם קיים)
          );
        } else {
          // עבור לקוח - בדוק אם clientId תואם
          // בדיוק כמו ב-Dashboard.vue שורה 1633-1648
          const clientId = job.clientId?._id
            ? String(job.clientId._id)
            : String(job.clientId || "");
          return (
            clientId === userIdStr &&
            job.handymanId && // רק עבודות ששובצו
            job.status !== "open" && // לא עבודות פתוחות
            (job.paymentStatus === undefined || job.paymentStatus !== "paid") && // לא עבודות שהתשלום שוחרר (אם קיים)
            !job.ratingSubmitted && // לא עבודות שדורגו (אם קיים)
            (job.status !== "done" || // לא עבודות שהושלמו (או...)
              (job.status === "done" && job.clientApproved === false)) // אלא אם כן צריך אישור לקוח
          );
        }
      });

      return !!activeJob;
    },
  },
  watch: {
    // Watch for changes in store.jobs to ensure reactive updates
    "store.jobs": {
      handler() {
        // Force reactivity update
        this.$forceUpdate();
      },
      deep: true,
    },
    // Watch for route changes
    "$route.name"() {
      // Force reactivity update when route changes
      this.$forceUpdate();
    },
  },
  methods: {
    handleInquirySubmitted() {
      this.showContactModal = false;
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap");

* {
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  background: #0b0b0f;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

#app {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #0b0b0f;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

#app > * {
  flex: 1;
}

/* הסתר את כפתור "צרו קשר" כאשר יש צ'אט פעיל */
/* חשוב: רק על הכפתור עצמו, לא על אלמנטים אחרים */
button.contact-button.contact-button--hidden {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  z-index: -1 !important;
}

/* הסתר את כפתור Stripe למפתחים - כל ה-iframes של Stripe */
iframe[name*="__privateStripeFrame"],
iframe[name*="privateStripeFrame"],
iframe[src*="stripe.com"][src*="elements-inner"],
iframe[src*="stripe.com"][src*="easel"],
iframe[title*="מסגרת כלים למפתחי פס"],
iframe[title*="Stripe developer tools frame"],
iframe[src*="js.stripe.com"][name*="Stripe"],
iframe[role="presentation"][src*="stripe.com"],
.stripe-test-mode-badge,
[class*="__PrivateStripeElement"],
[class*="privateStripe"],
[id*="__privateStripe"],
[id*="privateStripe"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: 0 !important;
  max-height: 0 !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
  right: -9999px !important;
  bottom: -9999px !important;
  z-index: -99999 !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: scale(0) !important;
  overflow: hidden !important;
}
</style>
