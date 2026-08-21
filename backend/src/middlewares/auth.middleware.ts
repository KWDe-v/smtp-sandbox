import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt.js';
import { apiKeyRepository } from '../repositories/api-key.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  authType: 'jwt' | 'api_key';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  let tokenOrKey: string | undefined;

  // 1. Tenta extrair do Header Authorization
  const authHeader = (req.headers.authorization || req.headers.Authorization) as string;
  if (authHeader) {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ') || trimmed.toLowerCase().startsWith('token ')) {
      tokenOrKey = trimmed.substring(trimmed.indexOf(' ') + 1).trim();
    } else {
      tokenOrKey = trimmed;
    }
  }

  // 2. Tenta extrair de X-API-Key / x-api-key / apikey
  if (!tokenOrKey) {
    const xApiKey = (req.headers['x-api-key'] || req.headers['X-API-Key'] || req.headers['x-apikey'] || req.headers['apikey']) as string;
    if (xApiKey) {
      tokenOrKey = xApiKey.trim();
    }
  }

  // 3. Tenta extrair de Query Params (?apiKey=... ou ?token=...)
  if (!tokenOrKey && req.query) {
    const qToken = (req.query.apiKey || req.query.api_key || req.query.token || req.query.access_token) as string;
    if (qToken) {
      tokenOrKey = qToken.trim();
    }
  }

  if (!tokenOrKey) {
    res.status(401).json({
      success: false,
      error: 'Token de autenticação ou Chave de API não fornecido. Envie via Header Authorization: Bearer <chave> ou X-API-Key: <chave>',
    });
    return;
  }

  // Limpa aspas que usuários às vezes deixam no script (ex: "sk_live_...")
  tokenOrKey = tokenOrKey.replace(/^['"]+|['"]+$/g, '').trim();

  // 1. Tenta validar primeiro como API Key no banco
  try {
    const apiKey = await apiKeyRepository.findByRawKey(tokenOrKey);
    if (apiKey) {
      const user = await userRepository.findById(apiKey.user_id);
      if (!user || user.status !== 'active') {
        res.status(403).json({
          success: false,
          error: 'Usuário proprietário da chave está inativo',
        });
        return;
      }

      req.user = {
        userId: user.id,
        email: user.email,
        authType: 'api_key',
      };
      next();
      return;
    }
  } catch (err) {
    console.error('[Auth Middleware] Erro ao consultar API Key:', err);
  }

  // 2. Se não encontrou como API Key, tenta validar como JWT Access Token
  try {
    const payload = verifyAccessToken(tokenOrKey);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      authType: 'jwt',
    };
    next();
    return;
  } catch {
    console.warn(`[Auth Middleware] Falha na autenticação. Token recebido: "${tokenOrKey.substring(0, 10)}..." (tam: ${tokenOrKey.length})`);
    res.status(401).json({
      success: false,
      error: 'Chave de API ou Token JWT inválido ou expirado. Verifique se copiou a chave completa gerada no painel.',
    });
  }
}
