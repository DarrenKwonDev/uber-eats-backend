import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';
import { UserProfileOutput } from './dtos/user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    try {
      // is it new user?
      const exists = await this.users.findOne({ email });

      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }

      // create user and save it(password will be hased by listener)
      const createdUser = await this.users.save(this.users.create({ email, password, role }));

      const createdVerification = await this.verification.save(this.verification.create({ user: createdUser }));

      //TODO: send virification email to, email, code
      this.mailService.sendVerificationEmail(createdUser.email, createdUser.email, createdVerification.code);

      return { ok: true };
    } catch (error) {
      // console.log(error.message);
      return { ok: false, error: `Can't create user` };
    }
  }

  async login({ email, password }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    try {
      // fine the user with email
      const user = await this.users.findOne({ email }, { select: ['id', 'password'] });
      if (!user) {
        return { ok: false, error: 'user not found' };
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

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      // password double hashing 문제로 select를 굳이 해줘야 함...
      const user = await this.users.findOneOrFail(
        { id },
        {
          select: ['password', 'id', 'email', 'password', 'role', 'verified'],
        },
      );
      return { ok: true, user };
    } catch (error) {
      return { ok: false, error: 'User Not Found' };
    }
  }

  async editProfile(userId: number, editProfileInput: EditProfileInput) {
    // editProfileInput을 destructuring 하지마세요. 빈 값이 undefined로 들어와서 update할 경우 기존 값을 덮어버립니다
    // 그래서 전 save를 씁니다. 게다가 typeORM은 update해도 @BeforeUpdate 리슨 못 합니다.

    try {
      const user = await this.users.findOne(userId);

      if (editProfileInput.email) {
        const exist = await this.users.findOne(editProfileInput.email);
        if (exist) {
          return { ok: false, error: 'this email is already taken by someone.' };
        }

        user.email = editProfileInput.email;
        user.verified = false; // email을 바꿨으니 새로 verification해야 함
        await this.verification.delete({ user: { id: user.id } });
        const createdVerification = await this.verification.save(this.verification.create({ user }));
        // email 바뀌었으니 새로 email verification 해야 함
        this.mailService.sendVerificationEmail(user.email, user.email, createdVerification.code);
      }
      if (editProfileInput.password) {
        // 이 방식으로 해야 @BeforeUpdate 리스너가 돎.
        user.password = editProfileInput.password;
      }
      await this.users.save(user); // If entity does not exist in the database then inserts, otherwise updates.
      return {
        ok: true,
      };
    } catch (error) {
      console.log(error); //  ER_DUP_ENTRY: Duplicate entry '2' for key 'verification.REL_8300048608d8721aea27747b07
      return { ok: false, error: 'Could not update profile.' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      // find verification
      const verification = await this.verification.findOne({ code }, { relations: ['user'] });
      if (verification) {
        // set user verified column true
        verification.user.verified = true;
        await this.users.save(verification.user);

        // 인증이 되었으면 verification은 사용되지 않으므로 해당 record를 지움
        await this.verification.delete(verification.id);

        return { ok: true };
      }
      return { ok: false, error: 'Verification not found' };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}
