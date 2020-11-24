import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtMiddleWare implements NestMiddleware {
  constructor(private readonly jwtService: JwtService, private readonly usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers) {
      const token = req.headers['x-jwt']; // ts는 header를 string | string[]으로 자동 타이핑함
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' || decoded.hasOwnProperty('id')) {
        try {
          // 유저 식별 성공
          const user = await this.usersService.findById(decoded['id']);
          req['user'] = user;
        } catch (error) {
          // 에러 핸들링 필요
        }
      }
    }
    next();
  }
}
