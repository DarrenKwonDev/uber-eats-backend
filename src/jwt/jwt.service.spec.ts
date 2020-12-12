import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';
import jwt from 'jsonwebtoken';

const TEST_KEY = 'testPrivateKey';
const USER_ID = 1;

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
    verify: jest.fn(() => ({ id: USER_ID })),
  };
});

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', () => {
      const token = service.sign({ id: USER_ID }); // service 내부에 jwt.sign 메서드가 실행됨

      // jwt.sign이 1번 실행되고, 들어가는 인자만 테스트하는 코드.
      // 결과값은 mocking하였음
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_KEY);

      expect(token).toBe('TOKEN');
    });
  });
  describe('verify', () => {
    it('should return the decoded token', async () => {
      const decodedToken = service.verify('whateverToken');
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenLastCalledWith('whateverToken', TEST_KEY);
      expect(decodedToken).toEqual({ id: USER_ID });
    });
  });
});
