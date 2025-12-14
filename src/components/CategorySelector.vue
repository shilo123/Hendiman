<template>
  <div class="category-selector">
    <label for="specialtiesTextarea">תחומי התמחות</label>
    <div class="textarea-wrapper">
      <textarea
        id="specialtiesTextarea"
        v-model="textareaValue"
        readonly
        @mouseenter="showDropdown = true"
        @mouseleave="handleTextareaLeave"
        class="specialties-textarea"
        placeholder="עבור עם העכבר לבחירת תחומי התמחות"
      ></textarea>
    </div>

    <!-- Dropdown עם קטגוריות -->
    <div
      v-if="showDropdown"
      class="dropdown-container"
      @mouseenter="keepDropdownVisible"
      @mouseleave="hideDropdown"
    >
      <div class="categories-dropdown">
        <div
          v-for="category in categories"
          :key="category.name"
          class="category-item"
          @mouseenter="showSubcategories(category)"
          @mouseleave="hideSubcategories"
        >
          <span class="category-name">{{ category.name }}</span>
          <span class="arrow">←</span>
        </div>
      </div>

      <!-- תת-קטגוריות (מופיעות כשעוברים עם העכבר) -->
      <div
        v-if="hoveredCategory"
        class="subcategories-dropdown-wrapper"
        @mouseenter="keepSubcategoriesVisible"
        @mouseleave="hideSubcategories"
      >
        <div class="subcategories-dropdown-scroll">
          <div class="subcategories-dropdown" dir="rtl">
            <!-- שדה חיפוש -->
            <div class="subcategories-search-wrapper">
              <input
                v-model="subcategorySearchQuery"
                type="text"
                class="subcategories-search-input"
                placeholder="חפש תת-קטגוריה..."
                @input="handleSearchInput"
                @click.stop
              />
            </div>
            <div
              v-for="subcategory in filteredSubcategories"
              :key="subcategory.name"
              class="subcategory-item"
              @click="selectSubcategory(hoveredCategory.name, subcategory)"
              @mouseenter="showTooltip($event, subcategory)"
              @mouseleave="hideTooltip"
              @mouseover="keepTooltipVisible(subcategory, $event)"
            >
              <span class="subcategory-name">{{ subcategory.name }}</span>
            </div>
            <div v-if="filteredSubcategories.length === 0" class="no-results">
              לא נמצאו תוצאות
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip עם CategoryTitle -->
      <div
        v-if="tooltipSubcategory"
        class="tooltip"
        :style="tooltipStyle"
        @mouseenter="keepTooltipVisible(tooltipSubcategory, $event)"
        @mouseleave="hideTooltip"
      >
        <CategoryTitle
          :name="tooltipSubcategory.name"
          :price="tooltipSubcategory.price"
          :work-type="tooltipSubcategory.workType"
        />
      </div>
    </div>
  </div>
</template>

<script>
import categoriesData from "@/APIS/Categorhs.json";
import CategoryTitle from "./CategoryTitle.vue";

