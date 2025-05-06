import { Test, type TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VehiclesModule } from './vehicles.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleUnavailability } from './entities/vehicle-unavailability.entity';
import { AuthModule } from '../auth/auth.module';

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

describe('VehiclesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [VehiclesModule],
    })
      .overrideProvider(VehiclesService)
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have VehiclesController as controller', () => {
    const controller = module.get<VehiclesController>(VehiclesController);
    expect(controller).toBeDefined();
  });

  it('should have VehiclesService as provider', () => {
    const service = module.get<VehiclesService>(VehiclesService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule.forFeature with correct entities', () => {
    expect(TypeOrmModule.forFeature).toHaveBeenCalledWith([
      Vehicle,
      VehicleUnavailability,
    ]);
  });

  it('should import HttpModule', () => {
    const httpModule = module.get(HttpModule);
    expect(httpModule).toBeDefined();
  });

  it('should import ConfigModule', () => {
    const configModule = module.get(ConfigModule);
    expect(configModule).toBeDefined();
  });

  it('should import AuthModule', () => {
    const authModule = module.get(AuthModule);
    expect(authModule).toBeDefined();
  });

  it('should export VehiclesService', () => {
    const testModule = Test.createTestingModule({
      imports: [VehiclesModule],
    });

    expect(testModule).toBeDefined();

    const exports = Reflect.getMetadata('exports', VehiclesModule);
    expect(exports).toContain(VehiclesService);
  });
});
