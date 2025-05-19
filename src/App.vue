<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useLoginUserStore } from "@/store/useLoginUserStore";

const loginUserStore = useLoginUserStore();
loginUserStore.fetchLoginUser();
</script>

<style></style>
