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
      echo "=== Instalando Certbot na VPS ==="
      sudo apt-get update -y && sudo apt-get install -y certbot

      echo "=== Tentando obter certificado Let's Encrypt para app.asgardcp.com.br ==="
      # Como Nginx está rodando na porta 80 via Docker, usamos webroot ou paramos temporariamente o nginx
      cd ${REMOTE_DIR}
      docker compose stop nginx
      sudo certbot certonly --standalone -d app.asgardcp.com.br --non-interactive --agree-tos -m kleberwfo51@gmail.com || echo "Falha standalone"
      
      echo "=== Copiando certificados se gerados ==="
      if [ -f /etc/letsencrypt/live/app.asgardcp.com.br/fullchain.pem ]; then
        sudo cp /etc/letsencrypt/live/app.asgardcp.com.br/fullchain.pem ${REMOTE_DIR}/nginx/ssl/server.crt
        sudo cp /etc/letsencrypt/live/app.asgardcp.com.br/privkey.pem ${REMOTE_DIR}/nginx/ssl/server.key
        sudo chown -R antigravity:antigravity ${REMOTE_DIR}/nginx/ssl/
        echo "✅ Certificado Let's Encrypt instalado com sucesso!"
      fi

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
