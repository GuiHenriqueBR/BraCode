import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ProfessionalsService } from './professionals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os profissionais' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profissionais retornada com sucesso',
  })
  findAll() {
    return this.professionalsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter profissional por ID' })
  @ApiResponse({
    status: 200,
    description: 'Profissional retornado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Profissional não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }
}