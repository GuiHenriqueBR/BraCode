# MeChama - Autenticação e Segurança

## Índice
1. [Estratégia de Autenticação](#estratégia-de-autenticação)
2. [Autorização e RBAC](#autorização-e-rbac)
3. [Segurança de Senhas](#segurança-de-senhas)
4. [OAuth 2.0](#oauth-20)
5. [2FA (Two-Factor Authentication)](#2fa-two-factor-authentication)
6. [Session Management](#session-management)
7. [OWASP Top 10](#owasp-top-10)
8. [LGPD Compliance](#lgpd-compliance)
9. [API Security](#api-security)
10. [PCI DSS](#pci-dss)

---

## Estratégia de Autenticação

### JWT (JSON Web Token)

**Estrutura de Tokens**:

```typescript
// Access Token (curta duração)
interface AccessTokenPayload {
  sub: string;              // User ID
  email: string;
  role: UserRole;           // CUSTOMER | PROFESSIONAL | ADMIN
  permissions: string[];
  type: 'access';
  iat: number;              // Issued at
  exp: number;              // Expires at (15 min)
}

// Refresh Token (longa duração)
interface RefreshTokenPayload {
  sub: string;              // User ID
  tokenId: string;          // Unique token ID
  type: 'refresh';
  iat: number;
  exp: number;              // Expires at (7 days)
}
```

**Configuração**:

```typescript
// config/jwt.config.ts
export const jwtConfig = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256' as const
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256' as const
  }
};
```

**Implementação**:

```typescript
// services/auth/jwt.service.ts
import * as jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/jwt.config';

export class JwtService {
  generateAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user.role),
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60
    };

    return jwt.sign(payload, jwtConfig.access.secret, {
      algorithm: jwtConfig.access.algorithm
    });
  }

  generateRefreshToken(user: User): string {
    const tokenId = uuidv4();
    
    const payload: RefreshTokenPayload = {
      sub: user.id,
      tokenId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    };

    // Store token ID in Redis for validation
    this.storeRefreshToken(user.id, tokenId, payload.exp);

    return jwt.sign(payload, jwtConfig.refresh.secret, {
      algorithm: jwtConfig.refresh.algorithm
    });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = jwt.verify(token, jwtConfig.access.secret) as AccessTokenPayload;
      
      // Check if token is blacklisted
      const isBlacklisted = await this.redis.exists(`jwt:blacklist:${payload.sub}:${payload.iat}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, jwtConfig.refresh.secret) as RefreshTokenPayload;
      
      // Validate token ID exists in Redis
      const exists = await this.redis.exists(`refresh:${payload.sub}:${payload.tokenId}`);
      if (!exists) {
        throw new UnauthorizedException('Token revoked or invalid');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}:${tokenId}`);
  }

  async blacklistAccessToken(userId: string, iat: number, exp: number): Promise<void> {
    const ttl = exp - Math.floor(Date.now() / 1000);
    await this.redis.setex(`jwt:blacklist:${userId}:${iat}`, ttl, '1');
  }

  private async storeRefreshToken(userId: string, tokenId: string, exp: number): Promise<void> {
    const ttl = exp - Math.floor(Date.now() / 1000);
    await this.redis.setex(`refresh:${userId}:${tokenId}`, ttl, '1');
  }

  private getUserPermissions(role: UserRole): string[] {
    const permissions = {
      CUSTOMER: [
        'bookings:create',
        'bookings:read:own',
        'bookings:cancel:own',
        'reviews:create',
        'reviews:read',
        'payments:read:own',
        'profile:read:own',
        'profile:write:own'
      ],
      PROFESSIONAL: [
        'bookings:read:assigned',
        'bookings:confirm',
        'bookings:complete',
        'bookings:cancel:assigned',
        'reviews:read',
        'reviews:respond',
        'services:manage',
        'calendar:manage',
        'payments:read:own',
        'payouts:request',
        'profile:read:own',
        'profile:write:own'
      ],
      ADMIN: [
        '*:*' // All permissions
      ],
      SUPER_ADMIN: [
        '*:*'
      ]
    };

    return permissions[role] || [];
  }
}
```

---

## Autorização e RBAC

### Role-Based Access Control

**Roles**:

```typescript
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}
```

**Permission Pattern**: `resource:action[:scope]`

**Exemplos**:
- `bookings:create` - Criar agendamento
- `bookings:read:own` - Ver apenas próprios agendamentos
- `bookings:read:all` - Ver todos agendamentos
- `users:suspend` - Suspender usuários
- `*:*` - Todas permissões (admin)

**Guards**:

```typescript
// guards/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@/services/auth/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin bypass
    if (user.permissions.includes('*:*')) {
      return true;
    }

    // Check permissions
    return requiredPermissions.some(permission => 
      user.permissions.includes(permission)
    );
  }
}

// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.includes(user.role);
  }
}
```

**Decorators**:

```typescript
// decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

export const RequireRoles = (...roles: UserRole[]) =>
  SetMetadata('roles', roles);

// decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
```

**Uso**:

```typescript
// controllers/bookings.controller.ts
@Controller('bookings')
@UseGuards(AuthGuard, PermissionsGuard)
export class BookingsController {
  @Post()
  @RequirePermissions('bookings:create')
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateBookingDto
  ) {
    return this.bookingsService.create(user.sub, dto);
  }

  @Get(':id')
  @RequirePermissions('bookings:read:own', 'bookings:read:all')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string
  ) {
    // Check ownership if not admin
    if (!user.permissions.includes('bookings:read:all')) {
      await this.checkOwnership(user.sub, id);
    }
    
    return this.bookingsService.findOne(id);
  }

  @Put(':id/confirm')
  @RequireRoles(UserRole.PROFESSIONAL)
  @RequirePermissions('bookings:confirm')
  async confirm(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string
  ) {
    return this.bookingsService.confirm(user.sub, id);
  }
}
```

---

## Segurança de Senhas

### Hashing com Argon2

```typescript
// services/auth/password.service.ts
import * as argon2 from 'argon2';

export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536,      // 64 MB
    timeCost: 3,            // iterations
    parallelism: 4          // threads
  };

  async hash(password: string): Promise<string> {
    return argon2.hash(password, this.options);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async needsRehash(hash: string): Promise<boolean> {
    return argon2.needsRehash(hash, this.options);
  }
}
```

### Validação de Senha

```typescript
// validators/password.validator.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128, 'Senha deve ter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos um caractere especial');

export function validatePassword(password: string): void {
  passwordSchema.parse(password);
  
  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    throw new Error('Senha muito comum. Escolha uma senha mais segura.');
  }

  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    throw new Error('Senha não deve conter caracteres repetidos sequencialmente.');
  }
}

const COMMON_PASSWORDS = [
  '12345678', 'password', 'qwerty123', 'abc123456',
  // ... more common passwords
];
```

### Password Reset Flow

```typescript
// services/auth/password-reset.service.ts
import * as crypto from 'crypto';

export class PasswordResetService {
  async requestReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal user existence
      return;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Store hashed token in Redis (1 hour expiry)
    await this.redis.setex(
      `password:reset:${hashedToken}`,
      3600,
      user.id
    );

    // Send email
    await this.emailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const userId = await this.redis.get(`password:reset:${hashedToken}`);

    if (!userId) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    // Validate new password
    validatePassword(newPassword);

    // Hash password
    const passwordHash = await this.passwordService.hash(newPassword);

    // Update user
    await this.usersService.updatePassword(userId, passwordHash);

    // Delete reset token
    await this.redis.del(`password:reset:${hashedToken}`);

    // Revoke all sessions
    await this.sessionService.revokeAllSessions(userId);

    // Audit log
    await this.auditLog.log({
      userId,
      action: 'PASSWORD_RESET',
      timestamp: new Date()
    });
  }
}
```

---

## OAuth 2.0

### Google OAuth

```typescript
// services/auth/oauth/google.service.ts
import { OAuth2Client } from 'google-auth-library';

export class GoogleOAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    });
  }

  async authenticate(code: string): Promise<User> {
    // Exchange code for tokens
    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);

    // Get user info
    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload()!;

    // Find or create user
    let user = await this.usersService.findByOAuth('GOOGLE', payload.sub);

    if (!user) {
      user = await this.usersService.create({
        email: payload.email!,
        emailVerified: payload.email_verified,
        authProvider: 'GOOGLE',
        oauthId: payload.sub,
        profile: {
          fullName: payload.name!,
          avatarUrl: payload.picture
        }
      });
    }

    return user;
  }

  getAuthUrl(): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent'
    });
  }
}
```

### Facebook OAuth

```typescript
// services/auth/oauth/facebook.service.ts
import axios from 'axios';

export class FacebookOAuthService {
  private readonly apiVersion = 'v18.0';
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  async authenticate(accessToken: string): Promise<User> {
    // Verify token
    const appToken = await this.getAppAccessToken();
    const debugResponse = await axios.get(
      `${this.baseUrl}/debug_token`,
      {
        params: {
          input_token: accessToken,
          access_token: appToken
        }
      }
    );

    if (!debugResponse.data.data.is_valid) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    // Get user info
    const userResponse = await axios.get(
      `${this.baseUrl}/me`,
      {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken
        }
      }
    );

    const fbUser = userResponse.data;

    // Find or create user
    let user = await this.usersService.findByOAuth('FACEBOOK', fbUser.id);

    if (!user) {
      user = await this.usersService.create({
        email: fbUser.email,
        emailVerified: true, // Facebook verifies emails
        authProvider: 'FACEBOOK',
        oauthId: fbUser.id,
        profile: {
          fullName: fbUser.name,
          avatarUrl: fbUser.picture?.data?.url
        }
      });
    }

    return user;
  }

  private async getAppAccessToken(): Promise<string> {
    const cached = await this.redis.get('facebook:app_token');
    if (cached) return cached;

    const response = await axios.get(
      `${this.baseUrl}/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          grant_type: 'client_credentials'
        }
      }
    );

    const token = response.data.access_token;
    await this.redis.setex('facebook:app_token', 3600, token);

    return token;
  }
}
```

---

## 2FA (Two-Factor Authentication)

### TOTP Implementation

```typescript
// services/auth/totp.service.ts
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export class TotpService {
  async generateSecret(userId: string, email: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `MeChama (${email})`,
      issuer: 'MeChama'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex')
    );

    // Store encrypted secret (not enabled yet)
    await this.redis.setex(
      `2fa:setup:${userId}`,
      600, // 10 min
      JSON.stringify({
        secret: this.encrypt(secret.base32),
        backupCodes: backupCodes.map(this.hashBackupCode)
      })
    );

    return {
      secret: secret.base32,
      qrCode,
      backupCodes
    };
  }

  async enable(userId: string, code: string): Promise<void> {
    const data = await this.redis.get(`2fa:setup:${userId}`);
    
    if (!data) {
      throw new BadRequestException('2FA setup expired');
    }

    const { secret, backupCodes } = JSON.parse(data);
    const decryptedSecret = this.decrypt(secret);

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1 // Allow 1 time step tolerance
    });

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    // Save to database
    await this.usersService.update(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret // Already encrypted
    });

    // Save backup codes
    await this.saveBackupCodes(userId, backupCodes);

    // Clean setup data
    await this.redis.del(`2fa:setup:${userId}`);
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    const secret = this.decrypt(user.twoFactorSecret);

    // Try TOTP code
    const isValidTotp = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (isValidTotp) {
      return true;
    }

    // Try backup code
    const isValidBackup = await this.verifyBackupCode(userId, code);
    
    if (isValidBackup) {
      // Remove used backup code
      await this.removeBackupCode(userId, code);
      return true;
    }

    return false;
  }

  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
      crypto.randomBytes(16)
    );
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: cipher.iv.toString('hex'),
      data: encrypted.toString('hex'),
      tag: authTag.toString('hex')
    });
  }

  private decrypt(encrypted: string): string {
    const { iv, data, tag } = JSON.parse(encrypted);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'hex')),
      decipher.final()
    ]).toString('utf8');
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private async saveBackupCodes(userId: string, codes: string[]): Promise<void> {
    await this.redis.setex(
      `2fa:backup:${userId}`,
      365 * 24 * 60 * 60, // 1 year
      JSON.stringify(codes)
    );
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const data = await this.redis.get(`2fa:backup:${userId}`);
    if (!data) return false;

    const codes = JSON.parse(data);
    const hashedCode = this.hashBackupCode(code);

    return codes.includes(hashedCode);
  }

  private async removeBackupCode(userId: string, code: string): Promise<void> {
    const data = await this.redis.get(`2fa:backup:${userId}`);
    if (!data) return;

    const codes = JSON.parse(data);
    const hashedCode = this.hashBackupCode(code);
    const filtered = codes.filter((c: string) => c !== hashedCode);

    await this.redis.setex(
      `2fa:backup:${userId}`,
      365 * 24 * 60 * 60,
      JSON.stringify(filtered)
    );
  }
}
```

---

## Session Management

### Session Tracking

```typescript
// services/auth/session.service.ts
export class SessionService {
  async createSession(userId: string, deviceInfo: DeviceInfo): Promise<void> {
    const sessionId = uuidv4();
    
    const session = {
      userId,
      sessionId,
      deviceInfo,
      ipAddress: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Store in Redis (7 days)
    await this.redis.setex(
      `session:${sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify(session)
    );

    // Add to user's session set
    await this.redis.sadd(`user:sessions:${userId}`, sessionId);
  }

  async updateActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (session) {
      session.lastActivity = new Date();
      await this.redis.setex(
        `session:${sessionId}`,
        7 * 24 * 60 * 60,
        JSON.stringify(session)
      );
    }
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);
    
    const sessions = await Promise.all(
      sessionIds.map(id => this.getSession(id))
    );

    return sessions.filter(Boolean) as Session[];
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (session) {
      await this.redis.del(`session:${sessionId}`);
      await this.redis.srem(`user:sessions:${session.userId}`, sessionId);
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);
    
    await Promise.all(
      sessionIds.map(id => this.redis.del(`session:${id}`))
    );

    await this.redis.del(`user:sessions:${userId}`);
  }

  private async getSession(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

---

## OWASP Top 10

### 1. Injection (SQL, NoSQL, Command)

**Prevenção**:

```typescript
// ✅ CORRETO: Prepared statements (TypeORM)
const user = await this.userRepository.findOne({
  where: { email: userInput }
});

// ❌ ERRADO: String concatenation
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// ✅ CORRETO: Input validation (Zod)
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100)
});

const validated = schema.parse(userInput);
```

### 2. Broken Authentication

**Mitigações**:
- JWT com expiração curta
- Refresh token rotation
- 2FA opcional
- Bcrypt/Argon2 para senhas
- Rate limiting em login
- Account lockout após falhas

```typescript
// Rate limiting
@Throttle(5, 60) // 5 tentativas por minuto
@Post('login')
async login(@Body() dto: LoginDto) {
  // ...
}

// Account lockout
async login(email: string, password: string) {
  const attempts = await this.redis.get(`login:attempts:${email}`);
  
  if (attempts && parseInt(attempts) >= 5) {
    throw new TooManyRequestsException('Conta bloqueada. Tente novamente em 15 minutos.');
  }

  // ... authenticate
  
  if (!valid) {
    await this.redis.incr(`login:attempts:${email}`);
    await this.redis.expire(`login:attempts:${email}`, 900); // 15 min
  } else {
    await this.redis.del(`login:attempts:${email}`);
  }
}
```

### 3. Sensitive Data Exposure

**Mitigações**:
- HTTPS everywhere
- Encryption at rest (AWS KMS)
- Encryption in transit (TLS 1.3)
- Hashing de senhas
- Sanitização de logs

```typescript
// Sanitize logs
class Logger {
  log(message: string, meta?: any) {
    const sanitized = this.sanitize(meta);
    winston.log('info', message, sanitized);
  }

