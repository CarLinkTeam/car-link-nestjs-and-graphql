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

describe('RentalsModule Confirm/Reject (e2e)', () => {
  let app: INestApplication;
  let rentalRepository: Repository<Rental>;
  let userRepository: Repository<User>;
  let vehicleRepository: Repository<Vehicle>;
  let unavailabilityRepository: Repository<VehicleUnavailability>;
  let authToken: string;
  let userId: string;
  let vehicleId: string;
  let pendingRentalId: string;
  let confirmedRentalId: string;

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

  const pendingRentalDto = {
    initialDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    finalDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    vehicle_id: '',
    status: 'pending',
    totalCost: 100,
  };

  const confirmedRentalDto = {
    initialDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    finalDate: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
    vehicle_id: '',
    status: 'pending',
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
    pendingRentalDto.vehicle_id = vehicleId;
    confirmedRentalDto.vehicle_id = vehicleId;

    // Create pending rental
    const pendingRentalResponse = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(pendingRentalDto);

    pendingRentalId = pendingRentalResponse.body.id;

    // Create rental to be confirmed
    const confirmedRentalResponse = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(confirmedRentalDto);

    confirmedRentalId = confirmedRentalResponse.body.id;

    // Confirm the rental
    await request(app.getHttpServer())
      .patch(`/rentals/${confirmedRentalId}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();
  });

  afterAll(async () => {
    await rentalRepository.delete({ client_id: userId });
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  describe('Confirm Rental', () => {
    it('/rentals/:id/confirm (PATCH) - no authentication', async () => {
      const response = await request(app.getHttpServer()).patch(
        `/rentals/${pendingRentalId}/confirm`,
      );

      expect(response.status).toBe(401);
    });

    it('/rentals/:id/confirm (PATCH) - invalid rental id', async () => {
      const response = await request(app.getHttpServer())
        .patch('/rentals/invalid-id/confirm')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('/rentals/:id/confirm (PATCH) - non-existent rental id', async () => {
      const response = await request(app.getHttpServer())
        .patch('/rentals/00000000-0000-0000-0000-000000000000/confirm')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('/rentals/:id/confirm (PATCH) - already confirmed rental', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/rentals/${confirmedRentalId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('pending status');
    });

    it('/rentals/:id/confirm (PATCH) - valid rental confirmation', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/rentals/${pendingRentalId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', pendingRentalId);
      expect(response.body).toHaveProperty('status', 'confirmed');
    });
  });

  describe('Reject Rental', () => {
    // Create a new pending rental for rejection tests
    let rejectRentalId: string;

    beforeAll(async () => {
      const rejectRentalDto = {
        initialDate: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
        finalDate: new Date(Date.now() + 518400000).toISOString(), // 6 days from now
        vehicle_id: vehicleId,
        status: 'pending',
        totalCost: 200,
      };

      const rejectRentalResponse = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rejectRentalDto);

      rejectRentalId = rejectRentalResponse.body.id;
    });

    it('/rentals/:id/reject (PATCH) - no authentication', async () => {
      const response = await request(app.getHttpServer()).patch(
        `/rentals/${rejectRentalId}/reject`,
      );

      expect(response.status).toBe(401);
    });

    it('/rentals/:id/reject (PATCH) - invalid rental id', async () => {
      const response = await request(app.getHttpServer())
        .patch('/rentals/invalid-id/reject')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('/rentals/:id/reject (PATCH) - non-existent rental id', async () => {
      const response = await request(app.getHttpServer())
        .patch('/rentals/00000000-0000-0000-0000-000000000000/reject')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('/rentals/:id/reject (PATCH) - already confirmed rental', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/rentals/${confirmedRentalId}/reject`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('pending status');
    });

    it('/rentals/:id/reject (PATCH) - valid rental rejection', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/rentals/${rejectRentalId}/reject`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', rejectRentalId);
      expect(response.body).toHaveProperty('status', 'canceled');
    });
  });
});
