import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsArray } from 'class-validator';

export enum ServiceType {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
  BOTH = 'both',
}

export class UpdateServiceDto {
  @ApiProperty({
    description: 'Service title',
    example: 'Professional Hair Styling',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Professional hair styling for all occasions',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Service type',
    enum: ServiceType,
    example: ServiceType.IN_PERSON,
    required: false,
  })
  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;

  @ApiProperty({
    description: 'Service price',
    example: 150.00,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 120,
    minimum: 15,
    maximum: 480,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number;

  @ApiProperty({
    description: 'Service skills required',
    example: ['Hair Styling', 'Color Treatment', 'Hair Cutting'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({
    description: 'Service images URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Service availability',
    example: 'Monday to Friday, 9 AM to 6 PM',
    required: false,
  })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiProperty({
    description: 'Service location (for in-person services)',
    example: 'São Paulo, SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Service requirements',
    example: 'Please bring your own hair products',
    required: false,
  })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiProperty({
    description: 'Service cancellation policy',
    example: 'Free cancellation up to 24 hours before',
    required: false,
  })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiProperty({
    description: 'Service active status',
    example: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}