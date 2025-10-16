import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as avaliações' })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliações retornada com sucesso',
  })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter avaliação por ID' })
  @ApiResponse({
    status: 200,
    description: 'Avaliação retornada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Avaliação não encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}