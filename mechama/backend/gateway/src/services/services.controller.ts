import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { SearchServicesDto } from './dto/search-services.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for services and professionals' })
  @ApiResponse({ status: 200, description: 'Services found successfully' })
  async searchServices(@Query() searchServicesDto: SearchServicesDto) {
    return this.servicesService.searchServices(searchServicesDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all service categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.servicesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  async getService(@Param('id') id: string) {
    return this.servicesService.getService(id);
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Get professional profile' })
  @ApiResponse({ status: 200, description: 'Professional profile retrieved successfully' })
  async getProfessional(@Param('professionalId') professionalId: string) {
    return this.servicesService.getProfessional(professionalId);
  }

  @Get('professional/:professionalId/services')
  @ApiOperation({ summary: 'Get services by professional' })
  @ApiResponse({ status: 200, description: 'Professional services retrieved successfully' })
  async getProfessionalServices(@Param('professionalId') professionalId: string) {
    return this.servicesService.getProfessionalServices(professionalId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async createService(@Req() req: any, @Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.createService(req.user.userId, createServiceDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  async updateService(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.updateService(req.user.userId, id, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  async deleteService(@Req() req: any, @Param('id') id: string) {
    return this.servicesService.deleteService(req.user.userId, id);
  }
}