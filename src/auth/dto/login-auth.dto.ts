import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, MaxLength, MinLength } from "class-validator";

@InputType()
export class LoginAuthDto {

    @Field(() => String)
    @IsEmail()
    email:string;

    @Field(() => String)
    @MinLength(6)
    @MaxLength(50)
    password:string;
}