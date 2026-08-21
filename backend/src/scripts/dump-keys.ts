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
      cd ${REMOTE_DIR} && \
      docker compose exec -T backend node -e "
        const { query } = require('./dist/database/connection.js');
        Promise.all([
          query('SELECT * FROM api_keys'),
          query('SELECT id, email, status FROM users')
        ]).then(([keys, users]) => {
          console.log('API KEYS:', JSON.stringify(keys, null, 2));
          console.log('USERS:', JSON.stringify(users, null, 2));
        }).catch(console.error);
      "
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
