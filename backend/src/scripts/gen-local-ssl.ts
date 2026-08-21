import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const sslDir = path.resolve(process.cwd(), '../nginx/ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

console.log('Gerando chave e certificado SSL locais...');
try {
  execSync(
    `openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout "${sslDir}/server.key" -out "${sslDir}/server.crt" -subj "/C=BR/ST=SP/L=SaoPaulo/O=SMTP Sandbox/CN=asgardcp.com.br" -addext "subjectAltName=DNS:asgardcp.com.br,DNS:*.asgardcp.com.br,DNS:mail.asgardcp.com.br,DNS:app.asgardcp.com.br,IP:2.24.100.34"`,
    { stdio: 'inherit' }
  );
  console.log('Certificados gerados com sucesso em:', sslDir);
} catch (e: any) {
  console.log('OpenSSL local não disponível ou erro:', e.message);
}
