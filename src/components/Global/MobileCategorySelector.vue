<template>
  <div class="mobile-category-selector" dir="rtl">
    <label class="selector-label">{{ label }}</label>

    <!-- הוראות למובייל - רק בהרשמה (multiple selection) -->
    <div class="mobile-instructions" v-if="isMobile && !single">
      <p>לחיצה אחת: פתיחת תת-קטגוריות | לחיצה כפולה: בחירת קטגוריה שלימה</p>
    </div>

    <!-- Input/Button לפתיחת הבחירה -->
    <div class="selector-trigger" @click="openModal">
      <div class="trigger-content">
        <span v-if="displayText" class="trigger-text">{{ displayText }}</span>
        <span v-else class="trigger-placeholder">{{ placeholder }}</span>
      </div>
      <i
        class="fas fa-chevron-down trigger-icon"
        :class="{ 'icon-up': showModal }"
      ></i>
    </div>

    <!-- Modal למובייל / Dropdown למחשב -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content" @click.stop>
          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <!-- Search -->
          <div class="search-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="חפש קטגוריה או תת-קטגוריה..."
              @input="handleSearch"
            />
            <i class="fas fa-search search-icon"></i>
          </div>

          <!-- Categories List -->
          <div class="categories-list" v-if="!selectedCategory">
            <div
              v-for="category in filteredCategories"
              :key="category.name"
              class="category-card"
              @click="selectCategory(category)"
              @dblclick="selectFullCategory(category)"
            >
              <div class="category-info">
                <i class="fas fa-folder category-icon"></i>
                <span class="category-name">{{ category.name }}</span>
              </div>
              <i class="fas fa-chevron-left category-arrow"></i>
            </div>
            <div v-if="filteredCategories.length === 0" class="no-results">
              לא נמצאו תוצאות
            </div>
          </div>

          <!-- Subcategories List -->
          <div class="subcategories-list" v-else>
            <div class="subcategories-header">
              <button class="back-btn" @click="goBackToCategories">
                <i class="fas fa-arrow-right"></i>
                חזור
              </button>
              <h4 class="subcategories-title">{{ selectedCategory.name }}</h4>
            </div>

            <div class="subcategories-grid">
              <div
                v-for="subcategory in filteredSubcategories"
                :key="subcategory.name"
                class="subcategory-card"
                :class="{
                  'subcategory-card--selected': isSelected(subcategory),
                }"
                @click="toggleSubcategory(selectedCategory.name, subcategory)"
              >
                <div class="subcategory-check">
                  <i
                    v-if="isSelected(subcategory)"
                    class="fas fa-check-circle"
                  ></i>
                  <i v-else class="far fa-circle"></i>
                </div>
                <div class="subcategory-info">
                  <span class="subcategory-name">{{ subcategory.name }}</span>
                  <div
                    class="subcategory-details"
                    v-if="subcategory.price || subcategory.workType"
                  >
                    <span v-if="subcategory.price" class="subcategory-price">
                      <i class="fas fa-shekel-sign"></i> {{ subcategory.price }}
                    </span>
                    <span v-if="subcategory.workType" class="subcategory-type">
                      {{ subcategory.workType }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="filteredSubcategories.length === 0" class="no-results">
              לא נמצאו תוצאות
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            <button
              class="btn-footer btn-footer--primary"
              @click="confirmSelection"
            >
              אישור
            </button>
            <button class="btn-footer btn-footer--ghost" @click="closeModal">
              ביטול
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { loadCategories } from "@/utils/categoriesLoader";

export default {
  name: "MobileCategorySelector",
  props: {
    modelValue: {
      type: [Object, Array],
      default: null,
    },
    label: {
      type: String,
      default: "תחומי התמחות",
    },
    placeholder: {
      type: String,
      default: "לחץ לבחירת תחום התמחות",
    },
    single: {
      type: Boolean,
      default: false, // false = multiple selection (register), true = single selection (CreateCall)
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      categories: [],
      showModal: false,
      selectedCategory: null,
      searchQuery: "",
      selectedItems: [],
      isMobile: window.innerWidth <= 768,
    };
  },
  computed: {
    modalTitle() {
      if (this.selectedCategory) {
        return `תת-קטגוריות - ${this.selectedCategory.name}`;
      }
      return "בחר קטגוריה";
    },
    filteredCategories() {
      if (!this.searchQuery.trim()) {
        return this.categories;
      }
      const query = this.searchQuery.toLowerCase();
      return this.categories.filter((cat) =>
        cat.name.toLowerCase().includes(query)
      );
    },
    filteredSubcategories() {
      if (!this.selectedCategory || !this.selectedCategory.subcategories) {
        return [];
      }
      if (!this.searchQuery.trim()) {
        return this.selectedCategory.subcategories;
      }
      const query = this.searchQuery.toLowerCase();
      return this.selectedCategory.subcategories.filter((sub) =>
        sub.name.toLowerCase().includes(query)
      );
    },
    displayText() {
      if (this.single) {
        // Single selection - show selected subcategory name
        if (this.selectedItems.length > 0) {
          return this.selectedItems[0].subcategory;
        }
        return "";
      } else {
        // Multiple selection - show count
        if (this.selectedItems.length === 0) {
          return "";
        }
        if (this.selectedItems.length === 1) {
          return this.selectedItems[0].subcategory;
        }
        return `${this.selectedItems.length} התמחויות נבחרו`;
      }
    },
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (this.single) {
          // Single selection
          if (newValue && typeof newValue === "object" && newValue.name) {
            this.selectedItems = [
              {
                category: "",
                subcategory: newValue.name,
                price: newValue.price || null,
                workType: newValue.typeWork || null,
              },
            ];
          } else {
            this.selectedItems = [];
          }
        } else {
          // Multiple selection
          if (Array.isArray(newValue) && newValue.length > 0) {
            this.selectedItems = newValue.map((item) => ({
              category: item.category || "",
              subcategory: item.name || item,
              price: item.price || null,
              workType: item.typeWork || item.workType || null,
            }));
          } else {
            this.selectedItems = [];
          }
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    const data = await loadCategories();
    this.categories = data.categories || [];
    
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    },
    openModal() {
      this.showModal = true;
      this.searchQuery = "";
      this.selectedCategory = null;
    },
    closeModal() {
      this.showModal = false;
      this.searchQuery = "";
      this.selectedCategory = null;
    },
    selectCategory(category) {
      if (this.isMobile) {
        // במובייל - לחיצה אחת פותחת תת-קטגוריות
        this.selectedCategory = category;
        this.searchQuery = "";
      } else {
        // במחשב - לחיצה אחת פותחת תת-קטגוריות
        this.selectedCategory = category;
        this.searchQuery = "";
      }
    },
    selectFullCategory(category) {
      if (this.isMobile) {
        // במובייל - לחיצה כפולה בוחרת קטגוריה שלימה
        if (category.subcategories && category.subcategories.length > 0) {
          const allSubcategories = category.subcategories.map((sub) => ({
            category: category.name,
            subcategory: sub.name,
            price: sub.price || null,
            workType: sub.workType || null,
          }));

          if (this.single) {
            // Single selection - רק הראשון
            this.selectedItems = [allSubcategories[0]];
          } else {
            // Multiple selection - הוסף את כל התת-קטגוריות
            allSubcategories.forEach((item) => {
              if (
                !this.selectedItems.some(
                  (existing) => existing.subcategory === item.subcategory
                )
              ) {
                this.selectedItems.push(item);
              }
            });
          }
          this.updateModelValue();
        }
      }
    },
    toggleSubcategory(categoryName, subcategory) {
      const item = {
        category: categoryName,
        subcategory: subcategory.name,
        price: subcategory.price || null,
        workType: subcategory.workType || null,
      };

      if (this.single) {
        // Single selection - החלף את הבחירה
        this.selectedItems = [item];
        this.updateModelValue();
        this.closeModal();
      } else {
        // Multiple selection - הוסף/הסר
        const index = this.selectedItems.findIndex(
          (existing) => existing.subcategory === subcategory.name
        );
        if (index > -1) {
          this.selectedItems.splice(index, 1);
        } else {
          this.selectedItems.push(item);
        }
      }
    },
    isSelected(subcategory) {
      return this.selectedItems.some(
        (item) => item.subcategory === subcategory.name
      );
    },
    goBackToCategories() {
      this.selectedCategory = null;
      this.searchQuery = "";
    },
    confirmSelection() {
      this.updateModelValue();
      this.closeModal();
    },
    handleSearch() {
      // Search is handled by computed properties
    },
    updateModelValue() {
      if (this.single) {
        // Single selection - החזר אובייקט
        if (this.selectedItems.length === 0) {
          this.$emit("update:modelValue", null);
          return;
        }
        const item = this.selectedItems[0];
        this.$emit("update:modelValue", {
          name: item.subcategory,
          price: item.price,
          typeWork: item.workType,
        });
      } else {
        // Multiple selection - החזר מערך
        const result = this.selectedItems.map((item) => ({
          name: item.subcategory,
          category: item.category,
          price: item.price,
          typeWork: item.workType,
        }));
        this.$emit("update:modelValue", result);
      }
    },
    handleClickOutside(event) {
      if (this.showModal && !this.$el.contains(event.target)) {
        this.closeModal();
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

.mobile-category-selector {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.selector-label {
  display: block;
  font-size: clamp(13px, 3vw, 14px);
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 8px;
}

.mobile-instructions {
  display: none;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 8px;
  font-size: 11px;
  color: $orange3;
  font-weight: 800;
  line-height: 1.4;

  @media (max-width: 768px) {
    display: block;
  }

  p {
    margin: 0;
  }
}

.selector-trigger {
  width: 100%;
  max-width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba($orange, 0.18);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 12px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    min-height: 56px;
    padding: 14px 16px;
    box-sizing: border-box;
  }

  &:hover {
    border-color: rgba($orange, 0.35);
    background: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: scale(0.98);
  }
}

.trigger-content {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.trigger-text {
  color: $text;
  font-weight: 900;
  font-size: clamp(15px, 3.5vw, 16px);
  line-height: 1.4;
}

.trigger-placeholder {
  color: rgba(255, 255, 255, 0.45);
  font-weight: 800;
  font-size: clamp(15px, 3.5vw, 16px);
}

.trigger-icon {
  color: $orange;
  font-size: 14px;
  transition: transform 0.3s ease;
  flex-shrink: 0;

  &.icon-up {
    transform: rotate(180deg);
  }
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
    align-items: flex-end;
  }
}

.modal-content {
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  border: 1px solid $stroke;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 20px 20px 0 0;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding: 14px 16px;
  }
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;
  color: $orange3;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.modal-close {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.3);
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
}

.search-wrapper {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 10px 14px;
    box-sizing: border-box;
  }
}

.search-input {
  width: 100%;
  max-width: 100%;
  padding: 12px 40px 12px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  color: $text;
  font-size: 14px;
  font-weight: 900;
  font-family: $font-family;
  direction: rtl;
  text-align: right;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.45);
    background: rgba(255, 255, 255, 0.1);
    outline: none;
  }

  @media (max-width: 768px) {
    padding: 14px 38px 14px 12px;
    font-size: 16px; // Prevent iOS zoom
  }
}

.search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: $orange;
  font-size: 14px;
  pointer-events: none;

  @media (max-width: 768px) {
    left: 26px;
  }
}

