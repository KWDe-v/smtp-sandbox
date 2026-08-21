import { userRepository } from './repositories/user.repository.js';
import { domainRepository } from './repositories/domain.repository.js';
import { mailboxRepository } from './repositories/mailbox.repository.js';
import { messageRepository } from './repositories/message.repository.js';
import { hashPassword } from './utils/hash.js';
import { closeDatabaseConnection } from './database/connection.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Plataforma SMTP Sandbox — CLI Administrativa

Comandos disponíveis:
  user:create <nome> <email> <senha>
  domain:create <userId> <dominio>
  mailbox:create <userId> <domainId> <username> [senha]
  mailbox:list <userId>
  message:list <mailboxId>
  message:delete <messageId>
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'user:create': {
        const [, name, email, password] = args;
        if (!name || !email || !password) {
          console.error('Uso: npm run cli user:create <nome> <email> <senha>');
          process.exit(1);
        }
        const hash = await hashPassword(password);
        const user = await userRepository.create({ name, email, password_hash: hash });
        console.log('✅ Usuário criado com sucesso:', user);
        break;
      }

      case 'domain:create': {
        const [, userIdStr, domainName] = args;
        const userId = parseInt(userIdStr, 10);
        if (!userId || !domainName) {
          console.error('Uso: npm run cli domain:create <userId> <dominio>');
          process.exit(1);
        }
        const domain = await domainRepository.create({
          userId,
          domain: domainName,
          verificationToken: 'cli-verified',
          verified: true,
        });
        console.log('✅ Domínio criado com sucesso:', domain);
        break;
      }

      case 'mailbox:create': {
        const [, userIdStr, domainIdStr, username, password] = args;
        const userId = parseInt(userIdStr, 10);
        const domainId = parseInt(domainIdStr, 10);
        if (!userId || !domainId || !username) {
          console.error('Uso: npm run cli mailbox:create <userId> <domainId> <username> [senha]');
          process.exit(1);
        }
        const domain = await domainRepository.findById(domainId, userId);
        if (!domain) {
          console.error('❌ Domínio não encontrado para este usuário');
          process.exit(1);
        }
        const fullEmail = `${username}@${domain.domain}`;
        const passHash = password ? await hashPassword(password) : undefined;
        const mailbox = await mailboxRepository.create({
          domainId: domain.id,
          email: fullEmail,
          passwordHash: passHash,
        });
        console.log('✅ Caixa postal criada:', mailbox);
        break;
      }

      case 'mailbox:list': {
        const [, userIdStr] = args;
        const userId = parseInt(userIdStr, 10);
        if (!userId) {
          console.error('Uso: npm run cli mailbox:list <userId>');
          process.exit(1);
        }
        const mailboxes = await mailboxRepository.findByUserId(userId);
        console.table(mailboxes);
        break;
      }

      case 'message:list': {
        const [, mailboxIdStr] = args;
        const mailboxId = parseInt(mailboxIdStr, 10);
        if (!mailboxId) {
          console.error('Uso: npm run cli message:list <mailboxId>');
          process.exit(1);
        }
        const result = await messageRepository.findByMailboxId(mailboxId);
        console.table(result.messages);
        console.log(`Total: ${result.total} mensagens`);
        break;
      }

      case 'message:delete': {
        const [, messageIdStr] = args;
        const messageId = parseInt(messageIdStr, 10);
        if (!messageId) {
          console.error('Uso: npm run cli message:delete <messageId>');
          process.exit(1);
        }
        const deleted = await messageRepository.delete(messageId);
        console.log(deleted ? '✅ Mensagem excluída.' : '❌ Mensagem não encontrada.');
        break;
      }

      default:
        console.error(`Comando desconhecido: ${command}`);
    }
  } catch (err: any) {
    console.error('❌ Erro ao executar comando:', err.message);
  } finally {
    await closeDatabaseConnection();
    process.exit(0);
  }
}

main();
