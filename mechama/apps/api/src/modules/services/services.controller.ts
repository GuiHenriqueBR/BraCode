import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços' })
  @ApiResponse({
    status: 200,
    description: 'Lista de serviços retornada com sucesso',
  })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Listar serviços por categoria' })
  @ApiResponse({
    status: 200,
    description: 'Lista de serviços da categoria retornada com sucesso',
  })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.servicesService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter serviço por ID' })
  @ApiResponse({
    status: 200,
    description: 'Serviço retornado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Serviço não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}