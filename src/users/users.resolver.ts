import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/auth.decorator';
import { AuthGaurd } from 'src/auth/auth.guard';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UserService } from './users.service';

@Resolver(() => User) // User에 관한 resolver라는 의미일 뿐 안 적어도 상관은 없음
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => CreateAccountOutput)
  async createAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CreateAccountOutput> {
    return await this.userService.createAccount(createAccountInput);
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return await this.userService.login(loginInput);
  }

  @Query(() => User)
  @Role(['Any']) // @role이 있으면 권한을 체크한다는 의미임
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @Query(() => UserProfileOutput)
  @Role(['Any'])
  async userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
    try {
      const { user, ok } = await this.userService.findById(userProfileInput.userId);
      if (!user) {
        throw Error();
      }
      return { ok, user };
    } catch (e) {
      return {
        error: 'User Not Found',
        ok: false,
      };
    }
  }

  @Mutation(() => EditProfileOutput)
  @Role(['Any'])
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.userService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(() => VerifyEmailOutput)
  async verifyEmail(@Args('input') { code }: VerifyEmailInput): Promise<VerifyEmailOutput> {
    return this.userService.verifyEmail(code);
  }
}