export default {
  name: "CategorySelector",
  components: {
    CategoryTitle,
  },
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      categories: categoriesData.categories || [],
      showDropdown: false,
      hoveredCategory: null,
      tooltipSubcategory: null,
      tooltipStyle: {},
      selectedItems: [],
      keepSubcategories: false,
      keepDropdown: false,
      hideSubcategoriesTimeout: null,
      hideTooltipTimeout: null,
      subcategorySearchQuery: "",
    };
  },
  computed: {
    textareaValue() {
      return this.selectedItems
        .map((item) => {
          const base = `${item.category}\\${item.subcategory}`;
          if (item.price && item.workType) {
            const priceText = `${item.price} ₪`;
            const workTypeText = item.workType === "לשעה" ? "לשעה" : "קבלנות";
            return `${base} - ${priceText} (${workTypeText})`;
          }
          return base;
        })
        .join("\n");
    },
    filteredSubcategories() {
      if (!this.hoveredCategory || !this.hoveredCategory.subcategories) {
        return [];
      }

      const query = this.subcategorySearchQuery.trim().toLowerCase();

      if (!query) {
        return this.hoveredCategory.subcategories;
      }

      return this.hoveredCategory.subcategories.filter((subcategory) =>
        subcategory.name.toLowerCase().includes(query)
      );
    },
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (Array.isArray(newValue) && newValue.length > 0) {
          // תמיכה גם באובייקטים (name, price, typeWork) וגם ב-strings ישנים
          this.selectedItems = newValue
            .filter((item) => item !== null && item !== undefined)
            .map((item) => {
              // אם זה אובייקט עם name, price, typeWork
              if (typeof item === "object" && item.name) {
                return {
                  category: "", // לא נחוץ יותר, אבל נשמור למקרה
                  subcategory: String(item.name).trim(),
                  price: item.price || null,
                  workType: item.typeWork || null,
                };
              }

              // אם זה string, נסה לפרסר אותו (תאימות לאחור)
              if (typeof item === "string") {
                const itemStr = String(item).trim();
                if (!itemStr || !itemStr.includes("\\")) {
                  return null;
                }

                const parts = itemStr.split("\\");
                if (parts.length < 2) {
                  return null;
                }

                const category = parts[0].trim();
                const rest = parts.slice(1).join("\\").trim();

                if (!category || !rest) {
                  return null;
                }

                // נסה לחלץ מחיר וסוג עבודה אם הם קיימים
                let subcategory = rest;
                let price = null;
                let workType = null;

                if (rest.includes(" - ")) {
                  const [subcatPart, details] = rest.split(" - ");
                  subcategory = subcatPart.trim();

                  if (details) {
                    // חפש מחיר (מספר עם ₪)
                    const priceMatch = details.match(/(\d+)\s*₪/);
                    if (priceMatch) {
                      price = parseInt(priceMatch[1], 10);
                    }

                    // חפש סוג עבודה
                    if (details.includes("לשעה")) {
                      workType = "לשעה";
                    } else if (details.includes("קבלנות")) {
                      workType = "קבלנות";
                    }
                  }
                }

                return {
                  category: category,
                  subcategory: subcategory,
                  price: price,
                  workType: workType,
                };
              }

              return null;
            })
            .filter((item) => item !== null); // הסר null items
        } else {
          this.selectedItems = [];
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleTextareaLeave() {
      setTimeout(() => {
        if (!this.keepDropdown) {
          this.showDropdown = false;
          this.hoveredCategory = null;
        }
      }, 200);
    },
    keepDropdownVisible() {
      this.keepDropdown = true;
    },
    hideDropdown() {
      this.keepDropdown = false;
      this.showDropdown = false;
      this.hoveredCategory = null;
    },
    showSubcategories(category) {
      // בטל את ה-timeout הקודם אם קיים
      if (this.hideSubcategoriesTimeout) {
        clearTimeout(this.hideSubcategoriesTimeout);
        this.hideSubcategoriesTimeout = null;
      }
      this.hoveredCategory = category;
      this.keepSubcategories = false;
      // אפס את שדה החיפוש כשעוברים לקטגוריה חדשה
      this.subcategorySearchQuery = "";
    },
    hideSubcategories() {
      // רק אם לא עוברים על התת-קטגוריות
      // בטל את ה-timeout הקודם אם קיים
      if (this.hideSubcategoriesTimeout) {
        clearTimeout(this.hideSubcategoriesTimeout);
      }
      this.hideSubcategoriesTimeout = setTimeout(() => {
        if (!this.keepSubcategories) {
          this.hoveredCategory = null;
        }
        this.hideSubcategoriesTimeout = null;
      }, 200);
    },
    keepSubcategoriesVisible() {
      this.keepSubcategories = true;
      // בטל את ה-timeout אם קיים
      if (this.hideSubcategoriesTimeout) {
        clearTimeout(this.hideSubcategoriesTimeout);
        this.hideSubcategoriesTimeout = null;
      }
    },
    selectSubcategory(categoryName, subcategory) {
      // ודא שיש נתונים תקינים
      if (!categoryName || !subcategory || !subcategory.name) {
        return;
      }

      const item = {
        category: String(categoryName).trim(),
        subcategory: String(subcategory.name).trim(),
        price: subcategory.price || null,
        workType: subcategory.workType || null,
      };

      // בדוק אם כבר קיים (case-insensitive)
      const exists = this.selectedItems.some(
        (i) =>
          i.category.toLowerCase() === item.category.toLowerCase() &&
          i.subcategory.toLowerCase() === item.subcategory.toLowerCase()
      );

      if (!exists) {
        // ודא ש-selectedItems הוא מערך
        if (!Array.isArray(this.selectedItems)) {
          this.selectedItems = [];
        }
        this.selectedItems.push(item);
        this.updateModelValue();
      }

      // אל תסגור את ה-dropdown - תן למשתמש לבחור עוד
      this.hoveredCategory = null;
      this.keepSubcategories = false;
    },
    showTooltip(event, subcategory) {
      // בטל את ה-timeout הקודם אם קיים
      if (this.hideTooltipTimeout) {
        clearTimeout(this.hideTooltipTimeout);
        this.hideTooltipTimeout = null;
      }

      this.tooltipSubcategory = subcategory;
      // חשב את המיקום של ה-tooltip - מצד שמאל (ימין ב-RTL) של התת-קטגוריות
      if (event && event.target) {
        const rect =
          event.target.closest(".subcategory-item")?.getBoundingClientRect() ||
          event.target.getBoundingClientRect();
        const subcategoriesDropdown = event.target
          .closest(".subcategories-dropdown")
          ?.getBoundingClientRect();

        if (subcategoriesDropdown) {
          // מיקום מצד שמאל (ימין ב-RTL) של התת-קטגוריות
          this.tooltipStyle = {
            top: `${rect.top + rect.height / 2}px`,
            right: `${window.innerWidth - subcategoriesDropdown.left + 10}px`,
            transform: "translateY(-50%)",
          };
        } else {
          this.tooltipStyle = {
            top: `${rect.top - 5}px`,
            right: `${window.innerWidth - rect.right}px`,
            transform: "translateY(-100%)",
          };
        }
      }
    },
    hideTooltip() {
      // השתמש ב-timeout כדי לתת זמן למעבר בין תת-קטגוריות
      if (this.hideTooltipTimeout) {
        clearTimeout(this.hideTooltipTimeout);
      }
      this.hideTooltipTimeout = setTimeout(() => {
        this.tooltipSubcategory = null;
        this.hideTooltipTimeout = null;
      }, 150);
    },
    keepTooltipVisible(subcategory, event) {
      // בטל את ה-timeout אם קיים
      if (this.hideTooltipTimeout) {
        clearTimeout(this.hideTooltipTimeout);
        this.hideTooltipTimeout = null;
      }
      // עדכן את ה-tooltip
      this.showTooltip(event, subcategory);
    },
    updateModelValue() {
      // ודא ש-selectedItems הוא מערך
      if (!Array.isArray(this.selectedItems)) {
        this.selectedItems = [];
      }

      // המר למערך של אובייקטים עם name, price, typeWork
      const value = this.selectedItems
        .filter((item) => item && item.subcategory)
        .map((item) => {
          return {
            name: String(item.subcategory).trim(),
            price: item.price || null,
            typeWork: item.workType || null,
          };
        })
        .filter((obj) => obj.name.length > 0); // הסר אובייקטים עם name ריק

      this.$emit("update:modelValue", value);
    },
    handleSearchInput() {
      // הפונקציה הזו קיימת רק כדי למנוע בועות אירועים
      // החיפוש עצמו מתבצע דרך computed property
    },
  },
};
</script>

