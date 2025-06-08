import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { IsDate, IsIn, IsNumber, IsPositive, IsUUID } from 'class-validator';

@InputType()
export class CreateRentalDto {
  @ApiProperty({
    description: 'Start date of the rental',
    example: '2025-05-01T10:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  @Field(() => Date)
  initialDate: Date;

  @ApiProperty({
    description: 'End date of the rental',
    example: '2025-05-08T10:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  @Field(() => Date)
  finalDate: Date;

  @ApiProperty({
    description: 'Total cost of the rental',
    example: 350.0,
  })
  @IsNumber()
  @IsPositive()
  @Field(() => Float)
  totalCost: number;

  @ApiProperty({
    description: 'Current status of the rental',
    example: 'pending',
    enum: ['confirmed', 'cancelled', 'pending', 'completed'],
  })
  @IsIn(['confirmed', 'cancelled', 'pending', 'completed'])
  @Field(() => String)
  status: string;

  @ApiProperty({
    description: 'Vehicle identifier being rented',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @Field(() => ID)
  vehicle_id: string;
}
