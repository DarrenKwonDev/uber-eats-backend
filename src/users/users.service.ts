import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account-dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // 무언가 문제가 발생하면 string을 반환, clean exit하면 undefined하고 return 값들은 resolver 단에서 처리하기로
  async createAccount({ email, password, role }: CreateAccountInput): Promise<string | undefined> {
    try {
      // is it new user?
      const exists = await this.users.findOne({ email });
      if (exists) {
        return 'There is a user with that email already';
      }

      // create user and save it
      await this.users.save(this.users.create({ email, password, role }));

      //TODO: hashing password!
    } catch (error) {
      return `Can't create user error message : ${error.message}`;
    }
  }
}
