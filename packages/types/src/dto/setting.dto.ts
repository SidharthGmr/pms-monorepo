export interface SettingsDto {
  /** Absolute or app-relative URL of the admin-uploaded logo; empty means fall back to /logo.png. */
  logoUrl: string;
  siteName: string;
  supportEmail: string;
  invoiceTemplate: string;
  updatedAt?: Date | string | null;
}
