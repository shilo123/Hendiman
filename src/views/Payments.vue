<template>
  <div class="payments-page" dir="rtl">
    <div class="payments-container">
      <!-- Header -->
      <div class="payments-header">
        <button class="payments-back" type="button" @click="handleBack">
          ← חזור
        </button>
        <h1 class="payments-title">
          {{ isSubscription ? "הרשמה למנוי חודשי" : "תשלום" }}
        </h1>
        <p class="payments-subtitle">
          {{
            isSubscription
              ? "הזן פרטי כרטיס אשראי להרשמה למנוי חודשי"
              : "הזן פרטי כרטיס אשראי"
          }}
        </p>
      </div>

      <!-- Subscription Plans Selection -->
      <div v-if="isSubscription" class="subscription-plans">
        <!-- Annual Plan (Recommended) -->
        <div
          class="subscription-plan subscription-plan--annual"
          :class="{
            'subscription-plan--selected': selectedPlan === 'annual',
          }"
          @click="selectPlan('annual')"
        >
          <div class="subscription-plan__badge">⭐ מומלץ</div>
          <div class="subscription-plan__header">
            <div class="subscription-plan__icon">📅</div>
            <div class="subscription-plan__title">מנוי שנתי</div>
          </div>
          <div class="subscription-plan__price-wrapper">
            <div class="subscription-plan__price-old">
              <span class="subscription-plan__price-old-amount">598.80</span>
              <span class="subscription-plan__price-old-currency">₪</span>
            </div>
            <div class="subscription-plan__price">
              <span class="subscription-plan__price-amount">499.90</span>
              <span class="subscription-plan__price-currency">₪</span>
              <span class="subscription-plan__price-period">/שנה</span>
            </div>
          </div>
          <div class="subscription-plan__warning">
            ⚠️ לא ניתן לבטל את המנוי באמצע שנה
          </div>
        </div>

        <!-- Monthly Plan -->
        <div
          class="subscription-plan subscription-plan--monthly"
          :class="{
            'subscription-plan--selected': selectedPlan === 'monthly',
          }"
          @click="selectPlan('monthly')"
        >
          <div class="subscription-plan__header">
            <div class="subscription-plan__icon">📆</div>
            <div class="subscription-plan__title">מנוי חודשי</div>
          </div>
          <div class="subscription-plan__price">
            <span class="subscription-plan__price-amount">49.90</span>
            <span class="subscription-plan__price-currency">₪</span>
            <span class="subscription-plan__price-period">/חודש</span>
          </div>
          <div class="subscription-plan__monthly-note">
            התשלום יתבצע מדי חודש אוטומטית
          </div>
          <div class="subscription-plan__cancel-note">
            תוכל לבטל את המנוי בכל עת
          </div>
        </div>
      </div>

      <!-- Trial Notice (for monthly subscription - only if showTrialNotice is true) -->
      <div v-if="showTrialNotice" class="trial-notice">
        <div class="trial-notice__icon">🎁</div>
        <div class="trial-notice__content">
          <div class="trial-notice__title">14 יום חינם!</div>
          <div class="trial-notice__text">
            תקופת נסיון של 14 יום חינם. התשלום יתחיל רק אחרי תקופת הנסיון.
          </div>
        </div>
      </div>

      <!-- Subscription Notice (for monthly - only if not showing trial notice) -->
      <div
        v-if="isSubscription && selectedPlan === 'monthly' && !showTrialNotice"
        class="subscription-notice"
      >
        <div class="subscription-notice__icon">📅</div>
        <div class="subscription-notice__content">
          <div class="subscription-notice__title">מנוי חודשי</div>
          <div class="subscription-notice__text">
            התשלום יתבצע מדי חודש אוטומטית. תוכל לבטל את המנוי בכל עת.
            <span
              v-if="getPendingRegistrationData()"
              class="subscription-notice__resume"
            >
              <br />אתה ממשיך תהליך הרשמה.
            </span>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="payment-form-wrapper">
        <form class="payment-form" @submit.prevent="handlePayment">
          <!-- Amount Display -->
          <div v-if="currentAmount || amount" class="form-field">
            <label class="form-label">סכום לתשלום</label>
            <div class="amount-display">
              {{ formatCurrency(currentAmount || amount) }}
              <span v-if="isSubscription" class="amount-display__period">
                {{ selectedPlan === "annual" ? "/שנה" : "/חודש" }}
              </span>
            </div>
          </div>

          <!-- Stripe Payment Element (includes Apple Pay/Google Pay) -->
          <div class="form-field">
            <label class="form-label">פרטי תשלום</label>
            <div id="card-element" class="stripe-element-container">
              <!-- Stripe Payment Element will mount here (includes Apple Pay/Google Pay) -->
            </div>
            <div id="card-errors" class="form-error" role="alert"></div>
          </div>

          <!-- Security Notice -->
          <div class="security-notice">
            <div class="security-notice__icon">🔒</div>
            <div class="security-notice__text">
              התשלום מאובטח ומצפין. פרטי הכרטיס שלך לא נשמרים בשרת שלנו.
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="payment-submit-btn"
            :disabled="isProcessing || !isStripeReady"
          >
            <span v-if="isProcessing">
              {{ isSubscription ? "מעבד הרשמה..." : "מעבד תשלום..." }}
            </span>
            <span v-else>
              {{
                isSubscription && showTrialNotice
                  ? "הירשם ל14 יום חינם"
                  : isSubscription
                  ? "שלם"
                  : "שלם"
              }}
              {{
                !isSubscription && (currentAmount || amount)
                  ? ` ${formatCurrency(currentAmount || amount)}`
                  : isSubscription &&
                    !showTrialNotice &&
                    (currentAmount || amount)
                  ? ` ${formatCurrency(currentAmount || amount)}`
                  : ""
              }}
            </span>
          </button>

          <!-- Error Message -->
          <div v-if="submitError" class="form-error form-error--submit">
            {{ submitError }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { loadStripe } from "@stripe/stripe-js";
import logger from "@/utils/logger";

export default {
  name: "Payments",
  props: {
    id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: null,
    },
    jobId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      toast: null,
      userId: this.id,
      stripe: null,
      elements: null,
      paymentElement: null,
      stripePublishableKey: null,
      currentJobId: null,
      currentAmount: null,
      isSubscription: false,
      paymentForm: {},
      isProcessing: false,
      submitError: "",
      isStripeReady: false,
      clientSecret: null,
      selectedPlan: "annual", // 'annual' or 'monthly'
      monthlyPrice: 49.9,
      annualPrice: 499.9,
      showPlans: false, // Control visibility of subscription plans
      subscriptionStatus: null, // Store subscription status from API
    };
  },
  computed: {
    showTrialNotice() {
      // Don't show trial notice if:
      // 1. URL has ?afterFree=true
      // 2. subscriptionExpiresAt has passed
      // 3. User is not in trial period
      if (this.$route.query.afterFree === "true") {
        return false;
      }

      if (this.subscriptionStatus) {
        // If subscriptionExpiresAt exists and has passed, don't show trial notice
        if (this.subscriptionStatus.subscriptionExpiresAt) {
          const expiresAt = new Date(
            this.subscriptionStatus.subscriptionExpiresAt
          );
          const now = new Date();
          if (now >= expiresAt) {
            return false; // Expired - no trial
          }
        }

        // If needsBilling is true, don't show trial notice
        if (this.subscriptionStatus.needsBilling) {
          return false;
        }

        // If not in trial, don't show trial notice
        if (!this.subscriptionStatus.isTrial) {
          return false;
        }
      }

      // Default: show trial notice for monthly subscriptions
      return this.isSubscription && this.selectedPlan === "monthly";
    },
  },
  async created() {
    this.toast = useToast();

    // Check if this is a subscription payment
    // Check both query param and localStorage for pending registration
    const hasPendingRegistration = this.getPendingRegistrationData() !== null;
    this.isSubscription =
      this.$route.query.subscription === "true" || hasPendingRegistration;

    // If we have userId, check subscription status from DB
    if (this.userId && this.isSubscription) {
      try {
        const response = await fetch(
          `${URL}/api/subscription/status?userId=${this.userId}`
        );
        const data = await response.json();
        if (data.success) {
          this.subscriptionStatus = data;
        }
      } catch (error) {
        logger.error(
          "Error fetching subscription status in Payments.vue:",
          error
        );
      }
    }

    // If we have pending registration but no subscription query param, update the route
    if (hasPendingRegistration && !this.$route.query.subscription) {
      this.$router.replace({
        ...this.$route,
        query: { ...this.$route.query, subscription: "true" },
      });
    }

    // Get jobId and amount from query params if not provided as props
    if (this.$route.query.jobId) {
      this.currentJobId = this.$route.query.jobId;
    } else if (this.jobId) {
      this.currentJobId = this.jobId;
    }

    if (this.$route.query.amount) {
      this.currentAmount = parseFloat(this.$route.query.amount);
    } else if (this.amount) {
      this.currentAmount = this.amount;
    } else if (this.isSubscription) {
      // Fetch subscription amount from server
      try {
        const response = await fetch(`${URL}/api/subscription/amount`);
        const data = await response.json();
        if (data.success && data.amount) {
          this.monthlyPrice = data.amount;
          // Set initial amount based on selected plan
          this.currentAmount =
            this.selectedPlan === "annual"
              ? this.annualPrice
              : this.monthlyPrice;
        }
      } catch (error) {}
    }

    // Get Stripe publishable key from server
    try {
      const response = await fetch(`${URL}/api/stripe/publishable-key`);
      const data = await response.json();
      if (data.publishableKey) {
        this.stripePublishableKey = data.publishableKey;
        this.stripe = await loadStripe(data.publishableKey);

        if (this.stripe) {
          // Initialize Payment Element after getting clientSecret
          await this.initializePaymentElement();
        }
      }
    } catch (error) {
      this.submitError = "שגיאה בטעינת מערכת התשלומים. אנא נסה שוב.";
    }
  },
  beforeUnmount() {
    // Clean up Stripe elements
    if (this.paymentElement) {
      try {
        this.paymentElement.unmount();
      } catch (error) {
        // Ignore unmount errors
      }
      this.paymentElement = null;
    }

    // Clear container
    const paymentElementContainer = document.getElementById("card-element");
    if (paymentElementContainer) {
      paymentElementContainer.innerHTML = "";
    }

    // Reset state
    this.elements = null;
    this.isStripeReady = false;
  },
  methods: {
    selectPlan(plan) {
      this.selectedPlan = plan;
      this.currentAmount =
        plan === "annual" ? this.annualPrice : this.monthlyPrice;
      // Reinitialize payment element with new amount
      if (this.isStripeReady) {
        this.initializePaymentElement();
      }
    },
    handleBack() {
      if (this.isSubscription && this.userId === "pending") {
        this.$router.push({ name: "Register" });
      } else {
        this.$router.push(`/Dashboard/${this.userId}`);
      }
    },
    async initializePaymentElement() {
      if (!this.stripe) return;

      try {
        // Clean up existing payment element before creating a new one
        if (this.paymentElement) {
          try {
            this.paymentElement.unmount();
          } catch (unmountError) {
            // Ignore unmount errors
          }
          this.paymentElement = null;
        }

        // Clear the container
        let paymentElementContainer = document.getElementById("card-element");
        if (paymentElementContainer) {
          paymentElementContainer.innerHTML = "";
        }

        // Reset Stripe ready state
        this.isStripeReady = false;

        // Step 1: Get clientSecret from server
        let clientSecret = null;

        if (this.isSubscription) {
          // For subscription, create payment intent
          const registrationData = this.getPendingRegistrationData();
          if (!registrationData) {
            this.submitError = "נתוני הרשמה לא נמצאו. אנא חזור לדף ההרשמה.";
            return;
          }

          const createSubscriptionResponse = await fetch(
            `${URL}/api/subscription/create`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                registrationData: registrationData,
                planType: this.selectedPlan, // 'annual' or 'monthly'
              }),
            }
          );

          const subscriptionData = await createSubscriptionResponse.json();
          if (!subscriptionData.success || !subscriptionData.clientSecret) {
            this.submitError =
              subscriptionData.message || "שגיאה ביצירת מנוי. אנא נסה שוב.";
            return;
          }
          clientSecret = subscriptionData.clientSecret;
        } else {
          // For regular payment, create payment intent
          const jobIdToUse =
            this.currentJobId || this.jobId || this.$route.query.jobId;

          if (!jobIdToUse) {
            this.submitError = "מספר עבודה לא נמצא. אנא חזור לדשבורד.";
            return;
          }

          const createIntentResponse = await fetch(
            `${URL}/api/payments/create-intent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jobId: jobIdToUse,
              }),
            }
          );

          const intentData = await createIntentResponse.json();
          if (!intentData.success || !intentData.clientSecret) {
            this.submitError =
              intentData.message || "שגיאה ביצירת כוונת תשלום. אנא נסה שוב.";
            return;
          }
          clientSecret = intentData.clientSecret;
        }

        this.clientSecret = clientSecret;

        // Step 2: Clean up existing Elements instance if it exists
        if (this.elements) {
          // Elements instance will be recreated with new clientSecret
          this.elements = null;
        }

        // Step 3: Create Elements instance with clientSecret
        const elementsOptions = {
          clientSecret: clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#ff6a00",
              colorBackground: "#0b0b0f",
              colorText: "rgba(255, 255, 255, 0.92)",
              colorDanger: "#ef4444",
              fontFamily:
                '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              spacingUnit: "4px",
              borderRadius: "8px",
            },
            rules: {
              ".Input": {
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 106, 0, 0.2)",
                color: "rgba(255, 255, 255, 0.92)",
                fontSize: "15px",
                fontWeight: "800",
              },
              ".Input:focus": {
                border: "1px solid rgba(255, 106, 0, 0.5)",
                boxShadow: "0 0 0 3px rgba(255, 106, 0, 0.18)",
              },
              ".Input--invalid": {
                border: "1px solid #ef4444",
                color: "#ef4444",
              },
            },
          },
          locale: "he",
        };

        this.elements = this.stripe.elements(elementsOptions);

        // Step 4: Create Payment Element (includes Apple Pay/Google Pay)
        this.paymentElement = this.elements.create("payment", {
          layout: "tabs",
          // Disable automatic Link form display
          link: {
            enabled: false,
          },
        });

        // Step 5: Mount Payment Element
        paymentElementContainer = document.getElementById("card-element");
        if (paymentElementContainer) {
          // Ensure container is empty before mounting
          paymentElementContainer.innerHTML = "";

          this.paymentElement.mount("#card-element");
          this.isStripeReady = true;

          // Handle real-time validation errors
          this.paymentElement.on("change", (event) => {
            const displayError = document.getElementById("card-errors");
            if (event.error) {
              displayError.textContent = event.error.message;
            } else {
              displayError.textContent = "";
            }
          });
        }
      } catch (error) {
        this.submitError = "שגיאה באתחול מערכת התשלומים. אנא נסה שוב.";
        logger.error("Error initializing Payment Element:", error);
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount || 0);
    },
    async handlePayment() {
      if (!this.isStripeReady || !this.paymentElement || !this.clientSecret) {
        this.submitError = "מערכת התשלומים לא נטענה. אנא רענן את הדף.";
        return;
      }

      this.isProcessing = true;
      this.submitError = "";

      try {
        if (this.isSubscription) {
          await this.handleSubscriptionPayment();
        } else {
          await this.handleRegularPayment();
        }
      } catch (error) {
        this.submitError = error.message || "שגיאה בחיבור לשרת. אנא נסה שוב.";
      } finally {
        this.isProcessing = false;
      }
    },
    async handleSubscriptionPayment() {
      // Step 1: Submit the Payment Element first (required by Stripe)
      const { error: submitError } = await this.elements.submit();
      if (submitError) {
        this.submitError =
          submitError.message || "שגיאה באימות פרטי התשלום. אנא נסה שוב.";
        return;
      }

      // Step 2: Confirm Payment Intent with Payment Element
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        clientSecret: this.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/Dashboard/${this.userId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        this.submitError = error.message || "שגיאה באישור התשלום. אנא נסה שוב.";
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Complete registration on server
        try {
          const completeResponse = await fetch(
            `${URL}/api/subscription/complete`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                paymentMethodId: paymentIntent.payment_method,
              }),
            }
          );

          if (completeData.success) {
            // Clear pending registration
            localStorage.removeItem("pendingHandymanRegistration");

            this.toast?.showSuccess(
              "הרשמה למנוי בוצעה בהצלחה! ברוך הבא להנדימן."
            );

            // Redirect to dashboard
            setTimeout(() => {
              if (completeData.user?._id) {
                this.$router.push({
                  name: "Dashboard",
                  params: { id: completeData.user._id },
                });
              } else {
                this.$router.push({ name: "logIn" });
              }
            }, 2000);
          } else {
            logger.error("[PAYMENTS] Complete failed:", completeData);
            this.submitError =
              completeData.message ||
              "המנוי אושר אך יש בעיה בעדכון השרת. אנא פנה לתמיכה.";
          }
        } catch (fetchError) {
          logger.error(
            "[PAYMENTS] Error calling /api/subscription/complete:",
            fetchError
          );
          this.submitError = "שגיאה בחיבור לשרת. אנא פנה לתמיכה או נסה שוב.";
        }
      } else {
        logger.error(
          "[PAYMENTS] PaymentIntent status not succeeded:",
          paymentIntent?.status
        );
        this.submitError = "מצב מנוי לא צפוי. אנא פנה לתמיכה.";
      }
    },
    async handleRegularPayment() {
      const jobIdToUse = this.currentJobId;
      if (!jobIdToUse) {
        this.submitError = "מספר עבודה לא נמצא. אנא חזור לדשבורד.";
        return;
      }

      // Step 1: Submit the Payment Element first (required by Stripe)
      const { error: submitError } = await this.elements.submit();
      if (submitError) {
        this.submitError =
          submitError.message || "שגיאה באימות פרטי התשלום. אנא נסה שוב.";
        return;
      }

      // Step 2: Confirm Payment Intent with Payment Element
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        clientSecret: this.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/Dashboard/${this.userId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        this.submitError = error.message || "שגיאה באישור התשלום. אנא נסה שוב.";
        return;
      }

      // Step 3: Update server with payment confirmation
      if (paymentIntent && paymentIntent.status === "requires_capture") {
        const confirmResponse = await fetch(`${URL}/api/payments/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: jobIdToUse,
            paymentIntentId: paymentIntent.id,
            stripeStatus: paymentIntent.status,
          }),
        });

        const confirmData = await confirmResponse.json();

        if (confirmData.success) {
          this.toast?.showSuccess(
            "התשלום אושר בהצלחה! הכסף יועבר לאחר אישור סיום העבודה."
          );
          // Redirect to dashboard
          setTimeout(() => {
            this.$router.push(`/Dashboard/${this.userId}`);
          }, 2000);
        } else {
          this.submitError =
            confirmData.message ||
            "התשלום אושר אך יש בעיה בעדכון השרת. אנא פנה לתמיכה.";
        }
      } else {
        this.submitError = "מצב תשלום לא צפוי. אנא פנה לתמיכה.";
      }
    },
    getPendingRegistrationData() {
      try {
        const data = localStorage.getItem("pendingHandymanRegistration");
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {}
      return null;
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
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Arial, sans-serif;

.payments-page {
  min-height: 100vh;
  background: $bg;
  padding: 16px;
  color: $text;
  font-family: $font-family;
}

.payments-container {
  max-width: 520px;
  margin: 0 auto;
}

.payments-header {
  margin-bottom: 24px;
}

.payments-back {
  margin-bottom: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.5);
  }
}

