import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_unavailability')
export class VehicleUnavailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicle_id: string;

  @Column('timestamp')
  unavailable_from: Date;

  @Column('timestamp')
  unavailable_to: Date;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.availability)
  vehicle: Vehicle;
}
