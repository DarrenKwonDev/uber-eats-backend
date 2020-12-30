import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Restaurant extends CoreEntity {
  @Field(() => String) // nest(gql)
  @Column() // typeORM
  @IsString()
  @Length(5, 10)
  name: string; // nest(typescript)

  @Field(() => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field(() => String)
  @Column()
  @IsString()
  address: string;

  // 유저가 지워지면 레스토랑도 지워져야 맞다
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  owner: User;

  // onwerId
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  // 카테고리가 지워지면 레스토랑도 지워지면 안됨. 차라리 orphan이 되는 것이 맞음. 따라서 카테고리 삭제시 null로 처리
  // 이를 위해 category가 nullable할 수 있도록 하자.
  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.restaurants, { nullable: true, onDelete: 'SET NULL' })
  category: Category;

  // 1개의 레스토랑은 여러 Dish를 가질 수 있다. dish가 지워져도 레스토랑은 그대로 있어야 한다.
  @Field(() => [Dish])
  @OneToMany(() => Dish, (dish) => dish.restaurant)
  menu: Dish[];

  @Field(() => [Order], { nullable: true })
  @OneToMany(() => Order, (order) => order.restaurant, { nullable: true })
  orders?: Order[];
}
