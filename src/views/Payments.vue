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

          <!-- Stripe Card Elements - Separate fields for better control -->
          <div class="form-field">
            <label class="form-label">מספר כרטיס</label>
            <div class="stripe-fields-wrapper">
              <!-- Loading Skeleton -->
              <div v-if="isLoadingStripe" class="stripe-loading-skeleton">
                <div class="skeleton skeleton-label"></div>
                <div class="skeleton skeleton-input"></div>
              </div>
              <div v-show="!isLoadingStripe" id="card-number-element" class="stripe-input-field"></div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">תאריך תפוגה</label>
              <div class="stripe-fields-wrapper">
                <!-- Loading Skeleton -->
                <div v-if="isLoadingStripe" class="stripe-loading-skeleton">
                  <div class="skeleton skeleton-label"></div>
                  <div class="skeleton skeleton-input"></div>
                </div>
                <div v-show="!isLoadingStripe" id="card-expiry-element" class="stripe-input-field"></div>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">קוד אבטחה (CVV)</label>
              <div class="stripe-fields-wrapper">
                <!-- Loading Skeleton -->
                <div v-if="isLoadingStripe" class="stripe-loading-skeleton">
                  <div class="skeleton skeleton-label"></div>
                  <div class="skeleton skeleton-input"></div>
                </div>
                <div v-show="!isLoadingStripe" id="card-cvc-element" class="stripe-input-field"></div>
              </div>
            </div>
          </div>
          
          <!-- Loading Spinner and Text -->
          <div v-if="isLoadingStripe" class="stripe-loading-container">
            <div class="stripe-loading-spinner"></div>
            <div class="stripe-loading-text">💳 טוען פרטי תשלום...</div>
            <div class="stripe-loading-subtext">אנא המתן, טוען את השדות...</div>
          </div>
          
          <div id="card-errors" class="form-error" role="alert"></div>

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
      stripePromise: null, // Store the promise to wait for it
      elements: null,
      paymentElement: null,
      cardNumberElement: null,
      cardExpiryElement: null,
      cardCvcElement: null,
      stripePublishableKey: null,
      currentJobId: null,
      currentAmount: null,
      isSubscription: false,
      paymentForm: {},
      isProcessing: false,
      submitError: "",
      isStripeReady: false,
      isLoadingStripe: true,
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
        // Ignore subscription status errors
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

  },
  async mounted() {
    // Wait for DOM to be ready
    await this.$nextTick();
    
    // Load Stripe publishable key and initialize Stripe
    try {
      const response = await fetch(`${URL}/api/stripe/publishable-key`);
      const data = await response.json();
      
      if (data.publishableKey) {
        this.stripePublishableKey = data.publishableKey;
        this.stripePromise = loadStripe(data.publishableKey);
        
        try {
          this.stripe = await this.stripePromise;
        } catch (error) {
          logger.error("[PAYMENTS] Error loading Stripe:", error);
          this.submitError = "שגיאה בטעינת מערכת התשלומים. אנא רענן את הדף.";
          return;
        }
      } else {
        this.submitError = "לא הצלחנו לטעון את מפתח התשלום. אנא נסה שוב.";
        return;
      }
    } catch (error) {
      logger.error("[PAYMENTS] Error loading Stripe publishable key:", error);
      this.submitError = "שגיאה בטעינת מערכת התשלומים. אנא נסה שוב.";
      return;
    }
    
    if (!this.stripe) {
      this.submitError = "מערכת התשלומים לא נטענה. אנא רענן את הדף.";
      return;
    }
    
    // Wait for containers to be ready
    await this.$nextTick();
    let cardNumberContainer = document.getElementById("card-number-element");
    if (!cardNumberContainer) {
      await new Promise(resolve => setTimeout(resolve, 500));
      cardNumberContainer = document.getElementById("card-number-element");
      if (!cardNumberContainer) {
        this.submitError = "שגיאה: שדה התשלום לא נמצא. אנא רענן את הדף.";
        return;
      }
    }
    
    try {
      await this.initializePaymentElement();
    } catch (error) {
      logger.error("[PAYMENTS] Error initializing Payment Element:", error);
      this.submitError = "שגיאה באתחול שדות התשלום. אנא רענן את הדף.";
    }
  },
  beforeUnmount() {
    // Clean up Stripe card elements
    if (this.cardNumberElement) {
      try { this.cardNumberElement.unmount(); } catch (e) { /* ignore */ }
      this.cardNumberElement = null;
    }
    if (this.cardExpiryElement) {
      try { this.cardExpiryElement.unmount(); } catch (e) { /* ignore */ }
      this.cardExpiryElement = null;
    }
    if (this.cardCvcElement) {
      try { this.cardCvcElement.unmount(); } catch (e) { /* ignore */ }
      this.cardCvcElement = null;
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
      if (!this.stripe) {
        this.submitError = "מערכת התשלומים לא נטענה. אנא רענן את הדף.";
        this.isLoadingStripe = false;
        return;
      }

      this.isLoadingStripe = true;
      await this.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Clean up existing card elements
        if (this.cardNumberElement) {
          try { this.cardNumberElement.unmount(); } catch (e) { /* ignore */ }
          this.cardNumberElement = null;
        }
        if (this.cardExpiryElement) {
          try { this.cardExpiryElement.unmount(); } catch (e) { /* ignore */ }
          this.cardExpiryElement = null;
        }
        if (this.cardCvcElement) {
          try { this.cardCvcElement.unmount(); } catch (e) { /* ignore */ }
          this.cardCvcElement = null;
        }

        // Reset Stripe ready state
        this.isStripeReady = false;

        // Step 1: Get clientSecret from server
        let clientSecret = null;

        if (this.isSubscription) {
          const registrationData = this.getPendingRegistrationData();
          if (!registrationData) {
            this.submitError = "נתוני הרשמה לא נמצאו. אנא חזור לדף ההרשמה.";
            return;
          }

          try {
            const createSubscriptionResponse = await fetch(
              `${URL}/api/subscription/create`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  registrationData: registrationData,
                  planType: this.selectedPlan,
                }),
              }
            );

            if (!createSubscriptionResponse.ok) {
              this.submitError = `שגיאה בשרת (${createSubscriptionResponse.status}). אנא נסה שוב.`;
              return;
            }

            const subscriptionData = await createSubscriptionResponse.json();
            
            if (!subscriptionData.success || !subscriptionData.clientSecret) {
              this.submitError =
                subscriptionData.message || "שגיאה ביצירת מנוי. אנא נסה שוב.";
              return;
            }
            clientSecret = subscriptionData.clientSecret;
          } catch (fetchError) {
            logger.error("[PAYMENTS] Error creating subscription:", fetchError);
            this.submitError = "שגיאה בחיבור לשרת. אנא נסה שוב.";
            return;
          }
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

        // Step 2: Create Elements instance with clientSecret
        if (this.elements) {
          this.elements = null;
        }

        const elementsOptions = {
          clientSecret: clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#ff6a00",
              colorBackground: "#1a1a1f",
              colorText: "rgba(255, 255, 255, 0.92)",
              colorDanger: "#ef4444",
              fontFamily: '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              borderRadius: "8px",
            },
          },
          locale: "he",
        };

        this.elements = this.stripe.elements(elementsOptions);

        // Card element style
        const cardStyle = {
          base: {
            color: "rgba(255, 255, 255, 0.92)",
            fontFamily: '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            fontSize: "15px",
            fontWeight: "500",
            lineHeight: "24px",
            "::placeholder": {
              color: "rgba(255, 255, 255, 0.4)",
            },
          },
          invalid: {
            color: "#ef4444",
            iconColor: "#ef4444",
          },
        };

        // Step 3: Create individual card elements
        this.cardNumberElement = this.elements.create("cardNumber", {
          style: cardStyle,
          showIcon: true,
        });

        this.cardExpiryElement = this.elements.create("cardExpiry", {
          style: cardStyle,
        });

        this.cardCvcElement = this.elements.create("cardCvc", {
          style: cardStyle,
        });

        // Step 4: Mount card elements
        const cardNumberContainer = document.getElementById("card-number-element");
        const cardExpiryContainer = document.getElementById("card-expiry-element");
        const cardCvcContainer = document.getElementById("card-cvc-element");

        if (cardNumberContainer && cardExpiryContainer && cardCvcContainer) {
          this.cardNumberElement.mount("#card-number-element");
          this.cardExpiryElement.mount("#card-expiry-element");
          this.cardCvcElement.mount("#card-cvc-element");

          // Handle errors
          const displayError = document.getElementById("card-errors");
          
          const handleError = (event) => {
            if (displayError) {
              displayError.textContent = event.error ? event.error.message : "";
            }
          };

          this.cardNumberElement.on("change", handleError);
          this.cardExpiryElement.on("change", handleError);
          this.cardCvcElement.on("change", handleError);

          // Set ready when all elements are ready AND visible
          let readyCount = 0;
          const checkAllReady = () => {
            readyCount++;
            logger.log(`[PAYMENTS] Element ready: ${readyCount}/3`);
            
            // Wait a bit more to ensure iframes are loaded
            setTimeout(() => {
              if (readyCount >= 3) {
                // Double check that iframes are actually loaded
                const checkIframesLoaded = () => {
                  const cardNumberIframes = cardNumberContainer.querySelectorAll("iframe");
                  const cardExpiryIframes = cardExpiryContainer.querySelectorAll("iframe");
                  const cardCvcIframes = cardCvcContainer.querySelectorAll("iframe");
                  
                  const allIframesLoaded = 
                    cardNumberIframes.length > 0 && 
                    cardExpiryIframes.length > 0 && 
                    cardCvcIframes.length > 0;
                  
                  if (allIframesLoaded) {
                    this.isStripeReady = true;
                    this.isLoadingStripe = false;
                    logger.log("[PAYMENTS] All card elements ready and iframes loaded");
                  } else {
                    logger.log("[PAYMENTS] Waiting for iframes to load...");
                    // Retry after 500ms
                    setTimeout(checkIframesLoaded, 500);
                  }
                };
                
                checkIframesLoaded();
              }
            }, 300);
          };

          this.cardNumberElement.on("ready", checkAllReady);
          this.cardExpiryElement.on("ready", checkAllReady);
          this.cardCvcElement.on("ready", checkAllReady);

          // Extended fallback timeout - wait longer for slow connections
          setTimeout(() => {
            if (!this.isStripeReady) {
              // Final check - if iframes exist, mark as ready
              const cardNumberIframes = cardNumberContainer.querySelectorAll("iframe");
              const cardExpiryIframes = cardExpiryContainer.querySelectorAll("iframe");
              const cardCvcIframes = cardCvcContainer.querySelectorAll("iframe");
              
              if (cardNumberIframes.length > 0 || cardExpiryIframes.length > 0 || cardCvcIframes.length > 0) {
                this.isStripeReady = true;
                this.isLoadingStripe = false;
                logger.log("[PAYMENTS] Setting isStripeReady after extended timeout (iframes found)");
              } else {
                // If still no iframes, wait a bit more
                setTimeout(() => {
                  this.isStripeReady = true;
                  this.isLoadingStripe = false;
                  logger.log("[PAYMENTS] Setting isStripeReady after extended timeout (force)");
                }, 2000);
              }
            }
          }, 5000); // Extended to 5 seconds
        } else {
          this.submitError = "שגיאה: שדות התשלום לא נמצאו. אנא רענן את הדף.";
          this.isLoadingStripe = false;
        }
      } catch (error) {
        this.submitError = "שגיאה באתחול מערכת התשלומים. אנא נסה שוב.";
        this.isLoadingStripe = false;
        logger.error("[PAYMENTS] Error initializing Card Elements:", error);
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount || 0);
    },
    async handlePayment() {
      if (!this.isStripeReady || !this.cardNumberElement || !this.clientSecret) {
        this.submitError = "מערכת התשלומים לא נטענה. אנא רענן את הדף.";
        return;
      }

      logger.log("[PAYMENTS] Starting payment process", {
        isSubscription: this.isSubscription,
        hasClientSecret: !!this.clientSecret,
      });

      this.isProcessing = true;
      this.submitError = "";

      try {
        if (this.isSubscription) {
          await this.handleSubscriptionPayment();
        } else {
          await this.handleRegularPayment();
        }
      } catch (error) {
        logger.error("[PAYMENTS] Payment process error:", error);
        this.submitError = error.message || "שגיאה בחיבור לשרת. אנא נסה שוב.";
      } finally {
        this.isProcessing = false;
      }
    },
    async handleSubscriptionPayment() {
      // Confirm Payment with Card Element
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(
        this.clientSecret,
        {
          payment_method: {
            card: this.cardNumberElement,
          },
        }
      );

      if (error) {
        logger.error("[PAYMENTS] Stripe payment confirmation error:", error);
        this.submitError = error.message || "שגיאה באישור התשלום. אנא נסה שוב.";
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        logger.log("[PAYMENTS] Payment succeeded, completing registration", {
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentIntent.payment_method,
        });

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

          logger.log("[PAYMENTS] Complete response status:", completeResponse.status);

          if (!completeResponse.ok) {
            const errorText = await completeResponse.text();
            logger.error("[PAYMENTS] Complete response not OK:", {
              status: completeResponse.status,
              statusText: completeResponse.statusText,
              body: errorText,
            });
            this.submitError = "שגיאה בהשלמת הרשמת מנוי. אנא פנה לתמיכה.";
            return;
          }

          const completeData = await completeResponse.json();
          logger.log("[PAYMENTS] Complete response data:", completeData);

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
            logger.error("[PAYMENTS] Complete registration failed:", completeData);
            this.submitError =
              completeData.message ||
              "שגיאה בהשלמת הרשמת מנוי. אנא פנה לתמיכה.";
          }
        } catch (fetchError) {
          logger.error("[PAYMENTS] Error calling /api/subscription/complete:", fetchError);
          this.submitError = "שגיאה בהשלמת הרשמת מנוי. אנא פנה לתמיכה או נסה שוב.";
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

      // Confirm Payment with Card Element
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(
        this.clientSecret,
        {
          payment_method: {
            card: this.cardNumberElement,
          },
        }
      );

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
  overflow: visible;
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
  overflow: visible;
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
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
  min-height: auto;
  width: 100%;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative;
  overflow: visible;
}

