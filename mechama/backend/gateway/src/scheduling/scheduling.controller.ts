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
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SchedulingService } from './scheduling.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('scheduling')
@Controller('scheduling')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('appointments')
  @ApiOperation({ summary: 'Create new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  async createAppointment(@Req() req: any, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.schedulingService.createAppointment(req.user.userId, createAppointmentDto);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get user appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getAppointments(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.schedulingService.getAppointments(req.user.userId, page, limit, status);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment details' })
  @ApiResponse({ status: 200, description: 'Appointment details retrieved successfully' })
  async getAppointment(@Req() req: any, @Param('id') id: string) {
    return this.schedulingService.getAppointment(req.user.userId, id);
  }

  @Put('appointments/:id')
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  async updateAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.schedulingService.updateAppointment(req.user.userId, id, updateAppointmentDto);
  }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  async cancelAppointment(@Req() req: any, @Param('id') id: string) {
    return this.schedulingService.cancelAppointment(req.user.userId, id);
  }

  @Get('availability/:professionalId')
  @ApiOperation({ summary: 'Get professional availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  async getAvailability(
    @Param('professionalId') professionalId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.schedulingService.getAvailability(professionalId, date, serviceId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get user calendar' })
  @ApiResponse({ status: 200, description: 'Calendar retrieved successfully' })
  async getCalendar(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.schedulingService.getCalendar(req.user.userId, startDate, endDate);
  }
}