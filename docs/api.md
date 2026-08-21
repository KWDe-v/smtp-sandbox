# Documentação da API REST — Plataforma SMTP Sandbox

Todas as rotas da API estão prefixadas com `/api`. A autenticação é realizada via cabeçalho `Authorization: Bearer <token>` ou `Authorization: Bearer sk_live_...`.

---

## 1. Autenticação

### `POST /api/auth/register`
Registra uma nova conta de usuário.

**Request Body:**
```json
{
  "name": "Ana Dev",
  "email": "ana@empresa.com",
  "password": "senha_segura_123"
}
```

### `POST /api/auth/login`
Autentica e retorna o JWT Access Token e Refresh Token.

**Request Body:**
```json
{
  "email": "ana@empresa.com",
  "password": "senha_segura_123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Ana Dev",
      "email": "ana@empresa.com",
      "status": "active"
    }
  }
}
```

### `POST /api/auth/refresh`
Renova o Access Token utilizando o Refresh Token.

---

## 2. Domínios

### `GET /api/domains`
Retorna todos os domínios do usuário logado.

### `POST /api/domains`
Cadastra um novo domínio.

**Request Body:**
```json
{
  "domain": "meudominio.test"
}
```

### `DELETE /api/domains/:id`
Exclui um domínio e todas as suas mailboxes.

---

## 3. Caixas Postais (Mailboxes)

### `GET /api/mailboxes`
Lista as caixas postais do usuário, incluindo contadores de mensagens e não lidas.

### `POST /api/mailboxes`
Cria uma nova caixa postal.

**Request Body:**
```json
{
  "domainId": 1,
  "username": "teste",
  "password": "senha_imap_opcional"
}
```

---

## 4. Mensagens

### `GET /api/messages/mailbox/:id?page=1&limit=50`
Lista mensagens de uma caixa postal paginada.

### `GET /api/messages/:id`
Obtém os detalhes da mensagem (texto, HTML, lista de anexos).

### `GET /api/messages/:id/raw`
Retorna o conteúdo RFC822 completo (em formato `text/plain`).

### `GET /api/messages/:id/headers`
Retorna todos os cabeçalhos em formato JSON estruturado.

### `PATCH /api/messages/:id/read`
Marca a mensagem como lida.

### `PATCH /api/messages/:id/unread`
Marca a mensagem como não lida.

### `DELETE /api/messages/:id`
Exclui a mensagem e remove seus anexos físicos do disco.

---

## 5. Anexos

### `GET /api/attachments/:id`
Faz o download do arquivo físico em formato binário.

---

## 6. API Keys

### `POST /api/api-keys`
Gera uma chave de acesso com prefixo `sk_live_`.

**Request Body:**
```json
{
  "name": "Pipeline CI/CD",
  "expiresInDays": 90
}
```

---

## 7. Webhooks

### `POST /api/webhooks`
Cadastra um webhook para receber eventos HTTP POST com assinatura HMAC-SHA256 no cabeçalho `X-Sandbox-Signature`.

**Request Body:**
```json
{
  "url": "https://meusite.com/webhook",
  "events": ["message.received", "message.deleted"]
}
```

---

## 8. Tempo Real (SSE)

### `GET /api/events?token=<access_token>`
Stream contínuo de Server-Sent Events (`text/event-stream`). Dispara eventos `message.received`, `message.read`, `message.deleted`.
