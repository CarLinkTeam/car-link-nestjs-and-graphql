import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsModule } from './rentals.module';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { Rental } from './entities/rental.entity';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { AuthModule } from '../auth/auth.module';

jest.mock('../users/users.module');
jest.mock('../vehicles/vehicles.module');
jest.mock('../auth/auth.module');

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

describe('RentalsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RentalsModule],
    })
      .overrideProvider(RentalsService)
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have RentalsController as controller', () => {
    const controller = module.get<RentalsController>(RentalsController);
    expect(controller).toBeDefined();
  });

  it('should have RentalsService as provider', () => {
    const service = module.get<RentalsService>(RentalsService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule.forFeature with correct entities', () => {
    expect(TypeOrmModule.forFeature).toHaveBeenCalledWith([
      Rental,
      VehicleUnavailability,
    ]);
  });

  it('should import UsersModule', () => {
    const usersModule = module.get(UsersModule);
    expect(usersModule).toBeDefined();
  });

  it('should import VehiclesModule', () => {
    const vehiclesModule = module.get(VehiclesModule);
    expect(vehiclesModule).toBeDefined();
  });

  it('should import AuthModule', () => {
    const authModule = module.get(AuthModule);
    expect(authModule).toBeDefined();
  });

  it('should export RentalsService', () => {
    const testModule = Test.createTestingModule({
      imports: [RentalsModule],
    });

    expect(testModule).toBeDefined();
  });
});
