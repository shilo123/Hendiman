<template>
  <div class="single-category-selector">
    <label for="subcategoryInput">תחום-התמחות</label>
    <div class="input-wrapper">
      <input
        id="subcategoryInput"
        v-model="displayValue"
        readonly
        @click.stop="openDropdown"
        @focus="openDropdown"
        class="subcategory-input"
        placeholder="לחץ לבחירת תחום-התמחות דרוש"
      />
      <span class="input-arrow" :class="{ 'arrow-up': showDropdown }">▼</span>
    </div>

    <!-- Dropdown עם קטגוריות -->
    <div
      v-if="showDropdown"
      class="dropdown-container"
      @click.stop
      @mouseenter="keepDropdownVisible"
      @mouseleave="handleDropdownLeave"
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
  name: "SingleCategorySelector",
  components: {
    CategoryTitle,
  },
  props: {
    modelValue: {
      type: Object,
      default: null,
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
      selectedItem: null,
      keepSubcategories: false,
      keepDropdown: false,
      hideSubcategoriesTimeout: null,
      hideTooltipTimeout: null,
      subcategorySearchQuery: "",
    };
  },
  computed: {
    displayValue() {
      if (this.selectedItem && this.selectedItem.subcategory) {
        return this.selectedItem.subcategory;
      }
      return "";
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
        if (newValue && typeof newValue === "object" && newValue.name) {
          this.selectedItem = {
            category: "",
            subcategory: String(newValue.name).trim(),
            price: newValue.price || null,
            workType: newValue.typeWork || null,
          };
        } else {
          this.selectedItem = null;
        }
      },
      immediate: true,
    },
    showDropdown(newVal) {
      if (newVal) {
        // הוסף event listener לסגירה בלחיצה מחוץ
        this.$nextTick(() => {
          document.addEventListener("click", this.handleClickOutside);
        });
      } else {
        // הסר event listener
        document.removeEventListener("click", this.handleClickOutside);
      }
    },
  },
  beforeUnmount() {
    // נקה event listeners לפני unmount
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    openDropdown() {
      if (!this.showDropdown) {
        this.showDropdown = true;
        this.keepDropdown = true;
      }
    },
    keepDropdownVisible() {
      this.keepDropdown = true;
    },
    handleDropdownLeave() {
      this.keepDropdown = false;
      // תן זמן קצר לפני סגירה כדי לאפשר מעבר בין אלמנטים
      setTimeout(() => {
        if (!this.keepDropdown) {
          this.showDropdown = false;
          this.hoveredCategory = null;
        }
      }, 200);
    },
    hideDropdown() {
      this.keepDropdown = false;
      setTimeout(() => {
        if (!this.keepDropdown) {
          this.showDropdown = false;
          this.hoveredCategory = null;
        }
      }, 200);
    },
    showSubcategories(category) {
      if (this.hideSubcategoriesTimeout) {
        clearTimeout(this.hideSubcategoriesTimeout);
        this.hideSubcategoriesTimeout = null;
      }
      this.hoveredCategory = category;
      this.keepSubcategories = false;
      this.subcategorySearchQuery = "";
    },
    hideSubcategories() {
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
      if (this.hideSubcategoriesTimeout) {
        clearTimeout(this.hideSubcategoriesTimeout);
        this.hideSubcategoriesTimeout = null;
      }
    },
    selectSubcategory(categoryName, subcategory) {
      if (!categoryName || !subcategory || !subcategory.name) {
        return;
      }

      const item = {
        category: String(categoryName).trim(),
        subcategory: String(subcategory.name).trim(),
        price: subcategory.price || null,
        workType: subcategory.workType || null,
      };

      this.selectedItem = item;
      this.updateModelValue();
      this.keepDropdown = false;
      setTimeout(() => {
        this.showDropdown = false;
        this.hoveredCategory = null;
      }, 100);
    },
    showTooltip(event, subcategory) {
      if (this.hideTooltipTimeout) {
        clearTimeout(this.hideTooltipTimeout);
        this.hideTooltipTimeout = null;
      }

      this.tooltipSubcategory = subcategory;
      if (event && event.target) {
        const rect =
          event.target.closest(".subcategory-item")?.getBoundingClientRect() ||
          event.target.getBoundingClientRect();
        const subcategoriesDropdown = event.target
          .closest(".subcategories-dropdown")
          ?.getBoundingClientRect();

        if (subcategoriesDropdown) {
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
      if (this.hideTooltipTimeout) {
        clearTimeout(this.hideTooltipTimeout);
      }
      this.hideTooltipTimeout = setTimeout(() => {
        this.tooltipSubcategory = null;
        this.hideTooltipTimeout = null;
      }, 150);
    },
    keepTooltipVisible(subcategory, event) {
      if (this.hideTooltipTimeout) {
        clearTimeout(this.hideTooltipTimeout);
        this.hideTooltipTimeout = null;
      }
      this.showTooltip(event, subcategory);
    },
    updateModelValue() {
      if (!this.selectedItem || !this.selectedItem.subcategory) {
        this.$emit("update:modelValue", null);
        return;
      }

      const value = {
        name: String(this.selectedItem.subcategory).trim(),
        price: this.selectedItem.price || null,
        typeWork: this.selectedItem.workType || null,
      };

      this.$emit("update:modelValue", value);
    },
    handleSearchInput() {
      // הפונקציה הזו קיימת רק כדי למנוע בועות אירועים
    },
    handleClickOutside(event) {
      // סגור את ה-dropdown אם לוחצים מחוץ ל-component
      const component = this.$el;
      if (component && !component.contains(event.target)) {
        this.keepDropdown = false;
        this.showDropdown = false;
        this.hoveredCategory = null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;

$bg: #0b0b0f;
$bg2: #0f1016;
$card: rgba(255, 255, 255, 0.06);
$card2: rgba(255, 255, 255, 0.085);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.single-category-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.single-category-selector label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.78);
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.subcategory-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: #1a1a1a;
  color: $text;
  padding: 12px 40px 12px 12px;
  font-weight: 900;
  font-size: 16px;
  transition: all 0.2s ease;
  text-align: right;
  direction: rtl;
  cursor: pointer;
  font-family: $font-family;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.45);
    background: #1f1f1f;
  }

  &:hover {
    border-color: rgba($orange, 0.28);
    background: #1d1d1d;
  }
}

.input-arrow {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: $orange;
  font-size: 12px;
  pointer-events: none;
  transition: transform 0.2s ease;

  &.arrow-up {
    transform: translateY(-50%) rotate(180deg);
  }
}

.dropdown-container {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  z-index: 1000;
  display: flex;
  gap: 0;
  align-items: flex-start;
}

.categories-dropdown {
  background: #1a1a1a;
  border: 1px solid rgba($orange, 0.3);
  border-radius: 18px;
  width: 200px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
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
  border: 1px solid rgba($orange, 0.18);
  direction: rtl;

  &:hover {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #000000;
    border-color: rgba($orange, 0.5);
    transform: scale(1.02);
  }
}

.category-name {
  color: $text;
  font-size: 14px;
  font-weight: 900;
}

.category-item:hover .category-name {
  color: #000000;
}

.arrow {
  color: $orange;
  font-size: 16px;
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
  border: 1px solid rgba($orange, 0.3);
  border-radius: 18px;
  width: 280px;
  max-height: 400px;
  height: 400px;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  direction: rtl;
  scrollbar-width: auto;
  scrollbar-color: $orange #2d2d2d;
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
  border-bottom: 1px solid rgba($orange, 0.18);
}

.subcategories-search-input {
  width: 100%;
  background: #2d2d2d;
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  padding: 8px 12px;
  color: $text;
  font-size: 13px;
  transition: all 0.2s ease;
  text-align: right;
  direction: rtl;
  font-family: $font-family;
  box-sizing: border-box;
  font-weight: 900;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.45);
    background: #333333;
  }

  &:hover {
    border-color: rgba($orange, 0.28);
    background: #303030;
  }
}

