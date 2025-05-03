import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtPayload } from './interfaces/jwt.interface';
import { ValidRoles } from './enums/valid-roles.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {

  private logger = new Logger('AuthService');

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) { }

  async register(registerDto: RegisterAuthDto) {
    const { password, ...userData } = registerDto;

    try {
      const newUser = await this.usersService.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      const { password: _, ...userWithoutPassword } = newUser;

      return {
        user: userWithoutPassword,
        token: this.getJwtToken({ id: newUser.id })
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async login(loginDto: LoginAuthDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException(`User with email ${email} not found`);

    const passwordValid = bcrypt.compareSync(password, user.password!);
    if (!passwordValid) throw new UnauthorizedException(`Email or password incorrect`);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: this.getJwtToken({ id: user.id })
    }
  }

  async promoteUser(userId: string, newRole: ValidRoles, requester: User) {
    const user = await this.usersService.findById(userId);

    const isAdmin = requester.roles.includes(ValidRoles.ADMIN);
    const isSelf = requester.id === userId;

    if (!isAdmin && !isSelf) {
      throw new UnauthorizedException(`You are not allowed to promote this user`);
    }

    if (user.roles.includes(newRole)) {
      return {
        message: `User already has role ${newRole}`,
        user: { ...user, password: undefined },
      };
    }

    user.roles.push(newRole);
    const updatedUser = await this.usersService.save(user);

    delete updatedUser.password;

    return {
      message: `User promoted to ${newRole}`,
      user: updatedUser,
    };
  }

  private getJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private handleExceptions(error: any): never {
    if (error.code === "23505") {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
