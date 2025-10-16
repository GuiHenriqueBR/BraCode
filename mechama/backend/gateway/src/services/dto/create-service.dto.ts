import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsArray } from 'class-validator';

export enum ServiceCategory {
  BEAUTY = 'beauty',
  HEALTH = 'health',
  EDUCATION = 'education',
  TECHNOLOGY = 'technology',
  HOME = 'home',
  BUSINESS = 'business',
  TRANSPORT = 'transport',
  OTHER = 'other',
}

export enum ServiceType {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
  BOTH = 'both',
}

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service title',
    example: 'Professional Hair Styling',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Professional hair styling for all occasions',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Service category',
    enum: ServiceCategory,
    example: ServiceCategory.BEAUTY,
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({
    description: 'Service type',
    enum: ServiceType,
    example: ServiceType.IN_PERSON,
  })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({
    description: 'Service price',
    example: 150.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 120,
    minimum: 15,
    maximum: 480,
  })
  @IsNumber()
  @Min(15)
  @Max(480)
  duration: number;

  @ApiProperty({
    description: 'Service skills required',
    example: ['Hair Styling', 'Color Treatment', 'Hair Cutting'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

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
  })
  @IsString()
  availability: string;

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
}