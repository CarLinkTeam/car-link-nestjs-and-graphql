import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { RentalsModule } from '../rentals/rentals.module';
import { Review } from './entities/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  imports: [RentalsModule, TypeOrmModule.forFeature([Review]), AuthModule],
})
export class ReviewsModule {}