.categories-list,
.subcategories-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 200px;
  max-height: 400px;

  @media (max-width: 768px) {
    padding: 10px;
    max-height: calc(90vh - 250px);
  }
}

.category-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 56px; // Touch target

  @media (max-width: 768px) {
    padding: 16px 18px;
    min-height: 60px;
    margin-bottom: 10px;
  }

  &:hover,
  &:active {
    background: rgba($orange, 0.12);
    border-color: rgba($orange, 0.35);
    transform: translateX(-3px);
  }
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.category-icon {
  color: $orange;
  font-size: 18px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
}

.category-name {
  color: $text;
  font-size: 15px;
  font-weight: 1000;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.category-arrow {
  color: $orange;
  font-size: 14px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.subcategories-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;

  @media (max-width: 768px) {
    padding: 10px 14px;
    margin-bottom: 10px;
  }
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: $text;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
  }

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.3);
  }

  i {
    font-size: 12px;
  }
}

.subcategories-title {
  margin: 0;
  font-size: 16px;
  font-weight: 1000;
  color: $orange3;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 15px;
  }
}

.subcategories-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 10px;
  }
}

.subcategory-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba($orange, 0.18);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 60px;

  @media (max-width: 768px) {
    padding: 16px 18px;
    min-height: 70px;
    gap: 14px;
  }

  &:hover,
  &:active {
    background: rgba($orange, 0.08);
    border-color: rgba($orange, 0.35);
    transform: translateX(-2px);
  }

  &--selected {
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.5);
  }
}

