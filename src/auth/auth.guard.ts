import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AllowedRoles } from './auth.decorator';
@Injectable()
export class AuthGaurd implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>('roles', context.getHandler());

    // role이 없다는 건 권한, 로그인 여부 상관 없이 public하게 동작하는 handler라는 것
    if (!roles) {
      return true; // pass
    }
    const gqlContext = GqlExecutionContext.create(context).getContext(); // apollo-server context를 받기 위한 과정
    const user: User = gqlContext.user;
    if (!user) {
      return false; // 메타 데이터가 있는데 찾는 유저 정보가 없다? block
    }
    if (roles.includes('Any')) {
      return true;
    }
    return roles.includes(user.role); // pass
  }
}
