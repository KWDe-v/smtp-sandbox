<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';

const router = useRouter();
const { isAuthenticated, initAuth } = useAuth();

onMounted(() => {
  initAuth();
  if (isAuthenticated.value) {
    router.push('/dashboard');
  } else {
    router.push('/login');
  }
});
</script>

<template>
  <div style="height: 100vh; display: flex; align-items: center; justify-content: center; color: #94a3b8;">
    Carregando SMTP Sandbox...
  </div>
</template>
