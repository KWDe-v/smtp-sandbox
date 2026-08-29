import fs from 'fs';

const pythonCode = `# -*- coding: utf-8 -*-
import requests

API_BASE = "http://179.199.136.14:4000"
API_KEY = "4ef774f181844c4d0a278e0317c3a43f5484a35abd17c08d94451c22cf7718a7"

# Cabecalho de Autenticacao Obrigatorio para TODAS as requisicoes
headers = {
    "Authorization": "Bearer " + API_KEY,
    "Content-Type": "application/json"
}

# 1. Get available domains
print("1. Buscando dominios da sua conta...")
res_domains = requests.get(API_BASE + "/domains", headers=headers)
print("Status Dominios:", res_domains.status_code)
domains = res_domains.json()
print("Dominios:", domains)

# Pega o primeiro dominio ativo (ex: asgardcp.com.br)
domain_name = domains[0]["domain"] if isinstance(domains, list) and len(domains) > 0 else "asgardcp.com.br"
email_address = "cliente_teste@" + domain_name
password = "senha_segura_123"

print("\\n" + "="*50 + "\\n")

# 2. Create account (com token obrigatorio)
print("2. Criando conta/caixa: " + email_address + "...")
payload_account = {
    "address": email_address,
    "password": password
}
res_account = requests.post(API_BASE + "/accounts", json=payload_account, headers=headers)
print("Status Criacao:", res_account.status_code)
print("Resposta:", res_account.json())

print("\\n" + "="*50 + "\\n")

# 3. Fetch messages (com token obrigatorio)
print("3. Buscando mensagens recebidas...")
res_messages = requests.get(API_BASE + "/messages", headers=headers)
print("Status Mensagens:", res_messages.status_code)
messages = res_messages.json()
print("Total de mensagens:", len(messages) if isinstance(messages, list) else 0)
for msg in messages:
    print("- De:", msg.get("from", {}).get("address"), "| Assunto:", msg.get("subject"), "| Para:", msg.get("to"))
`;

fs.writeFileSync('C:\\Users\\klebe\\OneDrive\\Desktop\\Nova pasta\\teste.py', pythonCode, 'utf8');
console.log('teste.py atualizado com autenticação obrigatória em tudo!');
