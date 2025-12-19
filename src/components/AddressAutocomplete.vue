<template>
  <div class="address-autocomplete">
    <input
      :id="inputId"
      :value="modelValue"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      @keydown="handleKeydown"
      type="text"
      :placeholder="placeholder"
      :required="required"
      :class="{ invalid: showError }"
      autocomplete="off"
    />
    <div
      v-if="showSuggestions && filteredCities.length > 0"
      class="suggestions-dropdown"
    >
      <div
        v-for="(city, index) in filteredCities"
        :key="city.semel_yeshuv || city.מספר_ישוב || index"
        class="suggestion-item"
        :class="{ highlighted: index === highlightedIndex }"
        @click="selectCity(city)"
        @mouseenter="highlightedIndex = index"
      >
        {{ city.name || city.שם_ישוב || "" }}
      </div>
    </div>
    <div v-if="showError" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import citiesData from "@/APIS/AdressFromIsrael.json";

export default {
  name: "AddressAutocomplete",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    inputId: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      default: "הכנס שם ישוב",
    },
    required: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue", "update:englishName", "update:selectedCity"],
  data() {
    // סינון שורת הכותרת אם יש
    const filteredCities = Array.isArray(citiesData)
      ? citiesData.filter((city) => {
          // דלג על שורות כותרת (שדות שמתחילים ב-"סמל" או "שם" כערכים)
          if (city.name === "שם_ישוב" || city.שם_ישוב === "שם_ישוב") {
            return false;
          }
          return true;
        })
      : [];

    return {
      cities: filteredCities,
      showSuggestions: false,
      filteredCities: [],
      highlightedIndex: -1,
      showError: false,
      errorMessage: "ישוב זה לא נמצא במאגר",
      userInput: "",
    };
  },
  methods: {
    handleInput(event) {
      const value = event.target.value;
      this.userInput = value;
      this.$emit("update:modelValue", value);
      this.showError = false;

      // אם המשתמש מחק את "המיקום שלי" או התחיל להקליד משהו אחר
      if (value && value !== "המיקום שלי" && value.length >= 1) {
        this.filterCities(value);
        this.showSuggestions = true;
      } else {
        this.showSuggestions = false;
        this.filteredCities = [];
      }
    },
    filterCities(query) {
      // ניקוי של הרווחים והמרה ל-lowercase
      const searchTerm = query.trim().toLowerCase().replace(/\s+/g, " ");

      if (!searchTerm || searchTerm.length === 0) {
        this.filteredCities = [];
        this.highlightedIndex = -1;
        return;
      }

      // חיפוש בכל הישובים
      const allMatches = this.cities
        .map((city) => {
          // תמיכה בשני פורמטים: name (חדש) או שם_ישוב (ישן)
          const cityName = (city.name || city.שם_ישוב || "").trim();
          if (!cityName) return null;

          // ניקוי רווחים כפולים והמרה ל-lowercase
          const normalizedCityName = cityName
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/['"]/g, ""); // הסרת גרשיים

          // חיפוש בכל מקום בשם
          if (normalizedCityName.includes(searchTerm)) {
            const startsWith = normalizedCityName.startsWith(searchTerm);
            return {
              city,
              cityName,
              startsWith,
              index: normalizedCityName.indexOf(searchTerm),
            };
          }
          return null;
        })
        .filter((item) => item !== null)
        .sort((a, b) => {
          // מי שמתחיל עם החיפוש קודם
          if (a.startsWith && !b.startsWith) return -1;
          if (!a.startsWith && b.startsWith) return 1;
          // אחר כך מי שהחיפוש מופיע מוקדם יותר
          if (a.index !== b.index) return a.index - b.index;
          // אחר כך לפי אורך השם (קצר יותר קודם)
          return a.cityName.length - b.cityName.length;
        })
        .map((item) => item.city)
        .slice(0, 20); // הגדלתי ל-20 תוצאות

      this.filteredCities = allMatches;
      this.highlightedIndex = -1;
    },
    selectCity(city) {
      const cityName = city.name || city.שם_ישוב || "";
      const englishName = city.english_name || city.שם_ישוב_לועזי || "";
      this.userInput = cityName;
      this.$emit("update:modelValue", cityName);
      this.$emit("update:englishName", englishName);
      this.$emit("update:selectedCity", city); // שלח את כל האובייקט של הישוב
      this.showSuggestions = false;
      this.showError = false;
      this.filteredCities = [];
    },
    handleBlur() {
      // Delay to allow click on suggestion
      setTimeout(() => {
        this.showSuggestions = false;
        this.validateCity();
      }, 200);
    },
    handleFocus() {
      if (this.modelValue && this.modelValue.length >= 1) {
        this.filterCities(this.modelValue);
        this.showSuggestions = true;
      }
    },
    handleKeydown(event) {
      if (!this.showSuggestions || this.filteredCities.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.highlightedIndex = Math.min(
          this.highlightedIndex + 1,
          this.filteredCities.length - 1
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
      } else if (event.key === "Enter" && this.highlightedIndex >= 0) {
        event.preventDefault();
        this.selectCity(this.filteredCities[this.highlightedIndex]);
      } else if (event.key === "Escape") {
        this.showSuggestions = false;
      }
    },
    validateCity() {
      if (!this.modelValue || this.modelValue.trim() === "") {
        if (this.required) {
          this.showError = true;
          this.errorMessage = "חובה להזין שם ישוב";
        }
        return;
      }

      const searchValue = this.modelValue.trim();

      // "המיקום שלי" תמיד תקין - לא צריך לבדוק אותו
      if (searchValue === "המיקום שלי") {
        this.showError = false;
        return;
      }

      const normalizedSearch = searchValue.replace(/\s+/g, " ");

      // חיפוש בכל הישובים (לא רק ב-filteredCities)
      let foundCity = null;
      const cityExists = this.cities.some((city) => {
        // תמיכה בשני פורמטים: name (חדש) או שם_ישוב (ישן)
        const cityName = (city.name || city.שם_ישוב || "").trim();
        if (!cityName) return false;

        // ניקוי רווחים כפולים
        const normalizedCityName = cityName.replace(/\s+/g, " ");

        let matches = false;

        // השוואה מדויקת (רגיש לאותיות)
        if (normalizedCityName === normalizedSearch) {
          matches = true;
        }
        // השוואה case-insensitive (אם יש הבדל באותיות)
        else if (
          normalizedCityName.toLowerCase() === normalizedSearch.toLowerCase()
        ) {
          matches = true;
        }
        // השוואה עם הסרת תווים מיוחדים
        else {
          const cleanCity = normalizedCityName.replace(/['"()]/g, "").trim();
          const cleanSearch = normalizedSearch.replace(/['"()]/g, "").trim();
          if (cleanCity === cleanSearch) {
            matches = true;
          }
        }

        if (matches) {
          foundCity = city;
          return true;
        }

        return false;
      });

      if (!cityExists) {
        this.showError = true;
        this.errorMessage = "ישוב זה לא נמצא במאגר";
      } else {
        this.showError = false;
        // עדכן את englishName וגם את selectedCity גם אם המשתמש לא בחר מהרשימה
        if (foundCity) {
          const englishName =
            foundCity.english_name || foundCity.שם_ישוב_לועזי || "";
          if (englishName) {
            this.$emit("update:englishName", englishName);
          }
          // שלח את הישוב שנמצא
          this.$emit("update:selectedCity", foundCity);
        }
      }
    },
  },
};
</script>

<style scoped>
.address-autocomplete {
  position: relative;
  width: 100%;
}

.address-autocomplete input {
  width: 100%;
  background: #1f1f1f;
  border: 2px solid #2d2d2d;
  border-radius: 6px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  box-sizing: border-box;
  font-family: inherit;
}

.address-autocomplete input::placeholder {
  color: #666;
  font-size: 0.85rem;
}

.address-autocomplete input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
  background: #2a2a2a;
}

.address-autocomplete input:hover {
  border-color: #f97316;
}

.address-autocomplete input.invalid {
  border-color: #dc3545;
}

.address-autocomplete input.invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1f1f1f;
  border: 2px solid #f97316;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  direction: rtl;
  margin-top: 2px;
}

.suggestion-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #2d2d2d;
  transition: all 0.2s ease;
  color: #ffffff;
  font-size: 0.9rem;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #000000;
  font-weight: 600;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 5px;
  text-align: right;
}
</style>
