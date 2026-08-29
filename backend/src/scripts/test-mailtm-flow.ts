import { Client } from 'ssh2';

const VPS_HOST = '179.199.136.14';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    const command = `
      echo "=== 1. GET /domains ==="
      curl -s "http://localhost:4000/domains"
      echo ""

      echo "=== 2. POST /accounts ==="
      curl -s -X POST "http://localhost:4000/accounts" \
        -H "Content-Type: application/json" \
        -d '{"address":"teste_curl@asgardcp.com.br","password":"secret"}'
      echo ""

      echo "=== 3. POST /token ==="
      TOKEN_RES=$(curl -s -X POST "http://localhost:4000/token" \
        -H "Content-Type: application/json" \
        -d '{"address":"teste_curl@asgardcp.com.br","password":"secret"}')
      echo "$TOKEN_RES"
      TOKEN=$(echo "$TOKEN_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
      echo ""

      echo "=== 4. GET /messages ==="
      curl -s "http://localhost:4000/messages" \
        -H "Authorization: Bearer $TOKEN"
      echo ""
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
