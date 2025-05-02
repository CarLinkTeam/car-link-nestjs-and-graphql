import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService],
  imports: [TypeOrmModule.forFeature([Rental, User]), AuthModule],
})
export class RentalsModule {}
