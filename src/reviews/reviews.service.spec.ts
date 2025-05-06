import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { RentalsService } from '../rentals/rentals.service';
import { DataSource, Repository } from 'typeorm';
import {
  BadGatewayException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};

const mockReviewRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  preload: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
});

const mockRentalsService = () => ({
  findOne: jest.fn(),
});

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
    remove: jest.fn(),
  },
};

const mockDataSource = () => ({
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: Repository<Review>;
  let rentalsService: RentalsService;
  let dataSource: DataSource;
  let mockLogger: Partial<Logger>;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      warn: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useFactory: mockReviewRepository,
        },
        { provide: RentalsService, useFactory: mockRentalsService },
        { provide: DataSource, useFactory: mockDataSource },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get<Repository<Review>>(
      getRepositoryToken(Review),
    );
    rentalsService = module.get<RentalsService>(RentalsService);
    dataSource = module.get<DataSource>(DataSource);

    (service as any).logger = mockLogger;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review successfully', async () => {
      const createReviewDto: CreateReviewDto = {
        rating: 5,
        comment: 'Great experience!',
        createdAt: new Date('2023-01-15'),
        rental_id: 'rental-id',
      };

      const expectedReview = {
        id: 'review-id',
        ...createReviewDto,
      };

      jest
        .spyOn(rentalsService, 'findOne')
        .mockResolvedValue({ id: 'rental-id' } as any);

      jest
        .spyOn(reviewRepository, 'create')
        .mockReturnValue(expectedReview as any);
      jest
        .spyOn(reviewRepository, 'save')
        .mockResolvedValue(expectedReview as any);

      const result = await service.create(createReviewDto);
      expect(result).toEqual(expectedReview);
      expect(rentalsService.findOne).toHaveBeenCalledWith('rental-id');
      expect(reviewRepository.create).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Great experience!',
        createdAt: new Date('2023-01-15'),
        rental_id: 'rental-id',
      });
      expect(reviewRepository.save).toHaveBeenCalledWith(expectedReview);
    });

    it('should throw NotFoundException if rental not found', async () => {
      const createReviewDto: CreateReviewDto = {
        rating: 5,
        comment: 'Great experience!',
        createdAt: new Date('2023-01-15'),
        rental_id: 'non-existent-rental-id',
      };

      // Mock findOne to throw NotFoundException
      jest
        .spyOn(rentalsService, 'findOne')
        .mockRejectedValue(
          new NotFoundException(
            `Rental with id or typeFuel "non-existent-rental-id" not found`,
          ),
        );

      await expect(service.create(createReviewDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(rentalsService.findOne).toHaveBeenCalledWith(
        'non-existent-rental-id',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of reviews', async () => {
      const expectedReviews = [
        { id: 'review-id-1', rental: {} },
        { id: 'review-id-2', rental: {} },
      ];

      jest
        .spyOn(reviewRepository, 'find')
        .mockResolvedValue(expectedReviews as any);

      const result = await service.findAll();
      expect(result).toEqual(expectedReviews);
      expect(reviewRepository.find).toHaveBeenCalledWith({
        relations: ['rental'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a review by id', async () => {
      const reviewId = '123e4567-e89b-12d3-a456-426614174001';
      const expectedReview = {
        id: reviewId,
        rental: {},
      };

      jest
        .spyOn(reviewRepository, 'findOne')
        .mockResolvedValue(expectedReview as any);

      const result = await service.findOne(reviewId);
      expect(result).toEqual(expectedReview);
      expect(reviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: reviewId },
        relations: ['rental'],
      });
    });

    it('should return a review by rating or comment', async () => {
      const searchTerm = '5';
      const expectedReview = {
        id: 'review-id',
        rating: 5,
        comment: 'Great experience!',
        rental: {},
      };

      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);

      mockQueryBuilder.getOne.mockResolvedValue(expectedReview as any);

      const result = await service.findOne(searchTerm);
      expect(result).toEqual(expectedReview);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'review.rating = :rating',
        { rating: searchTerm },
      );
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'review.comment = :comment',
        { comment: searchTerm },
      );
    });

    it('should throw NotFoundException if review not found', async () => {
      const reviewId = 'non-existent-id';

      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);

      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne(reviewId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a review successfully', async () => {
      const reviewId = 'review-id';
      const updateReviewDto: UpdateReviewDto = {
        rating: 4,
        comment: 'Updated comment',
      };

      const existingReview = {
        id: reviewId,
        rating: 5,
        comment: 'Great experience!',
        rental_id: 'rental-id',
        rental: {},
      };

      const updatedReview = {
        ...existingReview,
        ...updateReviewDto,
      };

      jest
        .spyOn(reviewRepository, 'preload')
        .mockResolvedValue(updatedReview as any);

      jest.spyOn(service, 'findOne').mockResolvedValue(updatedReview as any);

      const result = await service.update(reviewId, updateReviewDto);
      expect(result).toEqual(updatedReview);
      expect(reviewRepository.preload).toHaveBeenCalledWith({
        id: reviewId,
        ...updateReviewDto,
      });
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(updatedReview);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should update a review with new rental_id successfully', async () => {
      const reviewId = 'review-id';
      const updateReviewDto: UpdateReviewDto = {
        rating: 4,
        comment: 'Updated comment',
        rental_id: 'new-rental-id',
      };

      const existingReview = {
        id: reviewId,
        rating: 5,
        comment: 'Great experience!',
        rental_id: 'old-rental-id',
        rental: {},
      };

      const updatedReview = {
        ...existingReview,
        ...updateReviewDto,
      };

      jest
        .spyOn(rentalsService, 'findOne')
        .mockResolvedValue({ id: 'new-rental-id' } as any);

      jest
        .spyOn(reviewRepository, 'preload')
        .mockResolvedValue(updatedReview as any);

      jest.spyOn(service, 'findOne').mockResolvedValue(updatedReview as any);

      const result = await service.update(reviewId, updateReviewDto);
      expect(result).toEqual(updatedReview);
      expect(rentalsService.findOne).toHaveBeenCalledWith('new-rental-id');
      expect(reviewRepository.preload).toHaveBeenCalledWith({
        id: reviewId,
        ...updateReviewDto,
      });
    });

    it('should throw NotFoundException if rental not found during update', async () => {
      const reviewId = 'review-id';
      const updateReviewDto: UpdateReviewDto = {
        rental_id: 'non-existent-rental-id',
      };

      jest
        .spyOn(rentalsService, 'findOne')
        .mockRejectedValue(
          new NotFoundException(
            `Rental with id or typeFuel "non-existent-rental-id" not found`,
          ),
        );

      await expect(service.update(reviewId, updateReviewDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(rentalsService.findOne).toHaveBeenCalledWith(
        'non-existent-rental-id',
      );
    });

    it('should throw NotFoundException if review not found during update', async () => {
      const reviewId = 'non-existent-id';
      const updateReviewDto: UpdateReviewDto = {
        rating: 4,
      };

      jest.spyOn(reviewRepository, 'preload').mockResolvedValue(undefined);

      await expect(service.update(reviewId, updateReviewDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a review successfully', async () => {
      const reviewId = 'review-id';
      const existingReview = {
        id: reviewId,
        rating: 5,
        comment: 'Great experience!',
        rental: {},
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingReview as any);

      await service.remove(reviewId);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(
        existingReview,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review not found during remove', async () => {
      const reviewId = 'non-existent-id';

      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove(reviewId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleExeptions', () => {
    it('should throw BadGatewayException for duplicate key error', async () => {
      const error = { code: '23505', detail: 'Duplicate key error' };

      expect(() => (service as any).handleExeptions(error)).toThrow(
        BadGatewayException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const error = new Error('Some unexpected error');

      expect(() => (service as any).handleExeptions(error)).toThrow(
        InternalServerErrorException,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
