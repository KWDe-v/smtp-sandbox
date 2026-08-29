import fs from 'fs';

const pythonCode = `# -*- coding: utf-8 -*-
import requests

API_BASE = "http://179.199.136.14:4000"

# 1. Get available domains
print("1. Buscando dominios disponiveis...")
res_domains = requests.get(API_BASE + "/domains")
print("Status Dominios:", res_domains.status_code)
domains = res_domains.json()
print("Dominios:", domains)

# Pega o primeiro dominio ativo (ex: asgardcp.com.br)
domain_name = domains[0]["domain"] if isinstance(domains, list) and len(domains) > 0 else "asgardcp.com.br"
email_address = "user_auto@" + domain_name
password = "secret_password_123"

print("\\n" + "="*50 + "\\n")

# 2. Create account
print("2. Criando conta para: " + email_address + "...")
payload_account = {
    "address": email_address,
    "password": password
}
res_account = requests.post(API_BASE + "/accounts", json=payload_account)
print("Status Criacao:", res_account.status_code)
print("Resposta:", res_account.json())

print("\\n" + "="*50 + "\\n")

# 3. Get token
print("3. Obtendo token de autenticacao...")
payload_token = {
    "address": email_address,
    "password": password
}
res_token = requests.post(API_BASE + "/token", json=payload_token)
print("Status Token:", res_token.status_code)
token_data = res_token.json()
token = token_data.get("token")
print("Token obtido com sucesso:", token[:25] + "...")

print("\\n" + "="*50 + "\\n")

# 4. Fetch messages
print("4. Buscando mensagens da conta...")
headers = {
    "Authorization": "Bearer " + token
}
res_messages = requests.get(API_BASE + "/messages", headers=headers)
print("Status Mensagens:", res_messages.status_code)
messages = res_messages.json()
print("Total de mensagens:", len(messages) if isinstance(messages, list) else 0)
print("Mensagens:", messages)
`;

fs.writeFileSync('C:\\Users\\klebe\\OneDrive\\Desktop\\Nova pasta\\teste.py', pythonCode, 'utf8');
console.log('teste.py gravado com sucesso!');
