<template>
  <div class="stripe-page" dir="rtl">
    <div class="stripe-container">
      <div class="stripe-card">
        <!-- Icon -->
        <div class="stripe-icon success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <!-- Title -->
        <h1 class="stripe-title">החשבון הוגדר בהצלחה!</h1>

        <!-- Message -->
        <p class="stripe-message">
          חשבון התשלומים שלך ב-Stripe הוגדר בהצלחה. כעת תוכל לקבל תשלומים
          מהלקוחות שלך.
        </p>

        <!-- Button -->
        <button class="stripe-btn" @click="goToDashboard">חזרה לדשבורד</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "StripeSuccess",
  methods: {
    goToDashboard() {
      // נסה לקבל את ה-userId מה-localStorage או מה-route
      const userId = localStorage.getItem("userId");
      if (userId) {
        this.$router.push({ name: "Dashboard", params: { id: userId } });
      } else {
        // אם אין userId, חזור לדף הבית
        this.$router.push({ name: "home" });
      }
    },
  },
  mounted() {
    // אפשר להוסיף כאן לוגיקה נוספת אם צריך
    // למשל: שליחת בקשה לשרת לעדכון סטטוס onboarding
  },
};
</script>

<style scoped>
.stripe-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f0f;
  padding: 24px;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.stripe-container {
  width: 100%;
  max-width: 520px;
}

.stripe-card {
  background: rgba(17, 17, 17, 0.92);
  border: 2px solid rgba(255, 106, 0, 0.85);
  border-radius: 18px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 16px 46px rgba(255, 106, 0, 0.12);
}

.stripe-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stripe-icon.success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 2px solid rgba(34, 197, 94, 0.3);
}

.stripe-title {
  margin: 0 0 16px;
  color: #f97316;
  font-size: 28px;
  font-weight: 900;
  line-height: 1.2;
}

.stripe-message {
  margin: 0 0 32px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
}

.stripe-btn {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border: none;
  background: #f97316;
  color: #000000;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.08s ease,
    background-color 0.15s ease;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
}

.stripe-btn:hover {
  background: #ea580c;
}

.stripe-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .stripe-card {
    padding: 32px 24px;
  }

  .stripe-title {
    font-size: 24px;
  }

  .stripe-message {
    font-size: 15px;
  }
}
</style>
