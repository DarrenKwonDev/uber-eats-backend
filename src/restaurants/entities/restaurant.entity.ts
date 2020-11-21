import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType() // nest
@Entity() // typeORM
export class Restaurant {
  @Field(() => Number) // nest(gql)
  @PrimaryGeneratedColumn() // typeORM
  id: number;

  @Field(() => String) // nest(gql)
  @Column() // typeORM
  name: string; // nest(typescript)

  @Field(() => Boolean)
  @Column()
  isVegan: boolean;

  @Field(() => String)
  @Column()
  address: string;

  @Field(() => String)
  @Column()
  ownersName: string;

  @Field(() => String)
  @Column()
  categoryName: string;
}