.stripe-fields-wrapper {
  position: relative;
}

// Skeleton Loading Styles
.stripe-loading-skeleton {
  width: 100%;
  pointer-events: none;
  
  .skeleton {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 25%, rgba($orange, 0.3) 50%, rgba(255, 255, 255, 0.08) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 8px;
    pointer-events: none;
  }
  
  .skeleton-label {
    width: 40%;
    height: 14px;
    margin-bottom: 8px;
    pointer-events: none;
  }
  
  .skeleton-input {
    height: 56px;
    border-radius: 10px;
    width: 100%;
    pointer-events: none;
  }
}

.stripe-loading-container {
  text-align: center;
  margin: 30px 0;
  padding: 20px;
}

.stripe-loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.1);
  border-top: 5px solid $orange;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.stripe-loading-text {
  color: $orange;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

.stripe-loading-subtext {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

.stripe-input-field {
  padding: 16px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
  width: 100%;
  min-height: 56px;
  box-sizing: border-box;
  pointer-events: auto !important;
  position: relative;
  z-index: 1;

  &:focus-within {
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }
}

/* Force ALL Stripe iframes to be visible - must be outside scoped to override App.vue */
.stripe-element-container iframe,
#card-element iframe,
[id="card-element"] iframe {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 100% !important;
  height: auto !important;
  min-height: 40px !important;
  position: relative !important;
  border: none !important;
  z-index: 9999 !important;
  pointer-events: auto !important;
  left: auto !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  transform: scale(1) !important;
  overflow: visible !important;
}

/* Hide only developer tools iframes */
.stripe-element-container iframe[name*="__privateStripeFrame"],
.stripe-element-container iframe[name*="privateStripeFrame"],
.stripe-element-container iframe[title*="מסגרת כלים למפתחי פס"],
.stripe-element-container iframe[title*="Stripe developer tools frame"],
#card-element iframe[name*="__privateStripeFrame"],
#card-element iframe[name*="privateStripeFrame"],
[id="card-element"] iframe[name*="__privateStripeFrame"],
[id="card-element"] iframe[name*="privateStripeFrame"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  pointer-events: none !important;
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
    grid-template-columns: 1fr 1fr;
    gap: 12px;
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

<!-- Global styles for Stripe elements -->
<style>
/* Force Stripe iframes to be visible */
.stripe-input-field > div,
.stripe-input-field iframe {
  display: block !important;
  width: 100% !important;
}

.stripe-input-field iframe {
  visibility: visible !important;
  opacity: 1 !important;
  min-height: 24px !important;
  position: relative !important;
  border: none !important;
  pointer-events: auto !important;
}

/* Overflow visible for containers */
.payment-form-wrapper,
.payment-form,
.form-field {
  overflow: visible !important;
}
</style>
