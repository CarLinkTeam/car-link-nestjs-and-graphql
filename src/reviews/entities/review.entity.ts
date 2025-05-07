import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rental } from '../../rentals/entities/rental.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Review {
  @ApiProperty({
    description: 'Unique identifier for the review',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Rating score for the rental experience (1-5)',
    example: 5,
  })
  @Column('int')
  rating: number;

  @ApiProperty({
    description: 'Detailed feedback about the rental experience',
    example: 'Great car and amazing service! Would rent again.',
  })
  @Column('text')
  comment: string;

  @ApiProperty({
    description: 'Date and time when the review was created',
    example: '2025-05-07T14:53:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Foreign key to the associated rental',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Column('uuid')
  rental_id: string;

  @OneToOne(() => Rental)
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;
}
