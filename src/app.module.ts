import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true, // in memory
      debug: true,
      playground: true,
    }),
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

// typeDefs,
// resolvers,
// debug: true,
// autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
