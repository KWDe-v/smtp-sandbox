import { simpleParser, ParsedMail, Attachment as ParsedAttachment } from 'mailparser';

export interface ParsedEmailData {
  messageId: string | null;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  headers: Record<string, any>;
  raw: string;
  size: number;
  mimeType: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }[];
}

export class MailParserService {
  async parseRawEmail(rawEmail: string | Buffer): Promise<ParsedEmailData> {
    const rawBuffer = Buffer.isBuffer(rawEmail) ? rawEmail : Buffer.from(rawEmail, 'utf-8');
    const parsed: ParsedMail = await simpleParser(rawBuffer);

    // Formata headers
    const headerObj: Record<string, any> = {};
    if (parsed.headers) {
      for (const [key, value] of parsed.headers) {
        headerObj[key] = value;
      }
    }

    // Remetente e Destinatário
    const fromAddress = parsed.from?.value?.[0]?.address || (parsed.from?.text as string) || 'unknown@sender.local';
    const toAddress = Array.isArray(parsed.to)
      ? parsed.to.map((t) => t.value.map((v) => v.address).join(', ')).join(', ')
      : parsed.to?.value?.[0]?.address || (parsed.to?.text as string) || 'unknown@recipient.local';

    // Anexos
    const attachments = (parsed.attachments || []).map((att: ParsedAttachment) => ({
      filename: att.filename || `anexo_${Date.now()}`,
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || att.content.length,
      content: att.content,
    }));

    return {
      messageId: parsed.messageId || null,
      from: fromAddress,
      to: toAddress,
      subject: parsed.subject || '(Sem assunto)',
      text: parsed.text || '',
      html: (parsed.html as string) || '',
      headers: headerObj,
      raw: rawBuffer.toString('utf-8'),
      size: rawBuffer.length,
      mimeType: (headerObj['content-type'] as string) || 'text/plain',
      attachments,
    };
  }
}

export const mailParserService = new MailParserService();
