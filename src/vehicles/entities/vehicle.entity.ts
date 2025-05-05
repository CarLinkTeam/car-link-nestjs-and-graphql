import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleModel: string;

  @Column()
  make: string;

  @Column()
  color: string;

  @Column()
  year: number;

  @Column({ unique: true })
  license_plate: string;

  @Column('text', { array: true })
  url_photos: string[];

  @Column('decimal', { precision: 10, scale: 2 })
  daily_price: number;

  @Column('text')
  rental_conditions: string;

  // External API data
  @Column({ nullable: true })
  class?: string;

  @Column({ nullable: true })
  drive?: string;

  @Column({ nullable: true })
  fuel_type?: string;

  @Column({ nullable: true })
  transmission?: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  combination_mpg?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  displacement?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column('uuid')
  ownerId: string;
}
