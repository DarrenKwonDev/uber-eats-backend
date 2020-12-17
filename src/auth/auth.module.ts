import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGaurd } from './auth.guard';

@Module({
  providers: [{ provide: APP_GUARD, useClass: AuthGaurd }],
})
export class AuthModule {}
