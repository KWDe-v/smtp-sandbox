<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import Sidebar from '~/components/Sidebar.vue';
import Navbar from '~/components/Navbar.vue';

const router = useRouter();
const auth = useAuth();
const api = useApi();

const apiKeys = ref<any[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);
const keyName = ref('');
const expiresInDays = ref(90);
const createLoading = ref(false);
const generatedToken = ref<string | null>(null);
const copied = ref(false);

async function loadKeys() {
  try {
    const res = await api.get('/api/api-keys');
    if (res.data) apiKeys.value = res.data;
  } catch (err: any) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function handleCreateKey() {
  createLoading.value = true;
  try {
    const res = await api.post('/api/api-keys', {
      name: keyName.value,
      expiresInDays: expiresInDays.value,
    });
    if (res.data?.token) {
      generatedToken.value = res.data.token;
      keyName.value = '';
      await loadKeys();
    }
  } catch (err: any) {
    alert(err.message);
  } finally {
    createLoading.value = false;
  }
}

async function handleDeleteKey(id: number) {
  if (!confirm('Deseja realmente desativar esta chave? Sistemas usando esta chave perderão o acesso.')) return;
  try {
    await api.delete(`/api/api-keys/${id}`);
    await loadKeys();
  } catch (err: any) {
    alert(err.message);
  }
}

function copyToken() {
  if (generatedToken.value) {
    navigator.clipboard.writeText(generatedToken.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 3000);
  }
}

onMounted(() => {
  auth.initAuth();
  if (!auth.isAuthenticated.value) {
    router.push('/login');
    return;
  }
  loadKeys();
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-content">
      <Navbar title="Chaves de Integração" subtitle="Crie chaves de acesso para conectar seus outros sistemas a este painel">
        <template #actions>
          <button class="btn btn-primary" @click="showCreateModal = true">
            ➕ Criar Nova Chave
          </button>
        </template>
      </Navbar>

      <main class="app-main">
        <div class="glass-card table-card">
          <div v-if="loading" class="loading-state">
            Carregando chaves...
          </div>

          <div v-else-if="apiKeys.length === 0" class="empty-state">
            <div class="empty-icon">🔑</div>
            <h3>Nenhuma chave de integração criada</h3>
            <p>Crie uma chave para permitir que seus programadores ou sistemas busquem e-mails automaticamente.</p>
            <button class="btn btn-primary" style="margin-top: 16px;" @click="showCreateModal = true">
              Criar Primeira Chave
            </button>
          </div>

          <div v-else class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome da Chave</th>
                  <th>Identificador</th>
                  <th>Último Uso</th>
                  <th>Validade</th>
                  <th>Criada Em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in apiKeys" :key="key.id">
                  <td>
                    <strong>{{ key.name }}</strong>
                  </td>
                  <td>
                    <code class="hash-code">{{ key.key_hash.substring(0, 16) }}...</code>
                  </td>
                  <td>{{ key.last_used_at ? new Date(key.last_used_at).toLocaleString('pt-BR') : 'Nunca utilizada' }}</td>
                  <td>{{ key.expires_at ? new Date(key.expires_at).toLocaleDateString('pt-BR') : 'Nunca expira' }}</td>
                  <td>{{ new Date(key.created_at).toLocaleDateString('pt-BR') }}</td>
                  <td>
                    <button class="btn btn-danger btn-sm" @click="handleDeleteKey(key.id)">
                      Excluir Chave
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal Gerar API Key -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div v-if="!generatedToken">
          <h3>Nova Chave de Integração</h3>
          <p class="modal-desc">Dê um nome para identificar onde esta chave será usada.</p>

          <form @submit.prevent="handleCreateKey">
            <div class="input-group">
              <label class="input-label">Nome de Identificação</label>
              <input
                v-model="keyName"
                type="text"
                class="input-control"
                placeholder="Ex: Site Principal, Sistema de Pedidos, Testes Automáticos"
                required
              />
            </div>

            <div class="input-group">
              <label class="input-label">Tempo de Validade</label>
              <select v-model="expiresInDays" class="input-control">
                <option :value="30">30 dias</option>
                <option :value="90">90 dias</option>
                <option :value="365">1 ano</option>
                <option :value="0">Sem expiração (Recomendado)</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="createLoading">
                {{ createLoading ? 'Gerando...' : 'Criar Chave' }}
              </button>
            </div>
          </form>
        </div>

        <div v-else class="token-result">
          <div class="token-alert">
            <h3>⚠️ Copie sua chave de acesso agora</h3>
            <p>Por segurança, este código de acesso só é mostrado uma única vez:</p>
          </div>

          <div class="token-box">
            <input type="text" readonly :value="generatedToken" class="token-input font-mono" />
            <button class="btn btn-primary btn-sm" @click="copyToken">
              {{ copied ? '✓ Copiado!' : 'Copiar' }}
            </button>
          </div>

          <div class="modal-actions" style="margin-top: 20px;">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showCreateModal = false; generatedToken = null;"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  padding: 24px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 12px 16px;
  color: var(--text-dim);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-muted);
}

.hash-code {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: #38bdf8;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-dim);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.modal-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.token-alert h3 {
  color: var(--status-warning);
  font-size: 1.1rem;
  margin-bottom: 6px;
}

.token-alert p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.token-box {
  display: flex;
  gap: 8px;
}

.token-input {
  flex: 1;
  background: #0f172a;
  border: 1px solid var(--accent-primary);
  color: #38bdf8;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}
</style>
