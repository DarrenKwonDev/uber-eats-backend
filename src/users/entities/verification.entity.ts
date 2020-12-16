import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  code: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' }) // user 삭제시 둘 다 삭제됨. verification삭제시 user는 유지됨
  @JoinColumn() // oneToone 관계는 한 쪽에 JoinColumn이 필요함
  user: User;

  @BeforeInsert()
  createCode(): void {
    // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' 너무 길어
    this.code = uuidv4();
  }
}
