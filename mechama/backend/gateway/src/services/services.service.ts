import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ServicesService {
  constructor(
    @Inject('SERVICES_SERVICE') private servicesClient: ClientProxy,
  ) {}

  async searchServices(searchServicesDto: any) {
    return firstValueFrom(this.servicesClient.send('search-services', searchServicesDto));
  }

  async getCategories() {
    return firstValueFrom(this.servicesClient.send('get-categories', {}));
  }

  async getService(id: string) {
    return firstValueFrom(this.servicesClient.send('get-service', { id }));
  }

  async getProfessional(professionalId: string) {
    return firstValueFrom(this.servicesClient.send('get-professional', { professionalId }));
  }

  async getProfessionalServices(professionalId: string) {
    return firstValueFrom(this.servicesClient.send('get-professional-services', { professionalId }));
  }

  async createService(userId: string, createServiceDto: any) {
    return firstValueFrom(this.servicesClient.send('create-service', { userId, ...createServiceDto }));
  }

  async updateService(userId: string, serviceId: string, updateServiceDto: any) {
    return firstValueFrom(this.servicesClient.send('update-service', { userId, serviceId, ...updateServiceDto }));
  }

  async deleteService(userId: string, serviceId: string) {
    return firstValueFrom(this.servicesClient.send('delete-service', { userId, serviceId }));
  }
}