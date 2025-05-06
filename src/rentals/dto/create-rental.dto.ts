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

  @IsIn(['confirmed', 'canceled', 'pending', 'completed'])
  status: string;

  @IsUUID()
  client_id: string;

  @IsUUID()
  vehicle_id: string;
}
