import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const VPS_HOST = '2.24.100.34';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';
const REMOTE_DIR = '/home/antigravity/smtp-sandbox';

const sslDir = path.resolve(process.cwd(), '../nginx/ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    conn.sftp((err, sftp) => {
      if (err) throw err;

      sftp.fastGet(`${REMOTE_DIR}/nginx/ssl/server.crt`, path.join(sslDir, 'server.crt'), (err1) => {
        if (err1) console.error('Erro baixando crt:', err1);
        else console.log('server.crt baixado com sucesso!');

        sftp.fastGet(`${REMOTE_DIR}/nginx/ssl/server.key`, path.join(sslDir, 'server.key'), (err2) => {
          if (err2) console.error('Erro baixando key:', err2);
          else console.log('server.key baixado com sucesso!');

          conn.end();
        });
      });
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
