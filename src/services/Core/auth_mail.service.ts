// services/mail.service.ts
import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export class MailService {
  private static transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: false, 
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });

  static async send(options: SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: env.email.from, 
        to: options.to, 
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      console.error('❌ Lỗi gửi email:', error);
    }
  }
}