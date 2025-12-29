<template>
  <div class="mobile-category-simple" dir="rtl">
    <label class="label">{{ label }}</label>

    <div class="trigger-wrapper">
      <div class="trigger" @click="openModal">
        <span v-if="displayText" class="trigger-text">{{ displayText }}</span>
        <span v-else class="trigger-placeholder">{{ placeholder }}</span>
        <span class="trigger-icon">▼</span>
      </div>

      <button
        v-if="selectedItems.length > 0"
        class="clear-btn"
        type="button"
        @click="clearAll"
      >
        הסר הכל
      </button>
    </div>

    <!-- Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal" @click.stop>
          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title">
              {{ selectedCategory ? selectedCategory.name : "בחר קטגוריה" }}
            </h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <!-- Back button when in subcategories -->
          <button v-if="selectedCategory" class="back-btn" @click="goBack">
            ← חזור
          </button>

          <!-- Categories List -->
          <div v-if="!selectedCategory" class="list">
            <div
              v-for="category in availableCategories"
              :key="category.name"
              class="item"
              @touchstart="handleTouchStart(category)"
              @touchend="handleTouchEnd()"
              @touchcancel="handleTouchCancel"
              @click="selectCategory(category)"
            >
              <span class="item-name">{{ category.name }}</span>
              <span class="item-arrow">→</span>
            </div>
          </div>

          <!-- Subcategories List -->
          <div v-else class="list">
            <div
              v-for="subcategory in availableSubcategories"
              :key="subcategory.name"
              class="item item--sub"
              :class="{ 'item--selected': isSelected(subcategory) }"
              @click="toggleSubcategory(subcategory)"
            >
              <span class="item-check">{{
                isSelected(subcategory) ? "✓" : ""
              }}</span>
              <span class="item-name">{{ subcategory.name }}</span>
              <span v-if="subcategory.price" class="item-price"
                >{{ subcategory.price }} ₪</span
              >
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <div class="hint">
      <span class="hint-text">ניתן לבחור קטגוריה או תת-קטגוריה</span>
      <span class="hint-text hint-text--small"
        >לחיצה ארוכה: קטגוריה | לחיצה רגילה: תת-קטגוריה</span
      >
    </div>
  </div>
</template>

<script>
import { loadCategories } from "@/utils/categoriesLoader";

export default {
  name: "MobileCategorySelectorSimple",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: "תחומי התמחות",
    },
    placeholder: {
      type: String,
      default: "לחץ לבחירת תחומי התמחות",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      categories: [],
      showModal: false,
      selectedCategory: null,
      selectedItems: [],
      longPressTimer: null,
      longPressCategory: null,
    };
  },
  computed: {
    displayText() {
      if (this.selectedItems.length === 0) return "";
      if (this.selectedItems.length === 1) {
        return this.selectedItems[0].subcategory;
      }
      return `${this.selectedItems.length} התמחויות נבחרו`;
    },
    availableCategories() {
      // Filter out categories that are fully selected (all subcategories selected) or full category selected
      return this.categories.filter((category) => {
        // אם הקטגוריה השלמה כבר נבחרה, הסתר אותה
        const fullCategorySelected = this.selectedItems.some(
          (item) =>
            item.category === category.name && item.isFullCategory === true
        );
        if (fullCategorySelected) return false;

        if (!category.subcategories || category.subcategories.length === 0) {
          return true; // Keep categories without subcategories
        }
        // Check if all subcategories are selected
        const allSelected = category.subcategories.every((sub) =>
          this.selectedItems.some(
            (item) =>
              item.category === category.name &&
              item.subcategory === sub.name &&
              item.isFullCategory !== true
          )
        );
        return !allSelected; // Show only if not all selected
      });
    },
    availableSubcategories() {
      if (!this.selectedCategory || !this.selectedCategory.subcategories) {
        return [];
      }
      // Filter out subcategories that are already selected
      return this.selectedCategory.subcategories.filter(
        (sub) => !this.isSelected(sub)
      );
    },
  },
  async mounted() {
    const data = await loadCategories();
    this.categories = data.categories || [];
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (Array.isArray(newValue) && newValue.length > 0) {
          this.selectedItems = newValue.map((item) => {
            // אם זה קטגוריה שלמה
            if (item.isFullCategory === true || item.type === "category") {
              return {
                category: item.name,
                subcategory: null,
                isFullCategory: true,
                price: null,
                workType: null,
              };
            }
            // אם זה תת-קטגוריה
            return {
              category: item.category || "",
              subcategory: item.name || item,
              price: item.price || null,
              workType: item.typeWork || item.workType || null,
              isFullCategory: false,
            };
          });
        } else {
          this.selectedItems = [];
        }
      },
      immediate: true,
    },
  },
  methods: {
    openModal() {
      this.showModal = true;
      this.selectedCategory = null;
    },
    closeModal() {
      this.showModal = false;
      this.selectedCategory = null;
      this.emitUpdate();
    },
    goBack() {
      this.selectedCategory = null;
    },
    selectCategory(category) {
      // Regular click - open subcategories
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      this.selectedCategory = category;
    },
    handleTouchStart(category) {
      this.longPressCategory = category;
      this.longPressTimer = setTimeout(() => {
        this.selectFullCategory(category);
        this.longPressTimer = null;
      }, 500); // 500ms for long press
    },
    handleTouchEnd() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    },
    handleTouchCancel() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    },
    selectFullCategory(category) {
      // Long press - select full category (not all subcategories)
      const item = {
        category: category.name,
        subcategory: null, // קטגוריה שלמה, לא תת-קטגוריה
        isFullCategory: true,
        price: null,
        workType: null,
      };

      // בדוק אם הקטגוריה כבר קיימת
      const exists = this.selectedItems.some(
        (existing) =>
          existing.category === item.category &&
          existing.isFullCategory === true
      );

      if (!exists) {
        this.selectedItems.push(item);
      }
      this.closeModal();
      this.emitUpdate();
    },
    toggleSubcategory(subcategory) {
      const item = {
        category: this.selectedCategory.name,
        subcategory: subcategory.name,
        price: subcategory.price || null,
        workType: subcategory.workType || null,
        isFullCategory: false,
      };

      const index = this.selectedItems.findIndex(
        (existing) =>
          existing.category === item.category &&
          existing.subcategory === item.subcategory
      );

      if (index === -1) {
        this.selectedItems.push(item);
      } else {
        this.selectedItems.splice(index, 1);
      }
    },
    isSelected(subcategory) {
      return this.selectedItems.some(
        (item) =>
          item.category === this.selectedCategory.name &&
          item.subcategory === subcategory.name &&
          item.isFullCategory !== true
      );
    },
    clearAll() {
      this.selectedItems = [];
      this.emitUpdate();
    },
    emitUpdate() {
      const formatted = this.selectedItems.map((item) => {
        // אם זה קטגוריה שלמה
        if (item.isFullCategory === true) {
          return {
            name: item.category,
            category: "",
            price: null,
            typeWork: null,
            isFullCategory: true,
            type: "category",
          };
        }
        // אם זה תת-קטגוריה
        return {
          name: item.subcategory,
          category: item.category || "",
          price: item.price || null,
          typeWork: item.workType || null,
          isFullCategory: false,
          type: "subCategory",
        };
      });
      this.$emit("update:modelValue", formatted);
    },
  },
  beforeUnmount() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  },
};
</script>

