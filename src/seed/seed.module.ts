import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { Review } from '../reviews/entities/review.entity';
import { SeedService } from './seed.service';
import { SeedCommand } from './seed.command';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Vehicle,
      VehicleUnavailability,
      Rental,
      Review,
    ]),
  ],
  providers: [SeedService, SeedCommand],
})
export class SeedModule {}
