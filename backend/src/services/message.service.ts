import { messageRepository } from '../repositories/message.repository.js';
import { attachmentRepository } from '../repositories/attachment.repository.js';
import { mailboxRepository } from '../repositories/mailbox.repository.js';
import { aliasRepository } from '../repositories/alias.repository.js';
import { domainRepository } from '../repositories/domain.repository.js';
import { mailParserService } from './mail-parser.service.js';
import { storageService } from './storage.service.js';
import { eventManager } from '../events/event-emitter.js';
import { webhookService } from './webhook.service.js';
import { Message, Attachment } from '../types/index.js';

export class MessageService {
  async processIncomingEmail(rawEmail: string | Buffer): Promise<{ message: Message; mailboxEmail: string }> {
    const parsed = await mailParserService.parseRawEmail(rawEmail);

    // Extrai o endereço do destinatário limpo (ex: "Nome <user@dominio.com>" -> "user@dominio.com")
    const match = parsed.to.match(/<([^>]+)>/) || [null, parsed.to];
    let recipientEmail = (match[1] || parsed.to).trim().toLowerCase();

    // 1. Verifica se é um Alias
    const alias = await aliasRepository.findByAlias(recipientEmail);
    if (alias) {
      recipientEmail = alias.destination.toLowerCase().trim();
    }

    // 2. Busca a Mailbox
    const mailbox = await mailboxRepository.findByEmail(recipientEmail);
    if (!mailbox) {
      const error = new Error(`Caixa postal não encontrada para o destinatário: ${recipientEmail}`);
      (error as any).statusCode = 404;
      throw error;
    }

    if (mailbox.status !== 'active') {
      const error = new Error(`A caixa postal ${recipientEmail} está inativa`);
      (error as any).statusCode = 403;
      throw error;
    }

    // 3. Obtém o dono da Mailbox para eventos
    const domain = await domainRepository.findById(mailbox.domain_id);
    const userId = domain?.user_id;

    // 4. Salva a mensagem no MySQL
    const message = await messageRepository.create({
      mailboxId: mailbox.id,
      messageId: parsed.messageId,
      sender: parsed.from,
      recipient: parsed.to,
      subject: parsed.subject,
      textBody: parsed.text,
      htmlBody: parsed.html,
      rawMessage: parsed.raw,
      headers: parsed.headers,
      mimeType: parsed.mimeType,
      size: parsed.size,
    });

    // 5. Salva anexos no Storage e no Banco
    const savedAttachments: Attachment[] = [];
    for (const att of parsed.attachments) {
      const storagePath = await storageService.saveAttachment(message.id, att.filename, att.content);
      const savedAtt = await attachmentRepository.create({
        messageId: message.id,
        filename: att.filename,
        mimeType: att.contentType,
        size: att.size,
        storagePath,
      });
      savedAttachments.push(savedAtt);
    }

    // 6. Publica evento no Redis Pub/Sub e SSE
    const eventPayload = {
      event: 'message.received' as const,
      timestamp: new Date().toISOString(),
      userId,
      data: {
        id: message.id,
        mailboxId: mailbox.id,
        mailboxEmail: mailbox.email,
        sender: message.sender,
        recipient: message.recipient,
        subject: message.subject,
        size: message.size,
        createdAt: message.created_at,
        attachmentsCount: savedAttachments.length,
      },
    };

    await eventManager.publish(eventPayload);

    return {
      message,
      mailboxEmail: mailbox.email,
    };
  }

  async listMailboxMessages(
    mailboxId: number,
    userId: number,
    page = 1,
    limit = 50
  ): Promise<{ messages: Message[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const { messages, total } = await messageRepository.findByMailboxId(mailboxId, userId, limit, offset);

    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async searchMessages(
    userId: number,
    filters: {
      email?: string;
      sender?: string;
      subject?: string;
      search?: string;
      unreadOnly?: boolean;
    },
    page = 1,
    limit = 20
  ): Promise<{ messages: Message[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const { messages, total } = await messageRepository.search(userId, filters, limit, offset);

    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getRecentMessages(userId: number, limit = 10): Promise<Message[]> {
    return messageRepository.findRecentByUserId(userId, limit);
  }

  async getMessage(id: number, userId: number): Promise<Message & { attachments: Attachment[] }> {
    const message = await messageRepository.findById(id, userId);
    if (!message) {
      const error = new Error('Mensagem não encontrada');
      (error as any).statusCode = 404;
      throw error;
    }

    const attachments = await attachmentRepository.findByMessageId(id, userId);
    return {
      ...message,
      attachments,
    };
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await messageRepository.markAsRead(id, userId);
    void eventManager.publish({
      event: 'message.read',
      timestamp: new Date().toISOString(),
      userId,
      data: { id },
    });
  }

  async markAsUnread(id: number, userId: number): Promise<void> {
    await messageRepository.markAsUnread(id, userId);
  }

  async deleteMessage(id: number, userId: number): Promise<void> {
    const message = await messageRepository.findById(id, userId);
    if (!message) {
      const error = new Error('Mensagem não encontrada ou sem permissão');
      (error as any).statusCode = 404;
      throw error;
    }

    const attachments = await attachmentRepository.findByMessageId(id, userId);
    for (const att of attachments) {
      await storageService.deleteAttachment(att.storage_path);
    }

    await messageRepository.delete(id, userId);

    void eventManager.publish({
      event: 'message.deleted',
      timestamp: new Date().toISOString(),
      userId,
      data: { id, mailboxId: message.mailbox_id },
    });

    void webhookService.dispatchEvent(userId, 'message.deleted', { id, mailboxId: message.mailbox_id });
  }

  async getMessageRaw(id: number, userId: number): Promise<string> {
    const message = await messageRepository.findById(id, userId);
    if (!message) {
      const error = new Error('Mensagem não encontrada');
      (error as any).statusCode = 404;
      throw error;
    }
    return message.raw_message || '';
  }

  async getMessageHeaders(id: number, userId: number): Promise<Record<string, any>> {
    const message = await messageRepository.findById(id, userId);
    if (!message) {
      const error = new Error('Mensagem não encontrada');
      (error as any).statusCode = 404;
      throw error;
    }
    return message.headers || {};
  }

  async getMessageAttachments(id: number, userId: number): Promise<Attachment[]> {
    return attachmentRepository.findByMessageId(id, userId);
  }

  async downloadAttachment(
    attachmentId: number,
    userId: number
  ): Promise<{ filename: string; mimeType: string; buffer: Buffer }> {
    const attachment = await attachmentRepository.findById(attachmentId, userId);
    if (!attachment) {
      const error = new Error('Anexo não encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    const buffer = await storageService.getAttachmentBuffer(attachment.storage_path);
    if (!buffer) {
      const error = new Error('Arquivo físico do anexo não encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    return {
      filename: attachment.filename,
      mimeType: attachment.mime_type,
      buffer,
    };
  }

  async getStats(userId: number): Promise<{
    domainsCount: number;
    mailboxesCount: number;
    totalMessages: number;
    unreadMessages: number;
  }> {
    const domains = await domainRepository.findByUserId(userId);
    const mailboxes = await mailboxRepository.findByUserId(userId);
    const msgStats = await messageRepository.countTotalAndUnreadByUserId(userId);

    return {
      domainsCount: domains.length,
      mailboxesCount: mailboxes.length,
      totalMessages: msgStats.total,
      unreadMessages: msgStats.unread,
    };
  }
}

export const messageService = new MessageService();
