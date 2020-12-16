import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
// import { IsBoolean, IsString, Length } from 'class-validator';
import { Restaurant } from '../entities/restaurant.entity';

// onwer의 경우 현재 로그인한 계정이 자동으로 onwer가 될 것
@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, ['name', 'coverImage', 'address']) {
  @Field(() => String)
  categoryName: string;
}
@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
