<template>
  <div></div>
</template>

<script>
export default {
  name: "UserProfile",
  data() {
    return {
      userId: null,
    };
  },
  created() {
    this.userId = this.$route.params.id;
  },
  watch: {
    "$route.params.id": {
      handler(newId) {
        this.userId = newId;
      },
      immediate: true,
    },
  },
};
</script>

<style lang="scss" scoped></style>
