import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/auth.decorator';
import { NEW_COOKED_ORDER, NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';
export class OrderResolver {
  constructor(private readonly orderService: OrderService, @Inject(PUB_SUB) private readonly pubSub: PubSub) {}

  @Mutation(() => CreateOrderOutput)
  @Role(['Client'])
  createOrder(@AuthUser() customer: User, @Args('input') createOrderInput: CreateOrderInput): Promise<CreateOrderOutput> {
    return this.orderService.createOrder(customer, createOrderInput);
  }

  @Query(() => GetOrdersOutput)
  @Role(['Any'])
  async getOrders(@AuthUser() user: User, @Args('input') getOrdersInput: GetOrdersInput): Promise<GetOrdersOutput> {
    return this.orderService.getOrders(user, getOrdersInput);
  }

  @Query(() => GetOrderOutput)
  @Role(['Any'])
  async getOrder(@AuthUser() user: User, @Args('input') getOrderInput: GetOrderInput): Promise<GetOrderOutput> {
    return this.orderService.getOrder(user, getOrderInput);
  }

  // order를 완전 수정하는게 아니라 status만 변경함
  @Mutation(() => EditOrderOutput)
  @Role(['Any'])
  async editOrder(@AuthUser() user: User, @Args('input') editOrderInput: EditOrderInput): Promise<EditOrderOutput> {
    return this.orderService.editOrder(user, editOrderInput);
  }

  // 유저가 주문을 만들면 가게 주인이 자신의 레스토랑에 온 주문을 실시간으로 볼 수 있어야 함
  @Subscription(() => Order, {
    filter: ({ pendingOrders: { newOrder, ownerId } }, _, { user }) => {
      // 해당 sub를 한 사람이 레스토랑 주인이어야 함(자신의 레스토랑에 온 주문만을 보여줘야 함)
      return ownerId === user.id;
    },
    resolve: ({ pendingOrders: { newOrder, ownerId } }) => {
      return newOrder;
    },
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  // 운전자가 cooked된 음식을 pickup하기 위해 일감을 실시간 반영
  @Subscription(() => Order, {
    resolve: ({ cookedOrders }) => {
      return cookedOrders;
    },
  })
  @Role(['Delivery'])
  cookedOrders() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }
}
