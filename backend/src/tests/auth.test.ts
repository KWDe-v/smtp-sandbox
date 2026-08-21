import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hashPassword, comparePassword, hashToken, generateApiKey } from '../utils/hash.js';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../auth/jwt.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

describe('Fase 2: Autenticação, Criptografia e JWT', () => {
  test('Hash e verificação de senha com bcrypt', async () => {
    const password = 'MinhaSenhaSegura123!';
    const hash = await hashPassword(password);

    assert.ok(hash !== password, 'O hash deve ser diferente da senha plana');
    assert.ok(hash.startsWith('$2'), 'Deve ser um hash bcrypt válido');

    const isValid = await comparePassword(password, hash);
    assert.strictEqual(isValid, true, 'Senha correta deve validar com sucesso');

    const isInvalid = await comparePassword('SenhaErrada', hash);
    assert.strictEqual(isInvalid, false, 'Senha errada deve ser rejeitada');
  });

  test('Geração e verificação de JWT Access Token', () => {
    const payload = { userId: 42, email: 'dev@sandbox.local' };
    const token = signAccessToken(payload);

    assert.ok(typeof token === 'string' && token.length > 20);

    const verified = verifyAccessToken(token);
    assert.strictEqual(verified.userId, 42);
    assert.strictEqual(verified.email, 'dev@sandbox.local');
  });

  test('Geração e verificação de JWT Refresh Token', () => {
    const payload = { userId: 99, email: 'test@sandbox.local' };
    const refreshToken = signRefreshToken(payload);

    assert.ok(typeof refreshToken === 'string');

    const verified = verifyRefreshToken(refreshToken);
    assert.strictEqual(verified.userId, 99);
    assert.strictEqual(verified.email, 'test@sandbox.local');
  });

  test('Geração e Hash de API Key', () => {
    const { key, hash, prefix } = generateApiKey();

    assert.ok(key.startsWith('sk_live_'));
    assert.ok(prefix.startsWith('sk_live_'));
    assert.strictEqual(hashToken(key), hash);
  });

  test('Validação de esquemas com Zod', () => {
    const validRegister = registerSchema.safeParse({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha_com_mais_de_8_digitos',
    });
    assert.strictEqual(validRegister.success, true);

    const invalidRegister = registerSchema.safeParse({
      name: 'J',
      email: 'invalid-email',
      password: '123',
    });
    assert.strictEqual(invalidRegister.success, false);

    const validLogin = loginSchema.safeParse({
      email: 'user@test.com',
      password: 'qualquer_senha',
    });
    assert.strictEqual(validLogin.success, true);
  });
});
