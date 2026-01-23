<template>
  <div>
    <router-view />
  </div>
</template>
<script>
export default {
  name: "AppVue",
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
  background: #0b0b0f;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

#app {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #0b0b0f;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

#app > * {
  flex: 1;
}

/* הסתר רק את באדג' הטסט של Stripe */
.stripe-test-mode-badge {
  display: none !important;
}

/* הסתר את כפתור Stripe */
a[href*="stripe.com"],
[class*="PoweredBy"],
[class*="LinkBranding"],
[class*="StripeBranding"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  pointer-events: none !important;
  position: absolute !important;
  left: -9999px !important;
}
</style>
