import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterAuthDto {
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    fullName: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            'The password must have a Uppercase, lowercase letter and a number',
    })
    password: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    location: string;

    @IsString()
    @Matches(/^\+\d{1,3}\d{6,14}$/, {
        message: 'The phone number must start with + followed by the country code and the number without spaces',
    })
    phone: string;
}
