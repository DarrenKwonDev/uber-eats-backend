import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';

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

  async findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }

  async editProfile(userId: number, editProfileInput: EditProfileInput) {
    // editProfileInput을 destructuring 하지마세요. 빈 값이 undefined로 들어와서 update할 경우 기존 값을 덮어버립니다
    // 그래서 전 save를 씁니다. 게다가 typeORM은 update해도 @BeforeUpdate 리슨 못 합니다.

    const user = await this.users.findOne({ id: userId });

    if (editProfileInput.email) {
      //TODO: email verification 해야 함
      user.email = editProfileInput.email;
    }
    if (editProfileInput.password) {
      // 이 방식으로 해야 @BeforeUpdate 리스너가 돎.
      user.password = editProfileInput.password;
    }

    return this.users.save(user); // If entity does not exist in the database then inserts, otherwise updates.
  }
}
