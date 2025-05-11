import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'The model of the vehicle',
    example: 'Corolla',
  })
  @IsNotEmpty()
  @IsString()
  vehicleModel: string;

  @ApiProperty({
    description: 'The make/brand of the vehicle',
    example: 'Toyota',
  })
  @IsNotEmpty()
  @IsString()
  make: string;

  @ApiProperty({
    description: 'The color of the vehicle',
    example: 'Red',
  })
  @IsNotEmpty()
  @IsString()
  color: string;

  @ApiProperty({
    description: 'The manufacturing year of the vehicle',
    example: 2022,
    minimum: 1900,
    maximum: new Date().getFullYear(),
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1900, { message: 'Year must be at least 1900' })
  @Max(new Date().getFullYear(), { message: 'year must not be a future year' })
  year: number;

  @ApiProperty({
    description: 'The license plate of the vehicle (unique)',
    example: 'ABC-123',
  })
  @IsNotEmpty()
  @IsString()
  license_plate: string;

  @ApiProperty({
    description: 'URLs of the vehicle photos',
    example: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  url_photos: string[];

  @ApiProperty({
    description: 'Daily rental price of the vehicle',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive({ message: 'daily_price must be a positive number' })
  daily_price: number;

  @ApiProperty({
    description: 'Rental conditions and rules',
    example: 'No smoking. Pets allowed with additional fee.',
  })
  @IsString()
  rental_conditions: string;

  @ApiProperty({
    description: 'Vehicle class/category',
    example: 'Sedan',
    required: false,
  })
  @IsOptional()
  @IsString()
  class?: string;

  @ApiProperty({
    description: 'Drive type (FWD, RWD, AWD)',
    example: 'FWD',
    required: false,
  })
  @IsOptional()
  @IsString()
  drive?: string;

  @ApiProperty({
    description: 'Fuel type',
    example: 'Gasoline',
    required: false,
  })
  @IsOptional()
  @IsString()
  fuel_type?: string;

  @ApiProperty({
    description: 'Transmission type',
    example: 'Automatic',
    required: false,
  })
  @IsOptional()
  @IsString()
  transmission?: string;
}
