import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE') private notificationsClient: ClientProxy,
  ) {}

  async getNotifications(userId: string, page: number, limit: number, unreadOnly: boolean) {
    return firstValueFrom(this.notificationsClient.send('get-notifications', { userId, page, limit, unreadOnly }));
  }

  async getNotification(userId: string, notificationId: string) {
    return firstValueFrom(this.notificationsClient.send('get-notification', { userId, notificationId }));
  }

  async markAsRead(userId: string, notificationId: string) {
    return firstValueFrom(this.notificationsClient.send('mark-as-read', { userId, notificationId }));
  }

  async markAllAsRead(userId: string) {
    return firstValueFrom(this.notificationsClient.send('mark-all-read', { userId }));
  }

  async deleteNotification(userId: string, notificationId: string) {
    return firstValueFrom(this.notificationsClient.send('delete-notification', { userId, notificationId }));
  }

  async getPreferences(userId: string) {
    return firstValueFrom(this.notificationsClient.send('get-preferences', { userId }));
  }

  async updatePreferences(userId: string, preferencesDto: any) {
    return firstValueFrom(this.notificationsClient.send('update-preferences', { userId, ...preferencesDto }));
  }
}