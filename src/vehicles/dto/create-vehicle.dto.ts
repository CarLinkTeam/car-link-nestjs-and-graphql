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
import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class CreateVehicleDto {
  @ApiProperty({
    description: 'The model of the vehicle',
    example: 'Corolla',
  })
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  vehicleModel: string;

  @ApiProperty({
    description: 'The make/brand of the vehicle',
    example: 'Toyota',
  })
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  make: string;

  @ApiProperty({
    description: 'The color of the vehicle',
    example: 'Red',
  })
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
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
  @Field(() => Int)
  year: number;

  @ApiProperty({
    description: 'The license plate of the vehicle (unique)',
    example: 'ABC-123',
  })
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
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
  @Field(() => [String])
  url_photos: string[];

  @ApiProperty({
    description: 'Daily rental price of the vehicle',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive({ message: 'daily_price must be a positive number' })
  @Field(() => Float)
  daily_price: number;

  @ApiProperty({
    description: 'Rental conditions and rules',
    example: 'No smoking. Pets allowed with additional fee.',
  })
  @IsString()
  @Field(() => String)
  rental_conditions: string;

  @ApiProperty({
    description: 'Vehicle class/category',
    example: 'Sedan',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  class?: string;

  @ApiProperty({
    description: 'Drive type (FWD, RWD, AWD)',
    example: 'FWD',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  drive?: string;

  @ApiProperty({
    description: 'Fuel type',
    example: 'Gasoline',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  fuel_type?: string;

  @ApiProperty({
    description: 'Transmission type',
    example: 'Automatic',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  transmission?: string;
}
