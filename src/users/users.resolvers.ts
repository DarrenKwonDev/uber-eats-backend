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

  @Mutation(() => CreateAccountOutput)
  async createAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      // deconstructuring. clean exit하면 error에는 undefined
      const { ok, error } = await this.userService.createAccount(createAccountInput);

      return {
        ok,
        error,
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }
}