  private sanitize(data: any): any {
    const sensitive = ['password', 'token', 'secret', 'cpf', 'creditCard'];
    
    if (typeof data === 'object') {
      const cleaned = { ...data };
      
      for (const key of sensitive) {
        if (key in cleaned) {
          cleaned[key] = '[REDACTED]';
        }
      }
      
      return cleaned;
    }
    
    return data;
  }
}
```

### 4. XSS (Cross-Site Scripting)

**Mitigações**:

```typescript
// Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.mechama.com.br'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Input sanitization
import * as DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}
```

### 5. Broken Access Control

**Mitigações**:

```typescript
// Ownership check
async checkOwnership(userId: string, resourceId: string) {
  const booking = await this.bookingsRepository.findOne(resourceId);
  
  if (booking.customerId !== userId && booking.professionalId !== userId) {
    throw new ForbiddenException('Acesso negado');
  }
  
  return booking;
}

// Resource-level authorization
@Get('bookings/:id')
async getBooking(
  @CurrentUser() user: AccessTokenPayload,
  @Param('id') id: string
) {
  const booking = await this.bookingsService.findOne(id);
  
  if (!user.permissions.includes('bookings:read:all')) {
    if (booking.customerId !== user.sub && booking.professionalId !== user.sub) {
      throw new ForbiddenException();
    }
  }
  
  return booking;
}
```

### 6. Security Misconfiguration

**Mitigações**:

```typescript
// Helmet.js
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.xssFilter());

