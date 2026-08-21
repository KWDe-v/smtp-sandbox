<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import { useEvents } from '~/composables/useEvents';
import Sidebar from '~/components/Sidebar.vue';
import Navbar from '~/components/Navbar.vue';

const router = useRouter();
const auth = useAuth();
const api = useApi();
const { connectSse, disconnect } = useEvents();

const mailboxes = ref<any[]>([]);
const domains = ref<any[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);

const selectedDomainId = ref<number | null>(null);
const username = ref('');
const password = ref('');
const createLoading = ref(false);
const errorMsg = ref('');
let pollInterval: any = null;

async function loadData(isSilent = false) {
  if (!isSilent) loading.value = true;
  try {
    const [mbRes, domRes] = await Promise.all([
      api.get('/api/mailboxes'),
      api.get('/api/domains'),
    ]);
    if (mbRes.data) mailboxes.value = mbRes.data;
    if (domRes.data) {
      domains.value = domRes.data;
      if (domains.value.length > 0 && !selectedDomainId.value) {
        selectedDomainId.value = domains.value[0].id;
      }
    }
  } catch (err: any) {
    console.error(err);
  } finally {
    if (!isSilent) loading.value = false;
  }
}

async function handleCreateMailbox() {
  if (!selectedDomainId.value) {
    errorMsg.value = 'Selecione um domínio';
    return;
  }
  errorMsg.value = '';
  createLoading.value = true;
  try {
    await api.post('/api/mailboxes', {
      domainId: selectedDomainId.value,
      username: username.value,
      password: password.value || undefined,
    });
    username.value = '';
    password.value = '';
    showCreateModal.value = false;
    await loadData();
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao criar caixa postal';
  } finally {
    createLoading.value = false;
  }
}

async function handleDeleteMailbox(id: number, email: string) {
  if (!confirm(`Deseja realmente excluir a caixa "${email}" e todos os seus e-mails?`)) return;
  try {
    await api.delete(`/api/mailboxes/${id}`);
    await loadData();
  } catch (err: any) {
    alert(err.message);
  }
}

onMounted(() => {
  auth.initAuth();
  if (!auth.isAuthenticated.value) {
    router.push('/login');
    return;
  }
  loadData();

  // SSE em tempo real
  connectSse((payload) => {
    loadData(true);
  });

  // Polling contínuo a cada 3 segundos
  pollInterval = setInterval(() => {
    loadData(true);
  }, 3000);
});

onUnmounted(() => {
  disconnect();
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-content">
      <Navbar title="Caixas Postais (Inboxes)" subtitle="Gerencie caixas de entrada para receber mensagens em tempo real">
        <template #actions>
          <button class="btn btn-secondary btn-sm" style="margin-right: 8px;" @click="loadData(false)">
            🔄 Atualizar
          </button>
          <button class="btn btn-primary" @click="showCreateModal = true">
            ➕ Nova Caixa Postal
          </button>
        </template>
      </Navbar>

      <main class="app-main">
        <div class="glass-card table-card">
          <div v-if="loading" class="loading-state">
            Carregando caixas postais...
          </div>

          <div v-else-if="mailboxes.length === 0" class="empty-state">
            <div class="empty-icon">📬</div>
            <h3>Nenhuma caixa postal criada</h3>
            <p>Crie caixas postais (ex: <code>teste@example.test</code>) para começar a receber mensagens.</p>
            <button class="btn btn-primary" style="margin-top: 16px;" @click="showCreateModal = true">
              Criar Primeira Caixa Postal
            </button>
          </div>

          <div v-else class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Endereço de E-mail</th>
                  <th>Domínio</th>
                  <th>Mensagens</th>
                  <th>Não Lidas</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mb in mailboxes" :key="mb.id">
                  <td>
                    <NuxtLink :to="`/mailboxes/${mb.id}`" class="mailbox-link">
                      <strong>{{ mb.email }}</strong>
                    </NuxtLink>
                  </td>
                  <td>{{ mb.domain }}</td>
                  <td>
                    <span class="badge badge-info">{{ mb.messages_count || 0 }} e-mails</span>
                  </td>
                  <td>
                    <span v-if="mb.unread_count > 0" class="badge badge-warning">
                      {{ mb.unread_count }} novas
                    </span>
                    <span v-else class="text-dim">0</span>
                  </td>
                  <td>
                    <span class="badge badge-success">Ativa</span>
                  </td>
                  <td class="action-buttons">
                    <NuxtLink :to="`/mailboxes/${mb.id}`" class="btn btn-primary btn-sm">
                      Abrir Inbox
                    </NuxtLink>
                    <button class="btn btn-danger btn-sm" @click="handleDeleteMailbox(mb.id, mb.email)">
                      Excluir
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal Nova Caixa Postal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h3>Criar Caixa Postal</h3>
        <p class="modal-desc">Defina o nome da caixa de entrada e selecione o domínio.</p>

        <div v-if="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

        <form @submit.prevent="handleCreateMailbox">
          <div class="input-group">
            <label class="input-label">Domínio</label>
            <select v-model="selectedDomainId" class="input-control" required>
              <option v-for="d in domains" :key="d.id" :value="d.id">
                @{{ d.domain }}
              </option>
            </select>
          </div>

          <div class="input-group">
            <label class="input-label">Nome da Caixa (Usuário)</label>
            <input
              v-model="username"
              type="text"
              class="input-control"
              placeholder="ex: teste, suporte, contato"
              required
            />
          </div>

          <div class="input-group">
            <label class="input-label">Senha IMAP (Opcional)</label>
            <input
              v-model="password"
              type="password"
              class="input-control"
              placeholder="Deixe em branco ou informe uma senha para acesso IMAP"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="createLoading">
              {{ createLoading ? 'Criando...' : 'Criar Caixa Postal' }}
            </button>
          </div>
        </form>
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

.mailbox-link {
  color: #818cf8;
  font-size: 1rem;
}
.mailbox-link:hover {
  text-decoration: underline;
}

.action-buttons {
  display: flex;
  gap: 8px;
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

.error-banner {
  background: var(--status-danger-bg);
  color: var(--status-danger);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  font-size: 0.85rem;
}
</style>
