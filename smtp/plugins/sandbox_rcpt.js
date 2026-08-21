// Haraka Plugin: sandbox_rcpt.js
// Valida se o destinatário existe no sistema e autoriza a recepção

const http = require('http');
const { URL } = require('url');
const { OK, DENY, DENYSOFT } = require('haraka-constants');

exports.hook_rcpt = function (next, connection, params) {
  const rcpt = params ? params[0] : null;
  if (!rcpt) {
    return next(DENY, '550 5.1.1 Recipient address required');
  }

  let recipient = '';
  if (typeof rcpt === 'string') {
    recipient = rcpt;
  } else if (rcpt.format && typeof rcpt.format === 'function') {
    recipient = rcpt.format();
  } else if (rcpt.user && rcpt.host) {
    recipient = `${rcpt.user}@${rcpt.host}`;
  } else {
    recipient = String(rcpt);
  }

  recipient = recipient.replace(/[<>]/g, '').toLowerCase().trim();

  if (!recipient) {
    return next(DENY, '550 5.1.1 Invalid recipient format');
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:4000';
  const urlObj = new URL('/api/internal/smtp/rcpt', backendUrl);

  const payload = JSON.stringify({ recipient });

  const req = http.request(
    {
      hostname: urlObj.hostname,
      port: urlObj.port || 4000,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 5000,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          connection.loginfo(this, `Destinatário aceito: ${recipient}`);
          // Autoriza a entrega para esta transação
          if (connection.transaction) {
            connection.transaction.relaying = true;
          }
          connection.relaying = true;
          return next(OK);
        } else {
          connection.loginfo(this, `Destinatário rejeitado (não encontrado): ${recipient}`);
          return next(DENY, '550 5.1.1 Recipient address rejected: User unknown in virtual mailbox table');
        }
      });
    }
  );

  req.on('error', (err) => {
    connection.logerror(this, `Falha ao consultar backend para validação de RCPT: ${err.message}`);
    return next(DENYSOFT, '451 Temporary lookup failure');
  });

  req.write(payload);
  req.end();
};
