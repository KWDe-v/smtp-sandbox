import { Client } from 'ssh2';

const VPS_HOST = '2.24.100.34';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';
const REMOTE_DIR = '/home/antigravity/smtp-sandbox';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    const command = `
      echo "=== 1. Instalando Certbot com sudo ==="
      echo "${VPS_PASS}" | sudo -S apt-get update -y
      echo "${VPS_PASS}" | sudo -S apt-get install -y certbot

      echo "=== 2. Parando Nginx temporariamente ==="
      cd ${REMOTE_DIR}
      docker compose stop nginx

      echo "=== 3. Obtendo certificado Let's Encrypt para app.asgardcp.com.br ==="
      echo "${VPS_PASS}" | sudo -S certbot certonly --standalone \
        -d app.asgardcp.com.br \
        --non-interactive --agree-tos -m kleberwfo51@gmail.com

      echo "=== 4. Copiando certificados para a pasta do Nginx ==="
      if [ -f /etc/letsencrypt/live/app.asgardcp.com.br/fullchain.pem ]; then
        echo "${VPS_PASS}" | sudo -S cp /etc/letsencrypt/live/app.asgardcp.com.br/fullchain.pem ${REMOTE_DIR}/nginx/ssl/server.crt
        echo "${VPS_PASS}" | sudo -S cp /etc/letsencrypt/live/app.asgardcp.com.br/privkey.pem ${REMOTE_DIR}/nginx/ssl/server.key
        echo "${VPS_PASS}" | sudo -S chown -R antigravity:antigravity ${REMOTE_DIR}/nginx/ssl/
        echo "${VPS_PASS}" | sudo -S chmod 644 ${REMOTE_DIR}/nginx/ssl/server.crt
        echo "${VPS_PASS}" | sudo -S chmod 600 ${REMOTE_DIR}/nginx/ssl/server.key
        echo "🎉 CERTIFICADO LET'S ENCRYPT INSTALADO COM SUCESSO!"
      else
        echo "❌ Falha ao encontrar certificado gerado"
      fi

      echo "=== 5. Reiniciando Nginx ==="
      docker compose up -d nginx
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
