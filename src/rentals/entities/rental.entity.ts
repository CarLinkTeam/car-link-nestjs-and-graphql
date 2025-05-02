import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
