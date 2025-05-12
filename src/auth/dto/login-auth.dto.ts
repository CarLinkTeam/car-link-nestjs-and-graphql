import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, MaxLength, MinLength } from "class-validator";

export class LoginAuthDto {

    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'User email address used to log in',
    })
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'User password (must be at least 6 characters)',
        minLength: 6,
        maxLength: 50,
    })
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;
}