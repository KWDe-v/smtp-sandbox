<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import Sidebar from '~/components/Sidebar.vue';
import Navbar from '~/components/Navbar.vue';

const router = useRouter();
const auth = useAuth();

const activeLanguage = ref<'curl' | 'javascript' | 'python' | 'php'>('curl');
const copiedSnippet = ref('');

const snippets = {
  getDomains: {
    curl: `curl https://app.asgardcp.com.br/domains \\
  -H "Authorization: Bearer SUA_CHAVE_DE_API"`,
    javascript: `const res = await fetch('https://app.asgardcp.com.br/domains', {
  headers: { 'Authorization': 'Bearer ' + API_KEY }
});
const domains = await res.json();
console.log(domains);`,
    python: `import requests

headers = {'Authorization': 'Bearer SUA_CHAVE_DE_API'}
response = requests.get('https://app.asgardcp.com.br/domains', headers=headers)
domains = response.json()
print(domains)`,
    php: `<?php
$ch = curl_init('https://app.asgardcp.com.br/domains');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer SUA_CHAVE_DE_API']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$domains = json_decode(curl_exec($ch), true);
print_r($domains);
?>`,
  },
  createAccount: {
    curl: `curl -X POST https://app.asgardcp.com.br/accounts \\
  -H "Authorization: Bearer SUA_CHAVE_DE_API" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"usuario@asgardcp.com.br","password":"minha_senha"}'`,
    javascript: `const res = await fetch('https://app.asgardcp.com.br/accounts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: 'usuario@asgardcp.com.br',
    password: 'minha_senha'
  })
});
const account = await res.json();
console.log(account);`,
    python: `import requests

headers = {
    'Authorization': 'Bearer SUA_CHAVE_DE_API',
    'Content-Type': 'application/json'
}
payload = {
    'address': 'usuario@asgardcp.com.br',
    'password': 'minha_senha'
}
response = requests.post('https://app.asgardcp.com.br/accounts', json=payload, headers=headers)
print(response.json())`,
    php: `<?php
$ch = curl_init('https://app.asgardcp.com.br/accounts');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'address' => 'usuario@asgardcp.com.br',
    'password' => 'minha_senha'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer SUA_CHAVE_DE_API',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = json_decode(curl_exec($ch), true);
print_r($res);
?>`,
  },
  postMessages: {
    curl: `curl -X POST https://app.asgardcp.com.br/messages \\
  -H "Authorization: Bearer SUA_CHAVE_DE_API" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"usuario@asgardcp.com.br","password":"minha_senha"}'`,
    javascript: `const res = await fetch('https://app.asgardcp.com.br/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: 'usuario@asgardcp.com.br',
    password: 'minha_senha'
  })
});
const messages = await res.json();
console.log('Mensagens:', messages);`,
    python: `import requests

headers = {
    'Authorization': 'Bearer SUA_CHAVE_DE_API',
    'Content-Type': 'application/json'
}
payload = {
    'address': 'usuario@asgardcp.com.br',
    'password': 'minha_senha'
}
response = requests.post('https://app.asgardcp.com.br/messages', json=payload, headers=headers)
messages = response.json()
print('Mensagens:', messages)`,
    php: `<?php
$ch = curl_init('https://app.asgardcp.com.br/messages');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'address' => 'usuario@asgardcp.com.br',
    'password' => 'minha_senha'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer SUA_CHAVE_DE_API',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$messages = json_decode(curl_exec($ch), true);
print_r($messages);
?>`,
  },
  getMessageById: {
    curl: `curl "https://app.asgardcp.com.br/messages/1?password=minha_senha" \\
  -H "Authorization: Bearer SUA_CHAVE_DE_API"`,
    javascript: `const res = await fetch('https://app.asgardcp.com.br/messages/1?password=minha_senha', {
  headers: { 'Authorization': 'Bearer ' + API_KEY }
});
const email = await res.json();
console.log('Assunto:', email.subject);
console.log('HTML:', email.html);`,
    python: `import requests

headers = {'Authorization': 'Bearer SUA_CHAVE_DE_API'}
params = {'password': 'minha_senha'}
response = requests.get('https://app.asgardcp.com.br/messages/1', headers=headers, params=params)
email = response.json()
print('Assunto:', email['subject'])
print('HTML:', email['html'])`,
    php: `<?php
$ch = curl_init('https://app.asgardcp.com.br/messages/1?password=minha_senha');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer SUA_CHAVE_DE_API']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$email = json_decode(curl_exec($ch), true);
echo "Assunto: " . $email['subject'] . "\n";
echo "HTML: " . $email['html'][0] . "\n";
?>`,
  },
};

