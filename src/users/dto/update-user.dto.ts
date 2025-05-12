import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+12345678901',
    description: 'Phone number in international format',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+\d{1,3}\d{6,14}$/, {
    message: 'The phone number must start with + followed by the country code and the number without spaces',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'New York',
    description: 'User location',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: 'NewPassword123!',
    description:
      'New password (must include uppercase, lowercase, and a number or special character)',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have an uppercase, lowercase letter and a number',
  })
  password?: string;

}
