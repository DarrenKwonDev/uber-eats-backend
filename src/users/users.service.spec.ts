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
});

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let emailService: MailService;

  beforeAll(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: getRepositoryToken(Verification), useValue: mockRepository() },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();
    service = modules.get<UsersService>(UsersService);
    emailService = modules.get<MailService>(MailService);
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
  });

  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
  it.todo('verifyEmail');
});
