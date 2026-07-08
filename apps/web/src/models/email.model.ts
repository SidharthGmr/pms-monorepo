export interface EmailModel {
  userId: string;
  newsletterId?: string | number;
  recipient: string;
  subject: string;
  htmlContent: string;
}
