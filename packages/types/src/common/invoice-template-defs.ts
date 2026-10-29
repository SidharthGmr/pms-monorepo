/**
 * The invoice layouts the admin can choose between. The React components that draw them live in
 * `apps/web/src/components/features/invoice-templates`; this registry holds everything that is
 * not JSX - the keys the API validates against and the labels both the gallery and the settings
 * header display - so the two cannot drift apart.
 */

export const INVOICE_TEMPLATE_KEYS = ["classic", "modern", "minimal", "receipt"] as const;

export type InvoiceTemplateKey = (typeof INVOICE_TEMPLATE_KEYS)[number];

export const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplateKey = "classic";

export interface InvoiceTemplateMeta {
  key: InvoiceTemplateKey;
  name: string;
  description: string;
  /** Design width in px; the gallery scales its thumbnail from this. */
  width: number;
}

export const INVOICE_TEMPLATE_META: InvoiceTemplateMeta[] = [
  { key: "classic", name: "Classic", description: "Brand navy & teal layout matching the PDF invoice.", width: 794 },
  { key: "modern", name: "Modern", description: "Gradient masthead with card-based details.", width: 794 },
  { key: "minimal", name: "Minimal", description: "Monochrome serif design with hairline rules.", width: 794 },
  { key: "receipt", name: "POS Receipt", description: "80mm thermal-printer slip for counter sales.", width: 320 },
];
