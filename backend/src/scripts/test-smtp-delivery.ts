import { Client } from 'ssh2';

const VPS_HOST = '179.199.136.14';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';
const REMOTE_DIR = '/home/antigravity/smtp-sandbox';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    // Envia e-mail SMTP apontando para o container smtp
    const command = `
      cd ${REMOTE_DIR} && \
      docker compose exec -T -e SMTP_HOST=smtp backend node dist/scripts/send-test-email.js "teste@example.test" "remetente@externo.com" "Teste de Envio Real SMTP na VPS" "Mensagem recebida e processada com sucesso no Sandbox!" && \
      docker compose exec -T backend node dist/cli.js message:list 1
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
