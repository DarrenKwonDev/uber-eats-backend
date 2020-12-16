import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Category extends CoreEntity {
  @Field(() => String) // nest(gql)
  @Column({ unique: true }) // typeORM
  @IsString()
  @Length(5, 10)
  name: string; // nest(typescript)

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImage: string;

  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  slug: string;

  @Field(() => [Restaurant])
  @OneToMany(() => Restaurant, (restaurant) => restaurant.category) //  "RESTRICT" | "CASCADE" | "SET NULL" | "DEFAULT" | "NO ACTION";
  restaurants: Restaurant[];
}
