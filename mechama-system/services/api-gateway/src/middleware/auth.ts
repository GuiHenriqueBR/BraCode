import { Request, Response, NextFunction } from 'express';
import { AuthUtils, logger, RedisService } from '@mechama/shared';
import { JwtPayload, UserRole } from '@mechama/types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

const redisService = new RedisService();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const isBlacklisted = await redisService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
      return;
    }

    // Verify token
    const payload = AuthUtils.verifyToken(token);
    
    // Check if user still exists and is active (cache check)
    const userKey = `user:${payload.sub}`;
    const cachedUser = await redisService.getJson(userKey);
    
    if (!cachedUser) {
      // If not in cache, we'll let the service handle user validation
      logger.warn('User not found in cache, forwarding to service', { userId: payload.sub });
    } else if (cachedUser.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        message: 'Conta inativa',
      });
      return;
    }

    // Add user info to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', error as Error);
    
    res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticação requerida',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Permissão insuficiente',
      });
      return;
    }

    next();
  };
};

export const requireProfessional = requireRole([UserRole.PROFESSIONAL, UserRole.ADMIN]);
export const requireAdmin = requireRole([UserRole.ADMIN]);