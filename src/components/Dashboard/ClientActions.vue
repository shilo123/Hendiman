<template>
  <div class="action-buttons">
    <button
      class="button"
      type="button"
      @click="$emit('create-call')"
      aria-label="צור קריאה חדשה"
    >
      <span>צור קריאה</span>
      <svg
        class="svgIcon"
        viewBox="0 0 512 512"
        height="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
        ></path>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: "ClientActions",
  emits: ["create-call"],
};
</script>

<style lang="scss" scoped>
.action-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.button {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  background-color: #ff7a00; // Orange
  border-radius: 30px;
  color: #0b0b0f; // Black text
  font-weight: 600;
  border: none;
  position: relative;
  cursor: pointer;
  transition-duration: 0.2s;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.116);
  padding-right: 8px; // RTL: padding on right (start)
  padding-left: 16px; // RTL: padding on left (end)
  transition-duration: 0.5s;

  @media (max-width: 768px) {
    height: 44px;
    padding-left: 20px;
  }
}

.svgIcon {
  height: 25px;
  transition-duration: 1.5s;
  fill: #0b0b0f; // Black icon
}

.button:hover {
  background-color: #ff9a3c; // Lighter orange
  transition-duration: 0.5s;
}

.button:active {
  transform: scale(0.97);
  transition-duration: 0.2s;
}

.button:hover .svgIcon {
  transform: rotate(250deg);
  transition-duration: 1.5s;
}
</style>
