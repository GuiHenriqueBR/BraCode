import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum AppointmentType {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
}

export class CreateAppointmentDto {
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
    description: 'Appointment date and time',
    example: '2024-01-15T14:30:00Z',
  })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({
    description: 'Appointment type',
    enum: AppointmentType,
    example: AppointmentType.IN_PERSON,
  })
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiProperty({
    description: 'Client notes',
    example: 'Please arrive 10 minutes early',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Appointment location (for in-person appointments)',
    example: 'Rua das Flores, 123 - São Paulo, SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Video call link (for online appointments)',
    example: 'https://meet.google.com/abc-defg-hij',
    required: false,
  })
  @IsOptional()
  @IsString()
  videoCallLink?: string;
}