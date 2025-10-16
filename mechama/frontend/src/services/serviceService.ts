import { apiService } from './api';
import { Service, Professional, SearchFilters, SearchResults, ServiceCategory } from '@/types/service';

export const serviceService = {
  async searchServices(filters: SearchFilters): Promise<SearchResults> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('query', filters.query);
    if (filters.categories?.length) {
      filters.categories.forEach(category => params.append('categories', category));
    }
    if (filters.latitude) params.append('latitude', filters.latitude.toString());
    if (filters.longitude) params.append('longitude', filters.longitude.toString());
    if (filters.radius) params.append('radius', filters.radius.toString());
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return apiService.get(`/services/search?${params.toString()}`);
  },

  async getCategories(): Promise<ServiceCategory[]> {
    return apiService.get('/services/categories');
  },

  async getService(id: string): Promise<Service> {
    return apiService.get(`/services/${id}`);
  },

  async getProfessional(id: string): Promise<Professional> {
    return apiService.get(`/services/professional/${id}`);
  },

  async getProfessionalServices(professionalId: string): Promise<Service[]> {
    return apiService.get(`/services/professional/${professionalId}/services`);
  },

  async createService(data: Partial<Service>): Promise<Service> {
    return apiService.post('/services', data);
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    return apiService.put(`/services/${id}`, data);
  },

  async deleteService(id: string): Promise<void> {
    return apiService.delete(`/services/${id}`);
  },
};