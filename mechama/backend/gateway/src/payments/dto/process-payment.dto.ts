import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Payment intent ID',
    example: 'pi_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiProperty({
    description: 'Payment method ID',
    example: 'pm_1234567890',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId?: string;
}