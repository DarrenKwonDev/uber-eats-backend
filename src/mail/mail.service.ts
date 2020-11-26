import got from 'got';
import FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions) {}

  private async sendEmail(subject: string, to: string, template: string, emailVars: EmailVar[]) {
    const form = new FormData(); // 일반 FormData는 안됨. 문서 https://github.com/sindresorhus/got#body 참고

    // template 변수에 대해서는 https://documentation.mailgun.com/en/latest/api-sending.html#sending 참고
    form.append('from', `<mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((emailVar) => {
      form.append(`v:${emailVar.key}`, emailVar.value);
    });

    // https://documentation.mailgun.com/en/latest/api-intro.html#errors
    // 401 (UNAUTHORIZED) No valid API key provided
    // 400 Bad Request - Often missing a required parameter

    // quiet fail
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`,
        },
        method: 'POST',
        body: form,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendVerificationEmail(to: string, email: string, code: string) {
    // mailgun 계정 결제를 하지 않았으므로 어차피 자신에게밖에 보내지 못함
    this.sendEmail('Verify Your Email', to, 'ubereats', [
      { key: 'username', value: email },
      { key: 'code', value: code },
    ]);
  }
}
