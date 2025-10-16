import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '@mechama/types';

export class AuthUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateAccessToken(payload: { id: string; email: string; role: UserRole }): string {
    return jwt.sign(
      {
        sub: payload.id,
        email: payload.email,
        role: payload.role,
      },
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN,
        issuer: 'mechama-api',
        audience: 'mechama-app',
      }
    );
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId },
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        issuer: 'mechama-api',
        audience: 'mechama-app',
      }
    );
  }

  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'mechama-api',
        audience: 'mechama-app',
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static generateTwoFactorSecret(): string {
    // Generate a random 32-character secret for 2FA
    return Array.from({ length: 32 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
    ).join('');
  }

  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    return Array.from({ length }, () => 
      charset[Math.floor(Math.random() * charset.length)]
    ).join('');
  }
}