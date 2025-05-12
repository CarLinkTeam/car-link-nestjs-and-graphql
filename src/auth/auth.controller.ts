import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Auth } from './decorators/auth.decorator';
import { ValidRoles } from './enums/valid-roles.enum';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'User registry' })
  @ApiResponse({ status: 201, description: 'Usuario registered successfully', type: RegisterAuthDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiBody({
    description: 'User registration payload',
    type: RegisterAuthDto,
    examples: {
      example1: {
        summary: 'Basic registration',
        value: {
          fullName: 'John Doe',
          password: 'Password123!',
          email: 'john.doe@example.com',
          location: 'New York',
          phone: '+12345678901'
        }
      }
    }
  })
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successfully', type: LoginAuthDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBody({
    description: 'User login credentials',
    type: LoginAuthDto,
    examples: {
      example1: {
        summary: 'Basic login',
        value: {
          email: 'john.doe@example.com',
          password: 'Password123!'
        }
      }
    }
  })
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('promoteToOwner/:id')
  @Auth(ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promover to OWNER role' })
  @ApiParam({ name: 'id', description: 'ID user to promove' })
  @ApiResponse({ status: 201, description: 'User promoved to OWNER role' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'User without permissions' })
  promoteToOwner(
    @Param('id') userId: string,
    @GetUser() requester: User
  ) {
    return this.authService.promoteUser(userId, ValidRoles.OWNER, requester);
  }

  @Post('promoteToAdmin/:id')
  @Auth(ValidRoles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promover to ADMIN role' })
  @ApiParam({ name: 'id', description: 'ID user to promove' })
  @ApiResponse({ status: 201, description: 'User promoved to OWNER role' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'User without permissions' })
  promoteToAdmin(
    @Param('id') userId: string,
    @GetUser() requester: User
  ) {
    return this.authService.promoteUser(userId, ValidRoles.ADMIN, requester);
  }

}
