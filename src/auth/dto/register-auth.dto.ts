import { InputType, Field } from "@nestjs/graphql";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class RegisterAuthDto {
    @Field(() => String, {
        description: 'Full name of the user',
        defaultValue: 'John Doe',
    })
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    fullName: string;

    @Field(() => String, {
        description: 'Password with uppercase, lowercase, and a number or special character',
        defaultValue: 'Password123!',
    })
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            'The password must have a Uppercase, lowercase letter and a number',
    })
    password: string;

    @Field(() => String, {
        description: 'User email address',
        defaultValue: 'john.doe@example.com',
    })
    @IsString()
    @IsEmail()
    email: string;

    @Field(() => String, {
        description: 'User location or city',
        defaultValue: 'New York',
    })
    @IsString()
    location: string;

    @Field(() => String, {
        description: 'Phone number with country code. Format: +[country_code][number]',
        defaultValue: '+12345678901',
    })
    @IsString()
    @Matches(/^\+\d{1,3}\d{6,14}$/, {
        message: 'The phone number must start with + followed by the country code and the number without spaces',
    })
    phone: string;
}
