import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
  imports: [TypeOrmModule.forFeature([Rental]), UsersModule],
})
export class RentalsModule {}
