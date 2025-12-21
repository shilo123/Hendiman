<template>
  <div class="sheet" v-if="visible">
    <div class="sheet__backdrop" @click="$emit('close')" />
    <div class="sheet__panel" :class="{ 'sheet__panel--handyman': isHandyman }">
      <header class="sheet__header">
        <h2 class="sheet__title">פרופיל משתמש</h2>
        <button class="icon-btn" type="button" @click="$emit('close')">
          ✕
        </button>
      </header>

      <section class="sheet__section">
        <h3 class="section__title">פרטים אישיים</h3>
        <div class="form-grid">
          <label class="field">
            <span>שם</span>
            <div class="edit-row">
              <input v-model="form.name" type="text" />
              <button class="icon-btn" type="button">✎</button>
            </div>
          </label>
          <label class="field">
            <span>טלפון</span>
            <div class="edit-row">
              <input v-model="form.phone" type="text" />
              <button class="icon-btn" type="button">✎</button>
            </div>
          </label>
          <label class="field">
            <span>אימייל</span>
            <div class="edit-row">
              <input v-model="form.email" type="email" />
              <button class="icon-btn" type="button">✎</button>
            </div>
          </label>
          <label class="field">
            <span>עיר</span>
            <div class="edit-row city-row">
              <input
                v-model="cityInput"
                type="text"
                autocomplete="off"
                @focus="onCityFocus"
                @input="onCityInput"
                @blur="onCityBlur"
              />
              <button class="icon-btn" type="button">✎</button>
              <div v-if="cityDropdown" class="city-dropdown">
                <div
                  v-for="c in filteredCities"
                  :key="c.name"
                  class="city-option"
                  @mousedown.prevent="selectCity(c.name)"
                >
                  {{ c.name }}
                </div>
                <div
                  v-if="filteredCities.length === 0"
                  class="city-option muted"
                >
                  לא נמצאה עיר
                </div>
              </div>
            </div>
            <span v-if="cityError" class="error">{{ cityError }}</span>
          </label>
        </div>
      </section>

      <section class="sheet__section specialties-section" v-if="isHandyman">
        <h3 class="section__title">תחומי התמחות</h3>
        <div class="chips">
          <span
            v-for="spec in form.specialties"
            :key="spec.name || spec"
            class="chip"
          >
            {{ spec.name || spec }}
            <button
              class="chip__remove"
              type="button"
              @click="removeSpec(spec)"
            >
              ✕
            </button>
          </span>
          <span
            v-if="!form.specialties || form.specialties.length === 0"
            class="muted"
            >לא הוגדרו התמחויות</span
          >
        </div>
        <div class="selector-wrapper">
          <ProfileSpecialtiesSelector v-model="form.specialties" />
        </div>
      </section>

      <footer class="sheet__footer">
        <button
          class="btn danger"
          type="button"
          @click="showDeleteConfirm = true"
        >
          מחק משתמש
        </button>
        <div class="sheet__footer__right">
          <button class="btn ghost" type="button" @click="$emit('close')">
            בטל
          </button>
          <button class="btn primary" type="button" @click="onSave">
            שמור
          </button>
        </div>
      </footer>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="deleteUserModal"
      dir="rtl"
      @click.self="showDeleteConfirm = false"
    >
      <div class="deleteUserModal__content">
        <div class="deleteUserModal__icon">⚠️</div>
        <h2 class="deleteUserModal__title">מחיקת משתמש</h2>
        <p class="deleteUserModal__message">
          האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה ביטול.
        </p>
        <div class="deleteUserModal__actions">
          <button
            class="deleteUserModal__btn deleteUserModal__btn--cancel"
            type="button"
            @click="showDeleteConfirm = false"
          >
            בטל
          </button>
          <button
            class="deleteUserModal__btn deleteUserModal__btn--confirm"
            type="button"
            @click="handleDeleteUser"
            :disabled="isDeleting"
          >
            {{ isDeleting ? "מוחק..." : "כן, מחק" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import cities from "@/APIS/AdressFromIsrael.json";
import ProfileSpecialtiesSelector from "@/components/ProfileSpecialtiesSelector.vue";
import axios from "axios";
import { URL } from "@/Url/url";

export default {
  name: "ProfileSheet",
  components: { ProfileSpecialtiesSelector },
  props: {
    visible: { type: Boolean, default: false },
    user: { type: Object, default: () => ({}) },
    isHandyman: { type: Boolean, default: false },
  },
  emits: ["close", "save"],
  data() {
    return {
      form: this.buildForm(this.user),
      cityInput: this.user?.address || "",
      cityError: "",
      cityDropdown: false,
      cityEnglishName: null, // שמור את השם באנגלית של הישוב
      showDeleteConfirm: false,
      isDeleting: false,
    };
  },
  computed: {
    filteredCities() {
      const q = (this.cityInput || "").trim();
      const list = cities.filter((c) => c.name && typeof c.name === "string");
      if (!q) return list.slice(1, 30); // skip header row default view
      return list.filter((c) => c.name.includes(q)).slice(0, 30);
    },
  },
  watch: {
    user: {
      handler(val) {
        this.form = this.buildForm(val);
        this.cityInput = val?.address || "";
        // מצא את השם באנגלית של הישוב הקיים
        if (val?.address) {
          const foundCity = cities.find((c) => c.name === val.city);
          if (foundCity) {
            this.cityEnglishName =
              foundCity.english_name || foundCity.שם_ישוב_לועזי || null;
          }
        }
      },
      deep: true,
    },
  },
  methods: {
    buildForm(user) {
      return {
        name: user?.username || user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        address: user?.address || "",
        specialties: user?.specialties ? [...user.specialties] : [],
      };
    },
    selectCity(name) {
      this.form.address = name;
      this.cityInput = name;
      this.cityError = "";
      this.cityDropdown = false;
      this.cityDropdownStyle = {};
      // מצא את השם באנגלית של הישוב
      const foundCity = cities.find((c) => c.name === name);
      if (foundCity) {
        this.cityEnglishName =
          foundCity.english_name || foundCity.שם_ישוב_לועזי || null;
      } else {
        this.cityEnglishName = null;
      }
    },
    onCityInput() {
      this.form.address = this.cityInput;
      this.cityError = "";
      this.cityDropdown = true;
    },
    onCityFocus() {
      this.cityDropdown = true;
    },
    onCityBlur() {
      setTimeout(() => {
        this.cityDropdown = false;
      }, 150);
    },
    validateCity() {
      const name = (this.cityInput || "").trim();
      if (!name) {
        this.cityError = "בחר עיר";
        return false;
      }
      const foundCity = cities.find((c) => c.name === name);
      if (!foundCity) {
        this.cityError = "יש לבחור עיר מתוך הרשימה";
        return false;
      }
      // עדכן את השם באנגלית
      this.cityEnglishName =
        foundCity.english_name || foundCity.שם_ישוב_לועזי || null;
      this.cityError = "";
      return true;
    },
    removeSpec(spec) {
      this.form.specialties = this.form.specialties.filter(
        (s) => (s.name || s) !== (spec.name || spec)
      );
    },
    onSave() {
      if (!this.validateCity()) return;
      this.form.address = this.cityInput.trim();
      // מצא את השם באנגלית אם עדיין לא נמצא
      if (!this.cityEnglishName) {
        const foundCity = cities.find((c) => c.name === this.form.city);
        if (foundCity) {
          this.cityEnglishName =
            foundCity.english_name || foundCity.שם_ישוב_לועזי || null;
        }
      }
      // שלח גם את השם באנגלית
      this.$emit("save", {
        ...this.form,
        cityEnglishName: this.cityEnglishName,
      });
      // סגור את המסך אחרי שמירה
      this.$emit("close");
    },
    async handleDeleteUser() {
      const userId = this.user?._id || this.user?.id;
      if (!userId) {
        alert("שגיאה: לא ניתן לזהות את המשתמש");
        return;
      }

      this.isDeleting = true;
      try {
        const response = await axios.delete(`${URL}/users/${userId}`);
        if (response.data.success) {
          // Close modal and sheet
          this.showDeleteConfirm = false;
          this.$emit("delete-user");
          this.$emit("close");
          // Redirect to home or login
          this.$router.push("/");
        } else {
          alert(
            response.data.message || "שגיאה במחיקת המשתמש. נסה שוב מאוחר יותר."
          );
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        const errorMessage =
          error.response?.data?.message ||
          "שגיאה במחיקת המשתמש. נסה שוב מאוחר יותר.";
        alert(errorMessage);
      } finally {
        this.isDeleting = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.sheet {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Heebo", sans-serif;
}
.sheet__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}
.sheet__panel {
  position: relative;
  width: min(920px, 95vw);
  max-height: calc(100vh - 28px);
  background: #0f1016;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  overflow: visible; /* allow dropdowns to overflow */
  color: #f7f7f7;
}
.sheet__panel--handyman {
  width: min(1100px, 95vw);
}
.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.sheet__title {
  margin: 0;
  font-size: 18px;
}
.sheet__section {
  margin-bottom: 12px;
}
.section__title {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}
.edit-row {
  display: flex;
  gap: 8px;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 6px 8px;
  position: relative;
}
.edit-row input:focus {
  outline: none;
}
.edit-row input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 13px;
  outline: none;
}
.icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 5px 7px;
  color: #fff;
  cursor: pointer;
}
.city-row .city-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  left: 0;
  max-height: 220px;
  overflow: auto;
  background: #0f1016;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  z-index: 9999;
}
.city-option {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.city-option:last-child {
  border-bottom: none;
}
.city-option:hover {
  background: rgba(255, 255, 255, 0.06);
}
.error {
  color: #ff8888;
  font-size: 12px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 5px 9px;
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
}
.chip__remove {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
}
.selector-wrapper {
  position: relative;
}
.specialties-section .selector-wrapper {
  width: 100%;
}
:deep(.selector-wrapper .category-selector) {
  position: relative;
  overflow: visible;
}
:deep(.selector-wrapper .dropdown-container) {
  position: absolute;
  top: auto;
  bottom: calc(100% + 8px);
  right: 0;
  left: auto;
  width: 360px;
  max-height: 380px;
  overflow: auto;
  z-index: 20000;
}
:deep(.selector-wrapper .subcategories-dropdown-wrapper) {
  position: absolute;
  top: 0;
  right: calc(100% + 10px);
  width: 360px;
  max-height: 380px;
  overflow: auto;
  z-index: 20001;
}
.add-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.add-row input {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px;
  color: #fff;
  outline: none;
}
.add-row .btn {
  padding: 10px 14px;
}
.btn {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s ease;
}
.btn.primary {
  background: linear-gradient(135deg, #ff6a00, #ff8a2b);
  color: #0b0b0f;
  padding: 10px 20px;
  margin-right: 5px;
}
.btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 106, 0, 0.3);
}
.btn.ghost {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 10px 20px;
  margin-right: 5px;
}
.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.08);
}
.btn.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 20px;
  margin-right: 5px;
}
.btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}
.sheet__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sheet__footer__right {
  display: flex;
  gap: 10px;
  margin-right: auto; /* דחוף את הכפתורים לצד ימין */
}
.muted {
  color: rgba(255, 255, 255, 0.6);
}
.wide {
  grid-column: 1 / -1;
}

.deleteUserModal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.deleteUserModal__content {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  width: min(400px, 90vw);
  text-align: center;
}

.deleteUserModal__icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.deleteUserModal__title {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 16px 0;
}

.deleteUserModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.deleteUserModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.deleteUserModal__btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.24);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  transition: all 0.2s ease;
  min-width: 100px;
}

.deleteUserModal__btn--cancel {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.deleteUserModal__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.deleteUserModal__btn--confirm {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.deleteUserModal__btn--confirm:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
  transform: translateY(-1px);
}

.deleteUserModal__btn--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.deleteUserModal__btn:active:not(:disabled) {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .sheet__panel {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .deleteUserModal__content {
    padding: 20px;
  }
  .deleteUserModal__actions {
    flex-direction: column;
  }
  .deleteUserModal__btn {
    width: 100%;
  }
}
</style>
