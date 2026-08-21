<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import Toast from '~/components/Toast.vue';

const { initAuth } = useAuth();

onMounted(() => {
  initAuth();
});
</script>

<template>
  <div>
    <NuxtPage />
    <Toast />
  </div>
</template>
