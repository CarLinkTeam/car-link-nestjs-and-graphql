import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

jest.mock('@nestjs/typeorm', () => {
  const original = jest.requireActual('@nestjs/typeorm');
  return {
    __esModule: true,
    ...original,
    InjectRepository: () => jest.fn(),
    TypeOrmModule: {
      forFeature: jest.fn().mockReturnValue({
        module: class MockTypeOrmModule {},
        providers: [],
      }),
      forRoot: jest.fn().mockReturnValue({
        module: class MockTypeOrmModule {},
      }),
      forRootAsync: jest.fn().mockReturnValue({
        module: class MockTypeOrmModule {},
      }),
    },
  };
});

jest.mock('./strategies/jwt.strategy', () => ({
  JwtStrategy: class MockJwtStrategy {
    constructor() {}
    validate() {
      return { id: 'test-id', roles: ['user'] };
    }
  },
}));

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            checkAuthStatus: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        JwtStrategy,
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AuthService as provider', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });

  it('should have AuthController as controller', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should have JwtStrategy as provider', () => {
    const provider = module.get<JwtStrategy>(JwtStrategy);
    expect(provider).toBeDefined();
  });
});
