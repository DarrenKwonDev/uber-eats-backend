import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UserService } from 'src/users/users.service';
import { AllowedRoles } from './auth.decorator';
@Injectable()
export class AuthGaurd implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext) {
    // @Role(['Client']) 꼴과 같이 @Role 을 통해 meda data로 넘어온 것들
    const roles = this.reflector.get<AllowedRoles>('roles', context.getHandler());

    // role이 없다는 건 권한, 로그인 여부 상관 없이 public하게 동작하는 handler라는 것
    if (!roles) {
      return true; // pass
    }

    // gql-context
    const gqlContext = GqlExecutionContext.create(context).getContext(); // apollo-server context를 받기 위한 과정
    const token = gqlContext.token;

    if (token) {
      const decoded = this.jwtService.verify(token);

      if (typeof decoded === 'object' || decoded.hasOwnProperty('id')) {
        // 유저 식별 성공 하면 req 객체에 담아 context를 통해 resolver 전역에서 사용 가능하게끔
        const { user } = await this.userService.findById(decoded['id']);

        if (!user) {
          return false; // 찾는 user 없으면 guard가 막기
        }

        gqlContext['user'] = user;

        // token으로 유저 식별이 완료되었다면, role을 체크.
        // 'Any'면 일단 로그인 되었으면 통과 처리
        if (roles.includes('Any')) {
          return true;
        }

        // metadata에서 건데 받은 roles에 속한 특정 role만 통과함
        return roles.includes(user.role);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
