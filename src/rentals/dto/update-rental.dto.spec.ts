import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateRentalDto } from './update-rental.dto';

describe('UpdateRentalDto', () => {
  it('should validate a valid partial DTO', async () => {
    const dto = plainToInstance(UpdateRentalDto, {
      totalCost: 600.75,
      status: 'completed',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateRentalDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid status', async () => {
    const dto = plainToInstance(UpdateRentalDto, {
      status: 'invalid-status',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('should fail validation with negative totalCost', async () => {
    const dto = plainToInstance(UpdateRentalDto, {
      totalCost: -100,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('totalCost');
  });

  it('should inherit validation rules from CreateRentalDto', async () => {
    const dto = plainToInstance(UpdateRentalDto, {
      cityMgp: -5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cityMgp');
  });
});
