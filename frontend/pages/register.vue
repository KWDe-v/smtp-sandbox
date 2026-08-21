<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';

const router = useRouter();
const api = useApi();
const auth = useAuth();

const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleRegister() {
  errorMsg.value = '';
  loading.value = true;

  try {
    const res = await api.post('/api/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
    });

    if (res.data?.accessToken) {
      auth.setAuthData(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.push('/dashboard');
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Falha ao registrar conta';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card glass-card">
      <div class="auth-header">
        <div class="logo">✉️</div>
        <h2>Criar Nova Conta</h2>
        <p>Receba e visualize todos os e-mails dos seus sistemas em tempo real</p>
      </div>

      <div v-if="errorMsg" class="error-banner">
        ⚠️ {{ errorMsg }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label class="input-label">Nome Completo</label>
          <input
            v-model="name"
            type="text"
            class="input-control"
            placeholder="Ex: Ana Silva"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label">E-mail de Acesso</label>
          <input
            v-model="email"
            type="email"
            class="input-control"
            placeholder="seu.email@empresa.com"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label">Senha de Acesso</label>
          <input
            v-model="password"
            type="password"
            class="input-control"
            placeholder="Mínimo 8 caracteres"
            required
            minlength="8"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Criando Conta...' : 'Cadastrar e Começar' }}
        </button>
      </form>

      <div class="auth-footer">
        Já possui cadastro? <NuxtLink to="/login">Fazer Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 36px;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.auth-header h2 {
  font-size: 1.5rem;
  margin-bottom: 6px;
}

.auth-header p {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.error-banner {
  background: var(--status-danger-bg);
  color: var(--status-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-bottom: 18px;
}

.btn-block {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 0.88rem;
  color: var(--text-muted);
}
</style>
