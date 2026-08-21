import { promises as dns } from 'dns';
import { domainRepository } from '../repositories/domain.repository.js';
import { generateRandomToken } from '../utils/hash.js';
import { Domain } from '../types/index.js';

// Configura servidores DNS confiáveis (Google e Cloudflare) para evitar caches locais lentos
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);

export class DomainService {
  async listUserDomains(userId: number): Promise<Domain[]> {
    return domainRepository.findByUserId(userId);
  }

  async getDomain(id: number, userId: number): Promise<Domain> {
    const domain = await domainRepository.findById(id, userId);
    if (!domain) {
      const error = new Error('Domínio não encontrado');
      (error as any).statusCode = 404;
      throw error;
    }
    return domain;
  }

  async createDomain(userId: number, domainName: string): Promise<Domain> {
    const cleanDomain = domainName.toLowerCase().trim();
    const existing = await domainRepository.findByDomain(cleanDomain);
    if (existing) {
      const error = new Error('Este domínio já está cadastrado no sistema');
      (error as any).statusCode = 409;
      throw error;
    }

    const verificationToken = `smtp-sandbox-verify=${generateRandomToken(16)}`;
    return domainRepository.create({
      userId,
      domain: cleanDomain,
      verificationToken,
      verified: false, // Inicia não verificado até validação DNS real
    });
  }

  async deleteDomain(id: number, userId: number): Promise<void> {
    const deleted = await domainRepository.delete(id, userId);
    if (!deleted) {
      const error = new Error('Domínio não encontrado ou sem permissão');
      (error as any).statusCode = 404;
      throw error;
    }
  }

  async verifyDomain(
    id: number,
    userId: number
  ): Promise<{ verified: boolean; domain: Domain; message: string; details?: any }> {
    const domain = await this.getDomain(id, userId);
    const domainName = domain.domain;
    const token = domain.verification_token;

    let isVerified = false;
    let checkReason = '';
    const foundRecords: { txt: string[]; mx: string[] } = { txt: [], mx: [] };

    // 1. Consulta registros TXT no DNS real
    try {
      const txtRecords = await resolver.resolveTxt(domainName);
      const flattenedTxt = txtRecords.map((chunk) => chunk.join(''));
      foundRecords.txt = flattenedTxt;

      if (token && flattenedTxt.some((rec) => rec.includes(token) || rec.trim() === token.trim())) {
        isVerified = true;
        checkReason = 'Registro TXT de verificação encontrado no DNS';
      }
    } catch (err: any) {
      console.warn(`[DNS Check] Erro ao consultar TXT para ${domainName}:`, err.message);
    }

    // 2. Se TXT não encontrou, verifica se há registro MX apontando para o servidor ou para o domínio
    if (!isVerified) {
      try {
        const mxRecords = await resolver.resolveMx(domainName);
        foundRecords.mx = mxRecords.map((m) => `${m.exchange} (prio: ${m.priority})`);

        if (mxRecords.length > 0) {
          const hasMatchingMx = mxRecords.some(
            (m) =>
              m.exchange.toLowerCase().includes('mail.') ||
              m.exchange.toLowerCase().includes(domainName.toLowerCase()) ||
              m.exchange.toLowerCase().includes('sandbox')
          );
          if (hasMatchingMx) {
            isVerified = true;
            checkReason = `Registro MX detectado apontando para ${mxRecords[0].exchange}`;
          }
        }
      } catch (err: any) {
        console.warn(`[DNS Check] Erro ao consultar MX para ${domainName}:`, err.message);
      }
    }

    // 3. Atualiza no banco de dados se verificado
    if (isVerified) {
      await domainRepository.verify(domain.id);
      const updatedDomain = await this.getDomain(id, userId);
      return {
        verified: true,
        domain: updatedDomain,
        message: `Domínio verificado com sucesso! (${checkReason})`,
        details: foundRecords,
      };
    } else {
      return {
        verified: false,
        domain,
        message:
          'Não foi possível validar o domínio no DNS. Certifique-se de ter adicionado o registro TXT ou MX no Cloudflare e aguarde a propagação.',
        details: foundRecords,
      };
    }
  }
}

export const domainService = new DomainService();
