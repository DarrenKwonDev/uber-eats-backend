import got from 'got';
import FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(@Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions) {
    console.log(options);
    this.sendEmail('testing', 'test');
  }

  // mailgun 계정 결제를 하지 않았으므로 어차피 자신에게밖에 보내지 못함
  private async sendEmail(subject: string, content: string, to = 'anatomy1545@gmai.com') {
    const form = new FormData(); // 일반 FormData는 안됨. 문서 https://github.com/sindresorhus/got#body 참고
    form.append('from', `Excited User <mailgun@${this.options.domain}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('text', content);

    console.log(Buffer.from(`api: ${this.options.apiKey}`).toString('base64'));

    try {
      const resonse = await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        headers: {
          Authoization: `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`,
        },
        method: 'POST',
        body: form,
      });
      console.log(resonse.body);
    } catch (error) {
      console.log(error);
      return;
    }
  }
}
