import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_unavailability')
export class VehicleUnavailability {
  @ApiProperty({
    description: 'The unique identifier of the unavailability record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the vehicle that is unavailable',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  vehicle_id: string;

  @ApiProperty({
    description: 'Start date of the unavailability period',
    example: '2023-01-01T00:00:00Z',
  })
  @Column('timestamp')
  unavailable_from: Date;

  @ApiProperty({
    description: 'End date of the unavailability period',
    example: '2023-01-05T00:00:00Z',
  })
  @Column('timestamp')
  unavailable_to: Date;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;
}
