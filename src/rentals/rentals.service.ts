import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { DataSource, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

@Injectable()
export class RentalsService {
  private logger = new Logger('RentalsService');
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createRentalDto: CreateRentalDto) {
    try {
      const { ...rentalData } = createRentalDto;
      const rental = this.rentalRepository.create({
        ...rentalData,
      });
      await this.rentalRepository.save(rental);
      return rental;
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  async findAll() {
    try {
      return await this.rentalRepository.find({});
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  async findOne(term: string) {
    let rental: Rental | null;

    if (isUUID(term)) {
      rental = await this.rentalRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.rentalRepository.createQueryBuilder('rental');
      rental = await queryBuilder
        .where('LOWER(rental.typeFuel) =:typeFuel', {
          typeFuel: term.toLowerCase(),
        })
        .getOne();
    }
    if (!rental)
      throw new NotFoundException(
        `Rental with id or typeFuel "${term}" not found`,
      );
    return rental;
  }

  async update(id: string, updateRentalDto: UpdateRentalDto) {
    const { ...rentalData } = updateRentalDto;
    const rental = await this.rentalRepository.preload({
      id: id,
      ...rentalData,
    });

    if (!rental)
      throw new NotFoundException(`Rental with id "${id}" not found`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(rental);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeptions(error);
    }
  }

  async remove(id: string) {
    const rental = await this.findOne(id);
    if (!rental)
      throw new NotFoundException(`Rental with id "${id}" not found`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.remove(rental);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return rental;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeptions(error);
    }
  }

  private handleExeptions(error: any) {
    if (error.code === '23505') throw new BadGatewayException(error.detail);

    this.logger.error(error.detail);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
