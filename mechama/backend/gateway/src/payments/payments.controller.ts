import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@ApiTags('payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createPayment(@Req() req: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(req.user.userId, createPaymentDto);
  }

  @Post('process')
  @ApiOperation({ summary: 'Process payment' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(@Req() req: any, @Body() processPaymentDto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(req.user.userId, processPaymentDto);
  }

  @Get('methods')
  @ApiOperation({ summary: 'Get payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  async getPaymentMethods(@Req() req: any) {
    return this.paymentsService.getPaymentMethods(req.user.userId);
  }

  @Post('methods')
  @ApiOperation({ summary: 'Add payment method' })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  async addPaymentMethod(@Req() req: any, @Body() paymentMethodDto: any) {
    return this.paymentsService.addPaymentMethod(req.user.userId, paymentMethodDto);
  }

  @Delete('methods/:methodId')
  @ApiOperation({ summary: 'Remove payment method' })
  @ApiResponse({ status: 200, description: 'Payment method removed successfully' })
  async removePaymentMethod(@Req() req: any, @Param('methodId') methodId: string) {
    return this.paymentsService.removePaymentMethod(req.user.userId, methodId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get payment transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.paymentsService.getTransactions(req.user.userId, page, limit);
  }

  @Get('transactions/:transactionId')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiResponse({ status: 200, description: 'Transaction details retrieved successfully' })
  async getTransaction(@Req() req: any, @Param('transactionId') transactionId: string) {
    return this.paymentsService.getTransaction(req.user.userId, transactionId);
  }

  @Post('refund/:transactionId')
  @ApiOperation({ summary: 'Request refund' })
  @ApiResponse({ status: 200, description: 'Refund requested successfully' })
  async requestRefund(@Req() req: any, @Param('transactionId') transactionId: string) {
    return this.paymentsService.requestRefund(req.user.userId, transactionId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Req() req: any) {
    return this.paymentsService.getBalance(req.user.userId);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Request withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal requested successfully' })
  async requestWithdrawal(@Req() req: any, @Body() withdrawalDto: any) {
    return this.paymentsService.requestWithdrawal(req.user.userId, withdrawalDto);
  }
}