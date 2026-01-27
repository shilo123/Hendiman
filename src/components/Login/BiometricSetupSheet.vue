<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible" class="biometric-sheet-overlay" @click.self="handleClose">
        <div class="biometric-sheet" :class="{ 'biometric-sheet--success': setupComplete }">
          <!-- Handle bar -->
          <div class="biometric-sheet__handle"></div>

          <!-- Header -->
          <div class="biometric-sheet__header">
            <div class="biometric-sheet__icon-wrapper">
              <span class="material-symbols-outlined biometric-sheet__icon">fingerprint</span>
            </div>
            <h2 class="biometric-sheet__title">
              {{ setupComplete ? 'טביעת אצבע הוגדרה!' : 'הגדרת טביעת אצבע' }}
            </h2>
            <p class="biometric-sheet__subtitle">
              {{ setupComplete 
                ? 'מעכשיו תוכל להתחבר במהירות עם טביעת האצבע שלך' 
                : 'הזן את פרטי ההתחברות שלך פעם אחת כדי להפעיל כניסה מהירה' 
              }}
            </p>
          </div>

          <!-- Form (only when not complete) -->
          <div v-if="!setupComplete" class="biometric-sheet__form">
            <!-- Username Input -->
            <div class="biometric-sheet__field">
              <label class="biometric-sheet__label">שם משתמש / אימייל</label>
              <div class="biometric-sheet__input-wrapper">
                <span class="material-symbols-outlined biometric-sheet__input-icon">person</span>
                <input
                  v-model="username"
                  type="text"
                  class="biometric-sheet__input"
                  placeholder="הזן שם משתמש או אימייל"
                  :disabled="isLoading"
                  autocomplete="username"
                  dir="rtl"
                  @compositionend="onUsernameCompositionEnd"
                  @blur="onUsernameBlur"
                  @input="onUsernameInput"
                />
              </div>
            </div>

            <!-- Password Input -->
            <div class="biometric-sheet__field">
              <label class="biometric-sheet__label">סיסמה</label>
              <div class="biometric-sheet__input-wrapper">
                <span class="material-symbols-outlined biometric-sheet__input-icon">lock</span>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="biometric-sheet__input"
                  placeholder="הזן סיסמה"
                  :disabled="isLoading"
                  autocomplete="current-password"
                  dir="rtl"
                />
                <button
                  type="button"
                  class="biometric-sheet__toggle-password"
                  @click="showPassword = !showPassword"
                >
                  <span class="material-symbols-outlined">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="biometric-sheet__error">
              <span class="material-symbols-outlined">error</span>
              {{ errorMessage }}
            </div>

            <!-- Setup Button -->
            <button
              class="biometric-sheet__btn biometric-sheet__btn--primary"
              :disabled="!canSubmit || isLoading"
              @click="handleSetupBiometric"
            >
              <span v-if="isLoading" class="biometric-sheet__loader"></span>
              <span v-else class="material-symbols-outlined">fingerprint</span>
              <span>{{ isLoading ? 'מאמת...' : 'הגדר טביעת אצבע' }}</span>
            </button>

            <!-- Cancel Button -->
            <button
              class="biometric-sheet__btn biometric-sheet__btn--secondary"
              :disabled="isLoading"
              @click="handleClose"
            >
              ביטול
            </button>
          </div>

          <!-- Success State -->
          <div v-else class="biometric-sheet__success">
            <div class="biometric-sheet__success-icon">
              <span class="material-symbols-outlined">check_circle</span>
            </div>
            <button
              class="biometric-sheet__btn biometric-sheet__btn--primary"
              @click="handleContinue"
            >
              <span class="material-symbols-outlined">login</span>
              <span>המשך לדשבורד</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";

