import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileOutput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { EditRestaurantInput } from './dtos/update-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './retositories/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurant.create(createRestaurantInput);
      newRestaurant.owner = owner;

      const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
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

      let category: Category = null;

      // 만약 input에 category가 없다면 category는 null이 됨
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
      }

      await this.restaurant.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }), // category가 존재하면 {category} 반환
        },
      ]);

      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not edit Restaurant' };
    }
  }
}
