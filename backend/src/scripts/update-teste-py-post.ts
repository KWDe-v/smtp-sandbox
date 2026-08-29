import fs from 'fs';

const pythonCode = `# -*- coding: utf-8 -*-
import requests

API_BASE = "http://179.199.136.14:4000"
API_KEY = "27d042f080f7e338d11a8ca2390327e014c74e708d63734907d0f901d8c5566e"

# 1. Cabecalho de Autenticacao com Chave de API
headers = {
    "Authorization": "Bearer " + API_KEY,
    "Content-Type": "application/json"
}

# 2. Listar dominios disponiveis
print("1. Buscando dominios da sua conta...")
res_domains = requests.get(API_BASE + "/domains", headers=headers)
print("Status Dominios:", res_domains.status_code)
domains = res_domains.json()
print("Dominios:", domains)

# Define email e senha de acesso da caixa
domain_name = domains[0]["domain"] if isinstance(domains, list) and len(domains) > 0 else "asgardcp.com.br"
email_address = "seguro_post@" + domain_name
password = "minha_senha_secreta"

print("\\n" + "="*50 + "\\n")

# 3. Criar conta/caixa via POST com senha
print("2. Criando conta/caixa via POST com senha: " + email_address + "...")
payload_account = {
    "address": email_address,
    "password": password
}
res_account = requests.post(API_BASE + "/accounts", json=payload_account, headers=headers)
print("Status Criacao:", res_account.status_code)
print("Resposta:", res_account.json())

print("\\n" + "="*50 + "\\n")

# 4. Consultar mensagens VIA POST com E-mail e Senha no JSON Body
print("3. Buscando mensagens VIA POST enviando E-mail e Senha no Body...")
payload_messages = {
    "address": email_address,
    "password": password
}
res_messages = requests.post(API_BASE + "/messages", json=payload_messages, headers=headers)
print("Status Mensagens:", res_messages.status_code)
messages = res_messages.json()
print("Total de mensagens:", len(messages) if isinstance(messages, list) else 0)
for msg in (messages if isinstance(messages, list) else []):
    print("- De:", msg.get("from", {}).get("address"), "| Assunto:", msg.get("subject"), "| Para:", msg.get("to"))
`;

fs.writeFileSync('C:\\Users\\klebe\\OneDrive\\Desktop\\Nova pasta\\teste.py', pythonCode, 'utf8');
console.log('teste.py atualizado 100% em POST!');
