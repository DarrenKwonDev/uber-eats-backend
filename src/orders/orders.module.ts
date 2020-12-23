import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order])], // TypeOrmModule entity,
  providers: [], // resolver, service ...
  exports: [], // want to export and use in other module
})
export class OrdersModule {}
