import { Module } from '@nestjs/common';
import { RestaurantResolver } from './restaurants.resolvers';

@Module({
  providers: [RestaurantResolver],
})
export class RestaurantsModule {}
