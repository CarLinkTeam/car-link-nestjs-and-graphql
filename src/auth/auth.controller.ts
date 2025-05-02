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
import { User } from './entities/user.entity';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('promoteToOwner/:id')
  @Auth(ValidRoles.ADMIN, ValidRoles.TENANT)
  promoteToOwner(
    @Param('id') userId: string,
    @GetUser() requester: User
  ) {
    return this.authService.promoteUser(userId, ValidRoles.OWNER, requester);
  }
  
  @Post('promoteToAdmin/:id')
  @Auth(ValidRoles.ADMIN)
  promoteToAdmin(
    @Param('id') userId: string,
    @GetUser() requester: User
  ) {
    return this.authService.promoteUser(userId, ValidRoles.ADMIN, requester);
  }

}
