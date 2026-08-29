import { Client } from 'ssh2';

const VPS_HOST = '179.199.136.14';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';
const REMOTE_DIR = '/home/antigravity/smtp-sandbox';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    const command = `
      echo "=== Verificando Certbot e OpenSSL ==="
      which certbot || echo "certbot não instalado"
      which openssl || echo "openssl não instalado"
      
      echo "=== Criando diretório de certificados SSL ==="
      mkdir -p ${REMOTE_DIR}/nginx/ssl
      
      echo "=== Gerando Certificado SSL auto-assinado de alta segurança como fallback/base ==="
      openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout ${REMOTE_DIR}/nginx/ssl/server.key \
        -out ${REMOTE_DIR}/nginx/ssl/server.crt \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=SMTP Sandbox/CN=asgardcp.com.br" \
        -addext "subjectAltName=DNS:asgardcp.com.br,DNS:*.asgardcp.com.br,DNS:mail.asgardcp.com.br,DNS:app.asgardcp.com.br,IP:179.199.136.14"

      ls -la ${REMOTE_DIR}/nginx/ssl/
    `;

    conn.exec(command, (err, stream) => {
      if (err) throw err;
      stream
        .on('close', (code: number) => {
          console.log(`\nFinalizado com código ${code}`);
          conn.end();
        })
        .on('data', (d: Buffer) => process.stdout.write(d.toString()))
        .stderr.on('data', (d: Buffer) => process.stderr.write(d.toString()));
    });
  })
  .on('error', (err) => {
    console.error('Erro SSH:', err);
  })
  .connect({
    host: VPS_HOST,
    port: 22,
    username: VPS_USER,
    password: VPS_PASS,
  });
