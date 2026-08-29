import { Client } from 'ssh2';

const VPS_HOST = '179.199.136.14';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    const command = `
      echo "=== Testando HTTPS Porta 443 Local ==="
      curl -k -I https://localhost/

      echo ""
      echo "=== Testando HTTPS Endpoint /domains com Token ==="
      curl -k -s https://localhost/domains \
        -H "Authorization: Bearer 27d042f080f7e338d11a8ca2390327e014c74e708d63734907d0f901d8c5566e"
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
