import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('vehicles')
export class Vehicle {
  @ApiProperty({
    description: 'The unique identifier of the vehicle',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The model of the vehicle',
    example: 'Corolla',
  })
  @Column()
  vehicleModel: string;

  @ApiProperty({
    description: 'The make/brand of the vehicle',
    example: 'Toyota',
  })
  @Column()
  make: string;

  @ApiProperty({
    description: 'The color of the vehicle',
    example: 'Red',
  })
  @Column()
  color: string;

  @ApiProperty({
    description: 'The manufacturing year of the vehicle',
    example: 2022,
  })
  @Column()
  year: number;

  @ApiProperty({
    description: 'The license plate of the vehicle (unique)',
    example: 'ABC-123',
  })
  @Column({ unique: true })
  license_plate: string;

  @ApiProperty({
    description: 'URLs of the vehicle photos',
    example: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ],
    isArray: true,
  })
  @Column('text', { array: true })
  url_photos: string[];

  @ApiProperty({
    description: 'Daily rental price of the vehicle',
    example: 50.0,
  })
  @Column('decimal', { precision: 10, scale: 2 })
  daily_price: number;

  @ApiProperty({
    description: 'Rental conditions and rules',
    example: 'No smoking. Pets allowed with additional fee.',
  })
  @Column('text')
  rental_conditions: string;

  // External API data
  @ApiProperty({
    description: 'Vehicle class/category',
    example: 'Sedan',
    required: false,
  })
  @Column({ nullable: true })
  class?: string;

  @ApiProperty({
    description: 'Drive type (FWD, RWD, AWD)',
    example: 'FWD',
    required: false,
  })
  @Column({ nullable: true })
  drive?: string;

  @ApiProperty({
    description: 'Fuel type',
    example: 'Gasoline',
    required: false,
  })
  @Column({ nullable: true })
  fuel_type?: string;

  @ApiProperty({
    description: 'Transmission type',
    example: 'Automatic',
    required: false,
  })
  @Column({ nullable: true })
  transmission?: string;

  @ApiProperty({
    description: 'Date when the vehicle was created in the system',
    example: '2023-01-01T00:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the vehicle was last updated',
    example: '2023-01-02T00:00:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: 'The ID of the vehicle owner',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column('uuid')
  ownerId: string;
}
