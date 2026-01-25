<template>
  <div class="categories-section">
    <div class="categories-section__header">
      <h2 class="categories-section__title">ניהול קטגוריות</h2>
      <button class="add-category-btn" type="button" @click="addCategory">
        <font-awesome-icon :icon="['fas', 'plus']" />
        הוסף קטגוריה
      </button>
    </div>

    <div v-if="isLoadingCategories" class="loading-state">טוען קטגוריות...</div>

    <div v-else>
      <!-- Category Tabs -->
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.name"
          class="category-tab"
          :class="{
            'category-tab--active': activeCategoryTab === category.name,
          }"
          @click="activeCategoryTab = category.name"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Category Content -->
      <div class="category-content">
        <div
          v-for="category in categories"
          :key="category.name"
          v-show="activeCategoryTab === category.name"
          class="category-panel"
        >
          <div class="category-panel__header">
            <h3 class="category-panel__title">{{ category.name }}</h3>
            <div class="category-panel__actions">
              <button
                class="category-panel__edit-btn"
                type="button"
                @click="editCategory(category)"
              >
                <font-awesome-icon :icon="['fas', 'edit']" />
                ערוך
              </button>
              <button
                class="category-panel__delete-btn"
                type="button"
                @click="deleteCategory(category)"
              >
                <font-awesome-icon :icon="['fas', 'trash']" />
                מחק
              </button>
            </div>
          </div>
          <div class="category-panel__content">
            <div class="subcategories-header">
              <h4 class="subcategories-title">תת-קטגוריות</h4>
              <button
                class="add-subcategory-btn"
                type="button"
                @click="openAddSubcategoryModal(category)"
              >
                <font-awesome-icon :icon="['fas', 'plus']" />
                הוסף תת-קטגוריה
              </button>
            </div>
            <div class="subcategories-grid">
              <div
                v-for="(sub, index) in category.subcategories"
                :key="index"
                class="subcategory-item"
              >
                <div class="subcategory-item__content">
                  <div class="subcategory-item__name">
                    {{ sub.name }}
                  </div>
                  <div class="subcategory-item__details">
                    <span class="subcategory-item__price">
                      {{ sub.price }} ₪
                    </span>
                    <span class="subcategory-item__work-type">
                      {{ sub.workType }}
                    </span>
                  </div>
                </div>
                <div class="subcategory-item__actions">
                  <button
                    class="subcategory-item__edit-btn"
                    type="button"
                    @click="openEditSubcategoryModal(category, sub)"
                  >
                    <font-awesome-icon :icon="['fas', 'edit']" />
                  </button>
                  <button
                    class="subcategory-item__delete-btn"
                    type="button"
                    @click="deleteSubcategory(category, sub)"
                  >
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div
      v-if="showCategoryModal"
      class="modal-overlay"
      @click="closeCategoryModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ editingCategory ? "ערוך קטגוריה" : "הוסף קטגוריה" }}
          </h3>
          <button class="modal-close" @click="closeCategoryModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">שם הקטגוריה</label>
            <input
              v-model="categoryForm.name"
              type="text"
              class="form-input"
              placeholder="לדוגמה: אינסטלציה"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--ghost" @click="closeCategoryModal">
            ביטול
          </button>
          <button class="btn btn--primary" @click="saveCategory">
            {{ editingCategory ? "שמור שינויים" : "הוסף" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Subcategory Edit Modal -->
    <div
      v-if="showSubcategoryModal"
      class="modal-overlay"
      @click="closeSubcategoryModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ editingSubcategory ? "ערוך תת-קטגוריה" : "הוסף תת-קטגוריה" }}
          </h3>
          <button class="modal-close" @click="closeSubcategoryModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label">שם התת-קטגוריה</label>
            <input
              v-model="subcategoryForm.name"
              type="text"
              class="form-input"
              placeholder="לדוגמה: פתיחת סתימות"
            />
          </div>
          <div class="form-field">
            <label class="form-label">מחיר (₪)</label>
            <input
              v-model.number="subcategoryForm.price"
              type="number"
              class="form-input"
              placeholder="לדוגמה: 350"
            />
          </div>
          <div class="form-field">
            <label class="form-label">סוג עבודה</label>
            <select v-model="subcategoryForm.workType" class="form-input">
              <option value="קבלנות">קבלנות</option>
              <option value="לשעה">לשעה</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--ghost" @click="closeSubcategoryModal">
            ביטול
          </button>
          <button
            v-if="editingSubcategory"
            class="btn btn--danger"
            @click="confirmDeleteSubcategory"
          >
            מחק
          </button>
          <button class="btn btn--primary" @click="saveSubcategory">
            {{ editingSubcategory ? "שמור שינויים" : "הוסף" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div
      v-if="showDeleteConfirmModal"
      class="modal-overlay"
      @click="closeDeleteConfirmModal"
    >
      <div class="modal-content modal-content--confirm" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ deleteConfirmTitle }}</h3>
          <button class="modal-close" @click="closeDeleteConfirmModal">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            {{ deleteConfirmMessage }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--ghost" @click="closeDeleteConfirmModal">
            ביטול
          </button>
          <button class="btn btn--danger" @click="confirmDelete">מחק</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { loadCategories } from "@/utils/categoriesLoader";
import { useToast } from "@/composables/useToast";

export default {
  name: "CategoriesTab",
  data() {
    return {
      categories: [],
      isLoadingCategories: false,
      activeCategoryTab: "",
      // Category modal
      showCategoryModal: false,
      editingCategory: null,
      categoryForm: {
        name: "",
      },
      // Subcategory modal
      showSubcategoryModal: false,
      editingSubcategory: null,
      editingSubcategoryCategory: null,
      subcategoryForm: {
        name: "",
        price: 0,
        workType: "קבלנות",
      },
      // Delete confirmation modal
      showDeleteConfirmModal: false,
      deleteConfirmCallback: null,
      deleteConfirmTitle: "",
      deleteConfirmMessage: "",
      toast: null,
    };
  },
  created() {
    this.toast = useToast();
    this.loadCategories();
  },
  methods: {
    async loadCategories() {
      this.isLoadingCategories = true;
      try {
        // Load from server
        const data = await loadCategories();
        this.categories = data.categories || [];
        // Set first category as active tab if available
        if (this.categories.length > 0 && !this.activeCategoryTab) {
          this.activeCategoryTab = this.categories[0].name;
        }
      } catch (error) {
      } finally {
        this.isLoadingCategories = false;
      }
    },
    addCategory() {
      this.openCategoryModal();
    },
    openCategoryModal(category = null) {
      this.editingCategory = category;
      if (category) {
        this.categoryForm.name = category.name;
      } else {
        this.categoryForm.name = "";
      }
      this.showCategoryModal = true;
    },
    closeCategoryModal() {
      this.showCategoryModal = false;
      this.editingCategory = null;
      this.categoryForm.name = "";
    },
    async saveCategory() {
      try {
        if (!this.categoryForm.name.trim()) {
          this.toast.showError("יש להזין שם קטגוריה");
          return;
        }

        if (this.editingCategory) {
          // Update category
          await axios.put(
            `${URL}/categories/${encodeURIComponent(
              this.editingCategory.name
            )}`,
            {
              name: this.categoryForm.name,
            }
          );
          this.toast.showSuccess("קטגוריה עודכנה בהצלחה");
        } else {
          // Add category
          await axios.post(`${URL}/categories`, {
            name: this.categoryForm.name,
            subcategories: [],
          });
          this.toast.showSuccess("קטגוריה נוספה בהצלחה");
        }

        await this.loadCategories();
        this.closeCategoryModal();
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || " לא הצלחנו לשמור את הקטגוריה"
        );
      }
    },
    deleteCategory(category) {
      this.showDeleteConfirm(
        "מחיקת קטגוריה",
        `האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`,
        async () => {
          try {
            await axios.delete(
              `${URL}/categories/${encodeURIComponent(category.name)}`
            );
            this.toast.showSuccess("קטגוריה נמחקה בהצלחה");
            await this.loadCategories();
          } catch (error) {
            this.toast.showError(
              error.response?.data?.message || " לא הצלחנו למחוק את הקטגוריה"
            );
          }
        }
      );
    },
    openAddSubcategoryModal(category) {
      this.editingSubcategoryCategory = category;
      this.editingSubcategory = null;
      this.subcategoryForm = {
        name: "",
        price: 0,
        workType: "קבלנות",
      };
      this.showSubcategoryModal = true;
    },
    openEditSubcategoryModal(category, subcategory) {
      this.editingSubcategoryCategory = category;
      this.editingSubcategory = subcategory;
      this.subcategoryForm = {
        name: subcategory.name,
        price: subcategory.price || 0,
        workType: subcategory.workType || "קבלנות",
      };
      this.showSubcategoryModal = true;
    },
    closeSubcategoryModal() {
      this.showSubcategoryModal = false;
      this.editingSubcategory = null;
      this.editingSubcategoryCategory = null;
      this.subcategoryForm = {
        name: "",
        price: 0,
        workType: "קבלנות",
      };
    },
    async saveSubcategory() {
      try {
        if (!this.subcategoryForm.name.trim()) {
          this.toast.showError("יש להזין שם תת-קטגוריה");
          return;
        }

        const categoryName = encodeURIComponent(
          this.editingSubcategoryCategory.name
        );

        if (this.editingSubcategory) {
          // Update subcategory
          await axios.put(
            `${URL}/categories/${categoryName}/subcategories/${encodeURIComponent(
              this.editingSubcategory.name
            )}`,
            this.subcategoryForm
          );
          this.toast.showSuccess("תת-קטגוריה עודכנה בהצלחה");
        } else {
          // Add subcategory
          await axios.post(
            `${URL}/categories/${categoryName}/subcategories`,
            this.subcategoryForm
          );
          this.toast.showSuccess("תת-קטגוריה נוספה בהצלחה");
        }

        await this.loadCategories();
        this.closeSubcategoryModal();
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || " לא הצלחנו לשמור את התת-קטגוריה"
        );
      }
    },
    deleteSubcategory(category, subcategory) {
      this.showDeleteConfirm(
        "מחיקת תת-קטגוריה",
        `האם אתה בטוח שברצונך למחוק את התת-קטגוריה "${subcategory.name}"?`,
        async () => {
          await this.performDeleteSubcategory(category, subcategory);
        }
      );
    },
    confirmDeleteSubcategory() {
      this.showDeleteConfirm(
        "מחיקת תת-קטגוריה",
        `האם אתה בטוח שברצונך למחוק את התת-קטגוריה "${this.editingSubcategory.name}"?`,
        async () => {
          await this.performDeleteSubcategory(
            this.editingSubcategoryCategory,
            this.editingSubcategory
          );
          this.closeSubcategoryModal();
        }
      );
    },
    showDeleteConfirm(title, message, callback) {
      this.deleteConfirmTitle = title;
      this.deleteConfirmMessage = message;
      this.deleteConfirmCallback = callback;
      this.showDeleteConfirmModal = true;
    },
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false;
      this.deleteConfirmCallback = null;
      this.deleteConfirmTitle = "";
      this.deleteConfirmMessage = "";
    },
    async confirmDelete() {
      if (this.deleteConfirmCallback) {
        await this.deleteConfirmCallback();
      }
      this.closeDeleteConfirmModal();
    },
    async performDeleteSubcategory(category, subcategory) {
      try {
        await axios.delete(
          `${URL}/categories/${encodeURIComponent(
            category.name
          )}/subcategories/${encodeURIComponent(subcategory.name)}`
        );
        this.toast.showSuccess("תת-קטגוריה נמחקה בהצלחה");
        await this.loadCategories();
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || " לא הצלחנו למחוק את התת-קטגוריה"
        );
      }
    },
    editCategory(category) {
      this.openCategoryModal(category);
    },
  },
};
</script>

