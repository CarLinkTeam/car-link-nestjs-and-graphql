import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Rental {
  @ApiProperty({
    description: 'Unique identifier for the rental',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Start date of the rental',
    example: '2025-05-01T10:00:00Z',
  })
  @Column({ type: 'timestamp' })
  initialDate: Date;

  @ApiProperty({
    description: 'End date of the rental',
    example: '2025-05-08T10:00:00Z',
  })
  @Column({ type: 'timestamp' })
  finalDate: Date;

  @ApiProperty({
    description: 'Total cost of the rental',
    example: 350.0,
  })
  @Column('decimal', { precision: 10, scale: 2 })
  totalCost: number;

  @ApiProperty({
    description:
      'Current status of the rental (pending, active, completed, canceled)',
    example: 'active',
  })
  @Column('text')
  status: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @ApiProperty({
    description: 'Client identifier who made the rental',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Column('uuid')
  client_id: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ApiProperty({
    description: 'Vehicle identifier being rented',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Column('uuid')
  vehicle_id: string;
}
