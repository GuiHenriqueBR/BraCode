import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject('PAYMENTS_SERVICE') private paymentsClient: ClientProxy,
  ) {}

  async createPayment(userId: string, createPaymentDto: any) {
    return firstValueFrom(this.paymentsClient.send('create-payment', { userId, ...createPaymentDto }));
  }

  async processPayment(userId: string, processPaymentDto: any) {
    return firstValueFrom(this.paymentsClient.send('process-payment', { userId, ...processPaymentDto }));
  }

  async getPaymentMethods(userId: string) {
    return firstValueFrom(this.paymentsClient.send('get-payment-methods', { userId }));
  }

  async addPaymentMethod(userId: string, paymentMethodDto: any) {
    return firstValueFrom(this.paymentsClient.send('add-payment-method', { userId, ...paymentMethodDto }));
  }

  async removePaymentMethod(userId: string, methodId: string) {
    return firstValueFrom(this.paymentsClient.send('remove-payment-method', { userId, methodId }));
  }

  async getTransactions(userId: string, page: number, limit: number) {
    return firstValueFrom(this.paymentsClient.send('get-transactions', { userId, page, limit }));
  }

  async getTransaction(userId: string, transactionId: string) {
    return firstValueFrom(this.paymentsClient.send('get-transaction', { userId, transactionId }));
  }

  async requestRefund(userId: string, transactionId: string) {
    return firstValueFrom(this.paymentsClient.send('request-refund', { userId, transactionId }));
  }

  async getBalance(userId: string) {
    return firstValueFrom(this.paymentsClient.send('get-balance', { userId }));
  }

  async requestWithdrawal(userId: string, withdrawalDto: any) {
    return firstValueFrom(this.paymentsClient.send('request-withdrawal', { userId, ...withdrawalDto }));
  }
}