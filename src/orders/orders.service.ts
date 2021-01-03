import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

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

    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
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
      const newOrder = await this.orders.save(
        this.orders.create({ customer, restaurant, items: orderItems, total: orderFinalPrice }),
      );

      // publish
      await this.pubSub.publish(NEW_PENDING_ORDER, { pendingOrders: { newOrder, ownerId: restaurant.ownerId } });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create Order' };
    }
  }

  async getOrders(user: User, { status }: GetOrdersInput): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({ where: { customer: user, ...(status && { status }) } });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({ where: { driver: user, ...(status && { status }) } });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({ where: { owner: user }, relations: ['orders'] });
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }
      return { ok: true, orders };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not get orders' };
    }
  }

  canSeeOrder(user: User, order: Order): boolean {
    // role checking
    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      canSee = false;
    }
    return canSee;
  }

  async getOrder(user: User, { id: orderId }: GetOrderInput): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return { ok: false, error: 'order not found' };
      }

      if (!this.canSeeOrder(user, order)) {
        return { ok: false, error: 'You can not see this' };
      }

      return { ok: true, order };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'could not find order' };
    }
  }

  async editOrder(user: User, { id: orderId, status }: EditOrderInput): Promise<EditOrderOutput> {
    try {
      // customer, restaurant, driver... 등 relations 옵션을 이용하기 보다 Order entity에서 eager를 설정하도록하자
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return { ok: false, error: 'Order not found' };
      }

      if (!this.canSeeOrder(user, order)) {
        return { ok: false, error: 'You can not see this' };
      }

      let canEdit = true;

      // 유저가 Client라면 주문 상태를 변경할 수 없음
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      // 유저가 Owner라면 Cooking, Cooked만 설정할 수 있음
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }
      // 유저가 Delivery라면 PickedUp, Delivered만 설정할 수 있음
      if (user.role === UserRole.Delivery) {
        if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
          canEdit = false;
        }
      }

      if (!canEdit) {
        return { ok: false, error: 'you can not do that' };
      }

      // 이 order는 전체 order가 아니라 수정된 부분반 반환하므로 재사용할 수 없다
      await this.orders.save({ id: orderId, status });

      const newOrder = { ...order, status };
      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          // publish. 기본 order에 status만 덮어 쓰는 방식
          await this.pubSub.publish(NEW_COOKED_ORDER, { cookedOrders: newOrder });
        }
      }

      // 주문한 Client는 status가 바뀌면 바로 알아봐야 한다. 따라서 update 되는 즉시 알아야 한다
      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit Order' };
    }
  }

  async takeOrder(driver: User, { id: orderId }: TakeOrderInput): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return { ok: false, error: 'order not found' };
      }
      if (order.driver) {
        return { ok: false, error: 'this order already has a driver' };
      }

      // 수정
      await this.orders.save({ id: orderId, driver });

      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: { ...order, driver } });

      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not take order' };
    }
  }
}
