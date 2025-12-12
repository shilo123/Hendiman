<template>
  <div class="category-selector">
    <label for="categoryDropdown">תחומי התמחות</label>
    <div class="dropdown-wrapper">
      <select
        id="categoryDropdown"
        v-model="selectedCategory"
        @change="onCategoryChange"
        class="category-dropdown"
      >
        <option value="">בחר קטגוריה</option>
        <option
          v-for="category in categories"
          :key="category.name"
          :value="category.name"
        >
          {{ category.name }}
        </option>
      </select>
    </div>

    <!-- תת-קטגוריות עם צ'קבוקסים -->
    <div
      v-if="selectedCategory && selectedSubcategories.length > 0"
      class="subcategories-section"
    >
      <div class="subcategories-header">
        <h4>{{ selectedCategory }}</h4>
      </div>
      <div class="subcategories-list">
        <div
          v-for="subcategory in selectedSubcategories"
          :key="`${selectedCategory}-${subcategory.name}`"
          class="checkbox-item"
        >
          <input
            :id="`subcategory-${selectedCategory}-${subcategory.name}`"
            type="checkbox"
            :value="subcategory.name"
            v-model="selectedSubcategoriesList"
            @change="onSubcategoryChange"
            class="checkbox-input"
          />
          <label
            :for="`subcategory-${selectedCategory}-${subcategory.name}`"
            class="checkbox-label"
          >
            <CategoryTitle
              :name="subcategory.name"
              :price="subcategory.price"
              :work-type="subcategory.workType"
            />
          </label>
        </div>
      </div>
    </div>

    <!-- הצגת כל התת-קטגוריות שנבחרו מכל הקטגוריות -->
    <div
      v-if="selectedSubcategoriesList.length > 0"
      class="selected-categories-section"
    >
      <div class="selected-header">
        <h4>תחומי התמחות שנבחרו ({{ selectedSubcategoriesList.length }})</h4>
      </div>
      <div class="selected-list">
        <div
          v-for="(subName, index) in selectedSubcategoriesList"
          :key="`selected-${index}`"
          class="selected-item"
        >
          <span class="selected-name">{{ subName }}</span>
          <button
            type="button"
            @click="removeSubcategory(subName)"
            class="remove-button"
          >
            ×
          </button>
        </div>
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
      selectedCategory: "",
      selectedSubcategoriesList: [],
    };
  },
  computed: {
    selectedSubcategories() {
      if (!this.selectedCategory) return [];
      const category = this.categories.find(
        (cat) => cat.name === this.selectedCategory
      );
      return category ? category.subcategories : [];
    },
  },
  watch: {
    modelValue: {
      handler(newValue) {
        // עדכן את הרשימה לפי modelValue
        if (Array.isArray(newValue)) {
          this.selectedSubcategoriesList = [...newValue];
        } else if (newValue && typeof newValue === "string") {
          // אם זה string, המר ל-array
          this.selectedSubcategoriesList = newValue
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        } else {
          this.selectedSubcategoriesList = [];
        }
      },
      immediate: true,
    },
  },
  methods: {
    onCategoryChange() {
      // אל תאפס את הרשימה - אפשר לבחור מכמה קטגוריות
      // רק עדכן את הרשימה
      this.updateModelValue();
    },
    onSubcategoryChange() {
      this.updateModelValue();
    },
    updateModelValue() {
      this.$emit("update:modelValue", [...this.selectedSubcategoriesList]);
    },
    removeSubcategory(subName) {
      const index = this.selectedSubcategoriesList.indexOf(subName);
      if (index > -1) {
        this.selectedSubcategoriesList.splice(index, 1);
        this.updateModelValue();
      }
    },
  },
};
</script>

<style scoped>
.category-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-selector label {
  color: #f97316;
  font-weight: 600;
  font-size: 0.8rem;
  text-align: right;
}

.dropdown-wrapper {
  position: relative;
}

.category-dropdown {
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
  cursor: pointer;
  font-family: inherit;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f97316' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  padding-left: 35px;

  &:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
    background: #2a2a2a;
  }

  &:hover {
    border-color: #f97316;
  }

  option {
    background: #1f1f1f;
    color: #ffffff;
  }
}

.subcategories-section {
  margin-top: 10px;
  padding: 15px;
  background: #1a1a1a;
  border: 2px solid #2d2d2d;
  border-radius: 8px;
}

.subcategories-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #f97316;
  flex-shrink: 0;
}

.checkbox-label {
  flex: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  min-height: 24px;
}

.subcategories-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #2d2d2d;
}

.subcategories-header h4 {
  color: #f97316;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  text-align: right;
}

.selected-categories-section {
  margin-top: 20px;
  padding: 15px;
  background: #1a1a1a;
  border: 2px solid #f97316;
  border-radius: 8px;
}

.selected-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2d2d2d;
}

.selected-header h4 {
  color: #f97316;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  text-align: right;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #1f1f1f;
  border: 2px solid #f97316;
  border-radius: 6px;
  direction: rtl;
}

.selected-name {
  color: #ffffff;
  font-size: 0.85rem;
}

.remove-button {
  background: transparent;
  border: none;
  color: #f97316;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;
  line-height: 1;
}

.remove-button:hover {
  background: #f97316;
  color: #000000;
  transform: scale(1.1);
}
</style>
