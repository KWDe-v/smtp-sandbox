import { userRepository } from '../repositories/user.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { hashPassword, comparePassword, hashToken } from '../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../auth/jwt.js';
import { User } from '../types/index.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password_hash'>;
}

export class AuthService {
  async register(data: { name: string; email: string; password: string }): Promise<AuthTokens> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      const error = new Error('Este endereço de e-mail já está cadastrado');
      (error as any).statusCode = 409;
      throw error;
    }

    const passwordHash = await hashPassword(data.password);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      status: 'active',
    });

    return this.createAuthSession(user);
  }

  async login(data: { email: string; password: string }): Promise<AuthTokens> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      const error = new Error('Credenciais inválidas');
      (error as any).statusCode = 401;
      throw error;
    }

    if (user.status !== 'active') {
      const error = new Error('Conta desativada ou suspensa');
      (error as any).statusCode = 403;
      throw error;
    }

    const isMatch = await comparePassword(data.password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Credenciais inválidas');
      (error as any).statusCode = 401;
      throw error;
    }

    return this.createAuthSession(user);
  }

  async refreshToken(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      const error = new Error('Refresh token inválido ou expirado');
      (error as any).statusCode = 401;
      throw error;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const session = await sessionRepository.findByTokenHash(tokenHash);
    if (!session) {
      const error = new Error('Sessão expirada ou revogada');
      (error as any).statusCode = 401;
      throw error;
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== 'active') {
      const error = new Error('Usuário inválido ou inativo');
      (error as any).statusCode = 403;
      throw error;
    }

    // Rotacionar refresh token
    await sessionRepository.deleteSession(tokenHash);

    const newAccessToken = signAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = signRefreshToken({ userId: user.id, email: user.email });
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await sessionRepository.createSession(user.id, hashToken(newRefreshToken), newExpiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string, userId?: number): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await sessionRepository.deleteSession(tokenHash);
    } else if (userId) {
      await sessionRepository.deleteUserSessions(userId);
    }
  }

  async getProfile(userId: number): Promise<Omit<User, 'password_hash'>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('Usuário não encontrado');
      (error as any).statusCode = 404;
      throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...profile } = user;
    return profile;
  }

  async updateProfile(
    userId: number,
    data: { name?: string; currentPassword?: string; newPassword?: string }
  ): Promise<Omit<User, 'password_hash'>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('Usuário não encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    let newPasswordHash: string | undefined;

    if (data.newPassword) {
      if (!data.currentPassword) {
        const error = new Error('A senha atual é necessária para alterar a senha');
        (error as any).statusCode = 400;
        throw error;
      }
      const isMatch = await comparePassword(data.currentPassword, user.password_hash);
      if (!isMatch) {
        const error = new Error('A senha atual informada está incorreta');
        (error as any).statusCode = 400;
        throw error;
      }
      newPasswordHash = await hashPassword(data.newPassword);
    }

    const updated = await userRepository.update(userId, {
      name: data.name,
      password_hash: newPasswordHash,
    });

    if (!updated) {
      throw new Error('Falha ao atualizar o usuário');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...profile } = updated;
    return profile;
  }

  private async createAuthSession(user: User): Promise<AuthTokens> {
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await sessionRepository.createSession(user.id, hashToken(refreshToken), expiresAt);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = user;
    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }
}

export const authService = new AuthService();
