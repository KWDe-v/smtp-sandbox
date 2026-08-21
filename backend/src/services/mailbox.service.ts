import { mailboxRepository } from '../repositories/mailbox.repository.js';
import { domainRepository } from '../repositories/domain.repository.js';
import { hashPassword } from '../utils/hash.js';
import { Mailbox } from '../types/index.js';

export class MailboxService {
  async listUserMailboxes(userId: number): Promise<(Mailbox & { domain: string; messages_count: number; unread_count: number })[]> {
    return mailboxRepository.findByUserId(userId);
  }

  async getMailbox(id: number, userId: number): Promise<Mailbox> {
    const mailbox = await mailboxRepository.findById(id, userId);
    if (!mailbox) {
      const error = new Error('Caixa postal não encontrada');
      (error as any).statusCode = 404;
      throw error;
    }
    return mailbox;
  }

  async createMailbox(
    userId: number,
    data: { domainId?: number; domainName?: string; email?: string; username?: string; password?: string; quota?: number }
  ): Promise<Mailbox> {
    let cleanUsername = (data.username || '').trim().toLowerCase();
    let targetDomainName = (data.domainName || '').trim().toLowerCase();

    // Se passou o e-mail completo (ex: teste@asgardcp.com.br)
    if (data.email && data.email.includes('@')) {
      const parts = data.email.split('@');
      cleanUsername = parts[0].trim().toLowerCase();
      targetDomainName = parts[1].trim().toLowerCase();
    }

    // Busca o domínio apropriado
    let domain: any = null;

    if (data.domainId) {
      domain = await domainRepository.findById(data.domainId, userId);
    } else if (targetDomainName) {
      const userDomains = await domainRepository.findByUserId(userId);
      domain = userDomains.find((d) => d.domain.toLowerCase() === targetDomainName);
    }

    // Se não informou domínio, usa o primeiro domínio ativo do usuário
    if (!domain) {
      const userDomains = await domainRepository.findByUserId(userId);
      if (userDomains.length > 0) {
        domain = userDomains[0];
      }
    }

    // Se o usuário ainda não tiver nenhum domínio, cria um padrão
    if (!domain) {
      domain = await domainRepository.create({
        userId,
        domain: 'sandbox.local',
        verificationToken: 'auto-generated',
        verified: true,
      });
    }

    if (!cleanUsername) {
      cleanUsername = `inbox_${Date.now().toString(36)}`;
    }

    const fullEmail = `${cleanUsername}@${domain.domain.toLowerCase()}`;
    const existing = await mailboxRepository.findByEmail(fullEmail);
    if (existing) {
      // Se já existe e pertence ao usuário, retorna a existente
      return existing;
    }

    const passwordHash = data.password ? await hashPassword(data.password) : null;

    return mailboxRepository.create({
      domainId: domain.id,
      email: fullEmail,
      passwordHash: passwordHash || undefined,
      quota: data.quota,
    });
  }

  async deleteMailbox(id: number, userId: number): Promise<void> {
    const deleted = await mailboxRepository.delete(id, userId);
    if (!deleted) {
      const error = new Error('Caixa postal não encontrada ou sem permissão');
      (error as any).statusCode = 404;
      throw error;
    }
  }
}

export const mailboxService = new MailboxService();
