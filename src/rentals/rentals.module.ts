import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { UsersModule } from 'src/users/users.module';
import { VehiclesModule } from 'src/vehicles/vehicles.module';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
  imports: [
    TypeOrmModule.forFeature([Rental, VehicleUnavailability]),
    UsersModule,
    VehiclesModule,
  ],
})
export class RentalsModule {}
