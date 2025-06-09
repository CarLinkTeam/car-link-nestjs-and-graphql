import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthService } from './auth.service'
import { AuthReponse } from './types/auth-response.type';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { GetUser } from './decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { Auth } from './decorators/auth.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Query(() => String)
  hello() {
    return 'Hello world!';
  }

  @Mutation(() => AuthReponse, { name: 'signup' })
  async signup(
    @Args('signInput') signInput: RegisterAuthDto
  ): Promise<AuthReponse> {
    return await this.authService.signup(signInput);
  }

  @Mutation(() => AuthReponse, { name: 'login' })
  async login(
    @Args('loginInput') loginInput: LoginAuthDto
  ): Promise<AuthReponse> {
    return await this.authService.login(loginInput);
  }

  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @Mutation(() => AuthReponse, { name: 'promoteToOwner' })
  async promoteToOwner(
    @GetUser() user: User,
    @Args('id') id: string
  ): Promise<AuthReponse> {
    return await this.authService.promoteUser(id, ValidRoles.OWNER, user);
  }

  @Auth(ValidRoles.ADMIN)
  @Mutation(() => AuthReponse, { name: 'promoteToAdmin' })
  async promoteToAdmin(
    @GetUser() user: User,
    @Args('id') id: string
  ): Promise<AuthReponse> {
    return await this.authService.promoteUser(id, ValidRoles.ADMIN, user);
  }
}