import fs from 'fs';

const code = `# -*- coding: utf-8 -*-
import requests

# 1. Configuracoes da API
API_BASE = 'http://179.199.136.14:4000/api'
API_KEY = '4ef774f181844c4d0a278e0317c3a43f5484a35abd17c08d94451c22cf7718a7'

headers = {
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Type': 'application/json'
}

# 2. Criando uma nova caixa de e-mail
print('Criando caixa de e-mail...')
payload_mailbox = {
    'username': 'teste_python'
}

res_mailbox = requests.post(API_BASE + '/mailboxes', json=payload_mailbox, headers=headers)
print('Status Caixa:', res_mailbox.status_code)
print(res_mailbox.json())

print('\\n' + '='*50 + '\\n')

# 3. Consultando os e-mails recebidos
print('Consultando e-mails recebidos...')
res_messages = requests.get(API_BASE + '/messages?limit=10', headers=headers)
print('Status Mensagens:', res_messages.status_code)

if res_messages.status_code == 200:
    data = res_messages.json()
    total = data.get('total', 0)
    messages = data.get('messages', [])
    print('Total de e-mails:', total)
    for msg in messages:
        sender = msg.get('sender')
        subject = msg.get('subject')
        mailbox = msg.get('mailbox_email')
        print('- De: %s | Assunto: %s | Para: %s' % (sender, subject, mailbox))
else:
    print('Erro ao buscar e-mails:', res_messages.text)
`;

fs.writeFileSync('C:\\Users\\klebe\\OneDrive\\Desktop\\Nova pasta\\teste.py', code, 'utf8');
console.log('teste.py atualizado com a chave ativa!');
