import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rental } from '../../rentals/entities/rental.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  rating: number;

  @Column('text')
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('uuid')
  rental_id: string;

  @OneToOne(() => Rental)
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;
}
