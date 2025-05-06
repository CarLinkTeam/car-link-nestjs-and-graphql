import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ValidRoles } from '../auth/enums/valid-roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({ where: { isActive: true } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id, isActive: true });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email, isActive: true },
      select: ['id', 'email', 'password', 'roles'],
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requester: User,
  ): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id, isActive: true });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found or inactive`);
    }

    const isAdmin = requester.roles.includes(ValidRoles.ADMIN);
    const isSelf = requester.id === id;

    if (!isAdmin && !isSelf) {
      throw new UnauthorizedException(
        `You are not allowed to promote this user`,
      );
    }

    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    await this.usersRepository.save(user);

    delete user.password;
    return user;
  }

  async remove(id: string, requester: User): Promise<{ message: string }> {
    const user = await this.usersRepository.findOneBy({ id, isActive: true });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found or already inactive`,
      );
    }

    const isAdmin = requester.roles.includes(ValidRoles.ADMIN);
    const isSelf = requester.id === id;

    if (!isAdmin && !isSelf) {
      throw new UnauthorizedException(
        `You are not allowed to promote this user`,
      );
    }

    user.isActive = false;
    await this.usersRepository.save(user);

    return { message: `User with ID ${id} has been deactivated` };
  }

  async save(user: User): Promise<User> {
    return await this.usersRepository.save(user);
  }
}
