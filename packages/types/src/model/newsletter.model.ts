export interface NewsletterModel {
  title: string;
  htmlContent: string;
  templetes?: string;
}

export interface EmailModel {
  userId: string;
  newsletterId?: string | number;
  recipient: string;
  subject: string;
  htmlContent: string;
}
