import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import Joi from 'joi'; // export= 방식으로 되어 있어서 esModuleInterop를 true로 켜줌
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleWare } from './jwt/jwt.middleware';
import { AuthModule } from './auth/auth.module';
import { Verification } from './users/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { Category } from './restaurants/entities/category.entity';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { Dish } from './restaurants/entities/dish.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod', // prod할 때는 heroku에 따로 넣기로
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        TOKEN_SECRET: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT, // parseInt
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: process.env.NODE_ENV !== 'prod', // Setting synchronize: true shouldn't be used in production - otherwise you can lose production data.
      logging: false, // 너무 시끄러워서 껐음
      entities: [User, Verification, Category, Restaurant, Dish, Order, OrderItem, Payment],
      // autoLoadEntities: true, // 자동으로 entity 넣어주기
    }),
    GraphQLModule.forRoot({
      // autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // set true if you want to use in memory gql
      autoSchemaFile: true, // set true if you want to use in memory gql
      debug: true,
      playground: true,
      installSubscriptionHandlers: true, // subscription 사용
      context: ({ req, connection }) => {
        const TOKEN_KEY = 'x-jwt';
        // http
        if (req) {
          return { token: req.headers[TOKEN_KEY] }; // 헤더에 있는 토큰만 쓸거니 헤더 중 토큰만 솎아서 보내자
        }
        // ws. connection은 ws 연결시 딱 한 번만 반환됨
        if (connection) {
          return { token: connection.context[TOKEN_KEY] }; // connection.context 에 토큰이 들어 있다
        }
      },
    }),
    UsersModule,
    CommonModule,
    JwtModule.forRoot({ privateKey: process.env.TOKEN_SECRET }),
    AuthModule, // 전역 Guard임. 주의!
    RestaurantsModule,
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),
    OrdersModule,
    PaymentsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(JwtMiddleWare).forRoutes({
//       path: '/graphql',
//       method: RequestMethod.POST,
//     });
//   }
// }

// typeDefs,
// resolvers,
// debug: true,
// autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
