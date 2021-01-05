import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Payment extends CoreEntity {
  @Field(() => String)
  @Column()
  transactionId: string;

  // 1명의 유저는 여러 개의 결제 이력을 가질 수 있음
  // 유저 지워졌다고 payment를 지우면 안됨. 남겨야 함. onDelete는 set null
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.payments, { onDelete: 'SET NULL', nullable: true, eager: true })
  user?: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  // restaurnt에 payment 관련 연결 안 할거임. inverse 안할거니 아무 설정도 안 할거임
  // 따라서 Restaurant에 OneToMany 안 할거임.
  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant)
  restaurant?: Restaurant;

  @Field(() => Int)
  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
