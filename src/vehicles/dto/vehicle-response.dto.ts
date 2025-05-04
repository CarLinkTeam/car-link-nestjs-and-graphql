import type { Vehicle } from '../entities/vehicle.entity';

export class VehicleResponseDto {
  id: string;
  ownerId: string;
  vehicleModel: string;
  make: string;
  color: string;
  year: number;
  license_plate: string;
  url_photos: string[];
  daily_price: number;
  rental_conditions: string;
  class?: string;
  drive?: string;
  fuel_type?: string;
  transmission?: string;
  combination_mpg?: number;
  displacement?: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(vehicle: Vehicle) {
    this.id = vehicle.id;
    this.ownerId = vehicle.ownerId;
    this.vehicleModel = vehicle.vehicleModel;
    this.make = vehicle.make;
    this.color = vehicle.color;
    this.year = vehicle.year;
    this.license_plate = vehicle.license_plate;
    this.url_photos = vehicle.url_photos;
    this.daily_price = vehicle.daily_price;
    this.rental_conditions = vehicle.rental_conditions;
    this.class = vehicle.class;
    this.drive = vehicle.drive;
    this.fuel_type = vehicle.fuel_type;
    this.transmission = vehicle.transmission;
    this.combination_mpg = vehicle.combination_mpg;
    this.displacement = vehicle.displacement;
    this.createdAt = vehicle.createdAt;
    this.updatedAt = vehicle.updatedAt;
  }
}
