import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

// Mock para el Auth decorator
jest.mock('../auth/decorators/auth.decorator', () => ({
  Auth: (...roles: string[]) => jest.fn(),
}));

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  // Mock del servicio
  const mockReviewsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);

    // Limpiar todos los mocks después de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call reviewsService.create with the provided dto', async () => {
      // Arrange
      const createReviewDto: CreateReviewDto = {
        rating: 5,
        comment: 'Great experience!',
        createdAt: new Date('2023-01-15'),
        rental_id: 'rental-id',
      };

      const expectedResult = { id: 'review-id', ...createReviewDto };
      mockReviewsService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createReviewDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createReviewDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call reviewsService.findAll', async () => {
      // Arrange
      const expectedResult = [{ id: 'review-id-1' }, { id: 'review-id-2' }];
      mockReviewsService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call reviewsService.findOne with the provided term', async () => {
      // Arrange
      const term = 'review-id';
      const expectedResult = { id: term };
      mockReviewsService.findOne.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(term);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(term);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call reviewsService.update with the provided id and dto', async () => {
      // Arrange
      const id = 'review-id';
      const updateReviewDto: UpdateReviewDto = {
        rating: 4,
        comment: 'Updated comment',
      };
      const expectedResult = { id, ...updateReviewDto };
      mockReviewsService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(id, updateReviewDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(id, updateReviewDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call reviewsService.remove with the provided id', async () => {
      // Arrange
      const id = 'review-id';
      const expectedResult = { id };
      mockReviewsService.remove.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.remove(id);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
