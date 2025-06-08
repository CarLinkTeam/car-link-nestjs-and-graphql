# CAR LINK - GraphQL API with NestJS

## Authors

> - Alejandro Londoño Bermúdez - A00395978
> - Juan David Colonia Aldana - A00395956
> - Miguel Ángel Gonzalez Arango - A00395687

## Project Overview

CAR LINK is a comprehensive GraphQL API that facilitates car rental processes for private vehicle owners. Built with NestJS, TypeORM, and PostgreSQL, it provides a robust platform where:

- Vehicle owners can register and manage their cars for rental
- Tenants can search, view, and book available vehicles
- Administrators can oversee the entire system

The application leverages GraphQL for efficient data fetching and modern web standards for a scalable, maintainable backend solution.

## Technologies Used

- **Backend Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **API**: GraphQL with Apollo Server
- **Authentication**: JWT with Passport.js
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator and class-transformer
- **Containerization**: Docker & Docker Compose

## Project Setup

```bash
# Clone the repository
git clone https://github.com/CarLinkTeam/car-link-nestjs-and-graphql

# Navigate to project directory
cd car-link-nestjs-and-graphql

# Install dependencies
npm install
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
POSTGRES_DB=car_link_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=2h

# PGAdmin Configuration
PG_PORT=5050
ADMIN_EMAIL=admin@carlink.com
ADMIN_PASSWORD=admin_password
```

## Database Setup

The project uses Docker Compose for easy database setup:

```bash
# Start PostgreSQL and pgAdmin containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

**Database Access:**

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Standard development mode
npm run start
```

**Application URLs:**

- GraphQL Playground: `http://localhost:3000/graphql`
- Swagger Documentation: `http://localhost:3000/api`

## Database Seeding

To populate the database with initial data:

```bash
npm run seed
```

This command creates:

- Sample users with different roles (ADMIN, OWNER, TENANT)
- Sample vehicles
- Sample rentals
- Test data for development

## System Architecture

### Database Schema

The application uses the following main entities:

**Users**

- id (UUID, Primary Key)
- email (Unique)
- password (Hashed)
- fullName
- location
- phone
- isActive (Boolean)
- roles (Array: ADMIN, OWNER, TENANT)

**Vehicles**

- id (UUID, Primary Key)
- make, model, year
- licensePlate (Unique)
- color, transmission, fuelType
- seatingCapacity, pricePerDay
- description, imageUrl
- isAvailable (Boolean)
- ownerId (Foreign Key to Users)

**Rentals**

- id (UUID, Primary Key)
- initialDate, finalDate
- totalCost
- status (pending, confirmed, cancelled, completed)
- client_id (Foreign Key to Users)
- vehicle_id (Foreign Key to Vehicles)

**VehicleUnavailability**

- id (UUID, Primary Key)
- unavailable_from, unavailable_to
- reason
- vehicle_id (Foreign Key to Vehicles)

### Authentication and Authorization

The system implements JWT-based authentication with three role levels:

1. **ADMIN**: Full system access, user management, system oversight
2. **OWNER**: Vehicle management, rental confirmations/rejections
3. **TENANT**: Vehicle browsing, rental requests, profile management

**Authentication Flow:**

1. User registers or logs in
2. Server generates JWT token with user info and roles
3. Client includes token in GraphQL requests
4. Guards validate token and check role permissions

## GraphQL API Documentation

### Authentication Operations

**Register User**

```graphql
mutation RegisterUser($registerInput: CreateUserDto!) {
  register(registerInput: $registerInput) {
    user {
      id
      email
      fullName
      location
      phone
      roles
      isActive
    }
    token
  }
}
```

**Input Type: CreateUserDto**

```typescript
{
  email: string; // Valid email address
  password: string; // Minimum 6 characters
  fullName: string; // User's full name
  location: string; // User's location
  phone: string; // Contact phone number
}
```

**Login User**

