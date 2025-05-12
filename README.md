# CAR LINK API - NestJS Implementation

## Authors

> - Alejandro Londoño Bermúdez - A00395978
> - Juan David Colonia Aldana - A00395956
> - Miguel Ángel Gonzalez Arango - A00395687

## Project Overview

The CAR LINK API facilitates car rental processes for private vehicle owners. It provides a comprehensive platform where owners can register and rent their vehicles, tenants can search and book rentals, and administrators can manage the overall system.

This version is implemented using NestJS, TypeORM, and PostgreSQL, providing a robust, scalable, and maintainable backend solution.

## Project Setup

```bash
# Install dependencies
$ npm install
```

## Running the Application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

# seed the database with initial data
$ npm run seed
```

## Running Tests

```bash
# unit tests
$ npm run test:unit

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Setting Up the Database

The project uses Docker Compose to set up a PostgreSQL database and pgAdmin for database management:

```bash
# Start the database and pgAdmin
docker-compose up -d
```

Make sure to create a `.env` file with the following environment variables:

```
# Database
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
DB_HOST=
DB_PORT=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# PGAdmin
PG_PORT=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## API Documentation

The purpose of this API is to facilitate the car rental process for private owners who wish to rent out their vehicles.

### Authentication and Authorization

The API uses JWT-based authentication with role-based access control. There are three user roles:

1. **Administrator**: Full access to manage users, roles, and oversee the system
2. **Owner**: Can register vehicles, manage rental listings, and update vehicle information
3. **Tenant**: Can search for available rentals, view details, and book vehicles

Authentication is implemented using:

- Passport.js with JWT strategy
- Custom guards and decorators for role-based protection
- Bcrypt for password hashing
- JWT tokens for secure user sessions

### Database Persistence

The application uses:

- TypeORM for database ORM
- PostgreSQL as the relational database
- Entity-based data modeling with relationships
- Database migrations for version control
- Data validation using DTOs and class-validator

## API Endpoints

### 1. Authentication Routes

| **Route**                  | **Method** | **Description**                  | **Request Body**                                 | **Response**        |
| -------------------------- | ---------- | -------------------------------- | ------------------------------------------------ | ------------------- |
| `/auth/register`           | POST       | Registers a new user account     | `{ email, password, fullName, location, phone }` | `{ user, token }`   |
| `/auth/login`              | POST       | Logs in an existing user         | `{ email, password }`                            | `{ user, token }`   |
| `/auth/promoteToOwner/:id` | POST       | Assigns the OWNER role to a user | -                                                | Updated user object |
| `/auth/promoteToAdmin/:id` | POST       | Assigns the ADMIN role to a user | -                                                | Updated user object |

### 2. Users Routes

| **Route**    | **Method** | **Description**                  | **Request Body/Params**      | **Response**    |
| ------------ | ---------- | -------------------------------- | ---------------------------- | --------------- |
| `/users`     | GET        | Retrieves all users (ADMIN only) | -                            | Array of users  |
| `/users/:id` | GET        | Retrieves a specific user        | `id` (path param)            | User object     |
| `/users/:id` | PATCH      | Updates a user                   | `id` (path param), User data | Updated user    |
| `/users/:id` | DELETE     | Deletes a user                   | `id` (path param)            | Success message |

### 3. Vehicles Routes

| **Route**              | **Method** | **Description**                    | **Request Body/Params**         | **Response**      |
| ---------------------- | ---------- | ---------------------------------- | ------------------------------- | ----------------- |
| `/vehicles`            | POST       | Creates a new vehicle (OWNER only) | Vehicle details                 | Created vehicle   |
| `/vehicles`            | GET        | Retrieves all vehicles             | Query params for filtering      | Array of vehicles |
| `/vehicles/myVehicles` | GET        | Retrieves user vehicles            | Query params for filtering      | Array of vehicles |
| `/vehicles/:term`      | GET        | Retrieves a specific vehicle       | `term` (path param)             | Vehicle object    |
| `/vehicles/:id`        | PATCH      | Updates a vehicle                  | `id` (path param), Vehicle data | Updated vehicle   |
| `/vehicles/:id`        | DELETE     | Deletes a vehicle                  | `id` (path param)               | Success message   |

### 4. Rentals Routes

| **Route**              | **Method** | **Description**             | **Request Body/Params**        | **Response**     |
| ---------------------- | ---------- | --------------------------- | ------------------------------ | ---------------- |
| `/rentals`             | POST       | Creates a new rental        | Rental details                 | Created rental   |
| `/rentals`             | GET        | Retrieves all rentals       | Query params for filtering     | Array of rentals |
| `/rentals/:term`       | GET        | Retrieves a specific rental | `term` (path param)            | Rental object    |
| `/rentals/:id`         | PATCH      | Updates a rental            | `id` (path param), Rental data | Updated rental   |
| `/rentals/:id`         | DELETE     | Deletes a rental            | `id` (path param)              | Success message  |
| `/rentals/:id/confirm` | PATCH      | Confirms a rental request   | `id` (path param)              | Updated rental   |
| `/rentals/:id/reject`  | PATCH      | Rejects a rental request    | `id` (path param)              | Updated rental   |

### 5. Reviews Routes

| **Route**        | **Method** | **Description**             | **Request Body/Params**        | **Response**     |
| ---------------- | ---------- | --------------------------- | ------------------------------ | ---------------- |
| `/reviews`       | POST       | Creates a new review        | Review details                 | Created review   |
| `/reviews`       | GET        | Retrieves all reviews       | Query params for filtering     | Array of reviews |
| `/reviews/:term` | GET        | Retrieves a specific review | `term` (path param)            | Review object    |
| `/reviews/:id`   | PATCH      | Updates a review            | `id` (path param), Review data | Updated review   |
| `/reviews/:id`   | DELETE     | Deletes a review            | `id` (path param)              | Success message  |

## Implementation Details

### Authentication Implementation

Authentication is implemented using JWT tokens. When a user registers or logs in, a JWT token is generated with user information (id, roles). This token must be included in subsequent API requests in the Authorization header:

```
Authorization: Bearer <token>
```

Role-based authorization is implemented using custom decorators:

```typescript
@Auth(ValidRoles.ADMIN)  // Requires admin role
@Auth(ValidRoles.OWNER)  // Requires owner role
@Auth(ValidRoles.TENANT)  // Requires tenant role
@Auth()                 // Requires authentication (any role)
```

### Database Implementation

The application uses TypeORM with PostgreSQL for data persistence. Entity relationships:

- Users have many Vehicles (one-to-many)
- Rental have one Review (one-to-one)
- Vehicles have many Rentals (one-to-many)
- Vehicles have many unavailabilities (one-to-many)

Each entity has validation rules implemented through DTOs and TypeORM decorations.

## Technical Architecture

The application follows the NestJS modular architecture:

- Controllers handle HTTP requests and responses
- Services contain business logic
- Entities define database models
- DTOs validate input/output data
- Guards protect routes based on authentication/authorization
- Decorators provide metadata for routes and methods

## Conclusion and Next Steps

The CAR LINK API provides a comprehensive solution for car rental management with proper authentication, authorization, and data persistence. The NestJS implementation ensures a scalable and maintainable codebase.

Future enhancements could include:

1. API rate limiting
2. Enhanced logging and monitoring
3. Payment integration
4. Real-time notifications
5. Extended vehicle information integration with external APIs
