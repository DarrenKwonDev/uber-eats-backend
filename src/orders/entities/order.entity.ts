import { Field, Float, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Order extends CoreEntity {
  // 1명의 고객은 여러 주문을 할 수 있다.
  // user를 지운다고 해서 이미 주문 중일 걸 삭제할 수는 없다.
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'SET NULL', nullable: true })
  customer?: User;

  // 내가 Rider라면
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.rides, { onDelete: 'SET NULL', nullable: true })
  driver?: User;

  // 1개의 레스토랑은 여러 개의 Order를 가질 수 있다
  @Field(() => Restaurant, { nullable: true })
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders, { onDelete: 'SET NULL', nullable: true })
  restaurant?: Restaurant;

  // 상식적으로 order에서 OrderItem를 불러오므로 JoinTable을 여기에 추가해줍시다
  // 다대다 관계는 OrderItem의 column을 지정하지 않고 이대로 끝냅니다.
  @Field(() => [OrderItem])
  @ManyToMany(() => OrderItem)
  @JoinTable()
  items: OrderItem[];

  @Field(() => Float, { nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  total?: number;

  @Field(() => OrderStatus)
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
