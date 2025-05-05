import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN, ValidRoles.OWNER)
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':term')
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN, ValidRoles.OWNER)
  findOne(@Param('term') term: string) {
    return this.reviewsService.findOne(term);
  }

  @Patch(':id')
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
