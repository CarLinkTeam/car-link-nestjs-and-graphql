import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt.interface';
import { JwtService } from '@nestjs/jwt';
import { ValidRoles } from './enums/valid-roles.enum';

@Injectable()
export class AuthService {

  private logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }

  async register(createAuthDto: RegisterAuthDto) {
    const { password, ...userData } = createAuthDto;
    try {
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });
      await this.userRepository.save(user);
      delete user.password;

      return {
        user: user,
        token: this.getJwtToken({ id: user.id })
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }
    });

    if (!user) throw new UnauthorizedException(`User with email ${email} not found`);

    if (!bcrypt.compareSync(password, user.password!))
      throw new UnauthorizedException(`Email or password incorrect`)

    delete user.password;

    return {
      user: user,
      token: this.getJwtToken({ id: user.id })
    }
  }

  async promoteUser(userId: string, newRole: ValidRoles, requester: User) {
    const user = await this.userRepository.findOneBy({ id: userId });
  
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  
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
    await this.userRepository.save(user);
  
    delete user.password;
    return {
      message: `User promoted to ${newRole}`,
      user,
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleExceptions(error: any) {
    if (error.code === "23505")
      throw new BadRequestException(error.detail);

    this.logger.error(error.detail);
    throw new InternalServerErrorException('Unspected error, check your server logs');
  }

}