import { EntityRepository, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {
  async getOrCreate(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.findOne({ slug: categorySlug });

    // 기존 카테고리가 없으면 새로 생성
    if (!category) {
      category = await this.save(this.create({ slug: categorySlug, name: categoryName }));
    }

    return category;
  }
}
