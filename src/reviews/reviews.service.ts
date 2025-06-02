import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RentalsService } from '../rentals/rentals.service';
import { isUUID } from 'class-validator';

@Injectable()
export class ReviewsService {
  private logger = new Logger('ReviewService');
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly rentalsService: RentalsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    try {
      const { rental_id, ...reviewData } = createReviewDto;

      const rental = await this.rentalsService.findOne(rental_id);
      if (!rental) {
        throw new NotFoundException(`Rental with ID "${rental_id}" not found`);
      }

      const review = this.reviewRepository.create({
        ...reviewData,
        rental_id,
      });
      await this.reviewRepository.save(review);
      return review;
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  async findAll() {
    try {
      return await this.reviewRepository.find({
        relations: ['rental'],
      });
    } catch (error) {
      this.handleExeptions(error);
    }
  }
  async findOne(term: string) {
    let review: Review | null;
    if (isUUID(term)) {
      review = await this.reviewRepository.findOne({
        where: { id: term },
        relations: ['rental'],
      });
    } else {
      const queryBuilder = this.reviewRepository.createQueryBuilder('review');
      const isNumeric = !isNaN(Number(term)) && Number.isInteger(Number(term));

      if (isNumeric) {
        queryBuilder.where('review.rating = :rating', { rating: Number(term) });
      }
      queryBuilder.orWhere('review.comment = :comment', { comment: term });

      review = await queryBuilder
        .leftJoinAndSelect('review.rental', 'rental')
        .getOne();
    }

    if (!review) {
      throw new NotFoundException(`Review with ID "${term}" not found`);
    }
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    if (updateReviewDto.rental_id) {
      await this.rentalsService.findOne(updateReviewDto.rental_id);
    }

    await this.findOne(id);

    const { ...reviewData } = updateReviewDto;
    const review = await this.reviewRepository.preload({
      id: id,
      ...reviewData,
    });

    if (!review)
      throw new NotFoundException(`Review with ID "${id}" not found`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(review);
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
    const review = await this.findOne(id);
    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.remove(review);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeptions(error);
    }
  }

  async findByVehicle(vehicleId: string) {
    try {
      return await this.reviewRepository.find({
        where: { rental: { vehicle_id: vehicleId } },
        relations: ['rental', 'rental.client'],
      });
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  private handleExeptions(error: any) {
    if (error instanceof BadRequestException) throw error;
    if (error instanceof NotFoundException) throw error;
    if (error.code === '23505') throw new BadGatewayException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