.subcategory-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }

  i {
    font-size: 20px;
    color: $orange;

    @media (max-width: 768px) {
      font-size: 24px;
    }
  }

  .fa-circle {
    color: rgba(255, 255, 255, 0.3);
  }
}

.subcategory-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subcategory-name {
  color: $text;
  font-size: 15px;
  font-weight: 1000;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.subcategory-details {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.subcategory-price {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba($orange, 0.12);
  border: 1px solid rgba($orange, 0.25);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 1000;
  color: $orange3;

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 5px 10px;
  }

  i {
    font-size: 9px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }
}

.subcategory-type {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.8);

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 5px 10px;
  }
}

.no-results {
  padding: 40px 20px;
  text-align: center;
  color: $muted;
  font-size: 14px;
  font-weight: 900;

  @media (max-width: 768px) {
    padding: 30px 15px;
    font-size: 13px;
  }
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding: 14px 16px;
    gap: 8px;
  }
}

.btn-footer {
  flex: 1;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 1000;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-height: 48px;

  @media (max-width: 768px) {
    padding: 14px 18px;
    font-size: 15px;
    min-height: 52px;
  }

  &--primary {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: 0 4px 12px rgba($orange, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($orange, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: $text;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  opacity: 0;
  transform: translateY(20px) scale(0.95);

  @media (max-width: 768px) {
    transform: translateY(100%);
  }
}

.modal-fade-enter-to .modal-content {
  opacity: 1;
  transform: translateY(0) scale(1);

  @media (max-width: 768px) {
    transform: translateY(0);
  }
}

/* Scrollbar */
.categories-list::-webkit-scrollbar,
.subcategories-list::-webkit-scrollbar {
  width: 6px;
}

.categories-list::-webkit-scrollbar-track,
.subcategories-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.categories-list::-webkit-scrollbar-thumb,
.subcategories-list::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.3);
  border-radius: 10px;

  &:hover {
    background: rgba($orange, 0.5);
  }
}
</style>