<style scoped lang="scss">
$bg: #0b0b0f;
$card: rgba(255, 255, 255, 0.06);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;

.mobile-category-simple {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: none; // Hidden by default

  // Show only on mobile (up to 400px)
  @media (max-width: 400px) {
    display: block;
  }
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 1000;
  color: $text;
  margin-bottom: 6px;
}

.hint {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba($orange, 0.08);
  border: 1px solid rgba($orange, 0.15);
}

.hint-text {
  font-size: 11px;
  font-weight: 900;
  color: rgba($orange, 0.9);
  line-height: 1.4;
}

.hint-text--small {
  font-size: 10px;
  color: rgba($orange, 0.75);
}

.trigger-wrapper {
  display: flex;
  gap: 8px;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
}

.trigger {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid $stroke;
  background: $card;
  color: $text;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  font-weight: 900;
  font-size: 14px;
}

.clear-btn {
  flex-shrink: 0;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  font-weight: 1000;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.trigger-text {
  flex: 1;
  min-width: 0; // Allow flex shrinking
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trigger-placeholder {
  flex: 1;
  min-width: 0; // Allow flex shrinking
  text-align: right;
  color: $muted;
}

.trigger-icon {
  font-size: 10px;
  color: $muted;
  flex-shrink: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  padding: 0;
}

.modal {
  width: 100%;
  max-height: 85vh;
  background: $bg;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 14px 16px;
  border-bottom: 1px solid $stroke;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid $stroke;
  background: $card;
  color: $text;
  font-size: 16px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.back-btn {
  padding: 10px 16px;
  border-bottom: 1px solid $stroke;
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
  color: $orange;
  font-weight: 1000;
  font-size: 14px;
  text-align: right;
  cursor: pointer;
  flex-shrink: 0;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  -webkit-overflow-scrolling: touch;
}

.item {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid $stroke;
  background: $card;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.item:active {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.3);
}

.item-name {
  flex: 1;
  font-size: 14px;
  font-weight: 900;
  color: $text;
  text-align: right;
}

.item-arrow {
  font-size: 14px;
  color: $muted;
  flex-shrink: 0;
}

.item-check {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid $stroke;
  background: $card;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: $orange;
  flex-shrink: 0;
}

.item--sub {
  padding: 10px 12px;
}

.item--selected {
  border-color: rgba($orange, 0.4);
  background: rgba($orange, 0.08);
}

.item--selected .item-check {
  background: $orange;
  color: #0b0b0f;
  border-color: $orange;
}

.item-price {
  font-size: 12px;
  font-weight: 1000;
  color: $orange2;
  flex-shrink: 0;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal,
.fade-leave-active .modal {
  transition: transform 0.3s ease;
}

.fade-enter-from .modal,
.fade-leave-to .modal {
  transform: translateY(100%);
}
</style>
