import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    try {
      // is it new user?
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }

      // create user and save it(password will be hased by listener)
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: `Can't create user error message : ${error.message}` };
    }
  }

  async login({ email, password }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    try {
      // fine the user with email
      const user = await this.users.findOne({ email });

      if (!user) {
        return { ok: false, error: 'user not found', token: '1234' };
      }

      // check password right
      const passwordCorrect = await user.checkPassword(password);

      if (!passwordCorrect) {
        return { ok: false, error: 'wrong password' };
      }

      // make jwt token and git it to user
      const token = this.jwtService.sign({ id: user.id });

      return { ok: true, token };
    } catch (error) {
      console.log(error);
      return { ok: false, error: error.message };
    }
  }

  async findById(id: number): Promise<{ ok: boolean; error?: string; user?: User }> {
    const user = await this.users.findOne({ id });
    if (!user) {
      return { ok: false, error: "Can't find User" };
    }
    return { ok: true, user };
  }
}
