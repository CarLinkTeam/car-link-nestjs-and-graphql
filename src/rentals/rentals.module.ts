import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { AuthModule } from '../auth/auth.module';
import { Review } from 'src/reviews/entities/review.entity';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
  imports: [
    TypeOrmModule.forFeature([Rental, VehicleUnavailability, Review]),
    UsersModule,
    VehiclesModule,
    AuthModule,
  ],
})
export class RentalsModule {}
