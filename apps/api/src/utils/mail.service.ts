import { sendEmail } from "./nodemailer";
import { injectable } from "inversify";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

@injectable()
export class MailService {
  async send({ to, subject, html }: SendEmailParams) {
    return await sendEmail(to, subject, html);
  }
}
