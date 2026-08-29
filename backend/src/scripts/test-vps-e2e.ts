import { Client } from 'ssh2';

const VPS_HOST = '179.199.136.14';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';
const REMOTE_DIR = '/home/antigravity/smtp-sandbox';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    // 1. Cria usuário de teste via CLI administrativa
    // 2. Cria domínio example.test
    // 3. Cria mailbox teste@example.test
    // 4. Executa script de teste de envio SMTP dentro da VPS
    const command = `
      cd ${REMOTE_DIR} && \
      docker compose exec -T backend npm run cli user:create "Admin Sandbox" "admin@sandbox.local" "admin123456" || true && \
      docker compose exec -T backend npm run cli domain:create 1 "example.test" || true && \
      docker compose exec -T backend npm run cli mailbox:create 1 1 "teste" || true && \
      docker compose exec -T backend npm run test:smtp "teste@example.test" "remetente@externo.com" "Boas-vindas ao Sandbox SMTP VPS"
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
