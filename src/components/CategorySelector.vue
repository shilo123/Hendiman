<template>
  <div
    class="category-selector"
    :class="{ 'category-selector-overlay': overlayMode }"
    ref="overlayAnchor"
  >
    <label for="specialtiesTextarea">תחומי התמחות</label>
    <!-- הוראות למובייל -->
    <div class="mobile-instructions">
      <p>לחיצה אחת: פתיחת תת-קטגוריות | לחיצה כפולה: בחירת קטגוריה שלימה</p>
    </div>
    <div class="textarea-wrapper">
      <textarea
        id="specialtiesTextarea"
        v-model="textareaValue"
        readonly
        @mouseenter="!isMobile && openDropdown()"
        @click="isMobile && !showDropdown && openDropdown()"
        class="specialties-textarea"
        placeholder="עבור עם העכבר לבחירת תחומי התמחות"
      ></textarea>
    </div>

    <!-- Dropdown עם קטגוריות -->
    <div
      v-if="showDropdown"
      class="dropdown-container"
      :style="overlayMode ? overlayStyle : null"
      @mouseenter="keepDropdownVisible"
      @mouseleave="hideDropdown"
      @click.stop
    >
      <div class="full-category-hint">
        לחץ על קטגוריה כדי להוסיף אותה כקטגוריה שלימה
      </div>
      <div class="categories-dropdown">
        <div
          v-for="category in displayedCategories"
          :key="category.name"
          class="category-item"
          @mouseenter="!isMobile && showSubcategories(category)"
          @mouseleave="!isMobile && hideSubcategories"
          @click.stop="handleCategoryClick(category)"
          @dblclick.stop="handleCategoryDoubleClick(category.name)"
          :title="
            isMobile
              ? 'לחיצה אחת: פתיחת תת-קטגוריות | לחיצה כפולה: בחירת קטגוריה שלימה'
              : 'לחץ כדי להוסיף קטגוריה שלימה'
          "
        >
          <span class="category-name">{{ category.name }}</span>
          <span class="arrow">←</span>
        </div>
      </div>

      <!-- תת-קטגוריות (מופיעות כשעוברים עם העכבר) -->
      <div
        v-if="hoveredCategory"
        class="subcategories-dropdown-wrapper"
        :style="overlayMode ? subOverlayStyle : null"
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
    overlayMode: {
      type: Boolean,
      default: false,
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
      selectedFullCategories: [], // קטגוריות שלימות שנבחרו
      keepSubcategories: false,
      keepDropdown: false,
      hideSubcategoriesTimeout: null,
      hideTooltipTimeout: null,
      subcategorySearchQuery: "",
      overlayStyle: null,
      subOverlayStyle: null,
      isMobile: window.innerWidth <= 768, // זיהוי מובייל
    };
  },
  computed: {
    displayedCategories() {
      // הסר קטגוריות שכבר נבחרו
      return (this.categories || []).filter((cat) => {
        return !this.selectedFullCategories.some(
          (selected) =>
            selected &&
            cat?.name &&
            selected.toLowerCase() === cat.name.toLowerCase()
        );
      });
    },
    textareaValue() {
      const fullCategoriesText = this.selectedFullCategories
        .map((cat) => `[קטגוריה שלימה] ${cat}`)
        .join("\n");
      const subcategoriesText = this.selectedItems
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

      if (fullCategoriesText && subcategoriesText) {
        return `${fullCategoriesText}\n${subcategoriesText}`;
      }
      return fullCategoriesText || subcategoriesText;
    },
    filteredSubcategories() {
      if (!this.hoveredCategory || !this.hoveredCategory.subcategories) {
        return [];
      }

      const query = this.subcategorySearchQuery.trim().toLowerCase();

      // הסר תתי-קטגוריות שכבר נבחרו
      const alreadySelected = (name) =>
        this.selectedItems.some(
          (i) =>
            i.subcategory &&
            i.subcategory.toLowerCase() === String(name).toLowerCase()
        );

      const baseList = this.hoveredCategory.subcategories.filter(
        (subcategory) => !alreadySelected(subcategory.name)
      );

      if (!query) {
        return baseList;
      }

      return baseList.filter((subcategory) =>
        subcategory.name.toLowerCase().includes(query)
      );
    },
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (Array.isArray(newValue) && newValue.length > 0) {
          // הפרד בין קטגוריות שלימות לתת-קטגוריות
          const fullCategories = [];
          const subcategories = [];

          newValue
            .filter((item) => item !== null && item !== undefined)
            .forEach((item) => {
              // אם זה קטגוריה שלימה
              if (
                typeof item === "object" &&
                item.name &&
                item.isFullCategory
              ) {
                fullCategories.push(String(item.name).trim());
                return;
              }

              // אם זה אובייקט עם name, price, typeWork (תת-קטגוריה)
              if (typeof item === "object" && item.name) {
                subcategories.push({
                  category: "", // לא נחוץ יותר, אבל נשמור למקרה
                  subcategory: String(item.name).trim(),
                  price: item.price || null,
                  workType: item.typeWork || null,
                });
                return;
              }

              // אם זה string, נסה לפרסר אותו (תאימות לאחור)
              if (typeof item === "string") {
                const itemStr = String(item).trim();

                // בדוק אם זה קטגוריה שלימה (מתחיל ב-[קטגוריה שלימה])
                if (itemStr.startsWith("[קטגוריה שלימה]")) {
                  const categoryName = itemStr
                    .replace("[קטגוריה שלימה]", "")
                    .trim();
                  if (categoryName) {
                    fullCategories.push(categoryName);
                  }
                  return;
                }

                if (!itemStr || !itemStr.includes("\\")) {
                  return;
                }

                const parts = itemStr.split("\\");
                if (parts.length < 2) {
                  return;
                }

                const category = parts[0].trim();
                const rest = parts.slice(1).join("\\").trim();

                if (!category || !rest) {
                  return;
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

                subcategories.push({
                  category: category,
                  subcategory: subcategory,
                  price: price,
                  workType: workType,
                });
              }
            });

          this.selectedFullCategories = fullCategories;
          this.selectedItems = subcategories;
        } else {
          this.selectedItems = [];
          this.selectedFullCategories = [];
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    },
    handleClickOutside(event) {
      // סגור את הדרופדאון אם הלחיצה הייתה מחוץ לקומפוננטה
      if (
        this.showDropdown &&
        this.$refs.overlayAnchor &&
        !this.$refs.overlayAnchor.contains(event.target)
      ) {
        this.hideDropdown();
      }
    },
    handleTextareaLeave() {
      // סגור כאשר העכבר יוצא מהאזור
      this.keepDropdown = false;
      this.showDropdown = false;
      this.hoveredCategory = null;
    },
    openDropdown() {
      this.showDropdown = true;
      if (this.overlayMode) {
        this.$nextTick(() => this.updateOverlayPositions());
      }
    },
    handleCategoryClick(category) {
      // במובייל: לחיצה אחת פותחת תת-קטגוריות
      if (this.isMobile) {
        this.showSubcategories(category);
      } else {
        // במחשב: לחיצה בוחרת קטגוריה שלימה (התנהגות ישנה)
        this.selectFullCategory(category.name);
      }
    },
    handleCategoryDoubleClick(categoryName) {
      // במובייל: לחיצה כפולה בוחרת קטגוריה שלימה
      if (this.isMobile) {
        this.selectFullCategory(categoryName);
      }
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
      // במובייל - אל תסתיר אוטומטית
      if (this.isMobile) {
        return;
      }
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

      // אל תסגור את ה-dropdown - השאר מצב בחירה פעיל
      this.keepSubcategories = true;
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
    updateOverlayPositions() {
      if (!this.overlayMode) return;
      const anchor = this.$refs.overlayAnchor;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      this.overlayStyle = {
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxWidth: "90vw",
        maxHeight: "60vh",
        overflow: "auto",
        zIndex: 999999,
      };
      this.subOverlayStyle = {
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${rect.right + 12}px`,
        width: `${rect.width}px`,
        maxWidth: "90vw",
        maxHeight: "60vh",
        overflow: "auto",
        zIndex: 1000000,
      };
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
    selectFullCategory(categoryName) {
      if (!categoryName) return;

      const category = String(categoryName).trim();

      // בדוק אם כבר קיים
      const exists = this.selectedFullCategories.some(
        (cat) => cat.toLowerCase() === category.toLowerCase()
      );

      if (!exists) {
        if (!Array.isArray(this.selectedFullCategories)) {
          this.selectedFullCategories = [];
        }
        this.selectedFullCategories.push(category);
        this.updateModelValue();
      }

      // השאר את ה-dropdown פתוח
      this.keepDropdown = true;
    },
    updateModelValue() {
      // ודא ש-selectedItems הוא מערך
      if (!Array.isArray(this.selectedItems)) {
        this.selectedItems = [];
      }

      // המר למערך של אובייקטים עם name, price, typeWork
      const subcategoriesValue = this.selectedItems
        .filter((item) => item && item.subcategory)
        .map((item) => {
          return {
            name: String(item.subcategory).trim(),
            price: item.price || null,
            typeWork: item.workType || null,
          };
        })
        .filter((obj) => obj.name.length > 0); // הסר אובייקטים עם name ריק

      // הוסף קטגוריות שלימות עם סימון מיוחד
      const fullCategoriesValue = this.selectedFullCategories
        .filter((cat) => cat && cat.trim().length > 0)
        .map((cat) => {
          return {
            name: String(cat).trim(),
            price: null,
            typeWork: null,
            isFullCategory: true, // סימון שזה קטגוריה שלימה
          };
        });

      // שילוב של שתי הרשימות
      const value = [...fullCategoriesValue, ...subcategoriesValue];

      this.$emit("update:modelValue", value);
    },
    handleSearchInput() {
      // הפונקציה הזו קיימת רק כדי למנוע בועות אירועים
      // החיפוש עצמו מתבצע דרך computed property
    },
  },
  mounted() {
    if (this.overlayMode) {
      window.addEventListener("resize", this.updateOverlayPositions);
    }
    // עדכן את isMobile ב-resize
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
    // הוסף listener ללחיצות מחוץ לדרופדאון
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    if (this.overlayMode) {
      window.removeEventListener("resize", this.updateOverlayPositions);
    }
    window.removeEventListener("resize", this.handleResize);
    // הסר listener ללחיצות מחוץ לדרופדאון
    document.removeEventListener("click", this.handleClickOutside);
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

.full-category-hint {
  color: #9ca3af;
  font-size: 0.82rem;
  padding: 6px 12px 2px 12px;
  text-align: right;
}

.category-selector label {
  color: #f97316;
  font-weight: 600;
  font-size: 0.8rem;
  text-align: right;
}

.mobile-instructions {
  display: none;
  color: #9ca3af;
  font-size: 0.75rem;
  padding: 6px 0;
  text-align: right;
  direction: rtl;
  line-height: 1.4;
}

.mobile-instructions p {
  margin: 0;
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
  top: calc(100% + 6px);
  right: 0;
  z-index: 1000;
  left: 0;
  width: 100%;
  display: block;
  direction: rtl;
}

.categories-dropdown {
  position: absolute;
  top: 0;
  right: 0;
  background: #1a1a1a;
  border: 2px solid #f97316;
  border-radius: 8px;
  width: 180px;
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
  padding: 10px 12px;
  margin: 3px 0;
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
  font-size: 0.85rem;
  font-weight: 500;
}

.arrow {
  color: #f97316;
  font-size: 1rem;
  margin-left: 8px;
}

.category-item:hover .arrow {
  color: #000000;
}

.subcategories-dropdown-wrapper {
  position: absolute;
  right: 184px; /* צמוד משמאל לרשימת הקטגוריות (180px + רווח קטן) */
  top: 0;
  z-index: 1001;
  direction: rtl;
}

/* Overlay mode for usage inside modals (ProfileSheet) */
:deep(.category-selector-overlay) {
  position: relative;
}
:deep(.category-selector-overlay .dropdown-container) {
  position: absolute;
  top: calc(100% + 8px); /* מתחת לשדה */
  bottom: auto;
  right: auto;
  left: 0;
  width: 100%;
  max-width: none;
  max-height: 360px;
  overflow: auto;
  z-index: 999999;
  display: block;
}
:deep(.category-selector-overlay .subcategories-dropdown-wrapper) {
  position: absolute;
  top: 0;
  left: calc(100% + 10px);
  width: 100%;
  max-width: none;
  z-index: 1000000;
}

/* Overlay mode responsive for mobile */
@media (max-width: 768px) {
  :deep(.category-selector-overlay .dropdown-container) {
    max-height: 250px;
    flex-direction: column;
    gap: 8px;
  }

  :deep(.category-selector-overlay .categories-dropdown) {
    width: 100%;
    max-width: 100%;
    max-height: 200px;
    position: relative;
  }

  :deep(.category-selector-overlay .subcategories-dropdown-wrapper) {
    position: relative;
    top: auto;
    left: auto;
    margin-top: 8px;
    width: 100%;
  }

  :deep(.category-selector-overlay .subcategories-dropdown-scroll) {
    width: 100%;
    max-height: 250px;
  }
}

@media (max-width: 480px) {
  :deep(.category-selector-overlay .dropdown-container) {
    max-height: 220px;
  }

  :deep(.category-selector-overlay .categories-dropdown) {
    max-height: 180px;
  }

  :deep(.category-selector-overlay .subcategories-dropdown-scroll) {
    max-height: 220px;
  }
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
  .mobile-instructions {
    display: block;
  }

  .full-category-hint {
    display: none;
  }
  .dropdown-container {
    position: fixed;
    bottom: auto;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    margin: 0;
    max-width: 85vw;
    flex-direction: column;
    gap: 8px;
  }

  .categories-dropdown {
    position: relative;
    width: 100%;
    max-width: 85vw;
    max-height: 200px;
    width: 100%;
  }

  .subcategories-dropdown-wrapper {
    position: relative;
    right: auto;
    top: auto;
    margin: 8px 0 0 0;
    width: 100%;
  }

  .subcategories-dropdown-scroll {
    width: 100%;
    max-width: 85vw;
    max-height: 250px;
    height: auto;
  }

  .subcategories-dropdown {
    position: relative;
    right: auto;
    top: auto;
    margin: 0;
    width: 100%;
    max-width: 100%;
    max-height: 250px;
  }

  .specialties-textarea {
    min-height: 70px;
    font-size: 0.85rem;
    padding: 8px 10px;
  }

  .category-item,
  .subcategory-item {
    padding: 8px 10px;
    margin: 2px 4px;
    font-size: 0.75rem;
  }

  .category-name,
  .subcategory-name {
    font-size: 0.75rem;
  }

  .subcategory-item {
    width: auto;
    min-width: 0;
  }

  .subcategories-search-input {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .full-category-hint {
    font-size: 0.7rem;
    padding: 4px 8px;
  }

  .tooltip {
    position: fixed;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    transform: translate(-50%, -50%) !important;
    min-width: 180px;
    max-width: 85vw;
    font-size: 0.75rem;
  }

  .arrow {
    font-size: 0.85rem;
    margin-left: 4px;
  }
}

@media (max-width: 480px) {
  .dropdown-container {
    max-width: 92vw;
  }

  .categories-dropdown {
    max-width: 92vw;
    max-height: 180px;
  }

  .subcategories-dropdown-scroll {
    max-width: 92vw;
    max-height: 220px;
  }

  .subcategories-dropdown {
    max-height: 220px;
  }

  .category-item,
  .subcategory-item {
    padding: 6px 8px;
    margin: 2px 3px;
    font-size: 0.7rem;
  }

  .category-name,
  .subcategory-name {
    font-size: 0.7rem;
  }

  .subcategories-search-input {
    padding: 5px 8px;
    font-size: 0.7rem;
  }

  .full-category-hint {
    font-size: 0.65rem;
    padding: 3px 6px;
  }

  .specialties-textarea {
    min-height: 60px;
    font-size: 0.8rem;
    padding: 6px 8px;
  }

  .arrow {
    font-size: 0.75rem;
    margin-left: 3px;
  }

  .tooltip {
    min-width: 160px;
    max-width: 92vw;
    font-size: 0.7rem;
  }
}
</style>