<style scoped>
.category-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.category-selector label {
  color: #f97316;
  font-weight: 600;
  font-size: 0.8rem;
  text-align: right;
}

.textarea-wrapper {
  position: relative;
}

.specialties-textarea {
  width: 100%;
  max-width: 100%;
  min-height: 100px;
  background: #1f1f1f;
  border: 2px solid #2d2d2d;
  border-radius: 6px;
  padding: 10px 12px;
  color: #f97316;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  resize: vertical;
  cursor: pointer;
  font-family: inherit;
  box-sizing: border-box;
  font-weight: 500;

  &:hover {
    border-color: #f97316;
    background: #2a2a2a;
  }

  &:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
    background: #2a2a2a;
  }

  &::placeholder {
    color: #888;
  }
}

.dropdown-container {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 5px;
  z-index: 1000;
  display: flex;
  gap: 0;
  align-items: flex-start;
}

.categories-dropdown {
  background: #1a1a1a;
  border: 2px solid #f97316;
  border-radius: 8px;
  width: 200px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
  flex-shrink: 0;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  margin: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 20px;
  background: #2d2d2d;
  border: 1px solid #2d2d2d;
  direction: rtl;

  &:hover {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: #000000;
    border-color: #f97316;
    transform: scale(1.02);
  }
}

.category-name {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}

.arrow {
  color: #f97316;
  font-size: 1.2rem;
  margin-left: 10px;
}

.category-item:hover .arrow {
  color: #000000;
}