.no-results {
  padding: 20px 15px;
  text-align: center;
  color: $muted;
  font-size: 13px;
  direction: rtl;
  font-weight: 900;
}

.subcategory-item {
  padding: 10px 15px;
  margin: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 20px;
  background: #2d2d2d;
  border: 1px solid rgba($orange, 0.18);
  direction: ltr;
  width: 60%;
  text-align: right;

  &:hover {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #000000;
    border-color: rgba($orange, 0.5);
    transform: scale(1.02);
  }
}

.subcategory-name {
  color: $text;
  font-size: 13px;
  font-weight: 900;
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
  width: 8px !important;
  height: 100% !important;
  display: block !important;
  -webkit-appearance: none !important;
  background: transparent !important;
}

.categories-dropdown::-webkit-scrollbar-track,
.subcategories-dropdown-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 10px !important;
  margin: 2px 0 !important;
}

.categories-dropdown::-webkit-scrollbar-thumb,
.subcategories-dropdown-scroll::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.3) !important;
  border-radius: 10px !important;
  min-height: 50px !important;

  &:hover {
    background: rgba($orange, 0.5) !important;
  }
}

/* Firefox scrollbar */
.categories-dropdown,
.subcategories-dropdown-scroll {
  scrollbar-width: thin !important;
  scrollbar-color: $orange rgba(255, 255, 255, 0.1) !important;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .dropdown-container {
    position: fixed;
    top: auto;
    bottom: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, 50%);
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

  .subcategory-input {
    font-size: 14px;
    padding: 10px 36px 10px 10px;
  }

  .category-item,
  .subcategory-item {
    padding: 10px 12px;
    margin: 3px 5px;
    font-size: 12px;
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
</style>
