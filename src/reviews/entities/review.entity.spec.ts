import { Review } from './review.entity';
import { Rental } from '../../rentals/entities/rental.entity';

describe('Review Entity', () => {
  let review: Review;
  let rental: Rental;

  beforeEach(() => {
    rental = new Rental();
    rental.id = '123e4567-e89b-12d3-a456-426614174001';

    review = new Review();
    review.id = '123e4567-e89b-12d3-a456-426614174002';
    review.rating = 5;
    review.comment = 'Great experience!';
    review.createdAt = new Date('2023-01-15');
    review.rental_id = rental.id;
    review.rental = rental;
  });

  it('should create a review entity', () => {
    expect(review).toBeDefined();
    expect(review.id).toBeDefined();
  });

  it('should have all required properties', () => {
    expect(typeof review.rating).toBe('number');
    expect(typeof review.comment).toBe('string');
    expect(review.createdAt).toBeInstanceOf(Date);
  });

  it('should have correct values', () => {
    expect(review.rating).toEqual(5);
    expect(review.comment).toEqual('Great experience!');
    expect(review.createdAt).toEqual(new Date('2023-01-15'));
  });

  it('should have a relationship with Rental entity', () => {
    expect(review.rental).toBeDefined();
    expect(review.rental).toEqual(rental);
    expect(review.rental_id).toEqual(rental.id);
  });
});
