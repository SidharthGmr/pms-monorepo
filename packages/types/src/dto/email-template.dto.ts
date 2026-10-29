export interface EmailTemplateDto {
  key: string;
  name: string;
  description: string;
  subject: string;
  html: string;
  variables: string[];
  isCustomized: boolean;
  updatedAt?: Date | string | null;
}

export interface EmailTemplatePreviewDto {
  subject: string;
  html: string;
}
