import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthServiceGraph } from './auth.service.graph';
import { AuthReponse } from './types/auth-response.type';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthServiceGraph) { }

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
}