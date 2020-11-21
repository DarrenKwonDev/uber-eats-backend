import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Restaurant {
  @Field(() => Number) // nest(gql)
  @PrimaryGeneratedColumn() // typeORM
  id: number;

  @Field(() => String) // nest(gql)
  @Column() // typeORM
  @IsString()
  @Length(5, 10)
  name: string; // nest(typescript)

  @Field(() => Boolean, { nullable: true }) // nest(gql)
  @Column({ default: true }) // typeORM
  @IsOptional() // class-validation
  @IsBoolean() // class-validation
  isVegan: boolean;

  @Field(() => String, { defaultValue: 'gangname' })
  @Column()
  @IsString()
  address: string;

  @Field(() => String)
  @Column()
  @IsString()
  ownersName: string;

  @Field(() => String)
  @Column()
  @IsString()
  categoryName: string;
}
