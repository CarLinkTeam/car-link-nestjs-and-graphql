import { Type } from 'class-transformer';
import { IsDate, IsInt, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  rating: number;

  @IsString()
  comment: string;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @IsString()
  rental_id: string;
}
