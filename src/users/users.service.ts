import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({ where: { isActive: true } });
    return users.map(user => instanceToPlain(user) as User);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id, isActive: true });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return instanceToPlain(user) as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();

    return await this.usersRepository.findOne({
      where: { email: normalizedEmail, isActive: true },
      select: ['id', 'email', 'password', 'roles'],
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requester: User,
  ): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id, isActive: true });
    if (!user) throw new NotFoundException(`User with ID ${id} not found or inactive`);

    const isAdmin = requester.roles.includes(ValidRoles.ADMIN);
    const isSelf = requester.id === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException(`You are not allowed to update this user`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    await this.usersRepository.save(user);

    const updatedUser = await this.usersRepository.findOneBy({ id });
    if (!updatedUser) throw new NotFoundException(`User with ID ${id} not found after update`);

    return instanceToPlain(updatedUser) as User;
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
      throw new ForbiddenException(
        `You are not allowed to remove this user`,
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
