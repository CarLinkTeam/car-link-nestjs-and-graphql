import { IsDate, IsInt, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  rating: number;

  @IsString()
  comment: string;

  @IsDate()
  createdAt: Date;

  @IsString()
  rental_id: string;
}
