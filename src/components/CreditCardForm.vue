<template>
  <div class="credit-card-form">
    <section class="block block--credit">
      <div class="block__head">
        <div class="block__label">פרטי אשראי</div>
        <div class="block__req">חובה</div>
      </div>

      <div class="credit-info">
        <p class="credit-info__text">
          הכסף מגיע להנדימן רק אחרי העבודה
        </p>
      </div>

      <div class="credit-form">
        <!-- Stripe Elements Card Element -->
        <div class="field" v-if="stripe && elements">
          <label class="field__label">פרטי כרטיס אשראי</label>
          <div :id="cardElementId" class="stripe-card-element"></div>
          <div v-if="cardError" class="msg msg--err">
            {{ cardError }}
          </div>
        </div>

        <!-- Fallback: Manual input if Stripe not loaded -->
        <template v-else>
          <div class="field">
            <label class="field__label" for="cardNumber"
              >מספר כרטיס אשראי</label
            >
            <input
              :id="`cardNumber-${uniqueId}`"
              v-model="creditCard.cardNumber"
              type="text"
              class="input-small"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              @input="formatCardNumber"
            />
            <div v-if="errors.cardNumber" class="msg msg--err">
              {{ errors.cardNumber }}
            </div>
          </div>

          <div class="field">
            <label class="field__label" :for="`cardName-${uniqueId}`"
              >שם על הכרטיס</label
            >
            <input
              :id="`cardName-${uniqueId}`"
              v-model="creditCard.cardName"
              type="text"
              class="input-small"
              placeholder="יוסף כהן"
              @input="clearError('cardName')"
            />
            <div v-if="errors.cardName" class="msg msg--err">
              {{ errors.cardName }}
            </div>
          </div>

          <div class="twoCols">
            <div class="field">
              <label class="field__label" :for="`expiryDate-${uniqueId}`"
                >תאריך תפוגה</label
              >
              <input
                :id="`expiryDate-${uniqueId}`"
                v-model="creditCard.expiryDate"
                type="text"
                class="input-small"
                placeholder="MM/YY"
                maxlength="5"
                @input="formatExpiryDate"
              />
              <div v-if="errors.expiryDate" class="msg msg--err">
                {{ errors.expiryDate }}
              </div>
            </div>

            <div class="field">
              <label class="field__label" :for="`cvv-${uniqueId}`">CVV</label>
              <input
                :id="`cvv-${uniqueId}`"
                v-model="creditCard.cvv"
                type="text"
                class="input-small"
                placeholder="123"
                maxlength="4"
                @input="formatCVV"
              />
              <div v-if="errors.cvv" class="msg msg--err">
                {{ errors.cvv }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
import { loadStripe } from "@stripe/stripe-js";
import { URL } from "@/Url/url";

export default {
  name: "CreditCardForm",
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
      }),
    },
    errors: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue", "update:errors", "payment-method-created", "validation-changed"],
  data() {
    return {
      stripe: null,
      elements: null,
      cardElement: null,
      cardError: null,
      creditCard: {
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
      },
      uniqueId: Math.random().toString(36).substring(7),
      cardElementId: `card-element-${Math.random().toString(36).substring(7)}`,
    };
  },
  watch: {
    modelValue: {
      handler(newVal) {
        if (newVal) {
          this.creditCard = { ...newVal };
        }
      },
      immediate: true,
      deep: true,
    },
    creditCard: {
      handler(newVal) {
        this.$emit("update:modelValue", { ...newVal });
      },
      deep: true,
    },
    cardError(newVal) {
      this.$emit("validation-changed", !newVal);
    },
  },
  async mounted() {
    // Load Stripe for payment processing
    try {
      console.log("[CreditCardForm] Loading Stripe publishable key...");
      const response = await fetch(`${URL}/api/stripe/publishable-key`);
      const data = await response.json();
      if (data.publishableKey) {
        console.log(
          "[CreditCardForm] Stripe publishable key loaded:",
          data.publishableKey.substring(0, 10) + "..."
        );
        this.stripe = await loadStripe(data.publishableKey);
        if (this.stripe) {
          console.log("[CreditCardForm] Stripe instance created successfully");
          // Initialize Stripe Elements
          this.elements = this.stripe.elements();
          console.log("[CreditCardForm] Stripe Elements initialized");
          
          // Initialize card element
          this.$nextTick(() => {
            this.initStripeElements();
          });
        }
      } else {
        console.error("[CreditCardForm] No publishable key received from server");
      }
    } catch (error) {
      console.error("[CreditCardForm] Error loading Stripe:", error);
    }
  },
  beforeUnmount() {
    // Clean up Stripe Elements
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
        console.log("[CreditCardForm] Stripe Elements card unmounted");
      } catch (error) {
        console.error("[CreditCardForm] Error unmounting Stripe Elements:", error);
      }
    }
  },
  methods: {
    initStripeElements() {
      if (!this.stripe || !this.elements) {
        console.error("[CreditCardForm] Stripe or Elements not initialized");
        return;
      }

      try {
        console.log("[CreditCardForm] Initializing Stripe Elements...");

        // Create card element
        const cardElement = this.elements.create("card", {
          style: {
            base: {
              fontSize: "16px",
              color: "#ffffff",
              fontFamily: "Arial, sans-serif",
              "::placeholder": {
                color: "rgba(255, 255, 255, 0.5)",
              },
            },
            invalid: {
              color: "#ff3b3b",
            },
          },
        });

        // Mount card element
        const cardElementContainer = document.getElementById(this.cardElementId);
        if (cardElementContainer) {
          cardElement.mount(`#${this.cardElementId}`);
          this.cardElement = cardElement;
          console.log("[CreditCardForm] Stripe Elements card mounted successfully");

          // Listen for changes
          cardElement.on("change", (event) => {
            console.log("[CreditCardForm] Card element change:", {
              complete: event.complete,
              error: event.error ? event.error.message : null,
            });
            if (event.error) {
              this.cardError = event.error.message;
            } else {
              this.cardError = null;
            }
            this.$emit("validation-changed", !event.error);
          });
        } else {
          console.error("[CreditCardForm] Card element container not found");
        }
      } catch (error) {
        console.error("[CreditCardForm] Error initializing Stripe Elements:", error);
      }
    },
    formatCardNumber(event) {
      let value = event.target.value.replace(/\s/g, "");
      value = value.replace(/\D/g, "");
      let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
      if (formattedValue.length > 19) {
        formattedValue = formattedValue.substring(0, 19);
      }
      this.creditCard.cardNumber = formattedValue;
      this.clearError("cardNumber");
    },
    formatExpiryDate(event) {
      let value = event.target.value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }
      this.creditCard.expiryDate = value;
      this.clearError("expiryDate");
    },
    formatCVV(event) {
      let value = event.target.value.replace(/\D/g, "");
      if (value.length > 4) {
        value = value.substring(0, 4);
      }
      this.creditCard.cvv = value;
      this.clearError("cvv");
    },
    clearError(field) {
      if (this.errors[field]) {
        const newErrors = { ...this.errors };
        delete newErrors[field];
        this.$emit("update:errors", newErrors);
      }
    },
    async validate() {
      // If using Stripe Elements, validation is handled by Stripe
      if (this.cardElement) {
        return !this.cardError;
      }

      // Fallback: Manual validation
      const errors = {};
      let isValid = true;

      // Validate card number (should be 16 digits)
      const cardNumberDigits = this.creditCard.cardNumber.replace(/\s/g, "");
      if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
        errors.cardNumber = "מספר כרטיס לא תקין";
        isValid = false;
      }

      // Validate card name
      if (
        !this.creditCard.cardName ||
        this.creditCard.cardName.trim().length < 2
      ) {
        errors.cardName = "שם על הכרטיס חובה";
        isValid = false;
      }

      // Validate expiry date (MM/YY format)
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(this.creditCard.expiryDate)) {
        errors.expiryDate = "תאריך תפוגה לא תקין (MM/YY)";
        isValid = false;
      }

      // Validate CVV (3-4 digits)
      if (this.creditCard.cvv.length < 3 || this.creditCard.cvv.length > 4) {
        errors.cvv = "CVV לא תקין";
        isValid = false;
      }

      this.$emit("update:errors", errors);
      return isValid;
    },
    async createPaymentMethod() {
      if (!this.stripe) {
        throw new Error("Stripe not initialized");
      }

      console.log("[CreditCardForm] Creating payment method with Stripe...");

      // Validate first
      const isValid = await this.validate();
      if (!isValid) {
        throw new Error("Credit card validation failed");
      }

      let paymentMethod;

      // Use Stripe Elements if available (recommended)
      if (this.cardElement) {
        console.log("[CreditCardForm] Using Stripe Elements to create payment method");
        const { error: pmError, paymentMethod: pm } =
          await this.stripe.createPaymentMethod({
            type: "card",
            card: this.cardElement,
            billing_details: {
              name: this.creditCard.cardName || "Client",
            },
          });

        if (pmError) {
          console.error("[CreditCardForm] Stripe Elements payment method error:", pmError);
          throw new Error(pmError.message || "שגיאה ביצירת אמצעי תשלום");
        }

        paymentMethod = pm;
      } else {
        // Fallback: Manual input (not recommended, but for backward compatibility)
        console.log("[CreditCardForm] Using manual card input (fallback)");
        const cardNumberDigits = this.creditCard.cardNumber.replace(/\s/g, "");
        const [month, year] = this.creditCard.expiryDate.split("/");

        const { error: pmError, paymentMethod: pm } =
          await this.stripe.createPaymentMethod({
            type: "card",
            card: {
              number: cardNumberDigits,
              exp_month: parseInt(month),
              exp_year: parseInt("20" + year),
              cvc: this.creditCard.cvv,
            },
            billing_details: {
              name: this.creditCard.cardName,
            },
          });

        if (pmError || !pm) {
          console.error("[CreditCardForm] Manual payment method error:", pmError);
          throw new Error(
            pmError?.message || "שגיאה ביצירת אמצעי תשלום. אנא נסה שוב."
          );
        }

        paymentMethod = pm;
      }

      if (!paymentMethod) {
        throw new Error("Payment method is null");
      }

      console.log("[CreditCardForm] Payment method created successfully:", paymentMethod.id);

      // Emit event with payment method ID
      this.$emit("payment-method-created", paymentMethod.id);
      return paymentMethod.id;
    },
  },
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$danger: #ff3b3b;

.credit-card-form {
  width: 100%;
}

.block--credit {
  min-height: auto;
}

.credit-info {
  margin-bottom: 20px;
}

.credit-info__text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.credit-form {
  display: grid;
  gap: 16px;
}

/* Stripe Elements Card Element */
.stripe-card-element {
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  min-height: 48px;
  transition: all 0.2s;
}

.stripe-card-element:focus {
  outline: none;
  border-color: $orange;
  background: rgba(255, 255, 255, 0.06);
}

.stripe-card-element--invalid {
  border-color: rgba($danger, 0.55);
  background: rgba($danger, 0.08);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.input-small {
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: #ffffff;
  font-size: 16px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: $orange;
    background: rgba(255, 255, 255, 0.06);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.twoCols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.msg {
  font-size: 13px;
  margin-top: 4px;
}

.msg--err {
  color: rgba($danger, 0.9);
}
</style>

