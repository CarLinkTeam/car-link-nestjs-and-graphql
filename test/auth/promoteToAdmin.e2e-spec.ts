import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';

describe('Auth - Promote To Admin (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    const adminUser = {
        email: `admin-to-admin-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Admin',
        phone: '+573111111111',
        location: 'Admin Location',
    };

    const tenantUser = {
        email: `tenant-to-admin-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Tenant',
        phone: '+573122222222',
        location: 'Tenant Location',
    };

    const ownerUser = {
        email: `owner-to-admin-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Owner',
        phone: '+573133333333',
        location: 'Other Location',
    };

    let adminToken: string;
    let tenantToken: string;
    let ownerToken: string;

    let adminUserId: string;
    let tenantUserId: string;
    let ownerUserId: string;

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

        userRepository = app.get<Repository<User>>(getRepositoryToken(User));

        const httpServer = app.getHttpServer();

        // Register users
        const admin = await request(httpServer).post('/auth/register').send(adminUser);
        const tenant = await request(httpServer).post('/auth/register').send(tenantUser);
        const owner = await request(httpServer).post('/auth/register').send(ownerUser);


        adminUserId = admin.body.user.id;
        tenantUserId = tenant.body.user.id;
        ownerUserId = owner.body.user.id;

        await userRepository.update(adminUserId, {
            roles: [ValidRoles.ADMIN],
        });

        await userRepository.update(ownerUserId, {
            roles: [ValidRoles.OWNER],
        });

        // Login users
        const adminLogin = await request(httpServer).post('/auth/login').send({
            email: adminUser.email,
            password: adminUser.password,
        });

        const tenantLogin = await request(httpServer).post('/auth/login').send({
            email: tenantUser.email,
            password: tenantUser.password,
        });

        const ownerLogin = await request(httpServer).post('/auth/login').send({
            email: ownerUser.email,
            password: ownerUser.password,
        });
        
        adminToken = adminLogin.body.token;
        tenantToken = tenantLogin.body.token;
        ownerToken = ownerLogin.body.token;
  }, 10000);

    afterAll(async () => {
        await userRepository.delete({ id: adminUserId });
        await userRepository.delete({ id: tenantUserId });
        await userRepository.delete({ id: ownerUserId });
        await app.close();
    });


it('should NOT allow an admin to promote themselves', async () => {
  const response = await request(app.getHttpServer())
    .post(`/auth/promoteToAdmin/${adminUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(400);

  expect(response.body.message).toBe(`User already has role ADMIN`);
});

it('should NOT allow a tenant to promote another user to admin', async () => {
  const response = await request(app.getHttpServer())
    .post(`/auth/promoteToAdmin/${ownerUserId}`)
    .set('Authorization', `Bearer ${tenantToken}`)
    .expect(403);

  expect(response.body.message).toBe(`User ${tenantUser.email} needs a valid role`);
});

it('should NOT allow an owner to promote another user to admin', async () => {
  const response = await request(app.getHttpServer())
    .post(`/auth/promoteToAdmin/${tenantUserId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .expect(403);

  expect(response.body.message).toBe(`User ${ownerUser.email} needs a valid role`);
});

    it('should allow an admin to promote another user to admin', async () => {
  const response = await request(app.getHttpServer())
    .post(`/auth/promoteToAdmin/${tenantUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(201);

  expect(response.body.message).toBe(`User promoted to ${ValidRoles.ADMIN}`);
  expect(response.body.user.roles).toContain(ValidRoles.ADMIN);
});


});
