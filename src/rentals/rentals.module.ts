import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService],
  imports: [TypeOrmModule.forFeature([Rental, User]), UsersModule],
})
export class RentalsModule {}
