import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'John Doe',
        location: 'Location',
        phone: '+1234567890',
      };
      const savedUser = {
        ...createUserDto,
        id: 'some-uuid',
        isActive: true,
        roles: ['TENANT'],
      };

      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(savedUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(savedUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of active users', async () => {
      const usersArray = [
        { id: '1', email: 'test1@example.com', isActive: true },
        { id: '2', email: 'test2@example.com', isActive: true },
      ];

      mockUserRepository.find.mockResolvedValue(usersArray);

      const result = await service.findAll();

      expect(result).toEqual(usersArray);
      expect(mockUserRepository.find).toHaveBeenCalledWith({ where: { isActive: true } });
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const user = { id: 'some-uuid', email: 'test@example.com', isActive: true };
      mockUserRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findById('some-uuid');

      expect(result).toEqual(user);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 'some-uuid', isActive: true });
    });

    it('should throw a NotFoundException if user not found', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email found', async () => {
      const user = { id: 'some-uuid', email: 'test@example.com', isActive: true };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', isActive: true },
        select: ['id', 'email', 'password', 'roles'],
      });
    });
  });

  describe('update', () => {
    it('should update the user successfully', async () => {
      const updateUserDto = { fullName: 'Updated Name', phone: '+1234567890' };
      const user = {
        id: 'some-uuid',
        email: 'test@example.com',
        isActive: true,
        roles: ['TENANT'],
        ...updateUserDto,
      };
      const requester = { id: 'some-uuid', roles: ['TENANT'] } as User;

      mockUserRepository.findOneBy.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.update('some-uuid', updateUserDto, requester);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        id: 'some-uuid',
        isActive: true,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException if user is not admin or updating self', async () => {
      const updateUserDto = { fullName: 'Updated Name' };
      const user = { id: 'some-uuid', email: 'test@example.com', isActive: true };
      const requester = { id: 'different-id', roles: ['TENANT'] } as User;

      mockUserRepository.findOneBy.mockResolvedValue(user);

      await expect(service.update('some-uuid', updateUserDto, requester)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('remove', () => {
    it('should deactivate the user successfully', async () => {
      const user = { id: 'some-uuid', email: 'test@example.com', isActive: true };
      const requester = { id: 'some-uuid', roles: ['TENANT'] } as User;

      mockUserRepository.findOneBy.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.remove('some-uuid', requester);

      expect(result).toEqual({ message: 'User with ID some-uuid has been deactivated' });
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        id: 'some-uuid',
        isActive: true,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...user, isActive: false });
    });

    it('should throw UnauthorizedException if not admin or self', async () => {
      const user = { id: 'some-uuid', email: 'test@example.com', isActive: true };
      const requester = { id: 'different-id', roles: ['TENANT'] } as User;

      mockUserRepository.findOneBy.mockResolvedValue(user);

      await expect(service.remove('some-uuid', requester)).rejects.toThrow(UnauthorizedException);
    });
  });
});
