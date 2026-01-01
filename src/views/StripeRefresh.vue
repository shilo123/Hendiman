<template>
  <div class="stripe-page" dir="rtl">
    <div class="stripe-container">
      <div class="stripe-card">
        <!-- Icon -->
        <div class="stripe-icon warning">
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
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        <!-- Title -->
        <h1 class="stripe-title">הגדרת החשבון לא הושלמה</h1>

        <!-- Message -->
        <p class="stripe-message">
          נראה שלא סיימת את הגדרת חשבון התשלומים ב-Stripe. כדי לקבל תשלומים
          מהלקוחות שלך, עליך להשלים את התהליך.
        </p>

        <!-- Button -->
        <button class="stripe-btn" @click="retryOnboarding">
          השלם את ההגדרה
        </button>

        <!-- Secondary Button -->
        <button class="stripe-btn-secondary" @click="goToDashboard">
          חזרה לדשבורד
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { URL } from "@/Url/url";

export default {
  name: "StripeRefresh",
  methods: {
    async retryOnboarding() {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          this.$router.push({ name: "home" });
          return;
        }

        // קבל קישור onboarding חדש מהשרת
        const response = await fetch(
          `${URL}/api/handyman/stripe/onboarding-link`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ handymanId: userId }),
          }
        );

        const data = await response.json();

        if (data.success && data.url) {
          // הפנה את המשתמש לקישור onboarding
          window.location.href = data.url;
        } else {
          alert("שגיאה בקבלת קישור הגדרה. נסה שוב מאוחר יותר.");
        }
      } catch (error) {
        alert("שגיאה בקבלת קישור הגדרה. נסה שוב מאוחר יותר.");
      }
    },
    goToDashboard() {
      const userId = localStorage.getItem("userId");
      if (userId) {
        this.$router.push({ name: "Dashboard", params: { id: userId } });
      } else {
        this.$router.push({ name: "home" });
      }
    },
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

.stripe-icon.warning {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 2px solid rgba(251, 191, 36, 0.3);
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
  margin-bottom: 12px;
}

.stripe-btn:hover {
  background: #ea580c;
}

.stripe-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.stripe-btn-secondary {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border: 2px solid rgba(255, 106, 0, 0.5);
  background: transparent;
  color: #f97316;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.08s ease, background-color 0.15s ease;
}

.stripe-btn-secondary:hover {
  background: rgba(255, 106, 0, 0.1);
}

.stripe-btn-secondary:active {
  transform: scale(0.98);
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
