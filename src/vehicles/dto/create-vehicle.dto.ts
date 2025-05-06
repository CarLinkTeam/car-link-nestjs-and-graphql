import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  vehicleModel: string;

  @IsString()
  make: string;

  @IsString()
  color: string;

  @IsNumber()
  @Min(1900)
  year: number;

  @IsString()
  license_plate: string;

  @IsArray()
  @IsString({ each: true })
  url_photos: string[];

  @IsNumber()
  @Min(0)
  daily_price: number;

  @IsString()
  rental_conditions: string;

  // External API data
  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @IsString()
  drive?: string;

  @IsOptional()
  @IsString()
  fuel_type?: string;

  @IsOptional()
  @IsString()
  transmission?: string;
}
