import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';
import got from 'got';
import * as FormData from 'form-data';

const TEST_KEY = 'testPrivateKey';
const USER_ID = 1;

const MAILGUN_API_KEY = 'test key';
const MAILGUN_DOMAIN_NAME = 'test.mailgun.org';
const MAILGUN_FROM_EMAIL = 'test@email.com';

jest.mock('got');
jest.mock('form-data');

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN_NAME, fromEmail: MAILGUN_FROM_EMAIL },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', () => {
      const sendVerificationEmailArgs = {
        to: 'email',
        email: 'email',
        code: 'code',
      };
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true); // spy

      service.sendVerificationEmail(
        sendVerificationEmailArgs.to,
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );

      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith('Verify Your Email', sendVerificationEmailArgs.to, 'ubereats', [
        { key: 'username', value: sendVerificationEmailArgs.email },
        { key: 'code', value: sendVerificationEmailArgs.code },
      ]);
    });
  });

  // something wrong in test send email
  describe('send email', () => {
    // it('send email', async () => {
    //   const ok = await service.sendEmail('', '', '', [{ key: 'key', value: 'value' }]);
    //   const formSpy = jest.spyOn(FormData.prototype, 'append').mockImplementation(() => {}); // prototype을 spy함
    //   expect(formSpy).toHaveBeenCalled();
    //   expect(got.post).toHaveBeenCalledTimes(1);
    //   expect(got.post).toHaveBeenCalledWith(
    //     `https://api.mailgun.net/v3/${MAILGUN_DOMAIN_NAME}/messages`,
    //     expect.any(Object),
    //   );
    //   expect(ok).toEqual(true);
    // });
    // it('fails on error', async () => {
    //   jest.spyOn(got, 'post').mockImplementation(() => {
    //     throw new Error();
    //   });
    //   const ok = await service.sendEmail('', '', '', [{ key: 'key', value: 'value' }]);
    //   expect(ok).toEqual(false);
    // });
  });
});
