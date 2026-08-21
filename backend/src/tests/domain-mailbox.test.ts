import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createDomainSchema } from '../validators/domain.validator.js';
import { createMailboxSchema } from '../validators/mailbox.validator.js';
import { createApiKeySchema } from '../validators/api-key.validator.js';
import { createAliasSchema } from '../validators/alias.validator.js';

describe('Fase 3: Domínios, Mailboxes, Aliases e API Keys (Validadores e Regras)', () => {
  test('Validação de formatos de domínio', () => {
    const valid1 = createDomainSchema.safeParse({ domain: 'meudominio.com' });
    assert.strictEqual(valid1.success, true);

    const valid2 = createDomainSchema.safeParse({ domain: 'sub.sandbox.local' });
    assert.strictEqual(valid2.success, true);

    const invalid1 = createDomainSchema.safeParse({ domain: 'invalid' });
    assert.strictEqual(invalid1.success, false);

    const invalid2 = createDomainSchema.safeParse({ domain: '' });
    assert.strictEqual(invalid2.success, false);
  });

  test('Validação de caixas de entrada (Mailboxes)', () => {
    const valid = createMailboxSchema.safeParse({
      domainId: 1,
      username: 'contato',
      password: 'minha_senha_secreta',
      quota: 52428800,
    });
    assert.strictEqual(valid.success, true);

    const invalidUsername = createMailboxSchema.safeParse({
      domainId: 1,
      username: 'contato@invalido com espacos',
    });
    assert.strictEqual(invalidUsername.success, false);
  });

  test('Validação de API Keys', () => {
    const valid = createApiKeySchema.safeParse({
      name: 'CI/CD Key',
      expiresInDays: 30,
    });
    assert.strictEqual(valid.success, true);

    const invalid = createApiKeySchema.safeParse({
      name: '',
    });
    assert.strictEqual(invalid.success, false);
  });

  test('Validação de Aliases', () => {
    const valid = createAliasSchema.safeParse({
      domainId: 1,
      alias: 'suporte',
      destination: 'equipe@empresa.com',
    });
    assert.strictEqual(valid.success, true);

    const invalidDestination = createAliasSchema.safeParse({
      domainId: 1,
      alias: 'suporte',
      destination: 'not-an-email',
    });
    assert.strictEqual(invalidDestination.success, false);
  });
});