.payments-title {
  font-size: 24px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 6px 0;
  text-align: center;
}

.payments-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: $muted;
  margin: 0;
  text-align: center;
}

.subscription-plan-selector {
  margin-bottom: 20px;
}

.subscription-plan-selector__btn {
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  border: 2px solid rgba($orange, 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 106, 0, 0.15) 0%,
    rgba(255, 138, 43, 0.08) 100%
  );
  color: $text;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: $font-family;

  &:hover {
    border-color: $orange;
    background: linear-gradient(
      135deg,
      rgba(255, 106, 0, 0.2) 0%,
      rgba(255, 138, 43, 0.12) 100%
    );
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba($orange, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.subscription-plan-selector__icon {
  font-size: 20px;
}

.subscription-plan-selector__text {
  flex: 1;
  text-align: center;
}

.subscription-plan-selector__arrow {
  font-size: 12px;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.subscription-plans-wrapper {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.subscription-plans-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.subscription-plans-header__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.subscription-plans-header__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background: rgba(255, 106, 0, 0.15);
    border-color: rgba($orange, 0.5);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

.subscription-plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.subscription-plan {
  position: relative;
  padding: 18px;
  border-radius: 14px;
  border: 2px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &:hover {
    border-color: rgba($orange, 0.5);
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
  }

  &--selected {
    border-color: $orange;
    background: rgba(255, 106, 0, 0.12);
    box-shadow: 0 4px 20px rgba($orange, 0.3);
  }

  &--annual {
    border-color: rgba($orange, 0.4);
    background: linear-gradient(
      135deg,
      rgba(255, 106, 0, 0.15) 0%,
      rgba(255, 138, 43, 0.08) 100%
    );

    &.subscription-plan--selected {
      border-color: $orange2;
      background: linear-gradient(
        135deg,
        rgba(255, 106, 0, 0.2) 0%,
        rgba(255, 138, 43, 0.12) 100%
      );
      box-shadow: 0 6px 24px rgba($orange, 0.4);
    }
  }
}

.subscription-plan__badge {
  position: absolute;
  top: -8px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0b0f;
  font-size: 11px;
  font-weight: 1000;
  box-shadow: 0 2px 8px rgba($orange, 0.4);
  z-index: 1;
}

.subscription-plan__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.subscription-plan__icon {
  font-size: 20px;
}

.subscription-plan__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
}

.subscription-plan__price-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}

.subscription-plan__price-old {
  display: flex;
  align-items: baseline;
  gap: 2px;
  position: relative;
}

.subscription-plan__price-old-amount {
  font-size: 18px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  text-decoration-color: rgba(255, 255, 255, 0.6);
}

.subscription-plan__price-old-currency {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  text-decoration-color: rgba(255, 255, 255, 0.6);
}

.subscription-plan__price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.subscription-plan__price-amount {
  font-size: 28px;
  font-weight: 1000;
  color: $text;
  line-height: 1;
}

.subscription-plan__price-currency {
  font-size: 20px;
  font-weight: 900;
  color: $orange2;
}

.subscription-plan__price-period {
  font-size: 13px;
  font-weight: 700;
  color: $muted;
  margin-right: 2px;
}

.subscription-plan__warning {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  text-align: center;
  margin-top: 4px;
  line-height: 1.4;
}

.subscription-plan__monthly-note,
.subscription-plan__cancel-note {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  line-height: 1.4;
}

.subscription-plan__cancel-note {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.6);
}

.trial-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.15),
    rgba(139, 195, 74, 0.1)
  );
  border: 2px solid rgba(76, 175, 80, 0.4);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.trial-notice__icon {
  font-size: 28px;
  flex-shrink: 0;
}

