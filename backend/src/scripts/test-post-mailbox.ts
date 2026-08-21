import { Client } from 'ssh2';

const VPS_HOST = '2.24.100.34';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    const command = `
      echo "--- Testando POST /api/mailboxes com API Key ---"
      curl -s -X POST "http://localhost:4000/api/mailboxes" \
        -H "Authorization: Bearer 3cc3902fcebcfdfca0702306bc01151fe19fa2691af289862dbcaf8e1322e489" \
        -H "Content-Type: application/json" \
        -d '{"domainId": 1, "username": "teste_python"}'
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
