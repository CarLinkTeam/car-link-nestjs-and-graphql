import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsResolver } from './rentals.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [RentalsService, RentalsResolver],
  exports: [RentalsService],
  imports: [
    TypeOrmModule.forFeature([Rental, VehicleUnavailability]),
    UsersModule,
    VehiclesModule,
    AuthModule,
  ],
})
export class RentalsModule {}
