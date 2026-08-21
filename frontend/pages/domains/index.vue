<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import { useEvents } from '~/composables/useEvents';
import Sidebar from '~/components/Sidebar.vue';
import Navbar from '~/components/Navbar.vue';

const router = useRouter();
const auth = useAuth();
const api = useApi();
const { showToast } = useEvents();

const domains = ref<any[]>([]);
const loading = ref(true);
const showCreateModal = ref(false);
const showInstructionsModal = ref(false);
const selectedDomainForInstructions = ref<any>(null);

const newDomainName = ref('');
const createLoading = ref(false);
const verifyingId = ref<number | null>(null);
const errorMsg = ref('');
const copiedField = ref('');

async function loadDomains() {
  try {
    const res = await api.get('/api/domains');
    if (res.data) domains.value = res.data;
  } catch (err: any) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function handleCreateDomain() {
  errorMsg.value = '';
  createLoading.value = true;
  try {
    const res = await api.post('/api/domains', { domain: newDomainName.value });
    newDomainName.value = '';
    showCreateModal.value = false;
    await loadDomains();
    if (res.data) {
      openInstructions(res.data);
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao criar domínio';
  } finally {
    createLoading.value = false;
  }
}

async function handleVerifyDomain(d: any) {
  verifyingId.value = d.id;
  try {
    const res = await api.post(`/api/domains/${d.id}/verify`);
    if (res.success) {
      showToast('Domínio Verificado!', res.message, 'success');
    } else {
      showToast('DNS ainda não propagado', res.message, 'warning');
    }
    await loadDomains();
  } catch (err: any) {
    showToast('Erro na verificação', err.message, 'danger');
  } finally {
    verifyingId.value = null;
  }
}

function openInstructions(domain: any) {
  selectedDomainForInstructions.value = domain;
  showInstructionsModal.value = true;
}

function copyToClipboard(text: string, fieldName: string) {
  navigator.clipboard.writeText(text);
  copiedField.value = fieldName;
  showToast('Copiado!', `Registro ${fieldName} copiado para a área de transferência.`, 'info');
  setTimeout(() => {
    copiedField.value = '';
  }, 2000);
}

async function handleDeleteDomain(id: number, domain: string) {
  if (!confirm(`Deseja realmente excluir o domínio "${domain}" e todas as suas caixas postais?`)) return;
  try {
    await api.delete(`/api/domains/${id}`);
    await loadDomains();
    showToast('Domínio excluído', `Domínio ${domain} foi removido.`, 'info');
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
  loadDomains();
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-content">
      <Navbar title="Gerenciamento de Domínios" subtitle="Cadastre e verifique seus domínios para habilitar caixas de e-mail">
        <template #actions>
          <button class="btn btn-primary" @click="showCreateModal = true">
            ➕ Novo Domínio
          </button>
        </template>
      </Navbar>

      <main class="app-main">
        <div class="glass-card table-card">
          <div v-if="loading" class="loading-state">
            Carregando domínios...
          </div>

          <div v-else-if="domains.length === 0" class="empty-state">
            <div class="empty-icon">🌐</div>
            <h3>Nenhum domínio cadastrado</h3>
            <p>Cadastre seu primeiro domínio (ex: <code>meudominio.com.br</code>) para começar a receber e-mails.</p>
            <button class="btn btn-primary" style="margin-top: 16px;" @click="showCreateModal = true">
              Cadastrar Primeiro Domínio
            </button>
          </div>

          <div v-else class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Domínio</th>
                  <th>Status de Comunicação</th>
                  <th>Token TXT de Verificação</th>
                  <th>Criado Em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in domains" :key="d.id">
                  <td class="domain-name">
                    <strong>{{ d.domain }}</strong>
                  </td>
                  <td>
                    <span :class="['badge', d.verified ? 'badge-success' : 'badge-warning']">
                      {{ d.verified ? '✓ Ativo / Verificado' : '⏳ Pendente DNS' }}
                    </span>
                  </td>
                  <td>
                    <div class="token-wrapper">
                      <code class="token-code">{{ d.verification_token || 'N/A' }}</code>
                      <button
                        class="btn-icon-copy"
                        title="Copiar token"
                        @click="copyToClipboard(d.verification_token, 'TXT')"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>{{ new Date(d.created_at).toLocaleDateString('pt-BR') }}</td>
                  <td class="action-buttons">
                    <button
                      :class="['btn btn-sm', d.verified ? 'btn-secondary' : 'btn-primary']"
                      :disabled="verifyingId === d.id"
                      @click="handleVerifyDomain(d)"
                    >
                      {{ verifyingId === d.id ? 'Checando DNS...' : (d.verified ? '🔄 Rechecar DNS' : '🔍 Verificar DNS') }}
                    </button>
                    <button class="btn btn-secondary btn-sm" @click="openInstructions(d)">
                      📋 Instruções
                    </button>
                    <button class="btn btn-danger btn-sm" @click="handleDeleteDomain(d.id, d.domain)">
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

    <!-- Modal Novo Domínio -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h3>Adicionar Novo Domínio</h3>
        <p class="modal-desc">Insira o domínio que receberá os e-mails (ex: <code>asgardcp.com.br</code>).</p>

        <div v-if="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

        <form @submit.prevent="handleCreateDomain">
          <div class="input-group">
            <label class="input-label">Nome do Domínio</label>
            <input
              v-model="newDomainName"
              type="text"
              class="input-control"
              placeholder="ex: asgardcp.com.br ou sandbox.meusite.com"
              required
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="createLoading">
              {{ createLoading ? 'Cadastrando...' : 'Cadastrar Domínio' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Instruções DNS Cloudflare -->
    <div v-if="showInstructionsModal" class="modal-backdrop" @click.self="showInstructionsModal = false">
      <div class="modal-content instructions-modal">
        <div class="instructions-header">
          <div>
            <h3>Configuração DNS no Cloudflare</h3>
            <p class="modal-desc">
              Domínio: <strong>{{ selectedDomainForInstructions?.domain }}</strong>
            </p>
          </div>
          <button class="btn-close" @click="showInstructionsModal = false">✕</button>
        </div>

        <div class="instructions-body">
          <p class="instruction-tip">
            💡 Adicione os registros abaixo no painel DNS do seu domínio (Cloudflare / Registro.br).<br>
            <strong>Importante:</strong> Mantenha o registro <code>mail</code> em <strong>DNS Only (Nuvem Cinza)</strong>.
          </p>

          <div class="record-card">
            <div class="record-header">
              <span class="record-type">TXT</span>
              <span class="record-name">Nome: <code>@</code></span>
              <button
                class="btn btn-sm btn-secondary"
                @click="copyToClipboard(selectedDomainForInstructions?.verification_token, 'TXT')"
              >
                {{ copiedField === 'TXT' ? '✓ Copiado' : 'Copiar Valor' }}
              </button>
            </div>
            <div class="record-val">
              <code>{{ selectedDomainForInstructions?.verification_token }}</code>
            </div>
          </div>

          <div class="record-card">
            <div class="record-header">
              <span class="record-type">A</span>
              <span class="record-name">Nome: <code>mail</code> (Nuvem Cinza)</span>
              <button
                class="btn btn-sm btn-secondary"
                @click="copyToClipboard('2.24.100.34', 'IP')"
              >
                {{ copiedField === 'IP' ? '✓ Copiado' : 'Copiar IP' }}
              </button>
            </div>
            <div class="record-val">
              <code>2.24.100.34</code>
            </div>
          </div>

          <div class="record-card">
            <div class="record-header">
              <span class="record-type">MX</span>
              <span class="record-name">Nome: <code>@</code> | Prioridade: <code>10</code></span>
              <button
                class="btn btn-sm btn-secondary"
                @click="copyToClipboard(`mail.${selectedDomainForInstructions?.domain}`, 'MX')"
              >
                {{ copiedField === 'MX' ? '✓ Copiado' : 'Copiar Host MX' }}
              </button>
            </div>
            <div class="record-val">
              <code>mail.{{ selectedDomainForInstructions?.domain }}</code>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button
            class="btn btn-primary"
            :disabled="verifyingId === selectedDomainForInstructions?.id"
            @click="handleVerifyDomain(selectedDomainForInstructions)"
          >
            {{ verifyingId === selectedDomainForInstructions?.id ? 'Verificando...' : '🔍 Validar DNS Agora' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="showInstructionsModal = false">
            Fechar
          </button>
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

.domain-name {
  color: #ffffff;
  font-size: 1rem;
}

.token-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-code {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: #38bdf8;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-icon-copy {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.btn-icon-copy:hover {
  opacity: 1;
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

.instructions-modal {
  max-width: 620px;
}

.instructions-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.instruction-tip {
  background: rgba(99, 102, 241, 0.1);
  border-left: 3px solid var(--accent-primary);
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: #c7d2fe;
  margin-bottom: 20px;
  line-height: 1.5;
}

.record-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 12px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-type {
  font-weight: 700;
  color: #818cf8;
  font-size: 0.85rem;
  background: rgba(99, 102, 241, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

.record-name {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.record-val code {
  font-size: 0.85rem;
  color: #38bdf8;
  word-break: break-all;
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
