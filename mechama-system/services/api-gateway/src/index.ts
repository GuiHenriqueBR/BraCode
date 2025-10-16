import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

import { logger, RedisService } from '@mechama/shared';
import { SERVICE_PORTS, RATE_LIMITS } from '@mechama/shared';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

dotenv.config();

const app = express();
const port = process.env.PORT || SERVICE_PORTS.API_GATEWAY;
const redisService = new RedisService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
app.use(requestLogger);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.limit,
  message: 'Muitas requisições. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Service proxies with authentication
const createServiceProxy = (target: string, pathRewrite?: Record<string, string>) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onError: (err, req, res) => {
      logger.error('Proxy error', err, { url: req.url, target });
      res.status(502).json({
        success: false,
        message: 'Serviço temporariamente indisponível',
      });
    },
    onProxyReq: (proxyReq, req) => {
      // Forward user information to microservices
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
    },
  });
};

// Auth routes (no authentication required for login/register)
app.use('/api/auth', createServiceProxy(`http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`, {
  '^/api/auth': '',
}));

// Protected routes
app.use('/api/users', authMiddleware, createServiceProxy(`http://localhost:${SERVICE_PORTS.USER_SERVICE}`, {
  '^/api/users': '',
}));

app.use('/api/professionals', authMiddleware, createServiceProxy(`http://localhost:${SERVICE_PORTS.USER_SERVICE}`, {
  '^/api/professionals': '/professionals',
}));

app.use('/api/services', authMiddleware, createServiceProxy(`http://localhost:${SERVICE_PORTS.USER_SERVICE}`, {
  '^/api/services': '/services',
}));

app.use('/api/categories', createServiceProxy(`http://localhost:${SERVICE_PORTS.USER_SERVICE}`, {
  '^/api/categories': '/categories',
}));

app.use('/api/search', createServiceProxy(`http://localhost:${SERVICE_PORTS.SEARCH_SERVICE}`, {
  '^/api/search': '',
}));

app.use('/api/bookings', authMiddleware, createServiceProxy(`http://localhost:${SERVICE_PORTS.BOOKING_SERVICE}`, {
  '^/api/bookings': '',
}));

app.use('/api/payments', authMiddleware, createServiceProxy(`http://localhost:${SERVICE_PORTS.PAYMENT_SERVICE}`, {
  '^/api/payments': '',
}));

app.use('/api/reviews', authMiddleware, createServiceProxy(`http://localhost:${SERVICE_PORTS.RATING_SERVICE}`, {
  '^/api/reviews': '',
}));

app.use('/api/notifications', authMiddleware, createServiceProxy(`http://localhost:${SERVICE_PORTS.NOTIFICATION_SERVICE}`, {
  '^/api/notifications': '',
}));

// Admin routes (admin only)
app.use('/api/admin', authMiddleware, (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores.',
    });
  }
  next();
}, createServiceProxy(`http://localhost:${SERVICE_PORTS.ADMIN_SERVICE}`, {
  '^/api/admin': '',
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
  });
});

// Error handling
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    redisService.disconnect().then(() => {
      logger.info('Redis connection closed');
      process.exit(0);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const server = app.listen(port, () => {
  logger.info(`API Gateway running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;