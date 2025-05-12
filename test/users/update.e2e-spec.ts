import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';

describe('Users - Update (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let adminToken: string;
    let tenantToken: string;
    let otherTenantToken: string;
    let adminUserId: string;
    let tenantUserId: string;
    let otherTenantUserId: string;

    const tenantUser = {
        email: `tenant-find-one-test-user-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Test User',
        phone: '+573111234568',
        location: 'Test Location',
    };

    const otherTenantUser = {
        email: `other-find-one-test-user-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Test User',
        phone: '+573111234568',
        location: 'Test Location',
    };

    const adminUser = {
        email: `admin-find-one-test-user-${Date.now()}@example.com`,
        password: 'Test1234',
        fullName: 'Test User',
        phone: '+573111234568',
        location: 'Test Location',
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

        userRepository = app.get<Repository<User>>(getRepositoryToken(User));
        const httpServer = app.getHttpServer();

        // Register users
        const admin = await request(httpServer).post('/auth/register').send(adminUser);

        const tenant = await request(httpServer).post('/auth/register').send(tenantUser);

        const otherTenant = await request(httpServer).post('/auth/register').send(otherTenantUser);

        adminUserId = admin.body.user.id;
        tenantUserId = tenant.body.user.id;
        otherTenantUserId = otherTenant.body.user.id;
        
        userRepository.update(adminUserId, {
            roles: [ValidRoles.ADMIN],
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

        const otherTenantLogin = await request(httpServer).post('/auth/login').send({
            email: otherTenantUser.email,
            password: otherTenantUser.password,
        });

        adminToken = adminLogin.body.token;
        tenantToken = tenantLogin.body.token;
        otherTenantToken = otherTenantLogin.body.token;


  }, 10000);

    afterAll(async () => {
        await userRepository.delete({ id: adminUserId });
        await userRepository.delete({ id: tenantUserId });
        await userRepository.delete({ id: otherTenantUserId });
        await app.close();
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/users/${tenantUserId}`)
            .send({ fullName: 'New Name' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Unauthorized');
    });

    it('admin can edit itself', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/users/${adminUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ fullName: 'Admin Updated' });

        expect(res.status).toBe(200);
        expect(res.body.fullName).toBe('Admin Updated');
    });

    it('admin can edit a tenant', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/users/${tenantUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ fullName: 'Tenant Updated' });

        expect(res.status).toBe(200);
        expect(res.body.fullName).toBe('Tenant Updated');
    });

    it('tenant can edit itself', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/users/${tenantUserId}`)
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ location: 'New City' });

        expect(res.status).toBe(200);
        expect(res.body.location).toBe('New City');
    });

    it('tenant cannot edit another tenant', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/users/${otherTenantUserId}`)
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ fullName: 'Hacked!' });

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch("You are not allowed to update this user");
    });

    it('tenant cannot edit an admin', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/users/${adminUserId}`)
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ fullName: 'Nope' });

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch("You are not allowed to update this user");
    });

    it('should return 404 for nonexistent user', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';

        const res = await request(app.getHttpServer())
            .patch(`/users/${fakeId}`)
            .set('Authorization', `Bearer ${tenantToken}`)
            .send({ fullName: 'Ghost' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe(`User with ID ${fakeId} not found or inactive`);
    });
});
