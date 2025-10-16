import { Request, Response, NextFunction } from 'express';
import { RedisService, logger } from '@mechama/shared';
import { RATE_LIMITS } from '@mechama/shared';

const redisService = new RedisService();

export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator ? keyGenerator(req) : `rate_limit:${req.ip}`;
      const windowSeconds = Math.floor(windowMs / 1000);
      
      const result = await redisService.checkRateLimit(key, maxRequests, windowSeconds);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          key,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
        });

        res.status(429).json({
          success: false,
          message: 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error', error as Error);
      // Allow request on error
      next();
    }
  };
};

// Specific rate limiters
export const authRateLimiter = createRateLimiter(
  RATE_LIMITS.AUTH.windowMs,
  RATE_LIMITS.AUTH.limit,
  (req) => `auth_rate_limit:${req.ip}`
);

export const searchRateLimiter = createRateLimiter(
  RATE_LIMITS.SEARCH.windowMs,
  RATE_LIMITS.SEARCH.limit,
  (req) => req.user ? `search_rate_limit:${req.user.id}` : `search_rate_limit:${req.ip}`
);

export const bookingRateLimiter = createRateLimiter(
  RATE_LIMITS.BOOKING.windowMs,
  RATE_LIMITS.BOOKING.limit,
  (req) => `booking_rate_limit:${req.user?.id || req.ip}`
);