```graphql
mutation LoginUser($loginInput: LoginUserDto!) {
  login(loginInput: $loginInput) {
    user {
      id
      email
      fullName
      roles
    }
    token
  }
}
```

**Input Type: LoginUserDto**

```typescript
{
  email: string; // Registered email
  password: string; // User password
}
```

### User Management Operations

**Get My Profile** (All authenticated users)

```graphql
query GetMyProfile {
  getMyProfile {
    user {
      id
      email
      fullName
      location
      phone
      roles
      isActive
    }
  }
}
```

**Update My Profile** (All authenticated users)

```graphql
mutation UpdateMyProfile($updateInput: UpdateUserDto!) {
  updateMyProfile(updateInput: $updateInput) {
    user {
      id
      email
      fullName
      location
      phone
    }
  }
}
```

**Get All Users** (Admin only)

```graphql
query FindAllUsers {
  findAllUsers {
    users {
      id
      email
      fullName
      location
      phone
      roles
      isActive
    }
  }
}
```

**Update User** (Admin only)

```graphql
mutation UpdateUser($id: String!, $updateInput: UpdateUserDto!) {
  updateUser(id: $id, updateInput: $updateInput) {
    user {
      id
      email
      fullName
      roles
    }
  }
}
```

**Input Type: UpdateUserDto**

```typescript
{
  email?: string         // Optional: New email
  fullName?: string      // Optional: New full name
  location?: string      // Optional: New location
  phone?: string         // Optional: New phone
  roles?: string[]       // Optional: New roles (Admin only)
}
```

### Vehicle Management Operations

**Create Vehicle** (Owner, Admin)

```graphql
mutation CreateVehicle($createInput: CreateVehicleDto!) {
  createVehicle(createInput: $createInput) {
    vehicle {
      id
      make
      model
      year
      licensePlate
      color
      transmission
      fuelType
      seatingCapacity
      pricePerDay
      description
      imageUrl
      isAvailable
      owner {
        id
        fullName
      }
    }
  }
}
```

**Input Type: CreateVehicleDto**

```typescript
{
  make: string           // Vehicle manufacturer
  model: string          // Vehicle model
  year: number           // Manufacturing year
  licensePlate: string   // Unique license plate
  color: string          // Vehicle color
  transmission: string   // Manual/Automatic
  fuelType: string       // Gasoline/Diesel/Electric/Hybrid
  seatingCapacity: number // Number of seats
  pricePerDay: number    // Daily rental price
  description?: string   // Optional description
  imageUrl?: string      // Optional image URL
}
```

**Get Available Vehicles** (All authenticated users)

```graphql
query FindAvailableVehicles(
  $paginationArgs: PaginationArgs
  $searchArgs: SearchVehicleArgs
) {
  findAvailableVehicles(
    paginationArgs: $paginationArgs
    searchArgs: $searchArgs
  ) {
    vehicles {
      id
      make
      model
      year
      licensePlate
      color
      transmission
      fuelType
      seatingCapacity
      pricePerDay
      description
      imageUrl
      isAvailable
      owner {
        fullName
        location
        phone
      }
    }
    totalCount
    hasNextPage
    hasPreviousPage
  }
}
```

**Get My Vehicles** (Owner, Admin)

```graphql
query FindMyVehicles {
  findMyVehicles {
    vehicles {
      id
      make
      model
      year
      licensePlate
      pricePerDay
      isAvailable
    }
  }
}
```

**Update Vehicle** (Owner of vehicle, Admin)

```graphql
mutation UpdateVehicle($id: String!, $updateInput: UpdateVehicleDto!) {
  updateVehicle(id: $id, updateInput: $updateInput) {
    vehicle {
      id
      make
      model
      pricePerDay
      isAvailable
    }
  }
}
```

### Rental Management Operations

**Create Rental** (Tenant, Admin)

