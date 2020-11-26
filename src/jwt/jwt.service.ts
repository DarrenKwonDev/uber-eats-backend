/* eslint-disable @typescript-eslint/ban-types */
import { Inject, Injectable } from '@nestjs/common';
import { JWTModuleOptions } from './jwt.interfaces';
import jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

@Injectable()
export class JwtService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: JWTModuleOptions) {}

  sign(payload: object): string {
    // jwt 생성을 위한 private key는 이미 jwt module 단위에서 provide 해줬음
    return jwt.sign(payload, this.options.privateKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
