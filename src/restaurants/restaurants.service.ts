import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurant.create(createRestaurantInput);
      newRestaurant.owner = owner;

      const categoryName = createRestaurantInput.categoryName.trim().toLowerCase();
      const categorySlug = categoryName.replace(/ /g, '-');
      let category = await this.categories.findOne({ slug: categorySlug });

      // 기존 카테고리가 없으면 새로 생성
      if (!category) {
        category = await this.categories.save(this.categories.create({ slug: categorySlug, name: categoryName }));
        newRestaurant.category = category;
      }

      newRestaurant.category = category;

      await this.restaurant.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: true, error: 'error when create restaurant' };
    }
  }
}
