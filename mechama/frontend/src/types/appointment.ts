export interface Appointment {
  id: string;
  serviceId: string;
  service: Service;
  professionalId: string;
  professional: Professional;
  clientId: string;
  client: User;
  scheduledAt: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  location?: string;
  videoCallLink?: string;
  paymentId?: string;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export enum AppointmentType {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  price: number;
  duration: number;
  professionalId: string;
}

export interface Professional {
  id: string;
  userId: string;
  user: User;
  bio: string;
  categories: string[];
  skills: string[];
  rating: number;
  reviewCount: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
}

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  createdAt: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
}

export interface CreateAppointmentData {
  serviceId: string;
  professionalId: string;
  scheduledAt: string;
  type: AppointmentType;
  notes?: string;
  location?: string;
}

export interface UpdateAppointmentData {
  scheduledAt?: string;
  status?: AppointmentStatus;
  notes?: string;
  location?: string;
  videoCallLink?: string;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
}

export interface ProfessionalAvailability {
  date: string;
  slots: AvailabilitySlot[];
}