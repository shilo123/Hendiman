<template>
  <div>
    <router-view />
    <ContactButton @open-contact-modal="showContactModal = true" />
    <ContactModal
      :visible="showContactModal"
      @close="showContactModal = false"
      @submitted="handleInquirySubmitted"
    />
  </div>
</template>
<script>
import ContactButton from "@/components/Global/ContactButton.vue";
import ContactModal from "@/components/Global/ContactModal.vue";

export default {
  name: "AppVue",
  components: {
    ContactButton,
    ContactModal,
  },
  data() {
    return {
      showContactModal: false,
    };
  },
  methods: {
    handleInquirySubmitted() {
      this.showContactModal = false;
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap");

* {
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

#app {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

#app > * {
  flex: 1;
}
</style>