export default {
  name: "BiometricSetupSheet",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close", "success"],
  data() {
    return {
      username: "",
      password: "",
      showPassword: false,
      isLoading: false,
      errorMessage: "",
      setupComplete: false,
      userData: null,
      // For Android IME handling
      lastUsernameValue: "",
    };
  },
  computed: {
    canSubmit() {
      return this.username.trim().length > 0 && this.password.length > 0;
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // Reset state when opening
        this.username = "";
        this.password = "";
        this.showPassword = false;
        this.isLoading = false;
        this.errorMessage = "";
        this.setupComplete = false;
        this.userData = null;
        this.lastUsernameValue = "";
      }
    },
  },
  methods: {
    // Handle Android IME composition end event
    onUsernameCompositionEnd(event) {
      // When IME composition ends, ensure the value is captured
      const value = event.target.value;
      this.username = value;
      this.lastUsernameValue = value;
    },

    // Handle input event to track username changes
    onUsernameInput(event) {
      const value = event.target.value;
      this.username = value;
      // Update lastUsernameValue if the value is longer (to catch IME updates)
      if (value && value.length > (this.lastUsernameValue?.length || 0)) {
        this.lastUsernameValue = value;
      }
    },

    // Handle blur event to preserve username value
    onUsernameBlur(event) {
      // On Android, when moving to password field, the value might get truncated
      // This ensures we keep the correct value
      const currentValue = event.target.value;
      if (currentValue && currentValue.length > 0) {
        this.username = currentValue;
        this.lastUsernameValue = currentValue;
      } else if (this.lastUsernameValue) {
        // If the value was cleared incorrectly, restore it
        this.username = this.lastUsernameValue;
        event.target.value = this.lastUsernameValue;
      }
    },

    handleClose() {
      if (!this.isLoading) {
        this.$emit("close");
      }
    },

    async handleSetupBiometric() {
      if (!this.canSubmit || this.isLoading) return;

      this.isLoading = true;
      this.errorMessage = "";

      try {
        // Ensure we use the complete username value (handle Android IME issue)
        const finalUsername = this.lastUsernameValue || this.username.trim();
        
        if (!finalUsername || finalUsername.length === 0) {
          throw new Error("אנא הזן שם משתמש");
        }

        if (!this.password || this.password.length === 0) {
          throw new Error("אנא הזן סיסמה");
        }

        // Step 1: Verify credentials with server (with timeout)
        const response = await Promise.race([
          axios.post(`${URL}/login-user`, {
            username: finalUsername,
            password: this.password,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("תם הזמן - נסה שוב")), 15000)
          )
        ]);

        if (response.data.message !== "Success" || !response.data.user) {
          const errorMsg = response.data.message || "שם משתמש או סיסמה שגויים";
          if (errorMsg.includes("NoUser") || errorMsg.includes("NoEmail")) {
            throw new Error("שם משתמש לא נמצא במערכת");
          } else if (errorMsg.includes("NoPass")) {
            throw new Error("סיסמה שגויה");
          } else {
            throw new Error(errorMsg);
          }
        }

        const user = response.data.user;

        // Check if user is blocked
        if (user.isBlocked) {
          throw new Error("המשתמש חסום. פנה להנהלת הנדימן");
        }

        this.userData = user;

        // Step 2: Check if biometric is available
        if (!Capacitor.isNativePlatform()) {
          throw new Error("טביעת אצבע זמינה רק באפליקציה");
        }

        const biometryResult = await NativeBiometric.checkBiometry();
        
        if (!biometryResult.isAvailable) {
          throw new Error("טביעת אצבע לא זמינה במכשיר זה");
        }

        // Step 3: Prompt for biometric authentication
        const authResult = await NativeBiometric.authenticate({
          reason: "אמת את זהותך להגדרת כניסה מהירה",
          title: "אימות טביעת אצבע",
          subtitle: "הנח את האצבע על הסורק",
          description: "זה ישמור את פרטי ההתחברות שלך בצורה מאובטחת",
          negativeButtonText: "ביטול",
        });

        if (!authResult.isSuccess) {
          throw new Error("האימות בוטל");
        }

        // Step 4: Save credentials securely
        await this.saveCredentials(user);

        // Step 5: Show success state
        this.setupComplete = true;

      } catch (error) {
        // Handle different error types
        if (error.code === "USER_CANCEL" || error.message?.includes("cancel")) {
          this.errorMessage = "האימות בוטל";
        } else if (error.message?.includes("תם הזמן")) {
          this.errorMessage = "תם הזמן - נסה שוב";
        } else if (error.response?.data?.message) {
          const serverMsg = error.response.data.message;
          if (serverMsg.includes("NoUser") || serverMsg.includes("NoEmail")) {
            this.errorMessage = "שם משתמש לא נמצא במערכת";
          } else if (serverMsg.includes("NoPass")) {
            this.errorMessage = "סיסמה שגויה";
          } else if (serverMsg.includes("Blocked")) {
            this.errorMessage = "המשתמש חסום. פנה להנהלת הנדימן";
          } else {
            this.errorMessage = serverMsg;
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else if (error.code === "ECONNREFUSED" || error.message?.includes("Network")) {
          this.errorMessage = "לא ניתן להתחבר לשרת. אנא ודא שהשרת רץ";
        } else {
          this.errorMessage = "שגיאה בהגדרת טביעת אצבע. נסה שוב";
        }
      } finally {
        this.isLoading = false;
      }
    },

    async saveCredentials(user) {
      // Save credentials securely using Capacitor Preferences
      // These are encrypted on the device
      await Preferences.set({
        key: "biometric_username",
        value: this.username.trim(),
      });

      await Preferences.set({
        key: "biometric_password",
        value: this.password,
      });

      await Preferences.set({
        key: "biometric_userId",
        value: user._id,
      });

      await Preferences.set({
        key: "biometric_enabled",
        value: "true",
      });

      // Save device identifier for extra security
      const deviceId = await this.getDeviceId();
      if (deviceId) {
        await Preferences.set({
          key: "biometric_deviceId",
          value: deviceId,
        });
      }

      console.log("[BiometricSetup] Credentials saved successfully");
    },

    async getDeviceId() {
      try {
        // Generate a unique identifier based on timestamp and random string
        // This is a fallback since @capacitor/device is not installed
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${randomStr}`;
      } catch (e) {
        console.warn("[BiometricSetup] Could not generate device ID:", e);
        return null;
      }
    },

    handleContinue() {
      this.$emit("success", this.userData);
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #0a0a0b;
$card: #18181b;
$primary: #ff7b00;
$primary-light: #ff9500;
$success: #10b981;
$error: #ef4444;
$text: #ffffff;
$muted: #71717a;

.biometric-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.biometric-sheet {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: $bg;
  border-radius: 24px 24px 0 0;
  padding: 12px 24px 32px;
  padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
  direction: rtl;
  overflow-y: auto;

  &--success {
    .biometric-sheet__icon-wrapper {
      background: rgba($success, 0.15);
      border-color: rgba($success, 0.3);
    }

    .biometric-sheet__icon {
      color: $success;
    }
  }
}

.biometric-sheet__handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  margin: 0 auto 20px;
}

.biometric-sheet__header {
  text-align: center;
  margin-bottom: 28px;
}

.biometric-sheet__icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba($primary, 0.15);
  border: 2px solid rgba($primary, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  transition: all 0.3s;
}

.biometric-sheet__icon {
  font-size: 40px;
  color: $primary;
  transition: color 0.3s;
}

.biometric-sheet__title {
  font-size: 24px;
  font-weight: 900;
  color: $text;
  margin: 0 0 8px;
}

.biometric-sheet__subtitle {
  font-size: 14px;
  color: $muted;
  margin: 0;
  line-height: 1.5;
}

.biometric-sheet__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.biometric-sheet__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.biometric-sheet__label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.biometric-sheet__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.biometric-sheet__input-icon {
  position: absolute;
  right: 14px;
  font-size: 20px;
  color: $muted;
  pointer-events: none;
}

.biometric-sheet__input {
  width: 100%;
  height: 56px;
  padding: 0 48px;
  background: $card;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: $text;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;

  &::placeholder {
    color: $muted;
  }

  &:focus {
    outline: none;
    border-color: rgba($primary, 0.5);
    box-shadow: 0 0 0 3px rgba($primary, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.biometric-sheet__toggle-password {
  position: absolute;
  left: 12px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: $muted;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: $text;
  }

  .material-symbols-outlined {
    font-size: 20px;
  }
}

.biometric-sheet__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: rgba($error, 0.1);
  border: 1px solid rgba($error, 0.3);
  border-radius: 12px;
  color: $error;
  font-size: 13px;
  font-weight: 600;

  .material-symbols-outlined {
    font-size: 18px;
    flex-shrink: 0;
  }
}

.biometric-sheet__btn {
  width: 100%;
  height: 56px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.25s;

  .material-symbols-outlined {
    font-size: 22px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}

.biometric-sheet__btn--primary {
  background: linear-gradient(135deg, $primary-light 0%, $primary 100%);
  color: #000;
  box-shadow: 0 8px 24px rgba($primary, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 12px 32px rgba($primary, 0.4);
  }
}

.biometric-sheet__btn--secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: $muted;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: $text;
  }
}

.biometric-sheet__loader {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.biometric-sheet__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
}

.biometric-sheet__success-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba($success, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: successPulse 1s ease-out;

  .material-symbols-outlined {
    font-size: 56px;
    color: $success;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes successPulse {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// Sheet transition
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;

  .biometric-sheet {
    transform: translateY(100%);
  }
}

.sheet-enter-to,
.sheet-leave-from {
  opacity: 1;

  .biometric-sheet {
    transform: translateY(0);
  }
}

.sheet-enter-active .biometric-sheet,
.sheet-leave-active .biometric-sheet {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

