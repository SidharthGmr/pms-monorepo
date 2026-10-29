/** Patch semantics: only the keys present are written, so one tab can save without clobbering another. */
export interface UpdateSettingsModel {
  logoUrl?: string;
  siteName?: string;
  supportEmail?: string;
  invoiceTemplate?: string;
}
