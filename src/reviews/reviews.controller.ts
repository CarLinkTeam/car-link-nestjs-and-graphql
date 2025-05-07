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
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid review data',
  })
  @ApiResponse({ status: 404, description: 'Not found - Rental not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN, ValidRoles.OWNER)
  @ApiResponse({
    status: 200,
    description: 'List of reviews retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':term')
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN, ValidRoles.OWNER)
  @ApiResponse({ status: 200, description: 'Review found successfully' })
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
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid review data',
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
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'Not found - Review with specified ID not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
