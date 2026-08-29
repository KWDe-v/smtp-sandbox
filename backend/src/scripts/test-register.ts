import { Client } from 'ssh2';

const VPS_HOST = '179.199.136.14';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    const command = `
      curl -i -X POST http://localhost:4000/api/auth/register \\
        -H "Content-Type: application/json" \\
        -H "Origin: http://179.199.136.14" \\
        -d '{"name":"Kleber Washington","email":"kleberwfo51@gmail.com","password":"kleber155password"}'
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
