<template>
  <div class="profile-specialties">
    <div class="controls">
      <div class="control control--category">
        <label>קטגוריה</label>
        <select v-model="selectedCategoryName">
          <option disabled value="">בחר קטגוריה</option>
          <option v-for="cat in categories" :key="cat.name" :value="cat.name">
            {{ cat.name }}
          </option>
        </select>
        <button
          class="btn add-full"
          type="button"
          :disabled="!selectedCategoryName"
          @click="addFullCategory"
        >
          הוסף קטגוריה שלימה
        </button>
      </div>

      <div class="control control--subcategory" v-if="currentCategory">
        <label>תת־קטגוריה</label>
        <input
          v-model="subQuery"
          type="text"
          placeholder="חפש תת־קטגוריה..."
          class="sub-search"
        />
        <div class="sub-list">
          <button
            v-for="sub in filteredSubcategories"
            :key="sub.name"
            type="button"
            class="sub-item"
            @click="addSubcategory(sub)"
          >
            <span class="sub-name">{{ sub.name }}</span>
            <span class="sub-meta" v-if="sub.price || sub.workType">
              <span v-if="sub.price">{{ sub.price }} ₪</span>
              <span v-if="sub.workType">• {{ sub.workType }}</span>
            </span>
          </button>
          <div v-if="filteredSubcategories.length === 0" class="no-results">
            לא נמצאו תוצאות
          </div>
        </div>
      </div>
    </div>

    <div class="selected">
      <div class="selected-head">
        <span>התמחויות נבחרות</span>
        <span class="count">{{ internalValue.length }}</span>
      </div>
      <div class="chips" v-if="internalValue.length">
        <span v-for="item in internalValue" :key="chipKey(item)" class="chip">
          <span class="chip-name">
            <span v-if="item.isFullCategory">[קטגוריה שלימה] </span>
            {{ item.name }}
          </span>
          <span class="chip-meta" v-if="item.price || item.typeWork">
            <span v-if="item.price">{{ item.price }} ₪</span>
            <span v-if="item.typeWork">• {{ item.typeWork }}</span>
          </span>
          <button type="button" class="chip-remove" @click="remove(item)">
            ✕
          </button>
        </span>
      </div>
      <div v-else class="muted">לא נבחרו התמחויות</div>
    </div>
  </div>
</template>

<script>
import categoriesData from "@/APIS/Categorhs.json";

export default {
  name: "ProfileSpecialtiesSelector",
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
      selectedCategoryName: "",
      subQuery: "",
      internalValue: this.normalizeInitial(this.modelValue),
    };
  },
  computed: {
    currentCategory() {
      return this.categories.find((c) => c.name === this.selectedCategoryName);
    },
    filteredSubcategories() {
      if (!this.currentCategory || !this.currentCategory.subcategories) {
        return [];
      }
      const q = this.subQuery.trim().toLowerCase();
      const list = this.currentCategory.subcategories.map((sub) =>
        this.normalizeSub(sub)
      );
      if (!q) return list;
      return list.filter((sub) => sub.name.toLowerCase().includes(q));
    },
  },
  watch: {
    modelValue: {
      deep: true,
      handler(val) {
        this.internalValue = this.normalizeInitial(val);
      },
    },
  },
  methods: {
    normalizeInitial(arr) {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        if (typeof item === "string") {
          return { name: item, type: "subCategory" };
        }
        const isFull = item.isFullCategory || item.type === "category";
        return {
          name: item.name || item.subcategory || "",
          category: item.category || "",
          price: item.price || null,
          typeWork: item.typeWork || item.workType || null,
          isFullCategory: isFull,
          type: isFull ? "category" : item.type || "subCategory",
        };
      });
    },
    normalizeSub(sub) {
      const price =
        sub.price ||
        (sub.details && /\d+/.test(sub.details)
          ? parseInt(sub.details.match(/(\d+)/)?.[1], 10)
          : null);
      let workType = sub.workType || sub.typeWork || null;
      if (!workType && sub.details) {
        if (sub.details.includes("לשעה")) workType = "לשעה";
        else if (sub.details.includes("קבלנות")) workType = "קבלנות";
      }
      return {
        name: sub.name,
        price: price || null,
        workType: workType,
        typeWork: workType,
        type: "subCategory",
      };
    },
    emitChange() {
      this.$emit("update:modelValue", [...this.internalValue]);
    },
    chipKey(item) {
      return `${item.isFullCategory ? "full-" : "sub-"}${item.category || ""}-${
        item.name
      }`;
    },
    addFullCategory() {
      if (!this.selectedCategoryName) return;
      const exists = this.internalValue.some(
        (i) => i.isFullCategory && i.name === this.selectedCategoryName
      );
      if (exists) return;
      this.internalValue.push({
        name: this.selectedCategoryName,
        isFullCategory: true,
        type: "category",
      });
      this.emitChange();
    },
    addSubcategory(sub) {
      if (!sub || !this.selectedCategoryName) return;
      const exists = this.internalValue.some(
        (i) =>
          !i.isFullCategory &&
          i.name === sub.name &&
          i.category === this.selectedCategoryName
      );
      if (exists) return;
      this.internalValue.push({
        name: sub.name,
        category: this.selectedCategoryName,
        price: sub.price || null,
        typeWork: sub.typeWork || sub.workType || null,
        type: "subCategory",
      });
      this.emitChange();
    },
    remove(item) {
      this.internalValue = this.internalValue.filter(
        (i) =>
          !(
            i.name === item.name &&
            i.category === item.category &&
            !!i.isFullCategory === !!item.isFullCategory
          )
      );
      this.emitChange();
    },
  },
  mounted() {
    if (this.categories.length && !this.selectedCategoryName) {
      this.selectedCategoryName = this.categories[0].name;
    }
  },
};
</script>

<style scoped lang="scss">
.profile-specialties {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control--category {
  max-width: 200px;
}

label {
  font-weight: 800;
  color: #f5f5f5;
  font-size: 11px;
}

select,
.sub-search {
  width: 100%;
  padding: 6px 8px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, #0f1118, #171c28);
  color: #ffb36b;
  font-size: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
}

select option {
  background: #0b0b0f;
  color: #ffb36b;
}

.btn {
  border: 1px solid rgba(255, 122, 0, 0.3);
  background: linear-gradient(135deg, #1a1f2e, #23324b);
  color: #ffb36b;
  padding: 7px 8px;
  border-radius: 7px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.28);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.add-full {
  margin-top: 1px;
}

.sub-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 5px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

.sub-item {
  text-align: right;
  padding: 6px 8px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 122, 0, 0.32);
    background: rgba(255, 255, 255, 0.06);
  }
}

.sub-name {
  font-weight: 900;
  font-size: 12px;
}

.sub-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  gap: 4px;
}

.no-results {
  grid-column: 1 / -1;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 6px;
  border-radius: 7px;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  font-size: 11px;
}

.selected {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.selected-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 900;
  color: #fff;
  margin-bottom: 4px;
  font-size: 12px;
}

.count {
  background: rgba(255, 122, 0, 0.18);
  color: #ffb36b;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 50px;
  overflow-y: auto;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #fff;
  font-weight: 800;
  max-width: 100%;
  font-size: 11px;
}

.chip-name {
  white-space: nowrap;
}

.chip-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  gap: 4px;
}

.chip-remove {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  font-weight: 900;

  &:hover {
    color: #fff;
  }
}

.muted {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 800;
  font-size: 11px;
}

@media (max-width: 768px) {
  .sub-list {
    grid-template-columns: 1fr;
  }
}
</style>
