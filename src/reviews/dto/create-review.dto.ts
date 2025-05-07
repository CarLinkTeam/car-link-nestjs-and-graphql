import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsInt()
  rating: number;

  @ApiProperty()
  @IsString()
  comment: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsString()
  rental_id: string;
}
