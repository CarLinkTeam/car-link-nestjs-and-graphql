import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { RentalsModule } from 'src/rentals/rentals.module';
import { Review } from './entities/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  imports: [RentalsModule, TypeOrmModule.forFeature([Review])],
})
export class ReviewsModule {}
