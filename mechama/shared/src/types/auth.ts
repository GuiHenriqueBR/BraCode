import { z } from 'zod';

export enum UserRole {
  CLIENT = 'client',
  PROFESSIONAL = 'professional',
  ADMIN = 'admin',
}

export const UserRoleSchema = z.nativeEnum(UserRole);

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  role: UserRoleSchema,
  isVerified: z.boolean(),
  avatar: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  acceptTerms: boolean;
}

export const RegisterDataSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  role: UserRoleSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});