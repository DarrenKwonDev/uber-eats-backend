import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const gqlContext = GqlExecutionContext.create(context).getContext(); // apollo-server context를 받기 위한 과정
  const user = gqlContext['user']; // Guard에서 gqlContext에 user를 넣어 줬음.

  return user;
});
