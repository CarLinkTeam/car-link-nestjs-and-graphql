import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity()
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  initialDate: Date;

  @Column({ type: 'timestamp' })
  finalDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  totalCost: number;

  @Column('text')
  typeFuel: string;

  @Column('text')
  transmission: string;

  @Column('int')
  cityMgp: number;

  @Column('text')
  status: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column('uuid')
  client_id: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column('uuid')
  vehicle_id: string;
}
