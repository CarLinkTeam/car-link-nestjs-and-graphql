import { Test, type TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';
import { SeedCommand } from './seed.command';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { Review } from '../reviews/entities/review.entity';

jest.mock('@nestjs/typeorm', () => {
  const original = jest.requireActual('@nestjs/typeorm');
  return {
    __esModule: true,
    ...original,
    TypeOrmModule: {
      forFeature: jest.fn().mockReturnValue({
        module: class MockTypeOrmModule {},
        providers: [],
      }),
    },
  };
});

describe('SeedModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SeedModule],
    })
      .overrideProvider(SeedService)
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have SeedService as provider', () => {
    const service = module.get<SeedService>(SeedService);
    expect(service).toBeDefined();
  });

  it('should have SeedCommand as provider', () => {
    const command = module.get<SeedCommand>(SeedCommand);
    expect(command).toBeDefined();
  });

  it('should import TypeOrmModule.forFeature with correct entities', () => {
    expect(TypeOrmModule.forFeature).toHaveBeenCalledWith([
      User,
      Vehicle,
      VehicleUnavailability,
      Rental,
      Review,
    ]);
  });
});