```graphql
mutation CreateRental($createInput: CreateRentalDto!) {
  createRental(createInput: $createInput) {
    rental {
      id
      initialDate
      finalDate
      totalCost
      status
      client {
        fullName
        phone
      }
      vehicle {
        make
        model
        licensePlate
        pricePerDay
      }
    }
  }
}
```

**Input Type: CreateRentalDto**

```typescript
{
  vehicle_id: string; // ID of vehicle to rent
  initialDate: string; // Start date (ISO format)
  finalDate: string; // End date (ISO format)
  totalCost: number; // Total rental cost
}
```

**Get My Rentals** (Tenant, Admin)

```graphql
query FindMyRentals {
  findMyRentals {
    rentals {
      id
      initialDate
      finalDate
      totalCost
      status
      vehicle {
        make
        model
        licensePlate
        owner {
          fullName
          phone
        }
      }
    }
  }
}
```

**Get My Owner Rentals** (Owner, Admin)

```graphql
query FindMyOwnerRentals {
  findMyOwnerRentals {
    rentals {
      id
      initialDate
      finalDate
      totalCost
      status
      client {
        fullName
        phone
        email
      }
      vehicle {
        make
        model
        licensePlate
      }
    }
  }
}
```

**Confirm Rental** (Owner of vehicle, Admin)

```graphql
mutation ConfirmRental($id: String!) {
  confirmRental(id: $id) {
    message
    rental {
      id
      status
      client {
        fullName
      }
      vehicle {
        make
        model
      }
    }
  }
}
```

**Reject Rental** (Owner of vehicle, Admin)

```graphql
mutation RejectRental($id: String!) {
  rejectRental(id: $id) {
    message
    rental {
      id
      status
    }
  }
}
```

**Update Rental** (Tenant who created it, Admin)

```graphql
mutation UpdateRental($id: String!, $updateInput: UpdateRentalDto!) {
  updateRental(id: $id, updateInput: $updateInput) {
    rental {
      id
      initialDate
      finalDate
      totalCost
      status
    }
  }
}
```

**Input Type: UpdateRentalDto**

```typescript
{
  vehicle_id?: string    // Optional: Change vehicle
  initialDate?: string   // Optional: Change start date
  finalDate?: string     // Optional: Change end date
  totalCost?: number     // Optional: Update total cost
}
```

## Error Handling

The GraphQL API returns structured errors with the following format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "extensions": {
        "code": "ERROR_CODE",
        "exception": {
          "stacktrace": ["..."]
        }
      },
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["fieldName"]
    }
  ],
  "data": null
}
```

**Common Error Codes:**

- `UNAUTHENTICATED`: User not logged in
- `FORBIDDEN`: Insufficient permissions
- `BAD_REQUEST`: Invalid input data
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## Security Features

**Authentication Guards:**

- JWT token validation
- Role-based access control
- GraphQL context authentication

**Data Validation:**

- Input validation using DTOs
- TypeORM entity validation
- Custom validation pipes

**Security Measures:**

- Password hashing with bcrypt
- SQL injection protection via TypeORM
- CORS configuration
- Input sanitization

## Development Features

**Code Quality:**

- TypeScript for type safety
- ESLint and Prettier configuration
- Modular architecture with NestJS
- Dependency injection

**Documentation:**

- GraphQL schema introspection
- Swagger/OpenAPI documentation
- Code comments and type definitions

## Deployment Considerations

**Environment Variables:**
Ensure all required environment variables are set in production:

- Database connection strings
- JWT secrets
- CORS origins
- Port configuration

**Production Build:**

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## Conclusion

CAR LINK provides a complete GraphQL solution for car rental management with robust authentication, authorization, and data management capabilities. The NestJS architecture ensures scalability and maintainability while GraphQL provides efficient data fetching and real-time capabilities.

The system is designed to handle complex rental workflows, user management, and vehicle tracking while maintaining security and performance standards suitable for production environments.
