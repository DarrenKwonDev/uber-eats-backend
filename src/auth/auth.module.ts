import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { AuthGaurd } from './auth.guard';

@Module({
  imports: [UsersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGaurd }],
})
export class AuthModule {}
