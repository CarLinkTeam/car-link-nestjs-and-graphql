import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InputType, Field, Float, ID } from '@nestjs/graphql';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsPositive,
  IsUUID,
  IsOptional,
} from 'class-validator';

@InputType()
export class UpdateRentalDto {
  @ApiProperty({
    description: 'Start date of the rental',
    example: '2025-05-01T10:00:00Z',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @Field(() => Date, { nullable: true })
  initialDate?: Date;

  @ApiProperty({
    description: 'End date of the rental',
    example: '2025-05-08T10:00:00Z',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @Field(() => Date, { nullable: true })
  finalDate?: Date;

  @ApiProperty({
    description: 'Total cost of the rental',
    example: 350.0,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Field(() => Float, { nullable: true })
  totalCost?: number;

  @ApiProperty({
    description: 'Current status of the rental',
    example: 'confirmed',
    enum: ['confirmed', 'cancelled', 'pending', 'completed'],
    required: false,
  })
  @IsIn(['confirmed', 'cancelled', 'pending', 'completed'])
  @IsOptional()
  @Field(() => String, { nullable: true })
  status?: string;

  @ApiProperty({
    description: 'Vehicle identifier being rented',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Field(() => ID, { nullable: true })
  vehicle_id?: string;
}
