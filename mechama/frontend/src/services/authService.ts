import { apiService } from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  RefreshTokenResponse,
  ForgotPasswordData,
  ResetPasswordData,
  VerifyEmailData,
  User
} from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiService.post('/auth/login', credentials);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    return apiService.post('/auth/register', data);
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiService.post('/auth/refresh', { refreshToken });
  },

  async logout(): Promise<void> {
    return apiService.post('/auth/logout');
  },

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    return apiService.post('/auth/forgot-password', data);
  },

  async resetPassword(data: ResetPasswordData): Promise<void> {
    return apiService.post('/auth/reset-password', data);
  },

  async verifyEmail(data: VerifyEmailData): Promise<void> {
    return apiService.post('/auth/verify-email', data);
  },

  async getProfile(): Promise<User> {
    return apiService.get('/auth/me');
  },

  async googleLogin(): Promise<void> {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`;
  },

  async facebookLogin(): Promise<void> {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/facebook`;
  },
};