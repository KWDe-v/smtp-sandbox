import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mailParserService } from '../services/mail-parser.service.js';

describe('Fase 4 & 5: Parser MIME, E-mails e Anexos', () => {
  test('Parser de e-mail simples (Texto puro e Headers)', async () => {
    const rawEmail = [
      'From: "Remetente Teste" <remetente@externo.com>',
      'To: "Dev Sandbox" <teste@sandbox.local>',
      'Subject: Teste de Envio SMTP Sandbox',
      'Date: Wed, 20 Aug 2026 10:00:00 -0300',
      'Message-ID: <msg-123456@externo.com>',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Olá mundo! Este é um teste do sandbox SMTP.',
    ].join('\r\n');

    const parsed = await mailParserService.parseRawEmail(rawEmail);

    assert.strictEqual(parsed.from, 'remetente@externo.com');
    assert.strictEqual(parsed.to, 'teste@sandbox.local');
    assert.strictEqual(parsed.subject, 'Teste de Envio SMTP Sandbox');
    assert.ok(parsed.text.includes('Olá mundo! Este é um teste do sandbox SMTP.'));
    assert.strictEqual(parsed.messageId, '<msg-123456@externo.com>');
    assert.strictEqual(parsed.attachments.length, 0);
  });

  test('Parser de e-mail multipart (HTML + Texto + Anexo)', async () => {
    const rawEmail = [
      'From: noreply@github.com',
      'To: inbox@meudominio.com',
      'Subject: Seu código de verificação 987654',
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="====BOUNDARY===="',
      '',
      '--====BOUNDARY====',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<h1>Código de acesso</h1><p>Seu código é <b>987654</b></p>',
      '',
      '--====BOUNDARY====',
      'Content-Type: text/plain; name="relatorio.txt"',
      'Content-Disposition: attachment; filename="relatorio.txt"',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from('Conteúdo do arquivo de relatório de teste.').toString('base64'),
      '',
      '--====BOUNDARY====--',
    ].join('\r\n');

    const parsed = await mailParserService.parseRawEmail(rawEmail);

    assert.strictEqual(parsed.subject, 'Seu código de verificação 987654');
    assert.ok(parsed.html.includes('<h1>Código de acesso</h1>'));
    assert.strictEqual(parsed.attachments.length, 1);
    assert.strictEqual(parsed.attachments[0].filename, 'relatorio.txt');
    assert.strictEqual(parsed.attachments[0].content.toString('utf-8'), 'Conteúdo do arquivo de relatório de teste.');
  });
});
