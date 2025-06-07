import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";

@ObjectType()
export class AuthReponse{

    @Field(() => User)
    user: User;

    @Field(() => String)
    token: string;
}