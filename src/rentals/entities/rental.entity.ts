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
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
@Entity()
export class Rental {
  @ApiProperty({
    description: 'Unique identifier for the rental',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @ApiProperty({
    description: 'Start date of the rental',
    example: '2025-05-01T10:00:00Z',
  })
  @Column({ type: 'timestamp' })
  @Field(() => Date)
  initialDate: Date;

  @ApiProperty({
    description: 'End date of the rental',
    example: '2025-05-08T10:00:00Z',
  })
  @Column({ type: 'timestamp' })
  @Field(() => Date)
  finalDate: Date;

  @ApiProperty({
    description: 'Total cost of the rental',
    example: 350.0,
  })
  @Column('decimal', { precision: 10, scale: 2 })
  @Field(() => Float)
  totalCost: number;

  @ApiProperty({
    description:
      'Current status of the rental (pending, active, completed, canceled)',
    example: 'active',
  })
  @Column('text')
  @Field(() => String)
  status: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  @Field(() => User)
  client: User;

  @ApiProperty({
    description: 'Client identifier who made the rental',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Column('uuid')
  @Field(() => ID)
  client_id: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  @Field(() => Vehicle)
  vehicle: Vehicle;

  @ApiProperty({
    description: 'Vehicle identifier being rented',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Column('uuid')
  @Field(() => ID)
  vehicle_id: string;
}