<style scoped lang="scss">
$bg: #0b0b0f;
$panel: #0f1016;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;
$font-family: "Heebo", sans-serif;

.categories-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.categories-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.add-category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba($orange, 0.2);
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0;
}

.category-tabs::-webkit-scrollbar {
  height: 4px;
}

.category-tabs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.category-tabs::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.3);
  border-radius: 2px;
}

.category-tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: $muted;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: $font-family;

  &:hover {
    color: $orange2;
  }

  &--active {
    color: $orange2;
    border-bottom-color: $orange;
  }
}

.category-content {
  min-height: 400px;
}

.category-panel {
  animation: fadeIn 0.3s ease;
}

.category-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.category-panel__title {
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
}

.category-panel__actions {
  display: flex;
  gap: 8px;
}

.category-panel__edit-btn,
.category-panel__delete-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  border: none;
}

.category-panel__edit-btn {
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.category-panel__delete-btn {
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-1px);
  }
}

.category-panel__content {
  padding: 20px 0;
}

.subcategories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subcategories-title {
  font-size: 16px;
  font-weight: 900;
  color: $text;
}

.add-subcategory-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
  }
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.subcategory-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: rgba($orange, 0);
    transition: all 0.3s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.4);
    transform: translateX(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &::before {
      background: rgba($orange, 0.8);
    }

    .subcategory-item__actions {
      opacity: 1;
    }
  }
}

