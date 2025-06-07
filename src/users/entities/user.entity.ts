import { Exclude } from "class-transformer";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity('users')
@ObjectType()
export class User {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID)
    id: string;

    @Column('text', {
        unique: true
    })
    @Field(() => String)
    email: string;

    @Column('text')
    @Exclude()
    password?: string;

    @Column('text')
    @Field(() => String)
    fullName: string;

    @Column('text') 
    @Field(() => String)
    location: string;

    @Column('text')
    @Field(() => String)
    phone: string;
    
    @Column('bool', { default: true })
    @Field(() => Boolean)
    isActive: boolean;

    @Column('text', {
        array: true,
        default: ['TENANT']
    })
    @Field(() => [ String ])
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