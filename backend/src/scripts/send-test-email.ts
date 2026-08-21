import net from 'net';

async function sendSmtpEmail(
  host = process.env.SMTP_HOST || '127.0.0.1',
  port = parseInt(process.env.SMTP_PORT || '25', 10),
  from = 'sender@external.com',
  to = 'teste@example.test',
  subject = 'E-mail de Teste Sandbox SMTP',
  body = 'Olá! Esta é uma mensagem de teste enviada diretamente via socket SMTP.'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(port, host);
    let step = 0;

    socket.setEncoding('utf-8');

    socket.on('connect', () => {
      console.log(`🔌 Conectado ao servidor SMTP em ${host}:${port}`);
    });

    socket.on('data', (data) => {
      const response = data.toString();
      console.log(`[SMTP S] ${response.trim()}`);

      const code = parseInt(response.substring(0, 3), 10);
      if (code >= 400) {
        socket.end();
        return reject(new Error(`Erro SMTP: ${response}`));
      }

      if (step === 0 && code === 220) {
        // Banner recebido -> Envia EHLO
        step++;
        console.log('[SMTP C] EHLO localhost');
        socket.write('EHLO localhost\r\n');
      } else if (step === 1 && code === 250) {
        // EHLO OK -> Envia MAIL FROM
        step++;
        console.log(`[SMTP C] MAIL FROM:<${from}>`);
        socket.write(`MAIL FROM:<${from}>\r\n`);
      } else if (step === 2 && code === 250) {
        // MAIL FROM OK -> Envia RCPT TO
        step++;
        console.log(`[SMTP C] RCPT TO:<${to}>`);
        socket.write(`RCPT TO:<${to}>\r\n`);
      } else if (step === 3 && code === 250) {
        // RCPT TO OK -> Envia DATA
        step++;
        console.log('[SMTP C] DATA');
        socket.write('DATA\r\n');
      } else if (step === 4 && code === 354) {
        // DATA OK -> Envia corpo do e-mail
        step++;
        const messageId = `<${Date.now()}.${Math.random().toString(36).substring(7)}@local.test>`;
        const date = new Date().toUTCString();

        const rawMessage = [
          `From: ${from}`,
          `To: ${to}`,
          `Subject: ${subject}`,
          `Date: ${date}`,
          `Message-ID: ${messageId}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=utf-8',
          '',
          `<h2>${subject}</h2><p>${body}</p><p>Timestamp: <b>${date}</b></p>`,
          '\r\n.',
          '',
        ].join('\r\n');

        console.log('[SMTP C] (Enviando corpo RFC822)');
        socket.write(rawMessage);
      } else if (step === 5 && code === 250) {
        // Mensagem aceita
        step++;
        console.log('[SMTP C] QUIT');
        socket.write('QUIT\r\n');
      } else if (step === 6 && code === 221) {
        console.log('✅ E-mail SMTP transmitido com sucesso!');
        socket.end();
        resolve();
      }
    });

    socket.on('error', (err) => {
      console.error('❌ Erro no socket SMTP:', err.message);
      reject(err);
    });
  });
}

const args = process.argv.slice(2);
const toArg = args[0] || 'teste@example.test';
const fromArg = args[1] || 'dev@sender.com';
const subjectArg = args[2] || 'Teste Automatizado Sandbox';
const bodyArg = args[3] || 'Olá! Esta é uma mensagem de teste enviada diretamente via socket SMTP.';

const hostArg = process.env.SMTP_HOST || '127.0.0.1';
const portArg = parseInt(process.env.SMTP_PORT || '25', 10);

sendSmtpEmail(hostArg, portArg, fromArg, toArg, subjectArg, bodyArg)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
