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
        password: 'admin',
        fullName: 'Administrador',
        location: 'New York, CO',
        phone: '+12125551234',
        roles: ['ADMIN'],
        isActive: true,
        profilePhoto: 'https://example.com/profiles/admin.jpg',
      },
      {
        email: 'owner1@carlink.com',
        password: 'owner',
        fullName: 'Maria Garcia',
        location: 'Los Angeles, CO',
        phone: '+13105556789',
        roles: ['OWNER'],
        isActive: true,
        profilePhoto: 'https://example.com/profiles/maria.jpg',
        bio: 'Car enthusiast with 5 years experience renting vehicles',
      },
      {
        email: 'owner2@carlink.com',
        password: 'owner',
        fullName: 'James Wilson',
        location: 'Chicago, CO',
        phone: '+17735551234',
        roles: ['OWNER'],
        isActive: true,
        profilePhoto: 'https://example.com/profiles/james.jpg',
        bio: 'Professional car rental business owner',
      },
      {
        email: 'tenant1@carlink.com',
        password: 'tenant',
        fullName: 'Sarah Miller',
        location: 'Miami, CO',
        phone: '+13055551234',
        roles: ['TENANT'],
        isActive: true,
        profilePhoto: 'https://example.com/profiles/sarah.jpg',
        driverLicense: 'DL12345678',
        verified: true,
      },
      {
        email: 'tenant2@carlink.com',
        password: 'tenant',
        fullName: 'David Kim',
        location: 'Seattle, CO',
        phone: '+12065551234',
        roles: ['TENANT'],
        isActive: true,
        profilePhoto: 'https://example.com/profiles/david.jpg',
        driverLicense: 'DL87654321',
        verified: true,
      },
    ];

    const users = await Promise.all(
      usersData.map(async (userData) => {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        const user = this.userRepository.create({
          ...userData,
          password: hashedPassword,
          isActive: true,
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
        vehicleModel: 'Camry XSE',
        make: 'Toyota',
        color: 'Ruby Flare Pearl',
        year: 2022,
        license_plate: 'NYC-1234',
        url_photos: [
          'https://example.com/vehicles/camry1.jpg',
          'https://example.com/vehicles/camry2.jpg',
          'https://example.com/vehicles/camry3.jpg',
        ],
        daily_price: 65.99,
        weekly_price: 400.0,
        monthly_price: 1500.0,
        rental_conditions:
          'No smoking. Pets allowed with $20 fee. Minimum rental period: 2 days.',
        class: 'Midsize Sedan',
        drive: 'FWD',
        fuel_type: 'Gasoline',
        transmission: 'Automatic (8-speed)',
        combination_mpg: 32,
        displacement: 2.5,
        seats: 5,
        doors: 4,
        features: [
          'Apple CarPlay/Android Auto',
          'Heated seats',
          'Blind spot monitoring',
          'Sunroof',
        ],
        insurance_coverage: {
          collision: true,
          theft: true,
          liability: true,
          deductible: 500,
        },
        location: 'New York, NY',
        available: true,
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Model 3 Long Range',
        make: 'Tesla',
        color: 'Pearl White Multi-Coat',
        year: 2023,
        license_plate: 'CA-TESLA',
        url_photos: [
          'https://example.com/vehicles/tesla1.jpg',
          'https://example.com/vehicles/tesla2.jpg',
          'https://example.com/vehicles/tesla3.jpg',
        ],
        daily_price: 99.99,
        weekly_price: 600.0,
        monthly_price: 2200.0,
        rental_conditions:
          'No smoking. Must return with at least 20% charge. Free Supercharging included.',
        class: 'Electric Sedan',
        drive: 'AWD',
        fuel_type: 'Electric',
        transmission: 'Automatic (Single-speed)',
        combination_mpg: 132,
        battery_capacity: 82,
        range_miles: 358,
        seats: 5,
        doors: 4,
        features: [
          'Autopilot',
          'Premium audio',
          'Wireless phone charger',
          'All-glass roof',
        ],
        insurance_coverage: {
          collision: true,
          theft: true,
          liability: true,
          deductible: 1000,
        },
        location: 'Los Angeles, CA',
        available: true,
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Silverado 1500 LTZ',
        make: 'Chevrolet',
        color: 'Black',
        year: 2021,
        license_plate: 'IL-TRUCK',
        url_photos: [
          'https://example.com/vehicles/silverado1.jpg',
          'https://example.com/vehicles/silverado2.jpg',
          'https://example.com/vehicles/silverado3.jpg',
        ],
        daily_price: 89.5,
        weekly_price: 500.0,
        monthly_price: 1800.0,
        rental_conditions:
          'No off-roading. Towing allowed up to 9,500 lbs. Mileage limit: 200 miles/day.',
        class: 'Full-size Pickup Truck',
        drive: '4WD',
        fuel_type: 'Gasoline',
        transmission: 'Automatic (10-speed)',
        combination_mpg: 20,
        displacement: 5.3,
        towing_capacity: 9500,
        bed_length: '6.5 ft',
        seats: 5,
        doors: 4,
        features: [
          'Bose audio system',
          'Heated/ventilated seats',
          'Trailer brake controller',
          'MultiPro tailgate',
        ],
        insurance_coverage: {
          collision: true,
          theft: true,
          liability: true,
          deductible: 750,
        },
        location: 'Chicago, IL',
        available: true,
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Grand Cherokee L',
        make: 'Jeep',
        color: 'Velvet Red',
        year: 2022,
        license_plate: 'IL-JEEP',
        url_photos: [
          'https://example.com/vehicles/jeep1.jpg',
          'https://example.com/vehicles/jeep2.jpg',
          'https://example.com/vehicles/jeep3.jpg',
        ],
        daily_price: 79.99,
        weekly_price: 450.0,
        monthly_price: 1600.0,
        rental_conditions:
          'Light off-roading allowed. No rock crawling. Pets allowed with $15 fee.',
        class: 'Midsize SUV',
        drive: '4WD',
        fuel_type: 'Gasoline',
        transmission: 'Automatic (8-speed)',
        combination_mpg: 22,
        displacement: 3.6,
        seats: 7,
        doors: 4,
        features: [
          'Panoramic sunroof',
          'Third-row seating',
          'Adaptive cruise control',
          'Off-road suspension',
        ],
        insurance_coverage: {
          collision: true,
          theft: true,
          liability: true,
          deductible: 750,
        },
        location: 'Chicago, IL',
        available: true,
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
        reason: 'Maintenance service',
      },
      {
        vehicle_id: vehicle.id,
        unavailable_from: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        unavailable_to: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        reason: 'Owner personal use',
      },
      {
        vehicle_id: vehicle.id,
        unavailable_from: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        unavailable_to: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        reason: 'Scheduled detailing',
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
        initialDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        finalDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        totalCost: vehicles[0].daily_price * 3,
        typeFuel: vehicles[0].fuel_type,
        transmission: vehicles[0].transmission,
        cityMgp: vehicles[0].combination_mpg,
        status: 'COMPLETED',
        vehicle_id: vehicles[0].id,
        pickupLocation: 'New York, NY',
        dropoffLocation: 'New York, NY',
        mileageUsed: 240,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        notes: 'Client returned the vehicle in excellent condition',
      },
      {
        client_id: tenants[0].id,
        initialDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        finalDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        totalCost: vehicles[1].daily_price * 3,
        typeFuel: vehicles[1].fuel_type,
        transmission: vehicles[1].transmission,
        cityMgp: vehicles[1].combination_mpg,
        status: 'CONFIRMED',
        vehicle_id: vehicles[1].id,
        pickupLocation: 'Los Angeles, CA',
        dropoffLocation: 'Los Angeles, CA',
        paymentMethod: 'paypal',
        paymentStatus: 'pending',
      },
      {
        client_id: tenants[1].id,
        initialDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        finalDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        totalCost: vehicles[2].daily_price * 3,
        typeFuel: vehicles[2].fuel_type,
        transmission: vehicles[2].transmission,
        cityMgp: vehicles[2].combination_mpg,
        status: 'COMPLETED',
        vehicle_id: vehicles[2].id,
        pickupLocation: 'Chicago, IL',
        dropoffLocation: 'Chicago, IL',
        mileageUsed: 180,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        notes: 'Client used the truck for furniture moving',
      },
      {
        client_id: tenants[1].id,
        initialDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        finalDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
        totalCost: vehicles[3].daily_price * 3,
        typeFuel: vehicles[3].fuel_type,
        transmission: vehicles[3].transmission,
        cityMgp: vehicles[3].combination_mpg,
        status: 'PENDING',
        vehicle_id: vehicles[3].id,
        pickupLocation: 'Chicago, IL',
        dropoffLocation: 'Chicago, IL',
        paymentMethod: 'credit_card',
        paymentStatus: 'authorized',
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
      'Great car and smooth rental process!',
      'Vehicle was clean and exactly as described.',
      'Had a minor issue but the owner resolved it quickly.',
      'Perfect for our family vacation!',
      'Would definitely rent again from this owner.',
      'The pickup process could be improved.',
      'Excellent fuel efficiency for a car this size.',
      'Comfortable ride even on long distances.',
      'The owner was very responsive to messages.',
      'Minor scratches not mentioned in the listing.',
    ];

    const reviewsData = rentals.map((rental) => ({
      rental_id: rental.id,
      rating: Math.floor(Math.random() * 2) + 4, // Random rating between 4-5
      comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      createdAt: new Date(rental.finalDate.getTime() + 60 * 60 * 1000), // 1 hour after return
      ownerResponse:
        Math.random() > 0.7 ? 'Thank you for your feedback!' : null,
      cleanliness: Math.floor(Math.random() * 5) + 1,
      communication: Math.floor(Math.random() * 5) + 1,
      value: Math.floor(Math.random() * 5) + 1,
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
