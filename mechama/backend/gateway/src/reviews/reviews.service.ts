import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject('REVIEWS_SERVICE') private reviewsClient: ClientProxy,
  ) {}

  async createReview(userId: string, createReviewDto: any) {
    return firstValueFrom(this.reviewsClient.send('create-review', { userId, ...createReviewDto }));
  }

  async getProfessionalReviews(professionalId: string, page: number, limit: number) {
    return firstValueFrom(this.reviewsClient.send('get-professional-reviews', { professionalId, page, limit }));
  }

  async getServiceReviews(serviceId: string, page: number, limit: number) {
    return firstValueFrom(this.reviewsClient.send('get-service-reviews', { serviceId, page, limit }));
  }

  async getUserReviews(userId: string, page: number, limit: number) {
    return firstValueFrom(this.reviewsClient.send('get-user-reviews', { userId, page, limit }));
  }

  async updateReview(userId: string, reviewId: string, updateReviewDto: any) {
    return firstValueFrom(this.reviewsClient.send('update-review', { userId, reviewId, ...updateReviewDto }));
  }

  async deleteReview(userId: string, reviewId: string) {
    return firstValueFrom(this.reviewsClient.send('delete-review', { userId, reviewId }));
  }

  async respondToReview(userId: string, reviewId: string, responseDto: any) {
    return firstValueFrom(this.reviewsClient.send('respond-to-review', { userId, reviewId, ...responseDto }));
  }
}