// CORS
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Disable debug in production
if (process.env.NODE_ENV === 'production') {
  app.useLogger(false);
}
```

### 7-10. Outras Vulnerabilidades

```typescript
// 7. Insufficient Logging & Monitoring
await this.auditLog.log({
  userId: user.id,
  action: 'SENSITIVE_ACTION',
  resource: 'bookings',
  resourceId: booking.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date()
});

// 8. Insecure Deserialization
// Use Zod para validação de tipos
const schema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive()
});

const validated = schema.parse(JSON.parse(input));

// 9. Using Components with Known Vulnerabilities
// package.json scripts
{
  "scripts": {
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix"
  }
}

// 10. Insufficient Attack Protection
// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: 'Muitas requisições. Tente novamente mais tarde.'
}));
```

---

## LGPD Compliance

### Data Privacy

```typescript
// services/gdpr/data-export.service.ts
export class DataExportService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    const [user, profile, bookings, payments, reviews] = await Promise.all([
      this.usersService.findById(userId),
      this.profilesService.findByUserId(userId),
      this.bookingsService.findByUserId(userId),
      this.paymentsService.findByUserId(userId),
      this.reviewsService.findByUserId(userId)
    ]);

    return {
      personalInfo: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      },
      profile,
      bookings,
      payments: payments.map(this.anonymizePayment),
      reviews,
      exportedAt: new Date()
    };
  }

  private anonymizePayment(payment: Payment) {
    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      // Remove sensitive data
      stripePaymentIntentId: '[REDACTED]'
    };
  }
}

