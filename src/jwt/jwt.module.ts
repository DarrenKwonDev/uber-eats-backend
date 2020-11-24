import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JWTModuleOptions } from './jwt.interfaces';
import { JwtService } from './jwt.service';

@Module({})
@Global()
export class JwtModule {
  static forRoot(options: JWTModuleOptions): DynamicModule {
    return {
      ...options,
      global: true,
      module: JwtModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        {
          provide: JwtService,
          useClass: JwtService,
        },
      ],
      exports: [JwtService],
    };
  }
}
