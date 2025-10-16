import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SchedulingService {
  constructor(
    @Inject('SCHEDULING_SERVICE') private schedulingClient: ClientProxy,
  ) {}

  async createAppointment(userId: string, createAppointmentDto: any) {
    return firstValueFrom(this.schedulingClient.send('create-appointment', { userId, ...createAppointmentDto }));
  }

  async getAppointments(userId: string, page: number, limit: number, status?: string) {
    return firstValueFrom(this.schedulingClient.send('get-appointments', { userId, page, limit, status }));
  }

  async getAppointment(userId: string, appointmentId: string) {
    return firstValueFrom(this.schedulingClient.send('get-appointment', { userId, appointmentId }));
  }

  async updateAppointment(userId: string, appointmentId: string, updateAppointmentDto: any) {
    return firstValueFrom(this.schedulingClient.send('update-appointment', { userId, appointmentId, ...updateAppointmentDto }));
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    return firstValueFrom(this.schedulingClient.send('cancel-appointment', { userId, appointmentId }));
  }

  async getAvailability(professionalId: string, date: string, serviceId?: string) {
    return firstValueFrom(this.schedulingClient.send('get-availability', { professionalId, date, serviceId }));
  }

  async getCalendar(userId: string, startDate: string, endDate: string) {
    return firstValueFrom(this.schedulingClient.send('get-calendar', { userId, startDate, endDate }));
  }
}