// services/gdpr/data-deletion.service.ts
export class DataDeletionService {
  async deleteUserData(userId: string): Promise<void> {
    // LGPD: Right to be forgotten
    
    // 1. Anonymize instead of delete (for legal/audit reasons)
    await this.usersService.update(userId, {
      email: `deleted_${userId}@deleted.com`,
      phone: null,
      deletedAt: new Date()
    });

    // 2. Remove PII from related records
    await this.bookingsRepository.update(
      { customerId: userId },
      { customerNotes: '[DELETED]' }
    );

    // 3. Delete files
    await this.s3Service.deleteUserFiles(userId);

    // 4. Clear cache
    await this.redis.del(`user:${userId}:*`);

    // 5. Audit log
    await this.auditLog.log({
      userId,
      action: 'DATA_DELETION',
      timestamp: new Date()
    });
  }
}
```

### Consent Management

```typescript
// models/user-consent.entity.ts
@Entity()
export class UserConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  consentType: 'TERMS' | 'PRIVACY' | 'MARKETING' | 'COOKIES';

  @Column()
  granted: boolean;

  @Column()
  ipAddress: string;

  @Column({ type: 'timestamptz' })
  grantedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date;
}

// Tracking consent
async grantConsent(
  userId: string,
  type: ConsentType,
  ipAddress: string
): Promise<void> {
  await this.consentRepository.save({
    userId,
    consentType: type,
    granted: true,
    ipAddress,
    grantedAt: new Date()
  });
}
```

---

## API Security

### Rate Limiting

```typescript
// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições. Tente novamente mais tarde.'
      }
    });
  }
}));

