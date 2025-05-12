import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { Rental } from '../../src/rentals/entities/rental.entity';
import { User } from '../../src/users/entities/user.entity';
import { Vehicle } from '../../src/vehicles/entities/vehicle.entity';
import { VehicleUnavailability } from '../../src/vehicles/entities/vehicle-unavailability.entity';

describe('RentalsModule Create (e2e)', () => {
  let app: INestApplication;
  let rentalRepository: Repository<Rental>;
  let userRepository: Repository<User>;
  let vehicleRepository: Repository<Vehicle>;
  let unavailabilityRepository: Repository<VehicleUnavailability>;
  let authToken: string;
  let userId: string;
  let vehicleId: string;

  const testUser = {
    email: `test-user-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test User',
    phone: '+573111234568',
    location: 'Test Location',
  };

  const testVehicle = {
    make: 'Toyota',
    vehicleModel: 'Corolla',
    year: 2022,
    license_plate: `TEST-${Date.now()}`,
    color: 'Red',
    transmission: 'automatic',
    url_photos: ['http://example.com/photo1.jpg'],
    daily_price: 50,
    rental_conditions: '',
  };
  const validRentalDto = {
    initialDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    finalDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    vehicle_id: '',
    status: 'pending',
    totalCost: 100,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    rentalRepository = app.get<Repository<Rental>>(getRepositoryToken(Rental));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    vehicleRepository = app.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
    );
    unavailabilityRepository = app.get<Repository<VehicleUnavailability>>(
      getRepositoryToken(VehicleUnavailability),
    );

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    userId = userResponse.body.user.id;
    authToken = userResponse.body.token;

    const promotionResponse = await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    const vehicleResponse = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testVehicle);

    vehicleId = vehicleResponse.body.id;

    validRentalDto.vehicle_id = vehicleId;
  }, 10000);

  afterAll(async () => {
    await rentalRepository.delete({ client_id: userId });
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  it('/rentals (POST) - no authentication', async () => {
    const response = await request(app.getHttpServer())
      .post('/rentals')
      .send(validRentalDto);

    expect(response.status).toBe(401);
  });

  it('/rentals (POST) - no body', async () => {
    const response = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(Array.isArray(response.body.message)).toBeTruthy();
    expect(response.body.message).toContain(
      'initialDate must be a Date instance',
    );
    expect(response.body.message).toContain(
      'finalDate must be a Date instance',
    );
    expect(response.body.message).toContain(
      'totalCost must be a positive number',
    );
    expect(response.body.message).toContain(
      'totalCost must be a number conforming to the specified constraints',
    );
    expect(response.body.message).toContain(
      'status must be one of the following values: confirmed, canceled, pending, completed',
    );
    expect(response.body.message).toContain('vehicle_id must be a UUID');
  });

  it('/rentals (POST) - invalid dates (start date after end date)', async () => {
    const invalidDateRental = {
      ...validRentalDto,
      initialDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      finalDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    };

    const response = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidDateRental);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'start date must be earlier than the end date',
    );
  });

  it('/rentals (POST) - non-existent vehicle', async () => {
    const nonExistentVehicleRental = {
      ...validRentalDto,
      vehicle_id: '00000000-0000-0000-0000-000000000000',
    };

    const response = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(nonExistentVehicleRental);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('/rentals (POST) - valid rental creation', async () => {
    const response = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validRentalDto);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.client_id).toBe(userId);
    expect(response.body.vehicle_id).toBe(vehicleId);
    expect(response.body.status).toBe('pending');
  });

  it('/rentals (POST) - vehicle unavailable (date conflict)', async () => {
    const response = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validRentalDto);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already reserved');
  });
});
