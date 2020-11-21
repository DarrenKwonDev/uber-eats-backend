import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Active Record 방법으로 쓰려면 extends BaseEntity 해야 함.

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
