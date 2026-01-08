<template>
  <button
    v-if="showButton"
    class="contact-button"
    type="button"
    @click="openModal"
    aria-label="צרו קשר"
  >
    <font-awesome-icon
      :icon="['fas', 'envelope']"
      class="contact-button__icon"
    />
    <span class="contact-button__text">צרו קשר</span>
  </button>
</template>

<script>
export default {
  name: "ContactButton",
  computed: {
    showButton() {
      // Show only on specific pages: Dashboard, CreateCall, logIn, Register
      const routeName = this.$route?.name;
      const allowedRoutes = ["Dashboard", "CreateCall", "logIn", "Register"];
      return allowedRoutes.includes(routeName);
    },
  },
  methods: {
    openModal() {
      this.$emit("open-contact-modal");
    },
  },
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$orange2: #ff8a2b;
$bg: #0b0b0f;

.contact-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
  border: none;
  border-radius: 50px;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba($orange, 0.4);
  transition: all 0.3s ease;
  font-family: "Heebo", sans-serif;

  @media (max-width: 768px) {
    bottom: 16px;
    left: 16px;
    padding: 10px 14px;
    font-size: 12px;
    gap: 6px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($orange, 0.5);
    background: linear-gradient(135deg, $orange2, $orange);
  }

  &:active {
    transform: translateY(0);
  }

  &__icon {
    font-size: 16px;

    @media (max-width: 768px) {
      font-size: 14px;
    }
  }

  &__text {
    font-weight: 1000;
  }
}
</style>
