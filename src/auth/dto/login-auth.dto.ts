import { IsString, IsEmail, MaxLength, MinLength } from "class-validator";

export class LoginAuthDto{
    
    @IsString()
    @IsEmail()
    email:string;
   
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;
}