.subcategories-dropdown-wrapper {
  position: absolute;
  right: calc(100% + 2px);
  top: 0;
  z-index: 1001;
}

.subcategories-dropdown-scroll {
  background: #1a1a1a;
  border: 2px solid #f97316;
  border-radius: 8px;
  width: 280px;
  max-height: 400px;
  height: 400px;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  direction: rtl;
  scrollbar-width: auto;
  scrollbar-color: #f97316 #2d2d2d;
}

.subcategories-dropdown {
  direction: rtl;
  padding: 4px 0;
  min-height: 100%;
}

.subcategories-search-wrapper {
  padding: 8px;
  margin-bottom: 4px;
  position: sticky;
  top: 0;
  background: #1a1a1a;
  z-index: 10;
  border-bottom: 1px solid #2d2d2d;
}

.subcategories-search-input {
  width: 100%;
  background: #2d2d2d;
  border: 2px solid #2d2d2d;
  border-radius: 6px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: #666;
    font-size: 0.8rem;
  }

  &:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
    background: #3a3a3a;
  }

  &:hover {
    border-color: #f97316;
  }
}

.no-results {
  padding: 20px 15px;
  text-align: center;
  color: #888;
  font-size: 0.85rem;
  direction: rtl;
}

.subcategory-item {
  padding: 10px 15px;
  margin: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 20px;
  background: #2d2d2d;
  border: 1px solid #2d2d2d;
  direction: ltr;
  width: 60%;
  text-align: right;

  &:hover {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: #000000;
    border-color: #f97316;
    transform: scale(1.02);
  }
}

.subcategory-name {
  color: #ffffff;
  font-size: 0.85rem;
}

.subcategory-item:hover .subcategory-name {
  color: #000000;
}

.tooltip {
  position: fixed;
  z-index: 1001;
  pointer-events: none;
  min-width: 250px;
  margin-bottom: 5px;
}

/* Scrollbar styling */
.categories-dropdown::-webkit-scrollbar,
.subcategories-dropdown-scroll::-webkit-scrollbar {
  width: 16px !important;
  height: 100% !important;
  display: block !important;
  -webkit-appearance: none !important;
  background: transparent !important;
}

.categories-dropdown::-webkit-scrollbar-track,
.subcategories-dropdown-scroll::-webkit-scrollbar-track {
  background: #2d2d2d !important;
  border-radius: 8px !important;
  margin: 2px 0 !important;
}

.categories-dropdown::-webkit-scrollbar-thumb,
.subcategories-dropdown-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
  border-radius: 8px !important;
  border: 2px solid #1a1a1a !important;
  min-height: 50px !important;
}

.categories-dropdown::-webkit-scrollbar-thumb:hover,
.subcategories-dropdown-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ea580c 0%, #f97316 100%) !important;
}

.categories-dropdown::-webkit-scrollbar-corner,
.subcategories-dropdown-scroll::-webkit-scrollbar-corner {
  background: #1a1a1a !important;
}

/* Firefox scrollbar */
.categories-dropdown,
.subcategories-dropdown-scroll {
  scrollbar-width: auto !important;
  scrollbar-color: #f97316 #2d2d2d !important;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .dropdown-container {
    position: fixed;
    bottom: auto;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    margin: 0;
    max-width: 90vw;
    flex-direction: column;
    gap: 10px;
  }

  .categories-dropdown {
    width: 100%;
    max-width: 300px;
    max-height: 250px;
  }

  .subcategories-dropdown {
    position: relative;
    right: auto;
    top: auto;
    margin: 10px 0 0 0;
    width: 100%;
    max-width: 300px;
    max-height: 350px;
  }

  .specialties-textarea {
    min-height: 80px;
    font-size: 0.85rem;
  }

  .category-item,
  .subcategory-item {
    padding: 10px 12px;
    margin: 3px 5px;
    font-size: 0.85rem;
  }

  .tooltip {
    position: fixed;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    transform: translate(-50%, -50%) !important;
    min-width: 200px;
    max-width: 90vw;
  }
}

@media (max-width: 480px) {
  .dropdown-container {
    max-width: 95vw;
  }

  .categories-dropdown,
  .subcategories-dropdown {
    max-width: 100%;
    max-height: 300px;
  }

  .category-item,
  .subcategory-item {
    padding: 8px 10px;
    margin: 2px 4px;
    font-size: 0.8rem;
  }

  .arrow {
    font-size: 1rem;
  }
}
</style>
