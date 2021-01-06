import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { CreatePaymentInput, CreatePaymentOutput } from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class paymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,

    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createPayment(owner: User, { transactionId, restaurantId }: CreatePaymentInput): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);

      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }
      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'You are not own this restaurant' };
      }

      restaurant.isPromoted = true;
      const date = new Date();

      date.setDate(date.getDate() + 7); // promote는 7일간 진행됨
      restaurant.promoteUntil = date;
      this.restaurants.save(restaurant);

      // payment 생성
      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could create payment' };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user: user });
      return { ok: true, payments };
    } catch (error) {
      return { ok: false, error: 'Could not get Payment' };
    }
  }

  // 오늘 날짜가 promoteUntil보다 크면 Promoted를 false로 돌려놓는 작업(cron or interval)
  // 매일 midnight 12시에 promoteuntil을 cron 함
  @Cron('0 0 * * *', { name: 'checkPromotedRestaurants' })
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({ isPromoted: true, promoteUntil: LessThan(new Date()) });
    restaurants.forEach(async (restaurant) => {
      restaurant.isPromoted = false;
      restaurant.promoteUntil = null;
      await this.restaurants.save(restaurant);
    });
  }
}
