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

describe('RentalsModule Update (e2e)', () => {
  let app: INestApplication;
  let rentalRepository: Repository<Rental>;
  let userRepository: Repository<User>;
  let vehicleRepository: Repository<Vehicle>;
  let unavailabilityRepository: Repository<VehicleUnavailability>;
  let authToken: string;
  let userId: string;
  let vehicleId: string;
  let rentalId: string;

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

  const updateRentalDto = {
    initialDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    finalDate: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
    totalCost: 150,
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

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    userId = userResponse.body.user.id;
    authToken = userResponse.body.token;

    // Promote user to owner
    await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    // Create test vehicle
    const vehicleResponse = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testVehicle);

    vehicleId = vehicleResponse.body.id;
    validRentalDto.vehicle_id = vehicleId;

    // Create test rental
    const rentalResponse = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validRentalDto);

    rentalId = rentalResponse.body.id;
  }, 10000);

  afterAll(async () => {
    await rentalRepository.delete({ client_id: userId });
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  it('/rentals/:id (PATCH) - no authentication', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/rentals/${rentalId}`)
      .send(updateRentalDto);

    expect(response.status).toBe(401);
  });

  it('/rentals/:id (PATCH) - invalid rental id', async () => {
    const response = await request(app.getHttpServer())
      .patch('/rentals/invalid-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateRentalDto);

    expect(response.status).toBe(404);
  });

  it('/rentals/:id (PATCH) - non-existent rental id', async () => {
    const response = await request(app.getHttpServer())
      .patch('/rentals/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateRentalDto);

    expect(response.status).toBe(404);
  });

  it('/rentals/:id (PATCH) - invalid dates (start date after end date)', async () => {
    const invalidDateRental = {
      initialDate: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
      finalDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    };

    const response = await request(app.getHttpServer())
      .patch(`/rentals/${rentalId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidDateRental);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('anterior a la fecha final');
  });

  it('/rentals/:id (PATCH) - valid rental update', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/rentals/${rentalId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateRentalDto);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', rentalId);
    expect(response.body).toHaveProperty('totalCost', '150.00');
    expect(new Date(response.body.initialDate).getTime()).toBeGreaterThan(
      new Date(validRentalDto.initialDate).getTime(),
    );
  });
});
