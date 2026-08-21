// Haraka Plugin: sandbox_save.js
// Envia o e-mail completo capturado pelo Haraka para o Backend REST API

const http = require('http');
const { URL } = require('url');
const { OK, DENYSOFT } = require('haraka-constants');

exports.hook_data_post = function (next, connection) {
  const transaction = connection.transaction;
  if (!transaction) return next();

  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://backend:4000';
  const urlObj = new URL('/api/internal/smtp/incoming', backendUrl);

  const emailStream = transaction.message_stream;

  const req = http.request(
    {
      hostname: urlObj.hostname,
      port: urlObj.port || 4000,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'message/rfc822',
      },
      timeout: 15000,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          connection.loginfo(this, 'Mensagem persistida e processada pelo backend com sucesso.');
          return next(OK, '250 2.0.0 Message accepted for delivery');
        } else {
          connection.logerror(this, `Erro retornado pelo backend ao salvar e-mail: ${res.statusCode} ${data}`);
          return next(DENYSOFT, '451 Failed to store message');
        }
      });
    }
  );

  req.on('error', (err) => {
    connection.logerror(this, `Erro de rede ao conectar ao backend: ${err.message}`);
    return next(DENYSOFT, '451 Service temporarily unavailable');
  });

  emailStream.pipe(req);
};
