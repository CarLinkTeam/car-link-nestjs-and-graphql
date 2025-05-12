import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterAuthDto {
    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the user',
        minLength: 4,
        maxLength: 20,
    })
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    fullName: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'Password with uppercase, lowercase, and a number or special character',
        minLength: 6,
        maxLength: 50,
    })
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            'The password must have a Uppercase, lowercase letter and a number',
    })
    password: string;

    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'User email address',
    })
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'New York',
        description: 'User location or city',
    })
    @IsString()
    location: string;

    @ApiProperty({
        example: '+12345678901',
        description:
            'Phone number with country code. Format: +[country_code][number]',
    })
    @IsString()
    @Matches(/^\+\d{1,3}\d{6,14}$/, {
        message: 'The phone number must start with + followed by the country code and the number without spaces',
    })
    phone: string;
}