.trial-notice__content {
  flex: 1;
}

.trial-notice__title {
  font-size: 18px;
  font-weight: 1000;
  color: #4caf50;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.trial-notice__text {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.subscription-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: rgba(255, 106, 0, 0.1);
  border: 1px solid rgba(255, 106, 0, 0.3);
}

.subscription-notice__icon {
  font-size: 24px;
  flex-shrink: 0;
}

.subscription-notice__content {
  flex: 1;
}

.subscription-notice__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 4px;
}

.subscription-notice__text {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.subscription-notice__resume {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.payment-form-wrapper {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 900;
  color: $text;
}

.stripe-element-container {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;

  &:focus-within {
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 15px;
  font-weight: 800;
  font-family: $font-family;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: $muted;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.form-error {
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  min-height: 16px;
  line-height: 1.4;

  &--submit {
    text-align: center;
    padding: 10px 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    margin-top: 4px;
  }
}

.amount-display {
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.3);
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.amount-display__period {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.security-notice__icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.security-notice__text {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

.payment-submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-size: 16px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  margin-top: 4px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba($orange, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@media (max-width: 768px) {
  .payments-page {
    padding: 12px;
  }

  .payments-header {
    margin-bottom: 20px;
  }

  .payments-title {
    font-size: 22px;
  }

  .payments-subtitle {
    font-size: 13px;
  }

  .payment-form-wrapper {
    padding: 20px;
    border-radius: 14px;
  }

  .payment-form {
    gap: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 400px) {
  .payments-page {
    padding: 10px;
  }

  .payments-header {
    margin-bottom: 18px;
  }

  .payments-title {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .payments-subtitle {
    font-size: 12px;
  }

  .payment-form-wrapper {
    padding: 16px;
    border-radius: 12px;
  }

  .payment-form {
    gap: 14px;
  }

  .form-row {
    gap: 14px;
  }

  .form-label {
    font-size: 12px;
  }

  .form-input {
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 8px;
  }

  .amount-display {
    font-size: 20px;
    padding: 12px 14px;
  }

  .security-notice {
    padding: 10px 12px;
    gap: 8px;
  }

  .security-notice__text {
    font-size: 11px;
  }

  .payment-submit-btn {
    padding: 12px;
    font-size: 15px;
  }
}

/* Wallet Section Styles */
.wallet-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.wallet-header {
  margin-bottom: 16px;
}

.wallet-title {
  font-size: 16px;
  font-weight: 900;
  color: $orange2;
  margin-bottom: 4px;
}

.wallet-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.wallet-button-wrapper {
  margin-bottom: 12px;
}

.wallet-button {
  width: 100%;
}

.wallet-loading {
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 600;
}

.wallet-error {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.wallet-hint {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  font-weight: 600;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &::before {
    margin-left: 10px;
  }

  &::after {
    margin-right: 10px;
  }

  span {
    padding: 0 10px;
  }
}
</style>
