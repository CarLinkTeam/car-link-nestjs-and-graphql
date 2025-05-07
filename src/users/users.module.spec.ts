import { Test, type TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

jest.mock('@nestjs/axios');
jest.mock('@nestjs/config');
jest.mock('../auth/auth.module');

jest.mock('../auth/decorators/auth.decorator', () => ({
    Auth: (...roles: string[]) => jest.fn(),
  }));

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
    },
  };
});

describe('UsersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(UsersService)
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have UsersController as controller', () => {
    const controller = module.get<UsersController>(UsersController);
    expect(controller).toBeDefined();
  });

  it('should have UsersService as provider', () => {
    const service = module.get<UsersService>(UsersService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule.forFeature with correct entities', () => {
    expect(TypeOrmModule.forFeature).toHaveBeenCalledWith([
      User,
    ]);
  });

  it('should export UsersService', () => {
    const testModule = Test.createTestingModule({
      imports: [UsersService],
    });

    expect(testModule).toBeDefined();

    const exports = Reflect.getMetadata('exports', UsersModule);
    expect(exports).toContain(UsersService);
  });
});