.subcategory-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subcategory-item__name {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
}

.subcategory-item__details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  font-weight: 900;
  color: $muted;
}

.subcategory-item__price {
  color: $orange2;
}

.subcategory-item__work-type {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba($orange, 0.1);
  color: $orange2;
  font-size: 11px;
}

.subcategory-item__actions {
  display: flex;
  gap: 8px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.subcategory-item__edit-btn,
.subcategory-item__delete-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.3);
    transform: scale(1.05);
  }
}

.subcategory-item__delete-btn {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);

  &:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
  }
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-weight: 900;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-content {
  background: $panel;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.modal-content--confirm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}

.form-field {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 900;
  color: $muted;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  font-family: $font-family;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: rgba($orange, 0.5);
    box-shadow: 0 0 0 3px rgba($orange, 0.1);
  }
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.btn--ghost {
  background: transparent;
}

.btn--primary {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0b0f;
  border-color: rgba($orange, 0.5);

  &:hover {
    background: linear-gradient(
      135deg,
      lighten($orange, 5%),
      lighten($orange2, 5%)
    );
  }
}

.btn--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
  }
}

.confirm-message {
  text-align: center;
  color: $text;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .categories-section__header {
    flex-direction: column;
    align-items: stretch;
  }

  .add-category-btn {
    width: 100%;
    justify-content: center;
  }

  .category-tabs {
    gap: 4px;
  }

  .category-tab {
    padding: 10px 16px;
    font-size: 12px;
  }
}

