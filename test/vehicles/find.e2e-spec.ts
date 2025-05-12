import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { Vehicle } from '../../src/vehicles/entities/vehicle.entity';
import { User } from '../../src/users/entities/user.entity';

describe('VehiclesModule Find (e2e)', () => {
  let app: INestApplication;
  let vehicleRepository: Repository<Vehicle>;
  let userRepository: Repository<User>;
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
    rental_conditions: 'No smoking',
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

    vehicleRepository = app.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
    );
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    userId = userResponse.body.user.id;
    authToken = userResponse.body.token;

    await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    const vehicleResponse = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testVehicle);

    vehicleId = vehicleResponse.body.id;
  }, 10000);

  afterAll(async () => {
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  describe('Find All', () => {
    it('/vehicles (GET) - get all vehicles successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);

      const vehicle = response.body.find((v) => v.id === vehicleId);
      expect(vehicle).toBeDefined();
      expect(vehicle.make).toBe(testVehicle.make);
      expect(vehicle.vehicleModel).toBe(testVehicle.vehicleModel);
    });

    it('/vehicles (GET) - unauthorized access', async () => {
      const response = await request(app.getHttpServer()).get('/vehicles');

      expect(response.status).toBe(401);
    });

    it('/vehicles (GET) - invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('/vehicles (GET) - no vehicles found', async () => {
      const originalFind = vehicleRepository.find;
      vehicleRepository.find = jest.fn().mockResolvedValueOnce([]);

      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Vehicles not found');

      vehicleRepository.find = originalFind;
    });
  });

  describe('Find One', () => {
    it('/vehicles/:term (GET) - get vehicle by ID successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vehicleId);
      expect(response.body.make).toBe(testVehicle.make);
      expect(response.body.vehicleModel).toBe(testVehicle.vehicleModel);
      expect(response.body.year).toBe(testVehicle.year);
      expect(response.body.license_plate).toBe(testVehicle.license_plate);
    });

    it('/vehicles/:term (GET) - get vehicle by license plate successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${testVehicle.license_plate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vehicleId);
      expect(response.body.license_plate).toBe(testVehicle.license_plate);
    });

    it('/vehicles/:term (GET) - vehicle not found by ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('/vehicles/:term (GET) - vehicle not found by license plate', async () => {
      const nonExistentPlate = 'NONEXISTENT-PLATE';
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${nonExistentPlate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('/vehicles/:term (GET) - unauthorized access', async () => {
      const response = await request(app.getHttpServer()).get(
        `/vehicles/${vehicleId}`,
      );

      expect(response.status).toBe(401);
    });

    it('/vehicles/:term (GET) - invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Find My Vehicles', () => {
    it('/vehicles/myVehicles (GET) - get owner vehicles successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles/myVehicles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);

      const vehicle = response.body.find((v) => v.id === vehicleId);
      expect(vehicle).toBeDefined();
      expect(vehicle.make).toBe(testVehicle.make);
      expect(vehicle.vehicleModel).toBe(testVehicle.vehicleModel);
      expect(vehicle.ownerId).toBe(userId);
    });

    it('/vehicles/myVehicles (GET) - unauthorized access', async () => {
      const response = await request(app.getHttpServer()).get(
        '/vehicles/myVehicles',
      );

      expect(response.status).toBe(401);
    });

    it('/vehicles/myVehicles (GET) - invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles/myVehicles')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('/vehicles/myVehicles (GET) - forbidden for non-owner role', async () => {
      const tenantUser = {
        email: `tenant-user-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Tenant User',
        phone: '+573111234567',
        location: 'Test Location',
      };

      const tenantResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(tenantUser);

      const tenantToken = tenantResponse.body.token;
      const tenantId = tenantResponse.body.user.id;

      try {
        const response = await request(app.getHttpServer())
          .get('/vehicles/myVehicles')
          .set('Authorization', `Bearer ${tenantToken}`);

        expect(response.status).toBe(403);
      } finally {
        await userRepository.delete({ id: tenantId });
      }
    });

    it('/vehicles/myVehicles (GET) - no vehicles found for owner', async () => {
      const newOwner = {
        email: `owner-without-vehicles-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'New Owner',
        phone: '+573111234599',
        location: 'Test Location',
      };

      const ownerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newOwner);

      const ownerToken = ownerResponse.body.token;
      const ownerId = ownerResponse.body.user.id;

      await request(app.getHttpServer())
        .post(`/auth/promoteToOwner/${ownerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send();

      try {
        const response = await request(app.getHttpServer())
          .get('/vehicles/myVehicles')
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toContain('not found');
      } finally {
        await userRepository.delete({ id: ownerId });
      }
    });
  });
});
