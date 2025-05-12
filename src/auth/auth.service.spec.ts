import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ValidRoles } from './enums/valid-roles.enum';
import { User } from 'src/users/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    password: bcrypt.hashSync('Password123', 10),
    fullName: 'Test User',
    location: 'Earth',
    phone: '+1234567890',
    isActive: true,
    roles: ['TENANT'],
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue({ ...mockUser }),
      save: jest.fn().mockImplementation(user => Promise.resolve(user)),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      const dto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
        location: 'Earth',
        phone: '+1234567890',
      };

      const result = await authService.register(dto);

      expect(usersService.create).toHaveBeenCalled();
      expect(result.user).toHaveProperty('email', dto.email);
      expect(result).toHaveProperty('token', 'mock-token');
    });

    it('should throw BadRequestException if user already exists (duplicate)', async () => {
      (usersService.create as jest.Mock).mockRejectedValueOnce({
        code: '23505',
        detail: 'User already exists',
      });

      await expect(authService.register({
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
        location: 'Earth',
        phone: '+1234567890',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should login and return token if credentials are correct', async () => {
      const dto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = await authService.login(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(result.user.email).toBe(dto.email);
      expect(result.token).toBe('mock-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'Password123',
      })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const wrongPasswordDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      await expect(authService.login(wrongPasswordDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('promoteUser', () => {
    it('should allow admin to promote user', async () => {
      const requester = { ...mockUser, roles: [ValidRoles.ADMIN] } as User;
      const result = await authService.promoteUser('uuid-123', ValidRoles.ADMIN, requester);

      expect(usersService.findById).toHaveBeenCalledWith('uuid-123');
      expect(result.message).toBe(`User promoted to ADMIN`);
      expect(result.user.roles).toContain(ValidRoles.ADMIN);
    });

    it('should not promote if user already has the role', async () => {
      const requester = { ...mockUser, roles: [ValidRoles.ADMIN] } as User;
      await expect(authService.promoteUser('uuid-123', ValidRoles.TENANT, requester)).rejects.toThrow(BadRequestException);

    });

    it('should throw ForbiddenException if requester is not admin or self', async () => {
      const requester = { ...mockUser, id: 'other-id', roles: ['TENANT'] } as User;

      await expect(authService.promoteUser('uuid-123', ValidRoles.ADMIN, requester)).rejects.toThrow(ForbiddenException);
    });
  });
});
