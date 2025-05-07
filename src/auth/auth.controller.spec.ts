import { PassportModule } from "@nestjs/passport";
import { TestingModule, Test } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { User } from "../users//entities/user.entity";
import { RegisterAuthDto } from './dto/register-auth.dto';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;
  
    beforeEach(async () => {
      const mockAuthService = {
        register: jest.fn(),
        login: jest.fn(),
        promoteUser: jest.fn(),
      };
  
      const module: TestingModule = await Test.createTestingModule({
        imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
        providers: [
          {
            provide: AuthService,
            useValue: mockAuthService,
          },
        ],
        controllers: [AuthController],
      }).compile();
  
      authController = module.get<AuthController>(AuthController);
      authService = module.get<AuthService>(AuthService);
    });
  
    it('should be defined', () => {
      expect(authController).toBeDefined();
    });
  
    it('should create user with the proper DTO', async () => {
      const dto: RegisterAuthDto = {
        email: 'peluche2.hello@example.com',
        password: 'StrongPass1',
        fullName: 'John Doe',
        location: 'Test Location',
        phone: '+12345678901',
      };
  
      await authController.register(dto);
  
      expect(authService.register).toHaveBeenCalled();
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  
    it('should loginUser with the proper DTO', async () => {
      const dto: LoginAuthDto = {
        email: 'test@google.com',
        password: 'Abc123',
      };
  
      await authController.login(dto);
  
      expect(authService.login).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith(dto);
    })

    it('should promote user to OWNER with correct params', async () => {
      const requester = {
        id: 'uuid-requester',
        email: 'admin@example.com',
        password: 'hashedPassword',
        fullName: 'Admin User',
        location: 'HQ',
        phone: '+12345678901',
        isActive: true,
        roles: ['TENANT'],
      } as User;
    
      const promotedUser = { ...requester, roles: ['TENANT', 'OWNER'] };
    
      const promoteSpy = jest
        .spyOn(authService, 'promoteUser')
        .mockResolvedValue({
          message: 'User promoted to OWNER',
          user: promotedUser as User,
        });
    
      const result = await authController.promoteToOwner('uuid-target', requester);
      
      expect(promoteSpy).toHaveBeenCalledWith('uuid-target', 'OWNER', requester);
      expect(result.message).toBe('User promoted to OWNER');
      expect(result.user.roles).toContain('OWNER');
    });

    it('should promote user to ADMIN with correct params', async () => {
      const requester = {
        id: 'uuid-requester',
        email: 'admin@example.com',
        password: 'hashedPassword',
        fullName: 'Admin User',
        location: 'HQ',
        phone: '+12345678901',
        isActive: true,
        roles: ['TENANT'],
      } as User;
    
      const promotedUser = { ...requester, roles: ['TENANT', 'ADMIN'] };
    
      const promoteSpy = jest
        .spyOn(authService, 'promoteUser')
        .mockResolvedValue({
          message: 'User promoted to ADMIN',
          user: promotedUser as User,
        });
    
      const result = await authController.promoteToAdmin('uuid-target', requester);
    
      expect(promoteSpy).toHaveBeenCalledWith('uuid-target', 'ADMIN', requester);
      expect(result.message).toBe('User promoted to ADMIN');
      expect(result.user.roles).toContain('ADMIN');
    });
  
  
  });