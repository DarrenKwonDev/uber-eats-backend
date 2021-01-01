import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileOutput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Like, Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { EditDishIntput, EditDishOutput } from './dtos/edit-dish.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { SearchRestaurantInput, SearchRestaurantOutput } from './dtos/search-restaurant.dto';
import { EditRestaurantInput } from './dtos/update-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './retositories/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
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
      // restaurant의 owner의 id만 필요하므로 loadRelationIds을 사용하지 않음
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

  async deleteRestaurant(owner: User, deleteRestaurantInput: DeleteRestaurantInput): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurant.findOne(deleteRestaurantInput.restaurantId);

      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: "You can't delete a restaurant you don't own" };
      }

      await this.restaurant.delete(deleteRestaurantInput.restaurantId);

      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not delete Restaurant' };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error: 'fail to get all categories' };
    }
  }

  async countRestaurants(category: Category): Promise<number> {
    return await this.restaurant.count({ category });
  }

  async findCategoryBySlug({ slug, page }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return { ok: false, error: 'Could not found' };
      }

      // pagination. 1 page 당 5개씩만 보여주기로
      const restaurants = await this.restaurant.find({
        where: { category },
        take: 5,
        skip: (page - 1) * 5,
      });
      category.restaurants = restaurants;

      // total results
      const totalResults = await this.countRestaurants(category);

      return { ok: true, category, restaurants, totalPage: Math.ceil(totalResults / 5) };
    } catch (error) {
      return { ok: false, error: 'Could not load cateogry' };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, results] = await this.restaurant.findAndCount({ take: 5, skip: (page - 1) * 5 });
      return { ok: true, restaurants, totalPage: Math.ceil(results / 5), results };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not load restaurants' };
    }
  }

  async getRestaurantById(restaurantInput: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurant.findOne(restaurantInput.restaurantId, {
        relations: ['menu'],
      });

      if (!restaurant) {
        return { ok: false, error: 'restaurant not found' };
      }

      return { ok: true, restaurant };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not load restaurant' };
    }
  }

  async searchRestaurantByName({ query, page }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      // MySQL에선 Like가 case-insensitive하므로 Raw sql을 사용하지 않기로.
      // Postgresql 에서는 case-sensitive함. 그러나 typeORM에서는 ILIKE를 지원하지 않으므로 Raw Query를 짜야 함
      const [restaurants, results] = await this.restaurant.findAndCount({
        where: {
          name: Like(`%${query}%`),
        },
        take: 5,
        skip: (page - 1) * 5,
      });

      return { ok: true, restaurants, results, totalPage: Math.ceil(results / 5) };
    } catch (error) {
      return { ok: false, error: 'Could not search for Restaurant' };
    }
  }

  async createDish(owner: User, createDishInput: CreateDishInput): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurant.findOne(createDishInput.restaurantId);
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }
      if (owner.id !== restaurant.ownerId) {
        return { ok: false, error: 'Only Owner Can create Dish' };
      }

      await this.dishes.save(this.dishes.create({ ...createDishInput, restaurant }));

      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not create dish' };
    }
  }

  async editDish(owner: User, editDishIntput: EditDishIntput): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(editDishIntput.dishId, { relations: ['restaurant'] });
      if (!dish) {
        return { ok: false, error: 'Dish not found' };
      }
      if (owner.id !== dish.restaurant.ownerId) {
        return { ok: false, error: 'Only Owner edit dish' };
      }

      await this.dishes.save([
        {
          id: editDishIntput.dishId,
          ...editDishIntput,
        },
      ]);
      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not edit Dish' };
    }
  }

  async deleteDish(owner: User, deleteDishInput: DeleteDishInput): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(deleteDishInput.dishId, { relations: ['restaurant'] });
      if (!dish) {
        return { ok: false, error: 'Dish not found' };
      }
      if (owner.id !== dish.restaurant.ownerId) {
        return { ok: false, error: 'Only Owner delete dish' };
      }

      await this.dishes.delete(deleteDishInput.dishId);
      return { ok: true };
    } catch (error) {
      console.log(error.message);
      return { ok: false, error: 'Could not delete Dish' };
    }
  }
}
