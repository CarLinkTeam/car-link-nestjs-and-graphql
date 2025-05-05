import { Rental } from './rental.entity';
import { User } from '../../users/entities/user.entity';

describe('Rental Entity', () => {
  let rental: Rental;
  let user: User;

  beforeEach(() => {
    user = new User();
    user.id = '123e4567-e89b-12d3-a456-426614174000';

    rental = new Rental();
    rental.id = '123e4567-e89b-12d3-a456-426614174001';
    rental.initialDate = new Date('2023-01-01');
    rental.finalDate = new Date('2023-01-10');
    rental.totalCost = 500.5;
    rental.typeFuel = 'Gasoline';
    rental.transmission = 'Automatic';
    rental.cityMgp = 25;
    rental.status = 'Active';
    rental.client = user;
    rental.client_id = user.id;
  });

  it('should create a rental entity', () => {
    expect(rental).toBeDefined();
    expect(rental.id).toBeDefined();
  });

  it('should have all required properties', () => {
    expect(rental.initialDate).toBeInstanceOf(Date);
    expect(rental.finalDate).toBeInstanceOf(Date);
    expect(typeof rental.totalCost).toBe('number');
    expect(typeof rental.typeFuel).toBe('string');
    expect(typeof rental.transmission).toBe('string');
    expect(typeof rental.cityMgp).toBe('number');
    expect(typeof rental.status).toBe('string');
  });

  it('should have correct values', () => {
    expect(rental.initialDate).toEqual(new Date('2023-01-01'));
    expect(rental.finalDate).toEqual(new Date('2023-01-10'));
    expect(rental.totalCost).toEqual(500.5);
    expect(rental.typeFuel).toEqual('Gasoline');
    expect(rental.transmission).toEqual('Automatic');
    expect(rental.cityMgp).toEqual(25);
    expect(rental.status).toEqual('Active');
  });

  it('should have a relationship with User entity', () => {
    expect(rental.client).toBeDefined();
    expect(rental.client).toEqual(user);
    expect(rental.client_id).toEqual(user.id);
  });
});
