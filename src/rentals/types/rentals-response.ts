import { Field, ObjectType } from '@nestjs/graphql';
import { Rental } from 'src/rentals/entities/rental.entity';

@ObjectType()
export class RentalResponse {
  @Field(() => Rental)
  rental: Rental;
}

@ObjectType()
export class RentalsResponse {
  @Field(() => [Rental])
  rentals: Rental[];
}

@ObjectType()
export class RentalStatusResponse {
  @Field(() => String)
  message: string;

  @Field(() => Rental)
  rental: Rental;
}
