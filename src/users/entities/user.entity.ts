import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

type UserRole = 'client' | 'owner' | 'delivery';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(() => String) // gql
  @Column() // typeorm
  @IsString() // class-validatior
  email: string;

  @Field(() => String)
  @Column()
  @IsString()
  password: string;

  @Field(() => String)
  @Column()
  @IsString()
  role: UserRole;
}
