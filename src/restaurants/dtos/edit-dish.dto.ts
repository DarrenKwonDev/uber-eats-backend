import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

@InputType()
export class EditDishIntput extends PickType(Dish, ['name', 'price', 'description', 'options']) {
  @Field(() => Int)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
