import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGaurd implements CanActivate {
  canActivate(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context).getContext(); // apollo-server context를 받기 위한 과정
    const user = gqlContext.user;
    if (!user) {
      return false; // block. Forbidden resource error message
    }
    return true; // pass
  }
}
