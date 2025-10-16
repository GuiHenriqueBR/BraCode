import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, IsEnum, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

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

export enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING_DESC = 'rating_desc',
  DISTANCE_ASC = 'distance_asc',
  NEWEST = 'newest',
}

export class SearchServicesDto {
  @ApiProperty({
    description: 'Search query',
    example: 'hair styling',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    description: 'Service categories',
    enum: ServiceCategory,
    isArray: true,
    example: [ServiceCategory.BEAUTY],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceCategory, { each: true })
  categories?: ServiceCategory[];

  @ApiProperty({
    description: 'User latitude for location-based search',
    example: -23.5505,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @ApiProperty({
    description: 'User longitude for location-based search',
    example: -46.6333,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @ApiProperty({
    description: 'Search radius in kilometers',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseFloat(value))
  radius?: number;

  @ApiProperty({
    description: 'Minimum price',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price',
    example: 200,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  maxPrice?: number;

  @ApiProperty({
    description: 'Minimum rating',
    example: 4.0,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => parseFloat(value))
  minRating?: number;

  @ApiProperty({
    description: 'Sort by criteria',
    enum: SortBy,
    example: SortBy.RATING_DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}