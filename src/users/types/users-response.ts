import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@ObjectType()
export class UserResponse {
  @Field(() => User)
  user: User;
}

@ObjectType()
export class UsersResponse {
  @Field(() => [User])
  users: User[];
}

@ObjectType()
export class UserDeleteResponse {
  @Field(() => String)
  message: string;

  @Field(() => Boolean)
  success: boolean;
}
