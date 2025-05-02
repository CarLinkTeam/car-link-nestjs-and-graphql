import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('Date')
  initialDate: Date;

  @Column('Date')
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
}
