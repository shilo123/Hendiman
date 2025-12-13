<template>
  <router-view />
</template>
<script>
export default {
  name: "AppVue",
};
</script>

<style>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

#app > * {
  flex: 1;
}
</style>