/* Mobile Responsive - max-width 500px */
@media (max-width: 500px) {
  .categories-section__header {
    padding: 0;
    margin-bottom: 16px;
  }

  .categories-section__title {
    font-size: 18px;
  }

  .add-category-btn {
    font-size: 13px;
    padding: 9px 16px;
  }

  .category-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0;
    gap: 6px;
  }

  .category-tab {
    padding: 10px 14px;
    font-size: 12px;
    white-space: nowrap;
  }

  .category-panel__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
  }

  .category-panel__title {
    font-size: 18px;
  }

  .category-panel__actions {
    width: 100%;
    justify-content: stretch;
  }

  .category-panel__edit-btn,
  .category-panel__delete-btn {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
    font-size: 12px;
  }

  .subcategories-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .subcategories-title {
    font-size: 15px;
  }

  .add-subcategory-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
  }

  .subcategories-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .subcategory-item {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .subcategory-item__content {
    width: 100%;
  }

  .subcategory-item__name {
    font-size: 15px;
  }

  .subcategory-item__details {
    font-size: 12px;
    flex-wrap: wrap;
  }

  .subcategory-item__actions {
    width: 100%;
    justify-content: flex-end;
    opacity: 1;
  }

  .subcategory-item__edit-btn,
  .subcategory-item__delete-btn {
    width: 40px;
    height: 40px;
  }

  .modal-content {
    max-width: 95vw;
    margin: 10px;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 16px;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
    padding: 10px;
  }
}
</style>
