import {
  Controller,
  Get,
  Put,
  Post,
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
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfessionalProfileDto } from './dto/create-professional-profile.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Post('professional-profile')
  @ApiOperation({ summary: 'Create professional profile' })
  @ApiResponse({ status: 201, description: 'Professional profile created successfully' })
  async createProfessionalProfile(
    @Req() req: any,
    @Body() createProfessionalProfileDto: CreateProfessionalProfileDto,
  ) {
    return this.usersService.createProfessionalProfile(req.user.userId, createProfessionalProfileDto);
  }

  @Get('professional-profile')
  @ApiOperation({ summary: 'Get professional profile' })
  @ApiResponse({ status: 200, description: 'Professional profile retrieved successfully' })
  async getProfessionalProfile(@Req() req: any) {
    return this.usersService.getProfessionalProfile(req.user.userId);
  }

  @Put('professional-profile')
  @ApiOperation({ summary: 'Update professional profile' })
  @ApiResponse({ status: 200, description: 'Professional profile updated successfully' })
  async updateProfessionalProfile(
    @Req() req: any,
    @Body() updateProfessionalProfileDto: any,
  ) {
    return this.usersService.updateProfessionalProfile(req.user.userId, updateProfessionalProfileDto);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  async getFavorites(@Req() req: any) {
    return this.usersService.getFavorites(req.user.userId);
  }

  @Post('favorites/:professionalId')
  @ApiOperation({ summary: 'Add professional to favorites' })
  @ApiResponse({ status: 201, description: 'Professional added to favorites' })
  async addToFavorites(@Req() req: any, @Param('professionalId') professionalId: string) {
    return this.usersService.addToFavorites(req.user.userId, professionalId);
  }

  @Delete('favorites/:professionalId')
  @ApiOperation({ summary: 'Remove professional from favorites' })
  @ApiResponse({ status: 200, description: 'Professional removed from favorites' })
  async removeFromFavorites(@Req() req: any, @Param('professionalId') professionalId: string) {
    return this.usersService.removeFromFavorites(req.user.userId, professionalId);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.usersService.getNotifications(req.user.userId, page, limit);
  }

  @Put('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markNotificationAsRead(
    @Req() req: any,
    @Param('notificationId') notificationId: string,
  ) {
    return this.usersService.markNotificationAsRead(req.user.userId, notificationId);
  }
}