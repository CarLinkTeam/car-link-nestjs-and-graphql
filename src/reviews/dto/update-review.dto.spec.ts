import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateReviewDto } from './update-review.dto';

describe('UpdateReviewDto', () => {
  it('should validate a valid partial DTO', async () => {
    const dto = plainToInstance(UpdateReviewDto, {
      rating: 4,
      comment: 'Updated comment',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateReviewDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with non-integer rating', async () => {
    const dto = plainToInstance(UpdateReviewDto, {
      rating: 3.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('rating');
  });

  it('should inherit validation rules from CreateReviewDto', async () => {
    const dto = plainToInstance(UpdateReviewDto, {
      comment: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('comment');
  });

  it('should fail validation with invalid date', async () => {
    const dto = plainToInstance(UpdateReviewDto, {
      createdAt: 'invalid-date',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('createdAt');
  });
});
