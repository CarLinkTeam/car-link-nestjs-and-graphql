import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { Review } from '../reviews/entities/review.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehicleUnavailability)
    private readonly unavailabilityRepository: Repository<VehicleUnavailability>,
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async seedDatabase() {
    await this.clearDatabase();
    const users = await this.seedUsers();
    const vehicles = await this.seedVehicles(users);
    await this.seedUnavailabilities(vehicles);
    const rentals = await this.seedRentals(users, vehicles);
    await this.seedReviews(rentals);
  }

  private async clearDatabase() {
    await Promise.all([
      this.reviewRepository.delete({}),
      this.rentalRepository.delete({}),
      this.unavailabilityRepository.delete({}),
      this.vehicleRepository.delete({}),
      this.userRepository.delete({}),
    ]);
  }

  private async seedUsers(): Promise<User[]> {
    const usersData = [
      {
        email: 'admin@carlink.com',
        password: 'admin123',
        fullName: 'Administrador',
        location: 'Cali, Colombia',
        phone: '+57123456789',
        roles: ['ADMIN'],
        isActive: true,
      },
      {
        email: 'propietario1@carlink.com',
        password: 'propietario',
        fullName: 'Ana López',
        location: 'Palmira, Colombia',
        phone: '+57987654321',
        roles: ['OWNER'],
        isActive: true,
      },
      {
        email: 'propietario2@carlink.com',
        password: 'propietario',
        fullName: 'Juan García',
        location: 'Cali, Colombia',
        phone: '+57654321098',
        roles: ['OWNER'],
        isActive: true,
      },
      {
        email: 'cliente1@carlink.com',
        password: 'cliente',
        fullName: 'María Rodríguez',
        location: 'Cali, Colombia',
        phone: '+57789123456',
        roles: ['TENANT'],
        isActive: true,
      },
      {
        email: 'cliente2@carlink.com',
        password: 'cliente',
        fullName: 'David Sánchez',
        location: 'Palmira, Colombia',
        phone: '+57678901234',
        roles: ['TENANT'],
        isActive: true,
      },
    ];

    const users = await Promise.all(
      usersData.map(async (userData) => {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        const user = this.userRepository.create({
          ...userData,
          password: hashedPassword,
        });
        return this.userRepository.save(user);
      }),
    );

    console.log(`Created ${users.length} users`);
    return users;
  }

  private async seedVehicles(users: User[]): Promise<Vehicle[]> {
    const owners = users.filter((user) => user.roles.includes('OWNER'));
    const vehiclesData = [
      {
        ownerId: owners[0].id,
        vehicleModel: 'Corolla Híbrido',
        make: 'Toyota',
        color: 'Blanco Perla',
        year: 2023,
        license_plate: 'JZT-123',
        url_photos: [
          'https://ejemplo.com/vehiculos/corolla1.jpg',
          'https://ejemplo.com/vehiculos/corolla2.jpg',
          'https://ejemplo.com/vehiculos/corolla3.jpg',
        ],
        daily_price: 180000,
        rental_conditions:
          'Prohibido fumar. Se admiten mascotas con costo adicional de $20.000/día. Mínimo 2 días de alquiler.',
        class: 'Sedán Híbrido',
        drive: 'Delantera',
        fuel_type: 'Híbrido',
        transmission: 'Automático (CVT)',
        combination_mpg: 25,
        displacement: 2.5,
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'A3 Sportback',
        make: 'Audi',
        color: 'Gris Nardo',
        year: 2022,
        license_plate: 'UYL-456',
        url_photos: [
          'https://ejemplo.com/vehiculos/audi1.jpg',
          'https://ejemplo.com/vehiculos/audi2.jpg',
          'https://ejemplo.com/vehiculos/audi3.jpg',
        ],
        daily_price: 310000,
        rental_conditions:
          'Prohibido fumar. Se entrega con tanque lleno. Límite diario de 250 km. Exceso de km: $800/km.',
        class: 'Compacto Premium',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (7 velocidades)',
        combination_mpg: 18,
        displacement: 1.5,
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Kuga Titanium',
        make: 'Ford',
        color: 'Azul Metálico',
        year: 2021,
        license_plate: 'GRP-789',
        url_photos: [
          'https://ejemplo.com/vehiculos/kuga1.jpg',
          'https://ejemplo.com/vehiculos/kuga2.jpg',
          'https://ejemplo.com/vehiculos/kuga3.jpg',
        ],
        daily_price: 260000,
        rental_conditions:
          'Uso permitido en carretera pavimentada. Prohibido uso off-road. Se admiten mascotas sin costo.',
        class: 'SUV Familiar',
        drive: 'Tracción integral',
        fuel_type: 'Diésel',
        transmission: 'Automático (8 velocidades)',
        combination_mpg: 20,
        displacement: 2.0,
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Berlingo',
        make: 'Citroën',
        color: 'Blanco',
        year: 2022,
        license_plate: 'QWE-234',
        url_photos: [
          'https://ejemplo.com/vehiculos/berlingo1.jpg',
          'https://ejemplo.com/vehiculos/berlingo2.jpg',
          'https://ejemplo.com/vehiculos/berlingo3.jpg',
        ],
        daily_price: 220000,
        rental_conditions:
          'Ideal para mudanzas o carga. Capacidad: 1 tonelada. Se requiere depósito de $500.000.',
        class: 'Furgoneta Compacta',
        drive: 'Delantera',
        fuel_type: 'Diésel',
        transmission: 'Manual (6 velocidades)',
        combination_mpg: 22,
        displacement: 1.5,
      },
    ];

    const vehicles = await Promise.all(
      vehiclesData.map((vehicleData) => {
        const vehicle = this.vehicleRepository.create({
          ...vehicleData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return this.vehicleRepository.save(vehicle);
      }),
    );

    console.log(`Created ${vehicles.length} vehicles`);
    return vehicles;
  }

  private async seedUnavailabilities(
    vehicles: Vehicle[],
  ): Promise<VehicleUnavailability[]> {
    const unavailabilitiesData = vehicles.flatMap((vehicle) => [
      {
        vehicle_id: vehicle.id,
        unavailable_from: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        unavailable_to: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        reason: 'Mantenimiento programado',
      },
      {
        vehicle_id: vehicle.id,
        unavailable_from: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        unavailable_to: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        reason: 'Uso personal del propietario',
      },
      {
        vehicle_id: vehicle.id,
        unavailable_from: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        unavailable_to: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        reason: 'Detalles programados',
      },
    ]);

    const unavailabilities = await Promise.all(
      unavailabilitiesData.map((data) => {
        const unavailability = this.unavailabilityRepository.create(data);
        return this.unavailabilityRepository.save(unavailability);
      }),
    );

    console.log(`Created ${unavailabilities.length} unavailabilities`);
    return unavailabilities;
  }

  private async seedRentals(
    users: User[],
    vehicles: Vehicle[],
  ): Promise<Rental[]> {
    const tenants = users.filter((user) => user.roles.includes('TENANT'));
    const rentalsData = [
      {
        client_id: tenants[0].id,
        vehicle_id: vehicles[0].id,
        initialDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        finalDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        totalCost: vehicles[0].daily_price * 3,
        status: 'COMPLETED',
      },
      {
        client_id: tenants[0].id,
        vehicle_id: vehicles[1].id,
        initialDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        finalDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        totalCost: vehicles[1].daily_price * 3,
        status: 'CONFIRMED',
      },
      {
        client_id: tenants[1].id,
        vehicle_id: vehicles[2].id,
        initialDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        finalDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        totalCost: vehicles[2].daily_price * 3,
        status: 'COMPLETED',
      },
    ];

    const rentals = await Promise.all(
      rentalsData.map((data) => {
        const rental = this.rentalRepository.create(data);
        return this.rentalRepository.save(rental);
      }),
    );

    console.log(`Created ${rentals.length} rentals`);
    return rentals;
  }

  private async seedReviews(rentals: Rental[]): Promise<Review[]> {
    const reviewTexts = [
      '¡Excelente vehículo y proceso de alquiler muy sencillo!',
      'El coche estaba impecable y tal como se describía.',
      'Tuve un pequeño problema pero el propietario lo resolvió rápidamente.',
      'Perfecto para nuestras vacaciones familiares.',
      'Sin duda lo alquilaría nuevamente con este propietario.',
      'El proceso de recogida podría mejorar.',
      'Consumo de combustible excelente para un coche de este tamaño.',
      'Muy cómodo incluso en trayectos largos.',
      'El propietario fue muy atento y respondió rápido a los mensajes.',
      'Algunos rasguños menores no mencionados en el anuncio.',
    ];

    const reviewsData = rentals.map((rental) => ({
      rental_id: rental.id,
      rating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5
      comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
    }));

    const reviews = await Promise.all(
      reviewsData.map((data) => {
        const review = this.reviewRepository.create(data);
        return this.reviewRepository.save(review);
      }),
    );

    console.log(`Created ${reviews.length} reviews`);
    return reviews;
  }
}
