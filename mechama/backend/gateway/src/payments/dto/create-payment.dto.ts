import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, Min, IsOptional } from 'class-validator';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Service ID',
    example: 'service-123',
  })
  @IsString()
  serviceId: string;

  @ApiProperty({
    description: 'Professional ID',
    example: 'professional-123',
  })
  @IsString()
  professionalId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 150.00,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment description',
    example: 'Payment for Hair Styling service',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Client notes',
    example: 'Please arrive 10 minutes early',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}