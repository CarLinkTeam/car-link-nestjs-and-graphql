import {
  IsDate,
  IsIn,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRentalDto {
  @IsDate()
  initialDate: Date;

  @IsDate()
  finalDate: Date;

  @IsNumber()
  @IsPositive()
  totalCost: number;

  @IsString()
  typeFuel: string;

  @IsString()
  transmission: string;

  @IsNumber()
  @IsPositive()
  cityMgp: number;

  @IsIn(['confirmed', 'canceled', 'pending', 'completed'])
  status: string;

  @IsUUID()
  client_id: string;

  @IsUUID()
  vehicle_id: string;
}
