import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleUnavailability } from './entities/vehicle-unavailability.entity';
import { AuthModule } from '../auth/auth.module';
import { VehicleResolver } from './vehicles.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehicleUnavailability]),
    HttpModule,
    ConfigModule,
    AuthModule,
  ],
  controllers: [],
  providers: [VehicleResolver, VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
