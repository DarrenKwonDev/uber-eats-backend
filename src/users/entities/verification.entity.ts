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

  @OneToOne(() => User, { onDelete: 'CASCADE' }) // user와 연계되어있으므로 삭제시 둘 다 삭제되게
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createCode(): void {
    // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' 너무 길어
    this.code = uuidv4();
  }
}
