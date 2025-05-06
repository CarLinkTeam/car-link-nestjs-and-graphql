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
  @Type(() => Date)
  @IsDate()
  initialDate: Date;

  @Type(() => Date)
  @IsDate()
  finalDate: Date;

  @IsNumber()
  @IsPositive()
  totalCost: number;

  @IsIn(['confirmed', 'canceled', 'pending', 'completed'])
  status: string;

  @IsUUID()
  client_id: string;

  @IsUUID()
  vehicle_id: string;
}
