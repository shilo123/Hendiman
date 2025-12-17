<template>
  <div class="sheet" v-if="visible">
    <div class="sheet__backdrop" @click="$emit('close')" />
    <div class="sheet__panel">
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
          <label class="field wide">
            <span>כתובת</span>
            <div class="edit-row">
              <input v-model="form.address" type="text" />
              <button class="icon-btn" type="button">✎</button>
            </div>
          </label>
        </div>
      </section>

      <section class="sheet__section" v-if="isHandyman">
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
          <CategorySelector v-model="form.specialties" :overlayMode="true" />
        </div>
      </section>

      <footer class="sheet__footer">
        <button class="btn ghost" type="button" @click="$emit('close')">
          בטל
        </button>
        <button class="btn primary" type="button" @click="onSave">שמור</button>
      </footer>
    </div>
  </div>
</template>

<script>
import cities from "@/APIS/AdressFromIsrael.json";
import CategorySelector from "@/components/CategorySelector.vue";

export default {
  name: "ProfileSheet",
  components: { CategorySelector },
  props: {
    visible: { type: Boolean, default: false },
    user: { type: Object, default: () => ({}) },
    isHandyman: { type: Boolean, default: false },
  },
  emits: ["close", "save"],
  data() {
    return {
      form: this.buildForm(this.user),
      cityInput: this.user?.city || "",
      cityError: "",
      cityDropdown: false,
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
        this.cityInput = val?.city || "";
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
        city: user?.city || "",
        address: user?.address || "",
        specialties: user?.specialties ? [...user.specialties] : [],
      };
    },
    selectCity(name) {
      this.form.city = name;
      this.cityInput = name;
      this.cityError = "";
      this.cityDropdown = false;
      this.cityDropdownStyle = {};
    },
    onCityInput() {
      this.form.city = this.cityInput;
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
      const found = cities.some((c) => c.name === name);
      if (!found) {
        this.cityError = "יש לבחור עיר מתוך הרשימה";
        return false;
      }
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
      this.form.city = this.cityInput.trim();
      this.$emit("save", { ...this.form });
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
  max-height: 90vh;
  background: #0f1016;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  overflow: visible; /* allow dropdowns to overflow */
  color: #f7f7f7;
}
.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.sheet__title {
  margin: 0;
  font-size: 20px;
}
.sheet__section {
  margin-bottom: 18px;
}
.section__title {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field span {
  font-size: 13px;
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
  font-size: 14px;
  outline: none;
}
.icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 6px 8px;
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
  gap: 8px;
  margin-bottom: 8px;
}
.chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 6px 10px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
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
}
.btn.primary {
  background: linear-gradient(135deg, #ff6a00, #ff8a2b);
  color: #0b0b0f;
  padding: 10px 16px;
}
.btn.ghost {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 10px 16px;
}
.sheet__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.muted {
  color: rgba(255, 255, 255, 0.6);
}
.wide {
  grid-column: 1 / -1;
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
}
</style>
