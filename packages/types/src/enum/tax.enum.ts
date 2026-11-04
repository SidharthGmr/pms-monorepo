export type TaxType = "WithTax" | "WithoutTax";

export enum TaxTypeEnum {
  WithTax = "WithTax",
  WithoutTax = "WithoutTax",
}

export type TaxCategory = "TAXABLE" | "EXEMPT" | "ZERO_RATED" | "NON_GST";

export enum TaxCategoryEnum {
  Taxable = "TAXABLE",
  Exempt = "EXEMPT",
  ZeroRated = "ZERO_RATED",
  NonGst = "NON_GST",
}
