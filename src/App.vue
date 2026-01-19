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

/* הסתר את כפתור Stripe למפתחים - כל ה-iframes של Stripe */
iframe[name*="__privateStripeFrame"],
iframe[name*="privateStripeFrame"],
iframe[src*="stripe.com"][src*="elements-inner"],
iframe[src*="stripe.com"][src*="easel"],
iframe[title*="מסגרת כלים למפתחי פס"],
iframe[title*="Stripe developer tools frame"],
iframe[src*="js.stripe.com"][name*="Stripe"],
iframe[role="presentation"][src*="stripe.com"],
.stripe-test-mode-badge,
[class*="__PrivateStripeElement"],
[class*="privateStripe"],
[id*="__privateStripe"],
[id*="privateStripe"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: 0 !important;
  max-height: 0 !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
  right: -9999px !important;
  bottom: -9999px !important;
  z-index: -99999 !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: scale(0) !important;
  overflow: hidden !important;
}
</style>
