import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReviewDto } from './create-review.dto';

describe('CreateReviewDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      rating: 5,
      comment: 'Great experience!',
      createdAt: new Date('2023-01-15'),
      rental_id: '123e4567-e89b-12d3-a456-426614174001',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with non-integer rating', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      rating: 4.5,
      comment: 'Great experience!',
      createdAt: new Date('2023-01-15'),
      rental_id: '123e4567-e89b-12d3-a456-426614174001',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('rating');
  });

  it('should fail validation with non-string comment', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      rating: 5,
      comment: 123,
      createdAt: new Date('2023-01-15'),
      rental_id: '123e4567-e89b-12d3-a456-426614174001',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('comment');
  });

  it('should fail validation with invalid date', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      rating: 5,
      comment: 'Great experience!',
      createdAt: 'not-a-date',
      rental_id: '123e4567-e89b-12d3-a456-426614174001',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('createdAt');
  });

  it('should fail validation with non-string rental_id', async () => {
    const dto = plainToInstance(CreateReviewDto, {
      rating: 5,
      comment: 'Great experience!',
      createdAt: new Date('2023-01-15'),
      rental_id: 12345,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('rental_id');
  });
});
