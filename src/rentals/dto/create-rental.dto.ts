import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRentalDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  initialDate: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  finalDate: Date;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  totalCost: number;

  @ApiProperty()
  @IsIn(['confirmed', 'cancelled', 'pending', 'completed'])
  status: string;

  @ApiProperty()
  @IsUUID()
  vehicle_id: string;
}
