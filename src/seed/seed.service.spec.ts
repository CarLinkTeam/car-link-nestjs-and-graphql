import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SeedService } from './seed.service';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { Review } from '../reviews/entities/review.entity';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn().mockReturnValue('hashed_password'),
}));

describe('SeedService', () => {
  let service: SeedService;
  let userRepository: Repository<User>;
  let vehicleRepository: Repository<Vehicle>;
  let unavailabilityRepository: Repository<VehicleUnavailability>;
  let rentalRepository: Repository<Rental>;
  let reviewRepository: Repository<Review>;

  const originalConsoleLog = console.log;

  const mockUserRepository = {
    delete: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockVehicleRepository = {
    delete: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUnavailabilityRepository = {
    delete: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRentalRepository = {
    delete: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockReviewRepository = {
    delete: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    console.log = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
        {
          provide: getRepositoryToken(VehicleUnavailability),
          useValue: mockUnavailabilityRepository,
        },
        {
          provide: getRepositoryToken(Rental),
          useValue: mockRentalRepository,
        },
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    vehicleRepository = module.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
    );
    unavailabilityRepository = module.get<Repository<VehicleUnavailability>>(
      getRepositoryToken(VehicleUnavailability),
    );
    rentalRepository = module.get<Repository<Rental>>(
      getRepositoryToken(Rental),
    );
    reviewRepository = module.get<Repository<Review>>(
      getRepositoryToken(Review),
    );
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedDatabase', () => {
    it('should call all seed methods in order', async () => {
      const mockUsers = [
        { id: 'user1', roles: ['ADMIN'] },
        { id: 'user2', roles: ['OWNER'] },
        { id: 'user3', roles: ['TENANT'] },
      ] as User[];

      const mockVehicles = [
        {
          id: 'vehicle1',
          daily_price: 100,
          fuel_type: 'Gasolina',
          transmission: 'Manual',
        },
        {
          id: 'vehicle2',
          daily_price: 200,
          fuel_type: 'Diésel',
          transmission: 'Automático',
        },
      ] as Vehicle[];

      const mockRentals = [{ id: 'rental1' }, { id: 'rental2' }] as Rental[];

      jest
        .spyOn<any, any>(service, 'clearDatabase')
        .mockResolvedValue(undefined);
      jest.spyOn<any, any>(service, 'seedUsers').mockResolvedValue(mockUsers);
      jest
        .spyOn<any, any>(service, 'seedVehicles')
        .mockResolvedValue(mockVehicles);
      jest
        .spyOn<any, any>(service, 'seedUnavailabilities')
        .mockResolvedValue([]);
      jest
        .spyOn<any, any>(service, 'seedRentals')
        .mockResolvedValue(mockRentals);
      jest.spyOn<any, any>(service, 'seedReviews').mockResolvedValue([]);

      await service.seedDatabase();

      expect(service['clearDatabase']).toHaveBeenCalled();
      expect(service['seedUsers']).toHaveBeenCalled();
      expect(service['seedVehicles']).toHaveBeenCalledWith(mockUsers);
      expect(service['seedUnavailabilities']).toHaveBeenCalledWith(
        mockVehicles,
      );
      expect(service['seedRentals']).toHaveBeenCalledWith(
        mockUsers,
        mockVehicles,
      );
      expect(service['seedReviews']).toHaveBeenCalledWith(mockRentals);
    });
  });

  describe('clearDatabase', () => {
    it('should delete all records from all repositories', async () => {
      await service['clearDatabase']();

      expect(reviewRepository.delete).toHaveBeenCalledWith({});
      expect(rentalRepository.delete).toHaveBeenCalledWith({});
      expect(unavailabilityRepository.delete).toHaveBeenCalledWith({});
      expect(vehicleRepository.delete).toHaveBeenCalledWith({});
      expect(userRepository.delete).toHaveBeenCalledWith({});
    });
  });

  describe('seedUsers', () => {
    it('should create and save users with hashed passwords', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com' } as User;
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service['seedUsers']();

      expect(bcrypt.hashSync).toHaveBeenCalledTimes(5);
      expect(userRepository.create).toHaveBeenCalledTimes(5);
      expect(userRepository.save).toHaveBeenCalledTimes(5);
      expect(result).toHaveLength(5);
      expect(console.log).toHaveBeenCalledWith('Created 5 users');
    });
  });

  describe('seedVehicles', () => {
    it('should create and save vehicles for owners', async () => {
      const mockUsers = [
        { id: 'user1', roles: ['OWNER'] },
        { id: 'user2', roles: ['OWNER'] },
      ] as User[];

      const mockVehicle = { id: 'vehicle1' } as Vehicle;
      mockVehicleRepository.create.mockReturnValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue(mockVehicle);

      const result = await service['seedVehicles'](mockUsers);

      expect(vehicleRepository.create).toHaveBeenCalledTimes(4);
      expect(vehicleRepository.save).toHaveBeenCalledTimes(4);
      expect(result).toHaveLength(4);
      expect(console.log).toHaveBeenCalledWith('Created 4 vehicles');
    });
  });

  describe('seedUnavailabilities', () => {
    it('should create and save unavailabilities for vehicles', async () => {
      const mockVehicles = [
        { id: 'vehicle1' },
        { id: 'vehicle2' },
      ] as Vehicle[];

      const mockUnavailability = {
        id: 'unavailability1',
      } as VehicleUnavailability;
      mockUnavailabilityRepository.create.mockReturnValue(mockUnavailability);
      mockUnavailabilityRepository.save.mockResolvedValue(mockUnavailability);

      const result = await service['seedUnavailabilities'](mockVehicles);

      expect(unavailabilityRepository.create).toHaveBeenCalledTimes(6);
      expect(unavailabilityRepository.save).toHaveBeenCalledTimes(6);
      expect(result).toHaveLength(6);
      expect(console.log).toHaveBeenCalledWith('Created 6 unavailabilities');
    });
  });

  describe('seedRentals', () => {
    it('should create and save rentals for tenants', async () => {
      const mockUsers = [
        { id: 'user1', roles: ['TENANT'] },
        { id: 'user2', roles: ['TENANT'] },
      ] as User[];

      const mockVehicles = [
        {
          id: 'vehicle1',
          daily_price: 100,
          fuel_type: 'Gasolina',
          transmission: 'Manual',
        },
        {
          id: 'vehicle2',
          daily_price: 200,
          fuel_type: 'Diésel',
          transmission: 'Automático',
        },
        {
          id: 'vehicle3',
          daily_price: 300,
          fuel_type: 'Eléctrico',
          transmission: 'Automático',
        },
      ] as Vehicle[];

      const mockRental = { id: 'rental1' } as Rental;
      mockRentalRepository.create.mockReturnValue(mockRental);
      mockRentalRepository.save.mockResolvedValue(mockRental);

      const result = await service['seedRentals'](mockUsers, mockVehicles);

      expect(rentalRepository.create).toHaveBeenCalledTimes(3);
      expect(rentalRepository.save).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
      expect(console.log).toHaveBeenCalledWith('Created 3 rentals');
    });
  });

  describe('seedReviews', () => {
    it('should create and save reviews for rentals', async () => {
      const mockRentals = [
        { id: 'rental1' },
        { id: 'rental2' },
        { id: 'rental3' },
      ] as Rental[];

      const mockReview = { id: 'review1' } as Review;
      mockReviewRepository.create.mockReturnValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);

      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);

      const result = await service['seedReviews'](mockRentals);

      expect(reviewRepository.create).toHaveBeenCalledTimes(3);
      expect(reviewRepository.save).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
      expect(console.log).toHaveBeenCalledWith('Created 3 reviews');

      Math.random = originalRandom;
    });
  });
});
