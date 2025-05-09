import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { Review } from '../../src/reviews/entities/review.entity';
import { Rental } from '../../src/rentals/entities/rental.entity';
import { User } from '../../src/users/entities/user.entity';
import { Vehicle } from '../../src/vehicles/entities/vehicle.entity';

describe('ReviewsModule Delete (e2e)', () => {
  let app: INestApplication;
  let reviewRepository: Repository<Review>;
  let rentalRepository: Repository<Rental>;
  let userRepository: Repository<User>;
  let vehicleRepository: Repository<Vehicle>;
  let authToken: string;
  let userId: string;
  let vehicleId: string;
  let rentalId: string;
  let reviewId: string;

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

  const validReviewDto = {
    rating: 5,
    comment: 'Excellent service and vehicle!',
    createdAt: new Date(Date.now()).toISOString(),
    rental_id: '',
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

    reviewRepository = app.get<Repository<Review>>(getRepositoryToken(Review));
    rentalRepository = app.get<Repository<Rental>>(getRepositoryToken(Rental));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    vehicleRepository = app.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
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
    validReviewDto.rental_id = rentalId;

    // Create test review
    const reviewResponse = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validReviewDto);

    reviewId = reviewResponse.body.id;
  });

  afterAll(async () => {
    await rentalRepository.delete({ client_id: userId });
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  it('/reviews/:id (DELETE) - no authentication', async () => {
    const response = await request(app.getHttpServer()).delete(
      `/reviews/${reviewId}`,
    );

    expect(response.status).toBe(401);
  });

  it('/reviews/:id (DELETE) - invalid review id', async () => {
    const response = await request(app.getHttpServer())
      .delete('/reviews/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  it('/reviews/:id (DELETE) - non-existent review id', async () => {
    const response = await request(app.getHttpServer())
      .delete('/reviews/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  it('/reviews/:id (DELETE) - valid review deletion', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verify review was deleted
    const checkResponse = await request(app.getHttpServer())
      .get(`/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkResponse.status).toBe(404);
  });
});
