import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType('DishInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Dish extends CoreEntity {
  @Field(() => String) // nest(gql)
  @Column({ unique: true }) // typeORM
  @IsString()
  @Length(5, 10)
  name: string; // nest(typescript)

  @Field(() => Int)
  @Column()
  @IsNumber()
  price: number;

  @Field(() => String)
  @Column()
  @IsString()
  Photo: string;

  @Field(() => String)
  @Column()
  @IsString()
  @Length(5, 140)
  description: string;

  // 1개의 레스토랑은 여러 개의 dish를 가질 수 있다.
  // 레스토링이 지워지면 해당 레스토랑 소유의 dish도 다 지워져야 한다. CASCADE
  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, { onDelete: 'CASCADE' })
  restaurant: Restaurant;

  // onwerId
  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;
}
