import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
  ) {}

  async register(registerDto: any) {
    return firstValueFrom(this.authClient.send('register', registerDto));
  }

  async login(loginDto: any) {
    return firstValueFrom(this.authClient.send('login', loginDto));
  }

  async refreshToken(refreshToken: string) {
    return firstValueFrom(this.authClient.send('refresh-token', { refreshToken }));
  }

  async logout(user: any) {
    return firstValueFrom(this.authClient.send('logout', user));
  }

  async forgotPassword(email: string) {
    return firstValueFrom(this.authClient.send('forgot-password', { email }));
  }

  async resetPassword(resetPasswordDto: any) {
    return firstValueFrom(this.authClient.send('reset-password', resetPasswordDto));
  }

  async verifyEmail(token: string) {
    return firstValueFrom(this.authClient.send('verify-email', { token }));
  }

  async googleLogin(user: any) {
    return firstValueFrom(this.authClient.send('google-login', user));
  }

  async facebookLogin(user: any) {
    return firstValueFrom(this.authClient.send('facebook-login', user));
  }

  async getProfile(user: any) {
    return firstValueFrom(this.authClient.send('get-profile', user));
  }
}