<template>
  <div id="basicLayout">
    <a-layout>
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";

// import { getCurrentUser } from "@/api/user";
//
// getCurrentUser().then((res) => {
//   console.log(res);
// });
</script>

<style scoped>
#basicLayout .content {
  margin-bottom: 20px;
  background: linear-gradient(to right, #fefefe, #fff);
}

#basicLayout .header {
  background-color: white;
  margin-bottom: 16px;
  color: unset;
  padding-inline: 20px;
}
</style>
