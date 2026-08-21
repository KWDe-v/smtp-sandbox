import { Client } from 'ssh2';

const VPS_HOST = '2.24.100.34';
const VPS_USER = 'antigravity';
const VPS_PASS = 'smtp';

const conn = new Client();
conn
  .on('ready', () => {
    console.log('✅ Conexão SSH OK!');

    const command = `
      echo "--- Teste 1: Usando Header Authorization Bearer com hash ---"
      curl -s -X GET "http://localhost:4000/api/messages" \
        -H "Authorization: Bearer 3cc3902fcebcfdfca0702306bc01151fe19fa2691af289862dbcaf8e1322e489"

      echo ""
      echo "--- Teste 2: Usando Header X-API-Key ---"
      curl -s -X GET "http://localhost:4000/api/messages" \
        -H "X-API-Key: 3cc3902fcebcfdfca0702306bc01151fe19fa2691af289862dbcaf8e1322e489"

      echo ""
      echo "--- Teste 3: Usando Query Param ?apiKey= ---"
      curl -s -X GET "http://localhost:4000/api/messages?apiKey=3cc3902fcebcfdfca0702306bc01151fe19fa2691af289862dbcaf8e1322e489"
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
