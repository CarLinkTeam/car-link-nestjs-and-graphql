import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsModule } from './reviews.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { RentalsModule } from '../rentals/rentals.module';
import { AuthModule } from '../auth/auth.module';

jest.mock('../rentals/rentals.module');
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

describe('ReviewsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ReviewsModule],
    })
      .overrideProvider(ReviewsService)
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have ReviewsController as controller', () => {
    const controller = module.get<ReviewsController>(ReviewsController);
    expect(controller).toBeDefined();
  });

  it('should have ReviewsService as provider', () => {
    const service = module.get<ReviewsService>(ReviewsService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule.forFeature with correct entity', () => {
    expect(TypeOrmModule.forFeature).toHaveBeenCalledWith([Review]);
  });

  it('should import RentalsModule', () => {
    const rentalsModule = module.get(RentalsModule);
    expect(rentalsModule).toBeDefined();
  });

  it('should import AuthModule', () => {
    const authModule = module.get(AuthModule);
    expect(authModule).toBeDefined();
  });
});
