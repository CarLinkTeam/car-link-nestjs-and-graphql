import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Review } from './entities/review.entity';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(AuthGuard('jwt'))
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}
  @Post()
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: Review,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid review data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a tenant or admin',
  })
  @ApiResponse({ status: 404, description: 'Not found - Rental not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }
  @Get()
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN, ValidRoles.OWNER)
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({
    status: 200,
    description: 'List of reviews retrieved successfully',
    type: [Review],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll() {
    return this.reviewsService.findAll();
  }
  @Get(':term')
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN, ValidRoles.OWNER)
  @ApiOperation({ summary: 'Get a review by ID or term' })
  @ApiResponse({
    status: 200,
    description: 'Review found successfully',
    type: Review,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Review with specified ID or term not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(@Param('term') term: string) {
    return this.reviewsService.findOne(term);
  }
  @Patch(':id')
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: Review,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid review data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not authorized to update this review',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Review or rental not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not authorized to delete this review',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Review with specified ID not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }

  @Get('vehicle/:vehicleId')
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN, ValidRoles.OWNER)
  @ApiOperation({ summary: 'Get all reviews for a specific vehicle' })
  @ApiResponse({
    status: 200,
    description: 'List of reviews for the vehicle retrieved successfully',
    type: [Review],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - No reviews found for the specified vehicle',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.reviewsService.findByVehicle(vehicleId);
  }
}
