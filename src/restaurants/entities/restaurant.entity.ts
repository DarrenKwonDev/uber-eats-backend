import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Category } from './category.entity';

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

  @Field(() => String, { defaultValue: '강남' })
  @Column()
  @IsString()
  address: string;

  // 유저가 지워지면 레스토랑도 지워져야 맞다
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.restaurants)
  owner: User;

  // 카테고리가 지워지면 레스토랑도 지워지면 안됨. 차라리 orphan이 되는 것이 맞음. 따라서 카테고리 삭제시 null로 처리
  // 이를 위해 category가 nullable할 수 있도록 하자.
  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.restaurants, { nullable: true, onDelete: 'SET NULL' })
  category: Category;
}
