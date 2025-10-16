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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(@Req() req: any, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.userId, createReviewDto);
  }

  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Get reviews for professional' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getProfessionalReviews(
    @Param('professionalId') professionalId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewsService.getProfessionalReviews(professionalId, page, limit);
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Get reviews for service' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getServiceReviews(
    @Param('serviceId') serviceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewsService.getServiceReviews(serviceId, page, limit);
  }

  @Get('my-reviews')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user reviews' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully' })
  async getUserReviews(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewsService.getUserReviews(req.user.userId, page, limit);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  async updateReview(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(req.user.userId, id, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteReview(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteReview(req.user.userId, id);
  }

  @Post(':id/response')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to review' })
  @ApiResponse({ status: 201, description: 'Response added successfully' })
  async respondToReview(
    @Req() req: any,
    @Param('id') id: string,
    @Body() responseDto: any,
  ) {
    return this.reviewsService.respondToReview(req.user.userId, id, responseDto);
  }
}