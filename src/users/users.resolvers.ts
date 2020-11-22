import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account-dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver((of) => User)
export class UserResolver {
  constructor(private readonly userService: UsersService) {}

  @Query(() => Boolean)
  hi() {
    return true;
  }

  @Mutation(() => Boolean)
  createAccount(@Args('input') createAccountInput: CreateAccountInput): CreateAccountOutput {
    console.log(createAccountInput);
    return {
      ok: true,
    };
  }
}
