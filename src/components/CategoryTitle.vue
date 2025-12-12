<template>
  <div class="category-title">
    <span class="category-name">{{ name }}</span>
    <div class="category-details">
      <span class="price">{{ price }} ₪</span>
      <span class="work-type" :class="workTypeClass">{{ workType }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "CategoryTitle",
  props: {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    workType: {
      type: String,
      required: true,
      validator: (value) => ["לשעה", "קבלנות"].includes(value),
    },
  },
  computed: {
    workTypeClass() {
      return this.workType === "לשעה" ? "hourly" : "contract";
    },
  },
};
</script>

<style scoped>
.category-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  background: #1f1f1f;
  border: 2px solid #2d2d2d;
  border-radius: 6px;
  transition: all 0.3s ease;
  direction: rtl;
}

.category-title:hover {
  border-color: #f97316;
  background: #2a2a2a;
}

.category-name {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
  text-align: right;
}

.category-details {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 10px;
}

.price {
  color: #f97316;
  font-weight: 700;
  font-size: 0.95rem;
}

.work-type {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  min-width: 70px;
}

.work-type.hourly {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #000000;
}

.work-type.contract {
  background: #2d2d2d;
  color: #f97316;
  border: 1px solid #f97316;
}
</style>
