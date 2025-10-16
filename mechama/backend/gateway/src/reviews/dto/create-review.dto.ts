import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';

export enum ReviewType {
  SERVICE = 'service',
  PROFESSIONAL = 'professional',
}

export class CreateReviewDto {
  @ApiProperty({
    description: 'Review type',
    enum: ReviewType,
    example: ReviewType.SERVICE,
  })
  @IsEnum(ReviewType)
  type: ReviewType;

  @ApiProperty({
    description: 'Service ID (if reviewing a service)',
    example: 'service-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({
    description: 'Professional ID (if reviewing a professional)',
    example: 'professional-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({
    description: 'Appointment ID',
    example: 'appointment-123',
  })
  @IsString()
  appointmentId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Excellent service, very professional!',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Review images URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  images?: string[];
}