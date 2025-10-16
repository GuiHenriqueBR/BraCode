import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('professionals')
  @ApiOperation({ summary: 'Buscar profissionais' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profissionais encontrados',
  })
  searchProfessionals(@Query('q') query: string, @Query() filters: any) {
    return this.searchService.searchProfessionals(query, filters);
  }

  @Get('services')
  @ApiOperation({ summary: 'Buscar serviços' })
  @ApiResponse({
    status: 200,
    description: 'Lista de serviços encontrados',
  })
  searchServices(@Query('q') query: string, @Query() filters: any) {
    return this.searchService.searchServices(query, filters);
  }
}