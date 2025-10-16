// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

// Professional Types
export interface Professional {
  id: string;
  userId: string;
  bio?: string;
  experience?: string;
  hourlyRate?: number;
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  responseTime?: number;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Service Types
export interface Service {
  id: string;
  professionalId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking Types
export interface Booking {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  addressId?: string;
  scheduledAt: Date;
  duration: number;
  totalAmount: number;
  status: BookingStatus;
  notes?: string;
  cancelReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  professionalAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentId?: string;
  stripeTransferId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  authorId: string;
  targetId: string;
  rating: number;
  comment?: string;
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Address Types
export interface Address {
  id: string;
  userId: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export enum NotificationType {
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NEW_REVIEW = 'NEW_REVIEW',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search Types
export interface SearchFilters {
  category?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: {
    date: string;
    time: string;
  };
  isOnline?: boolean;
}

export interface SearchResult {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  totalReviews: number;
  categories: string[];
  services: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
  distance?: number;
  isOnline: boolean;
  responseTime?: number;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  professionalId: string;
  title: string;
  description?: string;
  imageUrl: string;
  projectUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Certification Types
export interface Certification {
  id: string;
  professionalId: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  imageUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Availability Types
export interface Availability {
  id: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar Types
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface CalendarDay {
  date: Date;
  slots: TimeSlot[];
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}