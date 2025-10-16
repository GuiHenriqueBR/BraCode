import { z } from 'zod';
import { UserRole, PaymentMethod, BookingStatus } from '@mechama/types';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  twoFactorCode: z.string().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

// Professional validation schemas
export const professionalProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  experience: z.string().max(500).optional(),
  hourlyRate: z.number().positive().optional(),
});

export const serviceSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(3, 'Nome do serviço deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.number().positive('Preço deve ser positivo'),
  duration: z.number().positive('Duração deve ser positiva'),
  isOnline: z.boolean().default(false),
});

// Address validation schema
export const addressSchema = z.object({
  street: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro deve ter pelo menos 2 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  country: z.string().default('Brazil'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().default(false),
});

// Booking validation schema
export const bookingSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  addressId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  cancelReason: z.string().optional(),
});

// Payment validation schema
export const paymentSchema = z.object({
  bookingId: z.string().uuid(),
  method: z.nativeEnum(PaymentMethod),
  stripePaymentMethodId: z.string().optional(),
});

// Review validation schema
export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reviewResponseSchema = z.object({
  response: z.string().max(500),
});

// Search validation schema
export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    radius: z.number().positive().default(10),
  }).optional(),
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().positive(),
  }).optional(),
  rating: z.number().min(1).max(5).optional(),
  availability: z.object({
    date: z.string().date(),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  isOnline: z.boolean().optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(50).default(20),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
});

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
    }
    throw error;
  }
};

export const validatePartialSchema = <T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> => {
  try {
    return schema.partial().parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.input,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
    }
    throw error;
  }
};