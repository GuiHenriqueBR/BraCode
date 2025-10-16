import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';

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

export class CreateProfessionalProfileDto {
  @ApiProperty({
    description: 'Professional bio',
    example: 'Experienced professional with 10+ years in the field',
  })
  @IsString()
  bio: string;

  @ApiProperty({
    description: 'Professional categories',
    enum: ServiceCategory,
    isArray: true,
    example: [ServiceCategory.BEAUTY, ServiceCategory.HEALTH],
  })
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  categories: ServiceCategory[];

  @ApiProperty({
    description: 'Professional skills',
    example: ['Hair Styling', 'Makeup', 'Nail Art'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({
    description: 'Professional experience in years',
    example: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears: number;

  @ApiProperty({
    description: 'Professional certifications',
    example: ['Certified Hair Stylist', 'Professional Makeup Artist'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiProperty({
    description: 'Professional portfolio URLs',
    example: ['https://example.com/portfolio1', 'https://example.com/portfolio2'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioUrls?: string[];

  @ApiProperty({
    description: 'Professional availability',
    example: 'Monday to Friday, 9 AM to 6 PM',
  })
  @IsString()
  availability: string;

  @ApiProperty({
    description: 'Service radius in kilometers',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  serviceRadius: number;

  @ApiProperty({
    description: 'Professional website',
    example: 'https://professional-website.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    description: 'Professional social media links',
    example: {
      instagram: 'https://instagram.com/professional',
      facebook: 'https://facebook.com/professional',
    },
    required: false,
  })
  @IsOptional()
  socialMedia?: Record<string, string>;
}