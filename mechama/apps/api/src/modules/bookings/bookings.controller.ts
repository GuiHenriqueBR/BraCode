import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os agendamentos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de agendamentos retornada com sucesso',
  })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter agendamento por ID' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento retornado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Agendamento não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }
}