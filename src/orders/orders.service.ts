import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,

    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,

    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createOrder(customer: User, { restaurantId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];

      // O(n) 복잡도인데 괜찮을까? 괜찮다. items 내 요소가 많아야 10내 이내 일텐데. 문제 없음.
      // forEach를 쓰지 말자. dish가 없어도  return이 안되고 무조건 loop를 돌다.
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          // 그냥 넘기는게 아니라 create Order 자체를 취소해야 함.
          return { ok: false, error: 'Dish not found' };
        }

        let dishFinalPrice = dish.price;

        // item.options(유저오 부터 온 옵션), dish.options(dish가 가진 옵션) checking AND calucatin g extra
        for (const itemOption of item.options) {
          // 우선 유저가 보낸 옵션이 실제로 있는 옵션인지 체크
          const dishOption = dish.options.find((dishOption) => dishOption.name === itemOption.name);

          if (dishOption) {
            // 옵션 자체에 extrea가 달려 있는 경우
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              // 옵션 내 choice에 extra가 달려 있는 경우
              const dishOptionChoice = dishOption.choices.find((optionChoice) => optionChoice.name === itemOption.choice);

              if (dishOptionChoice && dishOptionChoice.extra) {
                dishFinalPrice += dishOptionChoice.extra;
              }
            }
          }
        }

        // orderFinalPris
        orderFinalPrice += dishFinalPrice;

        const orderItem = await await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options, // [{name: "맵기", choice: "매운맛"}, { name: '사이즈', choice: '라지' }, ...]
          }),
        );

        orderItems.push(orderItem);
      }

      // order create
      await this.orders.save(this.orders.create({ customer, restaurant, items: orderItems, total: orderFinalPrice }));

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create Order' };
    }
  }
}
