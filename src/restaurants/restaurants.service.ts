import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileOutput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { EditRestaurantInput } from './dtos/update-restaurant.dto';
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

  async GetOrCreateCategory(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.categories.findOne({ slug: categorySlug });

    // 기존 카테고리가 없으면 새로 생성
    if (!category) {
      category = await this.categories.save(this.categories.create({ slug: categorySlug, name: categoryName }));
    }

    return category;
  }

  // ================================
  // resolver에서 사용되는 로직
  // ================================
  async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurant.create(createRestaurantInput);
      newRestaurant.owner = owner;

      const category = await this.GetOrCreateCategory(createRestaurantInput.categoryName);
      newRestaurant.category = category;

      await this.restaurant.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: true, error: 'error when create restaurant' };
    }
  }

  async editRestaurant(owner: User, editRestaurantInput: EditRestaurantInput): Promise<EditProfileOutput> {
    try {
      // restaurant의 owner의 id만 필요하므로 loadRelationIds을 사용
      const restaurant = await this.restaurant.findOne(editRestaurantInput.restaurantId);

      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: "You can't edit a restaurant you don't own" };
      }

      ///// logic

      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not edit Restaurant' };
    }
  }
}
