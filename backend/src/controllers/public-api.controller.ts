import { Request, Response, NextFunction } from 'express';
import { query, execute } from '../database/connection.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { messageService } from '../services/message.service.js';
import type { RowDataPacket } from 'mysql2/promise';

export class PublicApiController {
  // 1. GET /domains ou /api/domains (Exige Token)
  async getDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const rows = await query<RowDataPacket[]>(
        'SELECT id, domain, verified as isActive, created_at as createdAt FROM domains WHERE user_id = ? ORDER BY id ASC',
        [userId]
      );

      const domainsList = rows.map((d) => ({
        id: d.id,
        domain: d.domain,
        isActive: Boolean(d.isActive),
        isPrivate: false,
        createdAt: d.createdAt,
      }));

      res.status(200).json(domainsList);
    } catch (err) {
      next(err);
    }
  }

  // 2. POST /accounts ou /api/accounts (Exige Token)
  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const address = (req.body.address || req.body.email || '').trim().toLowerCase();
      const password = req.body.password;

      if (!address || !address.includes('@')) {
        res.status(400).json({
          success: false,
          error: 'Endereço de e-mail inválido. Envie {"address": "usuario@dominio.com", "password": "..."}',
        });
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          error: 'A senha de acesso da caixa é obrigatória. Envie {"address": "usuario@dominio.com", "password": "sua_senha"}',
        });
        return;
      }

      const [, domainName] = address.split('@');

      // Busca o domínio do usuário
      const domains = await query<RowDataPacket[]>(
        'SELECT id, domain FROM domains WHERE domain = ? AND user_id = ? LIMIT 1',
        [domainName, userId]
      );

      let domainId: number;

      if (domains.length > 0) {
        domainId = domains[0].id;
      } else {
        const insertDomain = await execute(
          'INSERT INTO domains (user_id, domain, verification_token, verified) VALUES (?, ?, ?, 1)',
          [userId, domainName, 'auto-token']
        );
        domainId = insertDomain.insertId;
      }

      const pwdHash = await hashPassword(password);

      // Verifica se a caixa já existe
      const existing = await query<RowDataPacket[]>('SELECT * FROM mailboxes WHERE email = ? LIMIT 1', [address]);
      let mailboxId: number;
      let createdAt: any;

      if (existing.length > 0) {
        mailboxId = existing[0].id;
        createdAt = existing[0].created_at;
        await execute('UPDATE mailboxes SET password_hash = ? WHERE id = ?', [pwdHash, mailboxId]);
      } else {
        const insertMb = await execute(
          'INSERT INTO mailboxes (domain_id, email, password_hash, status) VALUES (?, ?, ?, "active")',
          [domainId, address, pwdHash]
        );
        mailboxId = insertMb.insertId;
        createdAt = new Date().toISOString();
      }

      res.status(201).json({
        id: String(mailboxId),
        address,
        quota: 104857600,
        used: 0,
        isDisabled: false,
        isDeleted: false,
        createdAt,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  // 3. GET /messages ou POST /messages (Exige Token + E-mail e Senha da Caixa)
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      // Extrai o endereço e a senha de query params, headers ou body
      const address = (
        req.query.address ||
        req.query.email ||
        req.headers['x-mailbox-email'] ||
        req.body?.address ||
        req.body?.email ||
        ''
      )
        .toString()
        .trim()
        .toLowerCase();

      const password = (
        req.query.password ||
        req.headers['x-mailbox-password'] ||
        req.body?.password ||
        ''
      ).toString();

      // Validação obrigatória de e-mail e senha
      if (!address || !password) {
        res.status(401).json({
          success: false,
          error: 'Para listar os e-mails desta caixa, informe o endereço de e-mail e a senha de acesso (ex: /messages?address=usuario@dominio.com&password=senha ou no corpo da requisição).',
        });
        return;
      }

      // Valida a caixa e a senha no banco de dados
      const mbRows = await query<RowDataPacket[]>(
        `SELECT m.id, m.email, m.password_hash, d.user_id 
         FROM mailboxes m 
         JOIN domains d ON d.id = m.domain_id 
         WHERE m.email = ? AND d.user_id = ? LIMIT 1`,
        [address, userId]
      );

      if (mbRows.length === 0) {
        res.status(404).json({
          success: false,
          error: `Caixa de e-mail "${address}" não encontrada na sua conta.`,
        });
        return;
      }

      const mb = mbRows[0];

      if (!mb.password_hash) {
        res.status(401).json({
          success: false,
          error: 'Esta caixa de e-mail ainda não possui senha cadastrada. Atualize a senha via POST /accounts.',
        });
        return;
      }

      const isPasswordValid = await comparePassword(password, mb.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Senha de acesso incorreta para esta caixa de e-mail.',
        });
        return;
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 30;

      const result = await messageService.searchMessages(
        userId,
        {
          email: address,
          search: req.query.search as string,
        },
        page,
        limit
      );

      const formattedMessages = result.messages.map((m: any) => ({
        id: String(m.id),
        accountId: String(m.mailbox_id),
        msgid: m.message_id || String(m.id),
        from: {
          address: m.sender,
          name: m.sender.split('<')[0].replace(/"/g, '').trim() || m.sender,
        },
        to: [
          {
            address: m.recipient,
            name: m.recipient.split('@')[0],
          },
        ],
        subject: m.subject || '(Sem assunto)',
        intro: (m.text_body || '').substring(0, 100),
        seen: Boolean(m.is_read),
        isDeleted: false,
        hasAttachments: (m.attachments_count || 0) > 0,
        size: m.size || 0,
        downloadUrl: `/api/messages/${m.id}/raw`,
        createdAt: m.created_at,
        updatedAt: m.created_at,
        sender: m.sender,
        recipient: m.recipient,
        mailbox_email: m.mailbox_email || m.recipient,
        text_body: m.text_body,
        is_read: m.is_read,
        created_at: m.created_at,
      }));

      if (req.query.format === 'object') {
        res.status(200).json({
          success: true,
          messages: formattedMessages,
          total: result.total,
          page,
          totalPages: result.totalPages,
        });
      } else {
        const responseArray: any = formattedMessages;
        responseArray.total = result.total;
        responseArray.messages = formattedMessages;
        responseArray.success = true;
        res.status(200).json(formattedMessages);
      }
    } catch (err) {
      next(err);
    }
  }

  // 4. GET /messages/:id (Exige Token + E-mail e Senha)
  async getMessageById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const message = await messageService.getMessage(id, req.user!.userId);

      // Validação de senha se informada
      const password = (req.query.password || req.headers['x-mailbox-password'] || '').toString();
      if (password) {
        const mbRows = await query<RowDataPacket[]>('SELECT password_hash FROM mailboxes WHERE id = ? LIMIT 1', [message.mailbox_id]);
        if (mbRows.length > 0 && mbRows[0].password_hash) {
          const isOk = await comparePassword(password, mbRows[0].password_hash);
          if (!isOk) {
            res.status(401).json({ success: false, error: 'Senha incorreta para acessar este e-mail' });
            return;
          }
        }
      }

      res.status(200).json({
        id: String(message.id),
        msgid: message.message_id || String(message.id),
        from: {
          address: message.sender,
          name: message.sender,
        },
        to: [{ address: message.recipient, name: message.recipient }],
        subject: message.subject,
        intro: (message.text_body || '').substring(0, 100),
        text: message.text_body,
        html: [message.html_body],
        hasAttachments: message.attachments && message.attachments.length > 0,
        attachments: (message.attachments || []).map((a) => ({
          id: String(a.id),
          filename: a.filename,
          contentType: a.mime_type,
          disposition: 'attachment',
          transferEncoding: 'base64',
          related: false,
          size: a.size,
          downloadUrl: `/api/attachments/${a.id}`,
        })),
        size: message.size,
        seen: Boolean(message.is_read),
        createdAt: message.created_at,
        data: message,
        success: true,
      });
    } catch (err) {
      next(err);
    }
  }

  // 5. DELETE /messages/:id (Exige Token)
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await messageService.deleteMessage(id, req.user!.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const publicApiController = new PublicApiController();
