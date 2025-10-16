import Redis from 'ioredis';
import { logger } from './logger';

export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error', error);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error', error as Error, { key });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error', error as Error, { key });
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', error as Error, { key });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', error as Error, { key });
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis INCR error', error as Error, { key });
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error', error as Error, { key });
      throw error;
    }
  }

  // Cache helpers
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET JSON error', error as Error, { key });
      return null;
    }
  }

  async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      await this.set(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      logger.error('Redis SET JSON error', error as Error, { key });
      throw error;
    }
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    try {
      const current = await this.incr(key);
      
      if (current === 1) {
        await this.expire(key, windowSeconds);
      }

      const ttl = await this.client.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime,
      };
    } catch (error) {
      logger.error('Redis rate limit error', error as Error, { key });
      // Allow request on Redis error
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}