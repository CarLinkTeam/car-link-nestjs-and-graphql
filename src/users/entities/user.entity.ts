import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
@ObjectType()
export class User {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User unique identifier (UUID)',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'User email address (must be unique)',
    uniqueItems: true,
  })
  @Column('text', {
    unique: true,
  })
  @Field(() => String)
  email: string;

  @ApiProperty({
    example: 'mySecurePassword123',
    description: 'User password (excluded from responses)',
    writeOnly: true,
  })
  @Column('text')
  @Exclude()
  password?: string;

  @ApiProperty({
    example: 'Juan David Colonia',
    description: 'User full name',
  })
  @Column('text')
  @Field(() => String)
  fullName: string;

  @ApiProperty({
    example: 'Bogotá, Colombia',
    description: 'User location or address',
  })
  @Column('text')
  @Field(() => String)
  location: string;

  @ApiProperty({
    example: '+57 300 123 4567',
    description: 'User phone number',
  })
  @Column('text')
  @Field(() => String)
  phone: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user account is active',
    default: true,
  })
  @Column('bool', { default: true })
  @Field(() => Boolean)
  isActive: boolean;

  @ApiProperty({
    example: ['TENANT'],
    description: 'User roles in the system',
    enum: ['TENANT', 'OWNER', 'ADMIN'],
    isArray: true,
    default: ['TENANT'],
  })
  @Column('text', {
    array: true,
    default: ['TENANT'],
  })
  @Field(() => [String])
  roles: string[];

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}
