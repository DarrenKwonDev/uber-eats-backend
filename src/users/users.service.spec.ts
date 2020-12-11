import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'whatever signed token'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let emailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: getRepositoryToken(Verification), useValue: mockRepository() },
        { provide: JwtService, useValue: mockJwtService() },
        { provide: MailService, useValue: mockMailService() },
      ],
    }).compile();
    service = modules.get<UsersService>(UsersService);
    emailService = modules.get<MailService>(MailService);
    jwtService = modules.get<JwtService>(JwtService);
    userRepository = modules.get(getRepositoryToken(User));
    verificationRepository = modules.get(getRepositoryToken(Verification));
  });

  it('be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: '',
      password: '',
      role: 0,
    };

    it('should fail if user exists', async () => {
      // 반환값을 속임. 실제 DB를 찾지 않도록하기 위함
      userRepository.findOne.mockResolvedValue({ id: 1, email: 'lalalal' });

      // 무언가 생성하면 앞서 설정한 반환값인 { id: 1, email: 'lalalal' } 반환. 기존 유저가 존재하므로 에러가 떠야 함
      const result = await service.createAccount(createAccountArgs);

      expect(result).toMatchObject({ ok: false, error: 'There is a user with that email already' });
    });

    it('should create a new user', async () => {
      userRepository.findOne.mockResolvedValue(undefined);
      userRepository.create.mockReturnValue(createAccountArgs); // service에서 가서 올려보면 create는 User를 반환한다고 써 있음. 그대로 해주자
      userRepository.save.mockResolvedValue(createAccountArgs); // service에서 가서 올려보면 save는 Promise<User>를 반환한다고 써 있음. 그대로 해주자(resolvedvalue)
      verificationRepository.create.mockReturnValue({ user: createAccountArgs }); // Verification 반환. 그러나 testing 편의에 따라 변형 가능
      verificationRepository.save.mockResolvedValue({ code: 'code' }); // Promise<Verification> 반환. 그러나 testing 편의에 따라 변형 가능

      const result = await service.createAccount(createAccountArgs);

      // service에서 가서 올려보면 create는 User를 반환한다고 써 있음. 그대로 해주자
      expect(userRepository.create).toHaveBeenCalledTimes(1); // 함수가 1번 불릴 것으로 예상함 (mockRepository를 공유하지 않아야 함)
      expect(userRepository.create).toHaveBeenCalledWith(createAccountArgs); // create 메서드일 때 들어올 인자 체킹

      // service에서 가서 올려보면 save는 Promise<User>를 반환한다고 써 있음.어쨌거나 User 객체를 반환해주면 됨
      expect(userRepository.save).toHaveBeenCalledTimes(1); // 함수가 1번 불릴 것으로 예상함 (mockRepository를 공유하지 않아야 함)
      expect(userRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({ user: createAccountArgs });

      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith({ user: createAccountArgs });

      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
      ); // to, email, code가 필요함. 여기서는 String 타입인지만 체킹하자

      // 최종적으로 result는 아래와 같이 되어야 함
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      userRepository.findOne.mockRejectedValue(new Error('some err'));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: `Can't create user` });
    });
  });

  describe('login', () => {
    const loginArgs = { email: 'test@email.com', password: '1234' };
    it('should fail if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null); // 유저 찾기가 실패해야함. null을 return하도록

      const result = await service.login(loginArgs);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1); // 4번이 뜬다.. 왜?
      expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
      expect(result).toEqual({ ok: false, error: 'user not found' });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = { id: 1, checkPassword: jest.fn(() => Promise.resolve(false)) }; // entity 내부에 정의된 메서드를 쓸 것이므로
      userRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(result).toEqual({ ok: false, error: 'wrong password' });
    });

    it('should return token if password correct', async () => {
      const mockedUser = { id: 1, checkPassword: jest.fn(() => Promise.resolve(true)) };
      userRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({ ok: true, token: 'whatever signed token' });
    });
  });

  describe('findById', () => {
    it('should find an existing user', async () => {
      const findByIdArgs = { id: 1 };
      userRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail if no user if found', async () => {
      userRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    it('should change email', async () => {
      const oldUser = {
        email: 'old@email.com',
        verified: true,
      };
      const editProfileArgs = {
        userId: 1,
        editProfileInput: { email: 'new@email.com' },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        verified: false,
        email: editProfileArgs.editProfileInput.email,
      };

      userRepository.findOne.mockResolvedValue(oldUser);
      verificationRepository.create.mockReturnValue(newVerification);
      verificationRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(editProfileArgs.userId, editProfileArgs.editProfileInput);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(editProfileArgs.userId);
      expect(verificationRepository.create).toHaveBeenLastCalledWith({ user: newUser });
      expect(verificationRepository.save).toHaveBeenLastCalledWith(newVerification);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        editProfileArgs.editProfileInput.email,
        editProfileArgs.editProfileInput.email,
        newVerification.code,
      );
    });

    it('should change password', async () => {
      // const oldUser = {
      //   email: 'old@email.com',
      //   password: 'old',
      //   verified: true,
      // };

      const editProfileArgs = {
        userId: 1,
        editProfileInput: { password: 'newpwd' },
      };

      userRepository.findOne.mockResolvedValue({ password: 'old' });

      const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.editProfileInput);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(editProfileArgs.editProfileInput);

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      userRepository.findOne.mockResolvedValue(new Error());
      const result = await service.editProfile(1, { email: 'asdf' });
      expect(result).toEqual({ ok: false, error: 'Could not update profile.' });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verificationRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail('string');

      expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(mockedVerification.user);

      expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepository.delete).toHaveBeenCalledWith(mockedVerification.id);

      expect(result).toEqual({ ok: true });
    });

    it('should fail on verification not found', async () => {
      verificationRepository.findOne.mockResolvedValue(undefined);

      const result = await service.verifyEmail('string');
      expect(result).toEqual({ ok: false, error: 'Verification not found.' });
    });
  });
});
