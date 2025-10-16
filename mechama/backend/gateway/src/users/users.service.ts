import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private usersClient: ClientProxy,
  ) {}

  async getProfile(userId: string) {
    return firstValueFrom(this.usersClient.send('get-profile', { userId }));
  }

  async updateProfile(userId: string, updateProfileDto: any) {
    return firstValueFrom(this.usersClient.send('update-profile', { userId, ...updateProfileDto }));
  }

  async createProfessionalProfile(userId: string, createProfessionalProfileDto: any) {
    return firstValueFrom(this.usersClient.send('create-professional-profile', { userId, ...createProfessionalProfileDto }));
  }

  async getProfessionalProfile(userId: string) {
    return firstValueFrom(this.usersClient.send('get-professional-profile', { userId }));
  }

  async updateProfessionalProfile(userId: string, updateProfessionalProfileDto: any) {
    return firstValueFrom(this.usersClient.send('update-professional-profile', { userId, ...updateProfessionalProfileDto }));
  }

  async getFavorites(userId: string) {
    return firstValueFrom(this.usersClient.send('get-favorites', { userId }));
  }

  async addToFavorites(userId: string, professionalId: string) {
    return firstValueFrom(this.usersClient.send('add-to-favorites', { userId, professionalId }));
  }

  async removeFromFavorites(userId: string, professionalId: string) {
    return firstValueFrom(this.usersClient.send('remove-from-favorites', { userId, professionalId }));
  }

  async getNotifications(userId: string, page: number, limit: number) {
    return firstValueFrom(this.usersClient.send('get-notifications', { userId, page, limit }));
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    return firstValueFrom(this.usersClient.send('mark-notification-read', { userId, notificationId }));
  }
}