// Per-endpoint rate limit
@Throttle(5, 60) // 5 req/min
@Post('login')
async login() {}

@Throttle(10, 60) // 10 req/min
@Post('bookings')
async createBooking() {}
```

### Input Validation

```typescript
// DTOs with Zod
import { z } from 'zod';

export const createBookingSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  serviceType: z.enum(['ONLINE', 'IN_PERSON']),
  addressId: z.string().uuid().optional(),
  customerNotes: z.string().max(500).optional()
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;

// Validation pipe
@UsePipes(new ZodValidationPipe(createBookingSchema))
@Post('bookings')
async create(@Body() dto: CreateBookingDto) {
  return this.bookingsService.create(dto);
}
```

---

## PCI DSS

### Payment Security

**Princípios**:
1. **Não armazenar dados de cartão**: Usar Stripe tokenization
2. **PCI DSS Level 1**: Compliance via Stripe
3. **HTTPS obrigatório**: Todas comunicações
4. **Audit trail**: Logs de transações

```typescript
// ✅ CORRETO: Tokenização
const paymentMethod = await stripe.paymentMethods.create({
  type: 'card',
  card: {
    token: cardToken // Frontend já tokenizou
  }
});

// ❌ ERRADO: Nunca armazenar
const card = {
  number: '4242424242424242',
  cvc: '123',
  exp_month: 12,
  exp_year: 2025
};

// Salvar apenas metadata
await this.paymentMethodsRepository.save({
  userId,
  stripePaymentMethodId: paymentMethod.id,
  type: 'CREDIT_CARD',
  last4: paymentMethod.card.last4,
  brand: paymentMethod.card.brand,
  expMonth: paymentMethod.card.exp_month,
  expYear: paymentMethod.card.exp_year
});
```

---

## Conclusão

Este documento cobre:

1. **JWT** com access/refresh tokens
2. **RBAC** com guards e decorators
3. **Segurança de senhas** com Argon2
4. **OAuth 2.0** (Google, Facebook)
5. **2FA** com TOTP
6. **Session Management** com Redis
7. **OWASP Top 10** mitigations
8. **LGPD** compliance (export, deletion, consent)
9. **API Security** (rate limiting, validation)
10. **PCI DSS** via Stripe

Implementar estas práticas garante segurança robusta e compliance legal.
