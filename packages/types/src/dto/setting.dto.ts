export interface SettingsDto {
  /** Key of the invoice layout new invoices are printed with. */
  invoiceTemplate: string;
  updatedAt?: Date | string | null;
}
