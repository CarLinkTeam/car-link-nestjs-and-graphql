import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as request from 'supertest';
import { AppModule } from "../../src/app.module";
import { User } from "../../src/users/entities/user.entity";
import { Repository } from "typeorm";



describe('AuthModule Register (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    const testUser = {
        email: `register-test-user-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Test User',
        phone: '+573111234568',
        location: 'Test Location',
    };

    beforeEach(async () => {
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
        userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  }, 10000);

    afterEach(async () => {
        await userRepository.delete({ email: testUser.email });
        await app.close();
    });

    it('/auth/register (POST) - no body', async () => {
        const response = await request(app.getHttpServer()).post('/auth/register');

        const errorMessages = [
            "email must be an email",
            "email must be a string",
            "The password must have a Uppercase, lowercase letter and a number",
            "password must be longer than or equal to 6 characters",
            "password must be shorter than or equal to 50 characters",
            "password must be a string",
            "fullName must be a string"
        ];

        expect(response.status).toBe(400);
        errorMessages.forEach((message) => {
            expect(response.body.message).toContain(message);
        });
    });

    it('/auth/register (POST) - same email', async () => {
        await request(app.getHttpServer()).post('/auth/register').send(testUser);

        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testUser);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: `Key (email)=(${testUser.email}) already exists.`,
            error: 'Bad Request',
            statusCode: 400,
        });
    });

    it('/auth/register (POST) - unsafe password', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                ...testUser,
                password: 'abc123',
            });

        const errorMessages = [
            'The password must have a Uppercase, lowercase letter and a number',
        ];
        expect(response.status).toBe(400);
        errorMessages.forEach((message) => {
            expect(response.body.message).toContain(message);
        });
    });

    it('/auth/register (POST) - valid credentials', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testUser);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            user: {
                email: testUser.email,
                fullName: testUser.fullName,
                id: expect.any(String),
                isActive: true,
                location: testUser.location,
                phone: testUser.phone,
                roles: ['TENANT'],
            },
            token: expect.any(String),
        });
    });
});