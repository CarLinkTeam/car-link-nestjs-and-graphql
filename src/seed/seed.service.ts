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
    await this.reviewRepository.delete({});
    await this.rentalRepository.delete({});
    await this.unavailabilityRepository.delete({});
    await this.vehicleRepository.delete({});
    await this.userRepository.delete({});
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
          'https://platform.cstatic-images.com/xlarge/in/v2/269cdb56-ab42-5dc5-a676-ff41651f732f/4882fa7d-8bba-4aff-93c9-622b27b082a3/8ONu1sc0wvjoP6kzIlNj-eA4Klw.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/269cdb56-ab42-5dc5-a676-ff41651f732f/4882fa7d-8bba-4aff-93c9-622b27b082a3/3z9Yefe7RQ_GVdtB2kJTTr6_wcQ.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/269cdb56-ab42-5dc5-a676-ff41651f732f/4882fa7d-8bba-4aff-93c9-622b27b082a3/93rT9IdLkFgavxcFwI4zS9fxbno.jpg',
        ],
        daily_price: 180000,
        rental_conditions:
          'Prohibido fumar. Se admiten mascotas con costo adicional de $20.000/día. Mínimo 2 días de alquiler.',
        class: 'Sedán Híbrido',
        drive: 'Delantera',
        fuel_type: 'Híbrido',
        transmission: 'Automático (CVT)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'A3 Sportback',
        make: 'Audi',
        color: 'Gris Nardo',
        year: 2022,
        license_plate: 'UYL-456',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/04f913d7-a3e0-5bde-aba3-b6f4c0994054/24a1f601-3d4b-4854-9f6d-c52923b69e84/q9WbiCESXlosS5n_Y2-j0Av4oWg.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/04f913d7-a3e0-5bde-aba3-b6f4c0994054/24a1f601-3d4b-4854-9f6d-c52923b69e84/SRVNY5h8sbVd-hozS5HgZeyvLBk.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/04f913d7-a3e0-5bde-aba3-b6f4c0994054/24a1f601-3d4b-4854-9f6d-c52923b69e84/9p6I0YwrMy0unYbZ6W94urgsSzM.jpg',
        ],
        daily_price: 310000,
        rental_conditions:
          'Prohibido fumar. Se entrega con tanque lleno. Límite diario de 250 km. Exceso de km: $800/km.',
        class: 'Compacto Premium',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (7 velocidades)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Kuga Titanium',
        make: 'Ford',
        color: 'Azul Metálico',
        year: 2021,
        license_plate: 'GRP-789',
        url_photos: [
          'https://www.netcarshow.com/Ford-Kuga-2020-1280-08deacf659a3c9b819294d56d008b05e54.jpg',
          'https://www.netcarshow.com/Ford-Kuga-2020-1280-b81c026d0a1581fe258095fdb315f96ed2.jpg',
          'https://www.netcarshow.com/Ford-Kuga-2020-1280-9b7834b7cf99b4bd3a9f4379c153225a48.jpg',
        ],
        daily_price: 260000,
        rental_conditions:
          'Uso permitido en carretera pavimentada. Prohibido uso off-road. Se admiten mascotas sin costo.',
        class: 'SUV Familiar',
        drive: 'Tracción integral',
        fuel_type: 'Diésel',
        transmission: 'Automático (8 velocidades)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Berlingo',
        make: 'Citroën',
        color: 'Blanco',
        year: 2022,
        license_plate: 'QWE-234',
        url_photos: [
          'https://www.netcarshow.com/Citroen-SpaceTourer_4x4_E_Concept-2017-th-1.jpg',
          'https://www.netcarshow.com/Citroen-SpaceTourer_4x4_E_Concept-2017-1280-6d408b3c64b660b4430c68f300af798978.jpg',
          'https://www.netcarshow.com/Citroen-SpaceTourer_4x4_E_Concept-2017-1280-ffb65f1e59db351e2a29a45360e03a2875.jpg',
        ],
        daily_price: 220000,
        rental_conditions:
          'Ideal para mudanzas o carga. Capacidad: 1 tonelada. Se requiere depósito de $500.000.',
        class: 'Furgoneta Compacta',
        drive: 'Delantera',
        fuel_type: 'Diésel',
        transmission: 'Manual (6 velocidades)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Civic Touring',
        make: 'Honda',
        color: 'Negro Cristal',
        year: 2023,
        license_plate: 'ABC-567',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/a3c26c1b-9909-5ab0-9cf4-7a47a0f03727/5f5d94a1-13d0-4bf6-ad54-7956f86d6fbd/VW2jwvv53Ko7YuZyCfasRkigp4w.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/a3c26c1b-9909-5ab0-9cf4-7a47a0f03727/5f5d94a1-13d0-4bf6-ad54-7956f86d6fbd/0X3URdE0-VkOrYSG6nU8Ldelt1I.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/a3c26c1b-9909-5ab0-9cf4-7a47a0f03727/5f5d94a1-13d0-4bf6-ad54-7956f86d6fbd/0Xym5plGWa-OV6bzZMUSfsYsFiw.jpg',
        ],
        daily_price: 190000,
        rental_conditions:
          'Prohibido fumar. Entrega con tanque lleno. Límite diario de 200 km.',
        class: 'Sedán Compacto',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (CVT)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Elantra',
        make: 'Hyundai',
        color: 'Rojo Intenso',
        year: 2022,
        license_plate: 'DEF-890',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/6bda1516-b5c9-5a9f-b1a6-0d1efe96700f/ac6b3db6-9963-4781-afb8-a1dd2e88de79/uWOG0ZSMHpEHV7cEL6myLk2O5xE.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/6bda1516-b5c9-5a9f-b1a6-0d1efe96700f/ac6b3db6-9963-4781-afb8-a1dd2e88de79/EQwfAq-gTzJi79PLIIQOlO2uDnA.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/6bda1516-b5c9-5a9f-b1a6-0d1efe96700f/ac6b3db6-9963-4781-afb8-a1dd2e88de79/QajAtdFWaiTevSG4IL56SJKzUD8.jpg',
        ],
        daily_price: 175000,
        rental_conditions:
          'Se admiten mascotas. Prohibido fumar. Depósito de garantía: $300.000.',
        class: 'Sedán',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (6 velocidades)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'X3 xDrive30i',
        make: 'BMW',
        color: 'Azul Imperial',
        year: 2023,
        license_plate: 'GHI-123',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/b1805000-32a8-52e0-a4ac-1030edde69b7/c607f188-b3ee-4d3b-a0a4-7eafc7de5929/vbBh55VVbclV9cAxgGdmwvkor3s.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/b1805000-32a8-52e0-a4ac-1030edde69b7/c607f188-b3ee-4d3b-a0a4-7eafc7de5929/49zO0k4lZbvNCHBppkIT-RdeMKc.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/b1805000-32a8-52e0-a4ac-1030edde69b7/c607f188-b3ee-4d3b-a0a4-7eafc7de5929/bhKVV9YMhpLA-aIsXOy1gsfenBA.jpg',
        ],
        daily_price: 450000,
        rental_conditions:
          'Conductor mínimo 25 años. Seguro todo riesgo incluido. Prohibido off-road.',
        class: 'SUV Premium',
        drive: 'Tracción integral',
        fuel_type: 'Gasolina',
        transmission: 'Automático (8 velocidades)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'C-Class C200',
        make: 'Mercedes-Benz',
        color: 'Plata Iridio',
        year: 2022,
        license_plate: 'JKL-456',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/718fff7b-1d25-50da-a576-5bf59838eb3a/5a99583d-b61d-493d-a725-21ceb7b72667/KnkdIzaNoBHeQJprFFinCBI41Ws.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/718fff7b-1d25-50da-a576-5bf59838eb3a/5a99583d-b61d-493d-a725-21ceb7b72667/-mFs0VkYBXpgcysedFfNdZoked4.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/718fff7b-1d25-50da-a576-5bf59838eb3a/5a99583d-b61d-493d-a725-21ceb7b72667/mu9gKdGimxw5MsRJVmGl2S4KbDw.jpg',
        ],
        daily_price: 380000,
        rental_conditions:
          'Entrega con tanque lleno. Edad mínima 23 años. Licencia vigente por más de 2 años.',
        class: 'Sedán Ejecutivo',
        drive: 'Trasera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (9 velocidades)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Sentra',
        make: 'Nissan',
        color: 'Gris Plata',
        year: 2023,
        license_plate: 'MNO-789',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/ecf954d9-6f31-51b4-9fc5-9c18d57a6df6/fcbb87d4-a5b3-45f8-9aa3-06beee25e4c5/Me82t6O8Zdos9i9UzgsBn60Cc14.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/ecf954d9-6f31-51b4-9fc5-9c18d57a6df6/fcbb87d4-a5b3-45f8-9aa3-06beee25e4c5/ut_vjlWvDD98u74hOQsmI39FNFA.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/ecf954d9-6f31-51b4-9fc5-9c18d57a6df6/fcbb87d4-a5b3-45f8-9aa3-06beee25e4c5/wDI81qVN7V1a_q7XdFzp8-Z5Qpc.jpg',
        ],
        daily_price: 165000,
        rental_conditions:
          'Perfecto para ciudad. Se admiten mascotas pequeñas. Mínimo 1 día.',
        class: 'Sedán Económico',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (CVT)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Tucson',
        make: 'Hyundai',
        color: 'Blanco Polar',
        year: 2023,
        license_plate: 'PQR-012',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/a175668b-4518-537c-9b66-ca8f89f6b6fd/0a32b219-827f-4181-873e-2a4755049a7f/wtTr638islqqPnputrruhYPTlKE.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/a175668b-4518-537c-9b66-ca8f89f6b6fd/0a32b219-827f-4181-873e-2a4755049a7f/SMvgaFq2vQMx6NFh89F7g9yRfFc.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/a175668b-4518-537c-9b66-ca8f89f6b6fd/0a32b219-827f-4181-873e-2a4755049a7f/65-EYgz6UOxdNYAdPHcHy35dq90.jpg',
        ],
        daily_price: 280000,
        rental_conditions:
          'Ideal para familias. Asientos de cuero. Se requiere depósito de $400.000.',
        class: 'SUV Compacta',
        drive: 'Tracción integral',
        fuel_type: 'Gasolina',
        transmission: 'Automático (8 velocidades)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Mazda3',
        make: 'Mazda',
        color: 'Rojo Soul',
        year: 2022,
        license_plate: 'STU-345',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/ea4f3539-754a-45ce-a7de-c7214425e256/9c1e339d-071a-4d04-8cd9-2ade0b083480/rjzn7yJIhW0AAjUzPJKFsp5pjfE.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/ea4f3539-754a-45ce-a7de-c7214425e256/9c1e339d-071a-4d04-8cd9-2ade0b083480/9LxikiTGgUz9x-EcABXgZdw2P2w.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/ea4f3539-754a-45ce-a7de-c7214425e256/9c1e339d-071a-4d04-8cd9-2ade0b083480/4xIBUrypc5DgmLm8LZsu1hHq1ps.jpg',
        ],
        daily_price: 185000,
        rental_conditions:
          'Excelente rendimiento de combustible. Prohibido fumar. Límite 300 km/día.',
        class: 'Hatchback',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (6 velocidades)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'RAV4',
        make: 'Toyota',
        color: 'Verde Musgo',
        year: 2024,
        license_plate: 'VWX-678',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/3e7b1f58-d354-50af-99d7-479e00a7a651/577b08cb-6f26-45b2-b0e7-24a3404d3e9c/c_Lo--TcBVaYOncifPiwWxKnZWQ.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/3e7b1f58-d354-50af-99d7-479e00a7a651/577b08cb-6f26-45b2-b0e7-24a3404d3e9c/UTz9DIWK0csYyN9W7RhBdEvD_aA.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/3e7b1f58-d354-50af-99d7-479e00a7a651/577b08cb-6f26-45b2-b0e7-24a3404d3e9c/FWHapgKUJo3uo7OHDpGItgaWutw.jpg',
        ],
        daily_price: 320000,
        rental_conditions:
          'AWD incluido. Perfecto para aventuras. Depósito de seguridad: $500.000.',
        class: 'SUV',
        drive: 'Tracción integral',
        fuel_type: 'Híbrido',
        transmission: 'Automático (CVT)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Jetta GLI',
        make: 'Volkswagen',
        color: 'Negro Profundo',
        year: 2022,
        license_plate: 'YZA-901',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/f0c91512-345d-5ac4-82e4-3b9e1880ba2f/294497e6-909f-4c6d-ae7e-fff67a190e5e/YFCkLGtw1PpATfGVga0EdeWPyzY.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/f0c91512-345d-5ac4-82e4-3b9e1880ba2f/294497e6-909f-4c6d-ae7e-fff67a190e5e/69c4JAJ39XORnbUKXhtVYMo2_fE.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/f0c91512-345d-5ac4-82e4-3b9e1880ba2f/294497e6-909f-4c6d-ae7e-fff67a190e5e/mndctR82WAyzoB-DOJu8v2GVL-w.jpg',
        ],
        daily_price: 220000,
        rental_conditions:
          'Versión deportiva. Conductor experimentado preferido. Prohibido fumar.',
        class: 'Sedán Deportivo',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Manual (6 velocidades)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'CR-V',
        make: 'Honda',
        color: 'Gris Metálico',
        year: 2023,
        license_plate: '9CL-V77',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/9c4d0424-da99-5e48-a92c-b887f41e77af/ec7520d1-8553-43c1-8033-95b56093d9ba/WvgvA2LqVrdgKdyXC7VWxAoR-hk.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/9c4d0424-da99-5e48-a92c-b887f41e77af/ec7520d1-8553-43c1-8033-95b56093d9ba/jDhV_BsKbPCE7d59gQC6kydL74Y.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/9c4d0424-da99-5e48-a92c-b887f41e77af/ec7520d1-8553-43c1-8033-95b56093d9ba/wdd8MkDgvVm7_Ffpl2QmZDmBHgA.jpg',
        ],
        daily_price: 290000,
        rental_conditions:
          'Honda Sensing incluido. Ideal para viajes largos. Seguro amplio.',
        class: 'SUV',
        drive: 'Tracción integral',
        fuel_type: 'Gasolina',
        transmission: 'Automático (CVT)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Spark GT',
        make: 'Chevrolet',
        color: 'Amarillo Rally',
        year: 2022,
        license_plate: 'EFG-567',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/8117d940-0294-5aab-b445-3a70f743682d/30e8a9c5-d8e6-41a4-851d-0da5138a6689/Y2hfrPqnNjCrhg7oQZAHHbPKqz8.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/8117d940-0294-5aab-b445-3a70f743682d/30e8a9c5-d8e6-41a4-851d-0da5138a6689/pHurNr6yLfpwxURJ2lKVYPOWHEw.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/8117d940-0294-5aab-b445-3a70f743682d/30e8a9c5-d8e6-41a4-851d-0da5138a6689/gEXRyLsdLzLl941svEDi1RZmXc0.jpg',
        ],
        daily_price: 120000,
        rental_conditions:
          'Económico para ciudad. Fácil estacionamiento. Combustible eficiente.',
        class: 'Hatchback Compacto',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Manual (5 velocidades)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Sportage',
        make: 'Kia',
        color: 'Azul Océano',
        year: 2022,
        license_plate: 'HIJ-890',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/c9366f1d-0c43-4da7-b392-d14afab35ca4/9ab286f1-d674-479f-9f18-69932116b622/Wge2-BtoDOVPKAsNu601j1SUvj4.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/c9366f1d-0c43-4da7-b392-d14afab35ca4/9ab286f1-d674-479f-9f18-69932116b622/hT-oGQHFuJ2Y0e1bV4LS-puN_Bk.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/c9366f1d-0c43-4da7-b392-d14afab35ca4/9ab286f1-d674-479f-9f18-69932116b622/hAjXtVl0kZuAlOmOSjYXLDB3PsI.jpg',
        ],
        daily_price: 270000,
        rental_conditions:
          'Garantía extendida. Pantalla táctil. Se admiten mascotas con cobertura adicional.',
        class: 'SUV',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (8 velocidades)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Captiva',
        make: 'Chevrolet',
        color: 'Blanco Summit',
        year: 2015,
        license_plate: 'KLM-123',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/98ccf9e3-539d-5203-ae96-14946a329a19/48d6be45-ad5d-485c-b2e4-c11bc06e507d/X5F-uDZ4nkcRb-R5Xsi5HkDr_o8.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/98ccf9e3-539d-5203-ae96-14946a329a19/48d6be45-ad5d-485c-b2e4-c11bc06e507d/pRXTaiH8EZ-afsomPOv8k-rtYM0.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/98ccf9e3-539d-5203-ae96-14946a329a19/48d6be45-ad5d-485c-b2e4-c11bc06e507d/WgclWU2QRQm6NTtLMmVPM2o3mqE.jpg',
        ],
        daily_price: 150000,
        rental_conditions:
          '7 asientos disponibles. Perfecto para grupos grandes. Depósito: $350.000.',
        class: 'SUV Familiar',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Automático (6 velocidades)',
      },
      {
        ownerId: owners[1].id,
        vehicleModel: 'Logan',
        make: 'Renault',
        color: 'Gris Estrella',
        year: 2021,
        license_plate: 'ACR-677',
        url_photos: [
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/2023_Dacia_Logan_III_IMG_9678_%28cropped%29.jpg/1280px-2023_Dacia_Logan_III_IMG_9678_%28cropped%29.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/2023_Dacia_Logan_III_IMG_9671_%28cropped%29.jpg/1280px-2023_Dacia_Logan_III_IMG_9671_%28cropped%29.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/f/f7/Renault_Taliant_1.0_Turbo_90_X-tronic_%28Exterior%29.png',
        ],
        daily_price: 140000,
        rental_conditions:
          'Sedán espacioso y económico. Perfecto para uso diario. Bajo consumo.',
        class: 'Sedán Económico',
        drive: 'Delantera',
        fuel_type: 'Gasolina',
        transmission: 'Manual (5 velocidades)',
      },
      {
        ownerId: owners[0].id,
        vehicleModel: 'Outlander',
        make: 'Mitsubishi',
        color: 'Negro Diamante',
        year: 2023,
        license_plate: 'QRS-789',
        url_photos: [
          'https://platform.cstatic-images.com/xlarge/in/v2/615cc1a9-81f1-5660-93ec-9f051c573c7b/1e5f70b4-e863-4a9b-ad97-d1dfb5835def/EhnlfEa6g5H5ru_R6Qaff9nq9js.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/615cc1a9-81f1-5660-93ec-9f051c573c7b/1e5f70b4-e863-4a9b-ad97-d1dfb5835def/t_qQpgfrMty5ht9aqUn5KqLA758.jpg',
          'https://platform.cstatic-images.com/xlarge/in/v2/615cc1a9-81f1-5660-93ec-9f051c573c7b/1e5f70b4-e863-4a9b-ad97-d1dfb5835def/kCHqXSV7V6E3j5gOQaBmv2FT0ws.jpg',
        ],
        daily_price: 300000,
        rental_conditions:
          'SUV híbrida. Tecnología avanzada. Ideal para eco-conductores.',
        class: 'SUV Híbrida',
        drive: 'Tracción integral',
        fuel_type: 'Híbrido',
        transmission: 'Automático (CVT)',
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
    console.log(`Registrados ${vehiclesData.length} vehículos`);
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
        status: 'completed',
      },
      {
        client_id: tenants[0].id,
        vehicle_id: vehicles[1].id,
        initialDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        finalDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        totalCost: vehicles[1].daily_price * 3,
        status: 'confirmed',
      },
      {
        client_id: tenants[1].id,
        vehicle_id: vehicles[2].id,
        initialDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        finalDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        totalCost: vehicles[2].daily_price * 3,
        status: 'completed',
      },
      // New rentals for vehicles without rentals
      {
        client_id: tenants[0].id,
        vehicle_id: vehicles[3].id,
        initialDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        finalDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        totalCost: vehicles[3].daily_price * 3,
        status: 'completed',
      },
      {
        client_id: tenants[1].id,
        vehicle_id: vehicles[4].id,
        initialDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        finalDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        totalCost: vehicles[4].daily_price * 2,
        status: 'completed',
      },
      {
        client_id: tenants[0].id,
        vehicle_id: vehicles[5].id,
        initialDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        finalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        totalCost: vehicles[5].daily_price * 4,
        status: 'confirmed',
      },
      {
        client_id: tenants[1].id,
        vehicle_id: vehicles[6].id,
        initialDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        finalDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        totalCost: vehicles[6].daily_price * 3,
        status: 'pending',
      },
      {
        client_id: tenants[0].id,
        vehicle_id: vehicles[7].id,
        initialDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        finalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        totalCost: vehicles[7].daily_price * 4,
        status: 'confirmed',
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

    // Only create reviews for the first 3 rentals (original ones)
    const originalRentals = rentals.slice(0, 3);
    const reviewsData = originalRentals.map((rental) => ({
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
