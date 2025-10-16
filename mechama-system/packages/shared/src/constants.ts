// API Routes
export const API_ROUTES = {
  AUTH: '/auth',
  USERS: '/users',
  PROFESSIONALS: '/professionals',
  SERVICES: '/services',
  CATEGORIES: '/categories',
  BOOKINGS: '/bookings',
  PAYMENTS: '/payments',
  REVIEWS: '/reviews',
  SEARCH: '/search',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin',
} as const;

// Service Ports
export const SERVICE_PORTS = {
  API_GATEWAY: 3000,
  USER_SERVICE: 3001,
  AUTH_SERVICE: 3002,
  SEARCH_SERVICE: 3003,
  BOOKING_SERVICE: 3004,
  PAYMENT_SERVICE: 3005,
  RATING_SERVICE: 3006,
  NOTIFICATION_SERVICE: 3007,
  ADMIN_SERVICE: 3008,
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  PROFESSIONAL: (id: string) => `professional:${id}`,
  SERVICE: (id: string) => `service:${id}`,
  CATEGORY: (id: string) => `category:${id}`,
  SEARCH_RESULTS: (query: string) => `search:${query}`,
  RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
  EMAIL_VERIFICATION: (token: string) => `email_verification:${token}`,
  PASSWORD_RESET: (token: string) => `password_reset:${token}`,
  REFRESH_TOKEN: (token: string) => `refresh_token:${token}`,
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  GENERAL: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 auth attempts per 15 minutes
  SEARCH: { limit: 50, windowMs: 60 * 1000 }, // 50 searches per minute
  BOOKING: { limit: 10, windowMs: 60 * 1000 }, // 10 bookings per minute
} as const;

// Business Rules
export const BUSINESS_RULES = {
  PLATFORM_FEE_PERCENTAGE: 15, // 15% platform fee
  MIN_BOOKING_ADVANCE_HOURS: 2, // Minimum 2 hours advance booking
  MAX_BOOKING_ADVANCE_DAYS: 90, // Maximum 90 days advance booking
  CANCELLATION_WINDOW_HOURS: 24, // Can cancel up to 24 hours before
  REVIEW_WINDOW_DAYS: 30, // Can review up to 30 days after service
  MIN_SERVICE_DURATION: 30, // Minimum 30 minutes service
  MAX_SERVICE_DURATION: 480, // Maximum 8 hours service
  MIN_HOURLY_RATE: 20, // Minimum R$ 20/hour
  MAX_HOURLY_RATE: 500, // Maximum R$ 500/hour
} as const;

// File Upload
export const UPLOAD_LIMITS = {
  AVATAR: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  PORTFOLIO: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  CERTIFICATION: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
} as const;

// Notification Types
export const NOTIFICATION_TEMPLATES = {
  BOOKING_REQUEST: {
    title: 'Nova solicitação de agendamento',
    message: 'Você recebeu uma nova solicitação de agendamento',
  },
  BOOKING_CONFIRMED: {
    title: 'Agendamento confirmado',
    message: 'Seu agendamento foi confirmado',
  },
  BOOKING_CANCELLED: {
    title: 'Agendamento cancelado',
    message: 'Um agendamento foi cancelado',
  },
  PAYMENT_RECEIVED: {
    title: 'Pagamento recebido',
    message: 'Você recebeu um pagamento',
  },
  NEW_REVIEW: {
    title: 'Nova avaliação',
    message: 'Você recebeu uma nova avaliação',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso negado',
  NOT_FOUND: 'Recurso não encontrado',
  VALIDATION_ERROR: 'Erro de validação',
  INTERNAL_ERROR: 'Erro interno do servidor',
  RATE_LIMIT_EXCEEDED: 'Muitas tentativas. Tente novamente mais tarde',
  EMAIL_ALREADY_EXISTS: 'Email já está em uso',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  EMAIL_NOT_VERIFIED: 'Email não verificado',
  BOOKING_CONFLICT: 'Conflito de agendamento',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  PAYMENT_FAILED: 'Falha no pagamento',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'Usuário criado com sucesso',
  EMAIL_VERIFIED: 'Email verificado com sucesso',
  PASSWORD_RESET: 'Senha redefinida com sucesso',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso',
  BOOKING_CREATED: 'Agendamento criado com sucesso',
  PAYMENT_PROCESSED: 'Pagamento processado com sucesso',
  REVIEW_SUBMITTED: 'Avaliação enviada com sucesso',
} as const;