function copyCode(code: string, id: string) {
  navigator.clipboard.writeText(code);
  copiedSnippet.value = id;
  setTimeout(() => {
    copiedSnippet.value = '';
  }, 2000);
}

function copyCurrentSnippet(group: keyof typeof snippets) {
  const code = snippets[group][activeLanguage.value];
  copyCode(code, group);
}

onMounted(() => {
  auth.initAuth();
  if (!auth.isAuthenticated.value) {
    router.push('/login');
  }
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-content">
      <Navbar title="Documentação da API REST" subtitle="Guia oficial com métodos POST para criar caixas e consultar e-mails" />

      <main class="app-main docs-main">
        <!-- Banner de Autenticação Obrigatória -->
        <div class="glass-card auth-banner">
          <div class="auth-banner-content">
            <div class="auth-badge">🔒 Segurança HTTPS Ativa</div>
            <h3>Chave de API + E-mail e Senha via POST</h3>
            <p>
              Para criar e consultar mensagens, envie o cabeçalho <code>Authorization</code> com sua Chave de API e o corpo JSON com o <strong>endereço de e-mail e a senha</strong> da caixa.
            </p>
            <div class="code-box-header">
              <code>Authorization: Bearer SUA_CHAVE_DE_API</code>
              <button class="btn btn-sm btn-secondary" @click="copyCode('Authorization: Bearer SUA_CHAVE_DE_API', 'auth-header')">
                {{ copiedSnippet === 'auth-header' ? '✓ Copiado' : 'Copiar' }}
              </button>
            </div>
          </div>
          <div class="host-info">
            <div class="host-label">URL Base da API:</div>
            <code class="host-url">https://app.asgardcp.com.br</code>
          </div>
        </div>

        <!-- Seletor de Linguagens -->
        <div class="lang-selector-bar">
          <span class="lang-label">Escolha sua Linguagem:</span>
          <div class="lang-buttons">
            <button
              :class="['lang-btn', { active: activeLanguage === 'curl' }]"
              @click="activeLanguage = 'curl'"
            >
              cURL (Terminal)
            </button>
            <button
              :class="['lang-btn', { active: activeLanguage === 'javascript' }]"
              @click="activeLanguage = 'javascript'"
            >
              Node.js / JS
            </button>
            <button
              :class="['lang-btn', { active: activeLanguage === 'python' }]"
              @click="activeLanguage = 'python'"
            >
              Python
            </button>
            <button
              :class="['lang-btn', { active: activeLanguage === 'php' }]"
              @click="activeLanguage = 'php'"
            >
              PHP
            </button>
          </div>
        </div>

        <!-- Endpoints da API -->
        <div class="endpoints-list">
          <!-- 1. Listar Domínios -->
          <section class="endpoint-card glass-card">
            <div class="endpoint-header">
              <span class="step-num">1</span>
              <span class="http-badge get">GET</span>
              <span class="endpoint-path">/domains</span>
              <span class="endpoint-title">Listar Domínios Disponíveis</span>
            </div>
            <p class="endpoint-desc">
              Retorna os domínios ativos cadastrados na sua conta.
            </p>

            <div class="code-examples">
              <div class="code-header">
                <span>Exemplo de Requisição:</span>
                <button class="btn btn-sm btn-secondary" @click="copyCurrentSnippet('getDomains')">
                  {{ copiedSnippet === 'getDomains' ? '✓ Copiado' : 'Copiar Código' }}
                </button>
              </div>

              <pre class="code-content"><code>{{ snippets.getDomains[activeLanguage] }}</code></pre>
            </div>
          </section>

          <!-- 2. Criar Caixa com Senha -->
          <section class="endpoint-card glass-card">
            <div class="endpoint-header">
              <span class="step-num">2</span>
              <span class="http-badge post">POST</span>
              <span class="endpoint-path">/accounts</span>
              <span class="endpoint-title">Criar Caixa de E-mail com Senha</span>
            </div>
            <p class="endpoint-desc">
              Cria uma nova caixa de e-mail definindo um endereço e uma senha de acesso via POST.
            </p>

            <div class="code-examples">
              <div class="code-header">
                <span>Exemplo de Requisição (POST JSON):</span>
                <button class="btn btn-sm btn-secondary" @click="copyCurrentSnippet('createAccount')">
                  {{ copiedSnippet === 'createAccount' ? '✓ Copiado' : 'Copiar Código' }}
                </button>
              </div>

              <pre class="code-content"><code>{{ snippets.createAccount[activeLanguage] }}</code></pre>
            </div>

            <div class="response-section">
              <div class="code-header"><span>Exemplo de Resposta (JSON 201 Created):</span></div>
              <pre class="code-content response-json"><code>{
  "id": "18",
  "address": "usuario@asgardcp.com.br",
  "quota": 104857600,
  "used": 0,
  "isDisabled": false,
  "isDeleted": false,
  "createdAt": "2026-08-20T20:12:47.510Z"
}</code></pre>
            </div>
          </section>

          <!-- 3. Consultar Mensagens VIA POST -->
          <section class="endpoint-card glass-card">
            <div class="endpoint-header">
              <span class="step-num">3</span>
              <span class="http-badge post">POST</span>
              <span class="endpoint-path">/messages</span>
              <span class="endpoint-title">Listar E-mails da Caixa (POST JSON)</span>
            </div>
            <p class="endpoint-desc">
              Envia um <strong>POST</strong> com o JSON contendo <code>address</code> e <code>password</code> no corpo da requisição para listar os e-mails recebidos.
            </p>

            <div class="code-examples">
              <div class="code-header">
                <span>Exemplo de Requisição (POST JSON):</span>
                <button class="btn btn-sm btn-secondary" @click="copyCurrentSnippet('postMessages')">
                  {{ copiedSnippet === 'postMessages' ? '✓ Copiado' : 'Copiar Código' }}
                </button>
              </div>

              <pre class="code-content"><code>{{ snippets.postMessages[activeLanguage] }}</code></pre>
            </div>

            <div class="response-section">
              <div class="code-header"><span>Exemplo de Resposta (JSON 200 OK):</span></div>
              <pre class="code-content response-json"><code>[
  {
    "id": "142",
    "from": {
      "address": "seguranca@empresa.com",
      "name": "Segurança"
    },
    "to": [
      {
        "address": "usuario@asgardcp.com.br"
      }
    ],
    "subject": "Seu código de confirmação: 998811",
    "intro": "Código: 998811. Válido por 10 minutos.",
    "seen": false,
    "hasAttachments": false,
    "size": 1542,
    "createdAt": "2026-08-20T20:13:00.000Z"
  }
]</code></pre>
            </div>
          </section>

          <!-- 4. Ver Conteúdo Completo -->
          <section class="endpoint-card glass-card">
            <div class="endpoint-header">
              <span class="step-num">4</span>
              <span class="http-badge get">GET</span>
              <span class="endpoint-path">/messages/:id</span>
              <span class="endpoint-title">Ver Conteúdo Completo do E-mail</span>
            </div>
            <p class="endpoint-desc">
              Obtém o conteúdo completo do e-mail com corpo em HTML, texto simples e anexos.
            </p>

            <div class="code-examples">
              <div class="code-header">
                <span>Exemplo de Requisição:</span>
                <button class="btn btn-sm btn-secondary" @click="copyCurrentSnippet('getMessageById')">
                  {{ copiedSnippet === 'getMessageById' ? '✓ Copiado' : 'Copiar Código' }}
                </button>
              </div>

              <pre class="code-content"><code>{{ snippets.getMessageById[activeLanguage] }}</code></pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.docs-main {
  max-width: 1050px;
}

.auth-banner {
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
}

.auth-banner-content {
  flex: 1;
}

.auth-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.15);
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.auth-banner h3 {
  font-size: 1.15rem;
  margin-bottom: 6px;
}

.auth-banner p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.code-box-header {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #0f172a;
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
}

.code-box-header code {
  color: #38bdf8;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.host-info {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  padding: 14px 18px;
  border-radius: var(--radius-md);
  text-align: right;
}

.host-label {
  font-size: 0.75rem;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.host-url {
  color: #38bdf8;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 600;
}

.lang-selector-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.lang-label {
  font-size: 0.88rem;
  color: var(--text-muted);
  font-weight: 500;
}

.lang-buttons {
  display: flex;
  gap: 8px;
}

.lang-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.lang-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.endpoint-card {
  padding: 24px;
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.step-num {
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--accent-gradient);
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 4px;
}

.http-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.http-badge.get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid #3b82f6; }
.http-badge.post { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; }
.http-badge.delete { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }

.endpoint-path {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
}

.endpoint-title {
  font-size: 0.95rem;
  color: var(--text-dim);
}

.endpoint-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 18px;
  line-height: 1.5;
}

.code-examples {
  margin-top: 16px;
  margin-bottom: 16px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.82rem;
  color: var(--text-dim);
  font-weight: 600;
}

.code-content {
  background: #0f172a;
  border: 1px solid var(--border-color);
  padding: 14px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: #cbd5e1;
  overflow-x: auto;
  line-height: 1.5;
}

.response-json {
  color: #38bdf8;
  max-height: 280px;
  overflow-y: auto;
}
</style>
