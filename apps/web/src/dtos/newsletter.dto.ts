export interface NewsletterDto {
    id: number;
    newsletterId: number | null;
    userId: string;
    title: string;
    htmlContent: string;
    status: boolean | null;
    createdAt: Date;
    updatedAt: Date | null; 
}
 export interface sendEmailDto {
  id: number;
  userId: string;
  newsletterId: number | null;
  recipient: string;
  subject: string | null;
  htmlContent: string;
  emailResponse?: any | null;
  createdAt: Date | null;
  status: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
}

 