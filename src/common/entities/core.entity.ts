import { Field } from '@nestjs/graphql';
import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn } from 'typeorm';

// ------------------------------------------------
// wannt knwo about CreateDateColumn, DeleteDateColumn?
// https://typeorm.io/#/entities/special-columns
// ------------------------------------------------

export class CoreEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @DeleteDateColumn()
  deletedAt: Date;
}
