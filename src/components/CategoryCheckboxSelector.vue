<template>
  <div class="category-checkbox-selector">
    <label class="label">{{ label }}</label>
    <div class="categories-grid">
      <label
        v-for="category in categories"
        :key="category.name"
        class="cyberpunk-checkbox-label"
      >
        <input
          type="checkbox"
          class="cyberpunk-checkbox"
          :value="category.name"
          :checked="isSelected(category.name)"
          @change="toggleCategory(category.name)"
        />
        {{ category.name }}
      </label>
    </div>
  </div>
</template>

<script>
import categoriesData from "@/APIS/Categorhs.json";

export default {
  name: "CategoryCheckboxSelector",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: "תחומי התמחות",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      categories: categoriesData.categories || [],
    };
  },
  methods: {
    isSelected(categoryName) {
      return this.modelValue.some(
        (item) =>
          item.name === categoryName &&
          (item.isFullCategory === true || item.type === "category")
      );
    },
    toggleCategory(categoryName) {
      const currentValue = [...this.modelValue];
      const index = currentValue.findIndex(
        (item) =>
          item.name === categoryName &&
          (item.isFullCategory === true || item.type === "category")
      );

      if (index >= 0) {
        // Remove if already selected
        currentValue.splice(index, 1);
      } else {
        // Add if not selected
        currentValue.push({
          name: categoryName,
          category: "",
          price: null,
          typeWork: null,
          isFullCategory: true,
          type: "category",
        });
      }

      this.$emit("update:modelValue", currentValue);
    },
  },
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: #f5f5f5;
$bg: #0f0f0f;

.category-checkbox-selector {
  width: 100%;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 1100;
  color: $text;
  margin-bottom: 12px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Custom scrollbar */
.categories-grid::-webkit-scrollbar {
  width: 6px;
}

.categories-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.categories-grid::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.4);
  border-radius: 3px;
}

.categories-grid::-webkit-scrollbar-thumb:hover {
  background: rgba($orange, 0.6);
}

/* Cyberpunk Checkbox Style - Orange & Dark Theme */
.cyberpunk-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid $orange;
  border-radius: 5px;
  background-color: transparent;
  display: inline-block;
  position: relative;
  margin-left: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cyberpunk-checkbox:hover {
  border-color: $orange2;
  box-shadow: 0 0 8px rgba($orange, 0.4);
}

.cyberpunk-checkbox:before {
  content: "";
  background-color: $orange;
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 10px;
  height: 10px;
  border-radius: 3px;
  transition: all 0.3s ease-in-out;
}

.cyberpunk-checkbox:checked {
  border-color: $orange2;
  background-color: rgba($orange, 0.1);
  box-shadow: 0 0 12px rgba($orange, 0.5);
}

.cyberpunk-checkbox:checked:before {
  transform: translate(-50%, -50%) scale(1);
}

.cyberpunk-checkbox-label {
  font-size: 15px;
  color: $text;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.cyberpunk-checkbox-label:hover {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.3);
}

.cyberpunk-checkbox-label:has(.cyberpunk-checkbox:checked) {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.4);
  box-shadow: 0 0 8px rgba($orange, 0.3);
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .categories-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    max-height: 300px;
  }

  .cyberpunk-checkbox-label {
    font-size: 14px;
    padding: 8px 10px;
  }
}
</style>
